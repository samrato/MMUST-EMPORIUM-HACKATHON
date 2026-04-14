import 'dotenv/config';
import mqtt from 'mqtt';

const mqttUrl = process.env.MQTT_URL || 'mqtt://64.23.145.236:1883';
const mqttUsername = process.env.MQTT_USERNAME || undefined;
const mqttPassword = process.env.MQTT_PASSWORD || undefined;
const deviceId = process.env.DEVICE_ID || 'sim800-node-01';

const topics = {
  incoming: `sms/incoming/${deviceId}`,
  send: `sms/send/${deviceId}`,
  result: `sms/result/${deviceId}`
};

function waitFor(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const client = mqtt.connect(mqttUrl, { username: mqttUsername, password: mqttPassword });

  const seen = { send: null };
  const ready = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('MQTT connect timeout')), 10_000);
    client.on('connect', () => {
      clearTimeout(t);
      resolve();
    });
    client.on('error', (e) => reject(e));
  });

  await ready;
  await new Promise((resolve, reject) => {
    client.subscribe([topics.send], (err) => (err ? reject(err) : resolve()));
  });

  client.on('message', (topic, payload) => {
    if (topic !== topics.send) return;
    try {
      seen.send = JSON.parse(payload.toString('utf8'));
    } catch {
      seen.send = { raw: payload.toString('utf8') };
    }
  });

  const sender = process.env.TEST_SENDER || '+254700000000';
  const text = process.env.TEST_TEXT || 'Hello, I have a headache. What should I do?';

  client.publish(
    topics.incoming,
    JSON.stringify({
      device_id: deviceId,
      sender,
      message: text,
      provider: 'smoke-test'
    })
  );

  const started = Date.now();
  while (!seen.send && Date.now() - started < 15_000) {
    // eslint-disable-next-line no-await-in-loop
    await waitFor(250);
  }

  if (!seen.send) {
    throw new Error(`No outbound message observed on ${topics.send} within 15s`);
  }

  // Optionally simulate device status callback for UI consistency.
  if (seen.send.message_id) {
    client.publish(
      topics.result,
      JSON.stringify({
        message_id: seen.send.message_id,
        device_id: deviceId,
        recipient: sender,
        success: true,
        status: 'SENT',
        provider: 'smoke-test'
      })
    );
  }

  // Print what a device would send as an SMS.
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ mqttUrl, deviceId, inbound: { sender, text }, outboundJob: seen.send }, null, 2));

  client.end(true);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[mqtt-smoke] failed:', err?.stack || String(err));
  process.exitCode = 1;
});
