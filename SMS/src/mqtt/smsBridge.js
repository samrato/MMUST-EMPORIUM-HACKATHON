import mqtt from 'mqtt';
import { nanoid } from 'nanoid';
import { z } from 'zod';

// ============================================================================
// MQTT Validation Schemas
// ============================================================================

// 1. sms/send (App -> Gateway)
export const OutboundSmsSchema = z.object({
  id: z.string().optional(),
  message_id: z.string().optional(),
  phone: z.string().optional(),
  recipient: z.string().optional(),
  message: z.string(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal')
});

// 2. sms/status (Gateway -> App)
export const SmsStatusSchema = z.object({
  id: z.string().optional(),
  message_id: z.string().optional(),
  notification_id: z.string().optional(),
  status: z.enum(['queued', 'sending', 'sent', 'failed', 'QUEUED', 'SENDING', 'SENT', 'FAILED']).optional(),
  success: z.boolean().optional(),
  timestamp: z.union([z.number(), z.string()]).optional(),
  error: z.string().optional(),
  provider: z.string().optional(),
  provider_reference: z.string().optional()
});

// 3. sms/incoming (Gateway -> App)
export const IncomingSmsSchema = z.object({
  messageId: z.string().optional(),
  id: z.string().optional(),
  from: z.string().optional(),
  sender: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().optional(),
  text: z.string().optional(),
  timestamp: z.union([z.number(), z.string()]).optional(),
  device_id: z.string().optional(),
  provider: z.string().optional(),
  storage: z.string().optional(),
  storage_index: z.number().int().optional(),
  modem_timestamp: z.string().optional()
});

// 4. gateway/status (Gateway -> App, Retained)
export const GatewayStatusSchema = z.object({
  deviceId: z.string().optional(),
  device_id: z.string().optional(),
  online: z.boolean().optional().default(true),
  signal: z.number().optional(),
  operator: z.string().optional(),
  uptime: z.number().optional(),
  queueLength: z.number().optional(),
  timestamp: z.union([z.number(), z.string()]).optional()
});

// 5. gateway/metrics (Gateway -> App)
export const GatewayMetricsSchema = z.object({
  deviceId: z.string().optional(),
  device_id: z.string().optional(),
  sentToday: z.number().optional().default(0),
  receivedToday: z.number().optional().default(0),
  failedToday: z.number().optional().default(0),
  timestamp: z.union([z.number(), z.string()]).optional()
});

// 6. gateway/commands (App -> Gateway)
export const GatewayCommandSchema = z.object({
  command: z.enum(['reboot', 'clear_queue', 'send_at', 'status_check', 'reset_modem']),
  at: z.string().optional(),
  deviceId: z.string().optional()
});

// 7. gateway/events (Gateway -> App)
export const GatewayEventSchema = z.object({
  deviceId: z.string().optional(),
  device_id: z.string().optional(),
  event: z.string(),
  details: z.string().optional(),
  timestamp: z.union([z.number(), z.string()]).optional()
});

function safeJsonParse(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export function createSmsBridge({
  mqttUrl,
  mqttUsername,
  mqttPassword,
  deviceId = 'sim800-node-01',
  db,
  responder
}) {
  const topics = {
    // 1. Submit outbound SMS (App -> Gateway)
    send: 'sms/send',
    sendDevice: `sms/send/${deviceId}`,
    sendLegacy: 'fampesa/notifications/sms/jobs',

    // 2. SMS Status Tracking (Gateway -> App)
    status: 'sms/status',
    statusDevice: `sms/result/${deviceId}`,
    statusLegacy: 'fampesa/notifications/sms/status',

    // 3. Incoming SMS (Gateway -> App)
    incoming: 'sms/incoming',
    incomingDevice: `sms/incoming/${deviceId}`,
    incomingLegacy: 'fampesa/notifications/sms/incoming',

    // 4. Gateway Health Heartbeat (Gateway -> App, Retained)
    gatewayStatus: 'gateway/status',
    gatewayStatusDevice: `gateway/status/${deviceId}`,

    // 5. Aggregate Daily Metrics (Gateway -> App)
    gatewayMetrics: 'gateway/metrics',
    gatewayMetricsDevice: `gateway/metrics/${deviceId}`,

    // 6. Remote Commands (App -> Gateway)
    gatewayCommands: 'gateway/commands',
    gatewayCommandsDevice: `gateway/commands/${deviceId}`,

    // 7. Hardware Events & AT Responses (Gateway -> App)
    gatewayEvents: 'gateway/events',
    gatewayEventsDevice: `gateway/events/${deviceId}`
  };

  const client = mqtt.connect(mqttUrl, {
    username: mqttUsername,
    password: mqttPassword,
    reconnectPeriod: 5000,
    connectTimeout: 30000
  });

  // State in-memory cache for gateway telemetry
  let latestGatewayStatus = {
    deviceId,
    online: false,
    signal: 0,
    operator: 'Unknown',
    uptime: 0,
    queueLength: 0,
    lastSeen: null
  };

  let latestGatewayMetrics = {
    deviceId,
    sentToday: 0,
    receivedToday: 0,
    failedToday: 0,
    lastUpdated: null
  };

  const recentGatewayEvents = [];

  // Ensures only one AI response is generated/sent per sender at a time.
  const perSender = new Map(); // sender -> { inFlight: boolean, queued: string|null }

  client.on('connect', () => {
    console.log(`[mqtt] Connected to MQTT broker at ${mqttUrl}`);
    const subscribeTopics = [
      topics.incoming,
      topics.incomingDevice,
      topics.incomingLegacy,
      topics.status,
      topics.statusDevice,
      topics.statusLegacy,
      topics.gatewayStatus,
      topics.gatewayStatusDevice,
      topics.gatewayMetrics,
      topics.gatewayMetricsDevice,
      topics.gatewayEvents,
      topics.gatewayEventsDevice
    ];

    client.subscribe(subscribeTopics, (err) => {
      if (err) {
        console.error('[mqtt] Subscribe error:', err);
      } else {
        console.log('[mqtt] Subscribed to topics:', subscribeTopics);
      }
    });
  });

  client.on('error', (err) => {
    console.error('[mqtt] Client error:', err.message);
  });

  client.on('message', async (topic, payload) => {
    const text = payload.toString('utf8');

    // 1. Incoming SMS
    if (
      topic === topics.incoming ||
      topic === topics.incomingDevice ||
      topic === topics.incomingLegacy ||
      topic.startsWith('sms/incoming/')
    ) {
      await handleIncoming(text).catch((e) => console.error('[smsBridge] incoming error:', e));
      return;
    }

    // 2. SMS Status
    if (
      topic === topics.status ||
      topic === topics.statusDevice ||
      topic === topics.statusLegacy ||
      topic.startsWith('sms/status') ||
      topic.startsWith('sms/result/')
    ) {
      await handleStatus(text).catch((e) => console.error('[smsBridge] status error:', e));
      return;
    }

    // 4. Gateway Heartbeat Status
    if (topic === topics.gatewayStatus || topic === topics.gatewayStatusDevice || topic.startsWith('gateway/status')) {
      handleGatewayStatus(text);
      return;
    }

    // 5. Gateway Aggregate Metrics
    if (topic === topics.gatewayMetrics || topic === topics.gatewayMetricsDevice || topic.startsWith('gateway/metrics')) {
      handleGatewayMetrics(text);
      return;
    }

    // 7. Gateway Hardware Events & AT Responses
    if (topic === topics.gatewayEvents || topic === topics.gatewayEventsDevice || topic.startsWith('gateway/events')) {
      handleGatewayEvent(text);
    }
  });

  async function handleIncoming(text) {
    const parsed = safeJsonParse(text);
    if (!parsed.ok) {
      if (db?.logs) db.logs.insert({ level: 'warn', message: 'Invalid JSON on incoming topic', meta_json: JSON.stringify({ text }) });
      return;
    }

    const parseResult = IncomingSmsSchema.safeParse(parsed.value);
    if (!parseResult.success) {
      if (db?.logs) {
        db.logs.insert({
          level: 'warn',
          message: 'Invalid incoming SMS payload',
          meta_json: JSON.stringify({ issues: parseResult.error.issues, value: parsed.value })
        });
      }
      return;
    }

    const data = parseResult.data;
    const sender = data.from || data.sender || data.phone;
    const message = data.message || data.text;
    const messageId = data.messageId || data.id || `in-${Date.now()}`;

    if (!sender || !message) {
      if (db?.logs) {
        db.logs.insert({
          level: 'warn',
          message: 'Incoming SMS missing sender or message body',
          meta_json: JSON.stringify({ value: parsed.value })
        });
      }
      return;
    }

    const state = perSender.get(sender) || { inFlight: false, queued: null };
    if (state.inFlight) {
      state.queued = message;
      perSender.set(sender, state);
      if (db?.logs) {
        db.logs.insert({
          level: 'info',
          message: 'Sender busy; queued latest message',
          meta_json: JSON.stringify({ sender })
        });
      }
      return;
    }

    state.inFlight = true;
    perSender.set(sender, state);

    await processOneIncoming({
      messageId,
      sender,
      message,
      deviceId: data.device_id || deviceId,
      provider: data.provider,
      modem_timestamp: data.modem_timestamp || data.timestamp
    }).finally(() => {
      const next = perSender.get(sender);
      if (!next) return;
      const queuedText = next.queued;
      next.queued = null;
      next.inFlight = false;
      perSender.set(sender, next);
      if (queuedText) {
        process.nextTick(() => {
          handleIncoming(
            JSON.stringify({
              from: sender,
              message: queuedText,
              device_id: data.device_id || deviceId
            })
          ).catch(() => {});
        });
      }
    });
  }

  async function processOneIncoming(incoming) {
    const inboundId = incoming.messageId || nanoid();
    if (db?.inbound) {
      await db.inbound.insert({
        id: inboundId,
        device_id: incoming.deviceId || deviceId,
        sender: incoming.sender,
        message: incoming.message,
        provider: incoming.provider || null,
        modem_timestamp: incoming.modem_timestamp ? String(incoming.modem_timestamp) : null,
        created_at: Date.now()
      });
    }

    let ai;
    try {
      ai = await responder.respondToSms({
        from: incoming.sender,
        text: incoming.message
      });
    } catch (err) {
      if (db?.logs) {
        await db.logs.insert({
          level: 'error',
          message: 'AI responder failed; sending fallback reply',
          meta_json: JSON.stringify({ error: String(err?.message || err) })
        });
      }

      ai = {
        message_id: nanoid(),
        category: 'general',
        urgency: 'medium',
        reply:
          'Sorry—our AI assistant is temporarily unavailable. If this is an emergency, please call local emergency services or go to the nearest hospital.'
      };
    }

    const outId = ai.message_id || `msg-${nanoid(8)}`;
    if (db?.outbound) {
      await db.outbound.insert({
        id: outId,
        inbound_id: inboundId,
        device_id: incoming.deviceId || deviceId,
        recipient: incoming.sender,
        message: ai.reply,
        category: ai.category,
        urgency: ai.urgency,
        created_at: Date.now(),
        status: 'QUEUED'
      });
    }

    // Standard Topic 1 Payload: sms/send
    const sendPayload = {
      id: outId,
      phone: incoming.sender,
      message: ai.reply,
      priority: ai.urgency === 'critical' || ai.urgency === 'high' ? 'urgent' : 'normal'
    };

    // Publish to primary topic 'sms/send' and device topic 'sms/send/${deviceId}'
    client.publish(topics.send, JSON.stringify(sendPayload), { retain: false, qos: 1 });
    client.publish(topics.sendDevice, JSON.stringify({
      message_id: outId,
      device_id: incoming.deviceId || deviceId,
      recipient: incoming.sender,
      message: ai.reply
    }), { retain: false, qos: 1 });
  }

  async function handleStatus(text) {
    const parsed = safeJsonParse(text);
    if (!parsed.ok) return;

    const statusParsed = SmsStatusSchema.safeParse(parsed.value);
    if (!statusParsed.success) return;

    const data = statusParsed.data;
    const messageId = data.id || data.message_id || data.notification_id;
    if (!messageId) return;

    let normalizedStatus = 'QUEUED';
    if (data.status) {
      normalizedStatus = data.status.toUpperCase();
    } else if (data.success === true) {
      normalizedStatus = 'SENT';
    } else if (data.success === false) {
      normalizedStatus = 'FAILED';
    }

    if (db?.outbound) {
      await db.outbound.updateStatus({
        id: messageId,
        status: normalizedStatus,
        success: data.success ?? (normalizedStatus === 'SENT'),
        error: data.error || null,
        provider_reference: data.provider_reference || null,
        updated_at: typeof data.timestamp === 'number' ? data.timestamp * 1000 : Date.now()
      });
    }
  }

  function handleGatewayStatus(text) {
    const parsed = safeJsonParse(text);
    if (!parsed.ok) return;

    const res = GatewayStatusSchema.safeParse(parsed.value);
    if (!res.success) return;

    latestGatewayStatus = {
      ...latestGatewayStatus,
      ...res.data,
      deviceId: res.data.deviceId || res.data.device_id || deviceId,
      lastSeen: new Date().toISOString()
    };
    console.log('[gateway/status] Heartbeat received:', latestGatewayStatus);
  }

  function handleGatewayMetrics(text) {
    const parsed = safeJsonParse(text);
    if (!parsed.ok) return;

    const res = GatewayMetricsSchema.safeParse(parsed.value);
    if (!res.success) return;

    latestGatewayMetrics = {
      ...latestGatewayMetrics,
      ...res.data,
      deviceId: res.data.deviceId || res.data.device_id || deviceId,
      lastUpdated: new Date().toISOString()
    };
    console.log('[gateway/metrics] Daily metrics received:', latestGatewayMetrics);
  }

  function handleGatewayEvent(text) {
    const parsed = safeJsonParse(text);
    if (!parsed.ok) return;

    const res = GatewayEventSchema.safeParse(parsed.value);
    if (!res.success) return;

    const eventRecord = {
      ...res.data,
      deviceId: res.data.deviceId || res.data.device_id || deviceId,
      receivedAt: new Date().toISOString()
    };

    recentGatewayEvents.unshift(eventRecord);
    if (recentGatewayEvents.length > 50) recentGatewayEvents.pop();

    console.log(`[gateway/events] Event received [${eventRecord.event}]:`, eventRecord.details || '');
  }

  return {
    topics,
    client,
    getGatewayStatus: () => latestGatewayStatus,
    getGatewayMetrics: () => latestGatewayMetrics,
    getGatewayEvents: () => recentGatewayEvents,
    publishSms: (payload) => {
      const formatted = {
        id: payload.id || payload.message_id || `msg-${Date.now()}`,
        phone: payload.phone || payload.recipient,
        message: payload.message,
        priority: payload.priority || 'normal'
      };
      client.publish(topics.send, JSON.stringify(formatted), { retain: false, qos: 1 });
      client.publish(topics.sendDevice, JSON.stringify({
        message_id: formatted.id,
        device_id: deviceId,
        recipient: formatted.phone,
        message: formatted.message
      }), { retain: false, qos: 1 });
      return formatted;
    },
    publishCommand: (commandObj) => {
      const validated = GatewayCommandSchema.parse(commandObj);
      client.publish(topics.gatewayCommands, JSON.stringify(validated), { retain: false, qos: 1 });
      return validated;
    }
  };
}
