# SMS + AI Backend Gateway (MQTT)

Node.js backend and GSM bridge service that:
- Subscribes to incoming SMS via MQTT (`sms/incoming`)
- Forwards messages to the central AFYAROOT MKFR AI Orchestrator / Gemini for clinical triage and routing
- Shortens responses via the SMS Formatter Agent (< 320 chars)
- Publishes outbound SMS to MQTT (`sms/send`)
- Tracks SMS delivery lifecycle (`sms/status`: queued → sending → sent / failed)
- Ingests hardware gateway status heartbeats (`gateway/status`), aggregate daily metrics (`gateway/metrics`), and AT events (`gateway/events`)
- Sends remote commands (`gateway/commands`: reboot, clear_queue, send_at)
- Stores inbound/outbound records, sessions, and telemetry in MongoDB/SQLite
- Exposes REST HTTP endpoints for dashboard threads, charts, and gateway telemetry

---

## MQTT Topic Reference Summary

| Topic | Direction | Retain | Purpose |
|---|---|---|---|
| `sms/send` | App → Gateway | No | Submit outbound SMS to recipient |
| `sms/status` | Gateway → App | No | Track SMS state (`queued`, `sending`, `sent`, `failed`) |
| `sms/incoming` | Gateway → App | No | Receive incoming SMS messages from SIM card |
| `gateway/status` | Gateway → App | Yes | 30s heartbeat & Last Will/Testament status |
| `gateway/metrics` | Gateway → App | No | 5-min aggregate daily counters |
| `gateway/commands` | App → Gateway | No | Execute remote commands (`reboot`, `clear_queue`, `send_at`) |
| `gateway/events` | Gateway → App | No | AT command output & hardware log events |

---

## Topic Details & Payload Examples

### 1. Send Outbound SMS (`sms/send`)
• **Direction:** Application/Backend → Gateway  
• **Payload:**
```json
{
  "id": "msg-94812",
  "phone": "+254712345678",
  "message": "Your verification code is 482910.",
  "priority": "normal"
}
```

### 2. SMS Status Tracking (`sms/status`)
• **Direction:** Gateway → Application/Backend  
• **State Progression:** `queued` → `sending` → `sent` (or `failed`)  
• **Payload:**
```json
{
  "id": "msg-94812",
  "status": "sent",
  "timestamp": 1776341204
}
```

### 3. Incoming SMS (`sms/incoming`)
• **Direction:** Gateway → Application/Backend  
• **Payload:**
```json
{
  "messageId": "rx-1776341250",
  "from": "MPESA",
  "message": "UHH8O3GFSG Confirmed. You received Ksh 500.00 from JOHN DOE.",
  "timestamp": "now"
}
```

### 4. Gateway Health Heartbeat (`gateway/status`)
• **Direction:** Gateway → Broker/Backend (Retained)  
• **Payload:**
```json
{
  "deviceId": "gateway-001",
  "online": true,
  "signal": 24,
  "operator": "Safaricom",
  "uptime": 86420,
  "queueLength": 0
}
```

### 5. Aggregate Daily Metrics (`gateway/metrics`)
• **Direction:** Gateway → Broker/Backend  
• **Payload:**
```json
{
  "deviceId": "gateway-001",
  "sentToday": 142,
  "receivedToday": 38,
  "failedToday": 2
}
```

### 6. Remote Commands (`gateway/commands`)
• **Direction:** Application/Backend → Gateway  
• **Remote Reboot:**
```json
{ "command": "reboot" }
```
• **Clear Queue:**
```json
{ "command": "clear_queue" }
```
• **Send Raw AT:**
```json
{
  "command": "send_at",
  "at": "AT+CSQ"
}
```

### 7. Hardware Events & AT Responses (`gateway/events`)
• **Direction:** Gateway → Application/Backend  
• **Payload:**
```json
{
  "deviceId": "gateway-001",
  "event": "at_response",
  "details": "+CSQ: 24,0\r\nOK\r\n",
  "timestamp": 1776341300
}
```

---

## Setup & Running

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure `.env`:**
   ```env
   PORT=4000
   MQTT_URL=mqtt://137.184.147.21:1883
   BACKEND_API_URL=http://localhost:5000
   DEVICE_ID=sim800-node-01
   ```

3. **Start Service:**
   ```bash
   npm run dev
   ```

4. **Smoke Test:**
   ```bash
   node scripts/mqtt-smoke.mjs
   ```

---

## HTTP REST Endpoints

- `GET /health` - Health check and MQTT connection status
- `GET /api/topics` - Full MQTT topic reference map
- `GET /api/gateway/status` - Latest gateway telemetry and heartbeat
- `GET /api/gateway/metrics` - Daily aggregate message counters
- `GET /api/gateway/events` - Recent AT and hardware log events
- `POST /api/gateway/commands` - Dispatch remote command to gateway (`reboot`, `clear_queue`, `send_at`)
- `GET /api/threads?limit=50` - Inbound/Outbound chat threads
- `GET /api/charts?days=14` - Daily statistics and category breakdowns
- `POST /api/send` - Send manual outbound SMS via `sms/send`
