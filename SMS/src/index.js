import 'dotenv/config';
import { createServer } from './http/server.js';
import { createSmsBridge } from './mqtt/smsBridge.js';
import { createOrchestratorResponder } from './ai/orchestratorResponder.js';
import { createStorage } from './storage/index.js';

const port = Number(process.env.PORT || 4000);
const db = await createStorage();

const orchestratorResponder = createOrchestratorResponder({
  backendUrl: process.env.BACKEND_API_URL || 'http://localhost:5000'
});

const smsBridge = createSmsBridge({
  mqttUrl: process.env.MQTT_URL || 'mqtt://64.23.145.236:1883',
  mqttUsername: process.env.MQTT_USERNAME || undefined,
  mqttPassword: process.env.MQTT_PASSWORD || undefined,
  deviceId: process.env.DEVICE_ID || 'sim800-node-01',
  db,
  responder: orchestratorResponder
});

const app = createServer({ db, smsBridge });

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[sms-vertex-backend] listening on :${port}`);
});
