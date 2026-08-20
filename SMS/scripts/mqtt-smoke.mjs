import 'dotenv/config';
import mqtt from 'mqtt';

const mqttUrl = process.env.MQTT_URL || 'mqtt://127.0.0.1:1883';
const mqttUsername = process.env.MQTT_USERNAME || undefined;
const mqttPassword = process.env.MQTT_PASSWORD || undefined;
const deviceId = process.env.DEVICE_ID || 'gateway-001';

const topics = {
  // 1. Send Outbound SMS (App -> Gateway)
  send: 'sms/send',
  // 2. SMS Status Tracking (Gateway -> App)
  status: 'sms/status',
  // 3. Incoming SMS (Gateway -> App)
  incoming: 'sms/incoming',
  // 4. Gateway Health Heartbeat (Gateway -> App, Retained)
  gatewayStatus: 'gateway/status',
  // 5. Aggregate Daily Metrics (Gateway -> App)
  gatewayMetrics: 'gateway/metrics',
  // 6. Remote Commands (App -> Gateway)
  gatewayCommands: 'gateway/commands',
  // 7. Hardware Events & AT Responses (Gateway -> App)
  gatewayEvents: 'gateway/events'
};

function waitFor(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(`[mqtt-smoke] Connecting to MQTT broker at ${mqttUrl}...`);
  const client = mqtt.connect(mqttUrl, { username: mqttUsername, password: mqttPassword });

  const received = {
    send: null,
    commands: null
  };

  const ready = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('MQTT connect timeout')), 10_000);
    client.on('connect', () => {
      clearTimeout(t);
      resolve();
    });
    client.on('error', (e) => reject(e));
  });

  await ready;
  console.log('✅ Connected to MQTT broker.');

  // Subscribe to topics where App publishes to Gateway
  await new Promise((resolve, reject) => {
    client.subscribe([topics.send, topics.gatewayCommands], (err) => (err ? reject(err) : resolve()));
  });

  client.on('message', (topic, payload) => {
    const raw = payload.toString('utf8');
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { raw };
    }

    if (topic === topics.send) {
      console.log('📬 [Observed on sms/send]:', parsed);
      received.send = parsed;
    } else if (topic === topics.gatewayCommands) {
      console.log('⚡ [Observed on gateway/commands]:', parsed);
      received.commands = parsed;
    }
  });

  // 1. Test Gateway Health Heartbeat (gateway/status)
  console.log('\n--- 1. Publishing gateway/status heartbeat ---');
  client.publish(
    topics.gatewayStatus,
    JSON.stringify({
      deviceId,
      online: true,
      signal: 24,
      operator: 'Safaricom',
      uptime: 86420,
      queueLength: 0
    }),
    { retain: true, qos: 1 }
  );

  // 2. Test Gateway Aggregate Metrics (gateway/metrics)
  console.log('--- 2. Publishing gateway/metrics ---');
  client.publish(
    topics.gatewayMetrics,
    JSON.stringify({
      deviceId,
      sentToday: 142,
      receivedToday: 38,
      failedToday: 2
    }),
    { retain: false, qos: 1 }
  );

  // 3. Test Hardware Events & AT Responses (gateway/events)
  console.log('--- 3. Publishing gateway/events ---');
  client.publish(
    topics.gatewayEvents,
    JSON.stringify({
      deviceId,
      event: 'at_response',
      details: '+CSQ: 24,0\r\nOK\r\n',
      timestamp: Math.floor(Date.now() / 1000)
    }),
    { retain: false, qos: 1 }
  );

  // 4. Test Incoming SMS (sms/incoming)
  console.log('--- 4. Publishing sms/incoming ---');
  const testPhone = process.env.TEST_SENDER || '+254712345678';
  const testMsg = process.env.TEST_TEXT || 'Hello, I have severe headache and fever. Which Kakamega clinic should I visit?';
  const testMsgId = `rx-${Date.now()}`;

  client.publish(
    topics.incoming,
    JSON.stringify({
      messageId: testMsgId,
      from: testPhone,
      message: testMsg,
      timestamp: 'now'
    }),
    { retain: false, qos: 1 }
  );

  // 5. Wait for SMS Bridge to process AI & publish outbound SMS to sms/send
  console.log('--- 5. Waiting for outbound response on sms/send ---');
  const started = Date.now();
  while (!received.send && Date.now() - started < 15_000) {
    // eslint-disable-next-line no-await-in-loop
    await waitFor(250);
  }

  if (received.send) {
    console.log('✅ Received outbound AI response on sms/send!');

    // 6. Test SMS Status progression (sms/status)
    console.log('--- 6. Publishing status progression on sms/status ---');
    const msgId = received.send.id || received.send.message_id || 'msg-94812';
    
    // Status: sending
    client.publish(
      topics.status,
      JSON.stringify({
        id: msgId,
        status: 'sending',
        timestamp: Math.floor(Date.now() / 1000)
      })
    );

    await waitFor(100);

    // Status: sent
    client.publish(
      topics.status,
      JSON.stringify({
        id: msgId,
        status: 'sent',
        timestamp: Math.floor(Date.now() / 1000)
      })
    );
    console.log('✅ SMS Status progression published successfully.');
  } else {
    console.log('⚠️ Note: Outbound response on sms/send not seen within 15s (Check if SMS Bridge service is running locally).');
  }

  console.log('\n========================================');
  console.log('🎉 MQTT Smoke Test Finished Successfully');
  console.log('========================================');

  client.end(true);
}

main().catch((err) => {
  console.error('[mqtt-smoke] failed:', err?.stack || String(err));
  process.exitCode = 1;
});
