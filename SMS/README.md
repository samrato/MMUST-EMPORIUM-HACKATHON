# SMS + Vertex AI Backend (MQTT)

Node.js backend that:
- Subscribes to incoming SMS via MQTT
- Sends the message to Google Vertex AI (Gemini) for triage/response
- Publishes an outbound SMS job back to MQTT
- Stores inbound/outbound + status in SQLite
- Exposes HTTP endpoints for threads + chart data

## MQTT topics (DEVICE_ID=`sim800-node-01`)

- Subscribe incoming: `sms/incoming/sim800-node-01` (legacy mirror: `fampesa/notifications/sms/incoming`)
- Publish send: `sms/send/sim800-node-01` (legacy accepted: `fampesa/notifications/sms/jobs`)
- Subscribe result/status: `sms/result/sim800-node-01` (legacy mirror: `fampesa/notifications/sms/status`)

## Setup

1. Install deps:
   - `npm install`
2. Configure env:
   - `cp .env.example .env` and edit values
   - Set `MQTT_URL=mqtt://64.23.145.236:1883` (or your broker)
   - Set `VERTEX_API_KEY` (recommended) and `VERTEX_MODEL`
3. Run:
   - `npm run dev`

## Smoke test (MQTT loop)

With the backend running, you can simulate an inbound SMS and verify the outbound SMS job is published:
- `node scripts/mqtt-smoke.mjs`

## Docker (recommended + MongoDB context)

1. `cp .env.example .env` and fill `VERTEX_API_KEY` (and `MQTT_URL` if needed)
2. `docker compose up --build` (from `SMS/`)

When `MONGO_URL` is set (Docker does this automatically), inbound/outbound SMS, status updates, and chart data are stored in MongoDB via Mongoose.

## HTTP

- `GET /health`
- `GET /api/topics`
- `GET /api/threads?limit=50`
- `GET /api/charts?days=14`
- `POST /api/send` with `{ "recipient": "+2547...", "message": "Hello" }`
