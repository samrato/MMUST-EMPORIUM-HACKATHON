import mqtt from 'mqtt';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const IncomingSmsSchema = z.object({
  device_id: z.string().optional(),
  sender: z.string(),
  message: z.string(),
  provider: z.string().optional(),
  storage: z.string().optional(),
  storage_index: z.number().int().optional(),
  modem_timestamp: z.string().optional()
});

const StatusSchema = z.object({
  notification_id: z.string().optional(),
  message_id: z.string().optional(),
  device_id: z.string().optional(),
  recipient: z.string().optional(),
  success: z.boolean().optional(),
  status: z.string().optional(),
  provider: z.string().optional(),
  provider_reference: z.string().optional(),
  error: z.string().optional()
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
  deviceId,
  db,
  responder
}) {
  const topics = {
    incoming: `sms/incoming/${deviceId}`,
    incomingLegacy: 'fampesa/notifications/sms/incoming',
    send: `sms/send/${deviceId}`,
    sendLegacy: 'fampesa/notifications/sms/jobs',
    result: `sms/result/${deviceId}`,
    resultLegacy: 'fampesa/notifications/sms/status'
  };

  const client = mqtt.connect(mqttUrl, {
    username: mqttUsername,
    password: mqttPassword
  });

  // Ensures only one AI response is generated/sent per sender at a time.
  // If multiple SMS arrive quickly, the newest one is queued and processed next.
  const perSender = new Map(); // sender -> { inFlight: boolean, queued: string|null }

  client.on('connect', () => {
    client.subscribe([topics.incoming, topics.incomingLegacy, topics.result, topics.resultLegacy], (err) => {
      if (err) console.error('[mqtt] subscribe error', err); // eslint-disable-line no-console
      else console.log('[mqtt] subscribed', topics); // eslint-disable-line no-console
    });
  });

  client.on('message', async (topic, payload) => {
    const text = payload.toString('utf8');
    if (topic === topics.incoming || topic === topics.incomingLegacy) {
      await handleIncoming(text).catch((e) => console.error('[smsBridge] incoming error', e)); // eslint-disable-line no-console
      return;
    }
    if (topic === topics.result || topic === topics.resultLegacy) {
      await handleStatus(text).catch((e) => console.error('[smsBridge] status error', e)); // eslint-disable-line no-console
    }
  });

  async function handleIncoming(text) {
    const parsed = safeJsonParse(text);
    if (!parsed.ok) {
      db.logs.insert({ level: 'warn', message: 'Invalid JSON on incoming topic', meta_json: JSON.stringify({ text }) });
      return;
    }

    const sms = IncomingSmsSchema.safeParse(parsed.value);
    if (!sms.success) {
      db.logs.insert({
        level: 'warn',
        message: 'Invalid incoming SMS payload',
        meta_json: JSON.stringify({ issues: sms.error.issues, value: parsed.value })
      });
      return;
    }

    const incoming = sms.data;
    const sender = incoming.sender;
    const state = perSender.get(sender) || { inFlight: false, queued: null };
    if (state.inFlight) {
      state.queued = incoming.message;
      perSender.set(sender, state);
      db.logs.insert({
        level: 'info',
        message: 'Sender busy; queued latest message',
        meta_json: JSON.stringify({ sender })
      });
      return;
    }

    state.inFlight = true;
    perSender.set(sender, state);

    await processOneIncoming(incoming).finally(() => {
      const next = perSender.get(sender);
      if (!next) return;
      const queuedText = next.queued;
      next.queued = null;
      next.inFlight = false;
      perSender.set(sender, next);
      if (queuedText) {
        // Fire-and-forget: process the latest queued message next.
        process.nextTick(() => {
          handleIncoming(
            JSON.stringify({
              ...incoming,
              message: queuedText
            })
          ).catch(() => {});
        });
      }
    });
  }

  async function processOneIncoming(incoming) {
    const inboundId = nanoid();
    await db.inbound.insert({
      id: inboundId,
      device_id: incoming.device_id || deviceId,
      sender: incoming.sender,
      message: incoming.message,
      provider: incoming.provider || null,
      modem_timestamp: incoming.modem_timestamp || null,
      created_at: Date.now()
    });

    let ai;
    try {
      ai = await responder.respondToSms({
        from: incoming.sender,
        text: incoming.message
      });
    } catch (err) {
      await db.logs.insert({
        level: 'error',
        message: 'AI responder failed; sending fallback reply',
        meta_json: JSON.stringify({ error: String(err?.message || err) })
      });

      ai = {
        message_id: nanoid(),
        category: 'general',
        urgency: 'medium',
        reply:
          'Sorry—our AI assistant is temporarily unavailable. If this is an emergency, please call local emergency services or go to the nearest hospital.'
      };
    }

    const outId = ai.message_id || inboundId;
    await db.outbound.insert({
      id: outId,
      inbound_id: inboundId,
      device_id: deviceId,
      recipient: incoming.sender,
      message: ai.reply,
      category: ai.category,
      urgency: ai.urgency,
      created_at: Date.now(),
      status: 'QUEUED'
    });

    const sendPayload = {
      message_id: outId,
      device_id: deviceId,
      recipient: incoming.sender,
      message: ai.reply
    };

    client.publish(topics.send, JSON.stringify(sendPayload));
    // Legacy is accepted by broker; publishing only once avoids duplicate sends.
  }

  async function handleStatus(text) {
    const parsed = safeJsonParse(text);
    if (!parsed.ok) return;
    const status = StatusSchema.safeParse(parsed.value);
    if (!status.success) return;

    const messageId = status.data.message_id || status.data.notification_id;
    if (!messageId) return;

    db.outbound.updateStatus({
      id: messageId,
      status: status.data.status || (status.data.success ? 'SENT' : 'FAILED'),
      success: status.data.success ?? null,
      error: status.data.error || null,
      provider_reference: status.data.provider_reference || null,
      updated_at: Date.now()
    });
  }

  return {
    topics,
    client,
    publishSms: (payload) => client.publish(topics.send, JSON.stringify(payload))
  };
}
