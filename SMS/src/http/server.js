import express from 'express';

export function createServer({ db, smsBridge }) {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'afyaroot-sms-gateway',
      mqttConnected: Boolean(smsBridge?.client?.connected),
      timestamp: new Date().toISOString()
    });
  });

  // Topic reference list
  app.get('/api/topics', (_req, res) => {
    res.json({
      topics: smsBridge.topics,
      referenceSummary: {
        'sms/send': { direction: 'App -> Gateway', retain: false, purpose: 'Submit outbound SMS to recipient' },
        'sms/status': { direction: 'Gateway -> App', retain: false, purpose: 'Track SMS state (queued, sending, sent, failed)' },
        'sms/incoming': { direction: 'Gateway -> App', retain: false, purpose: 'Receive incoming SMS messages from SIM card' },
        'gateway/status': { direction: 'Gateway -> App', retain: true, purpose: '30s heartbeat & Last Will/Testament status' },
        'gateway/metrics': { direction: 'Gateway -> App', retain: false, purpose: '5-min aggregate daily counters' },
        'gateway/commands': { direction: 'App -> Gateway', retain: false, purpose: 'Execute remote commands (reboot, clear_queue, send_at)' },
        'gateway/events': { direction: 'Gateway -> App', retain: false, purpose: 'AT command output & hardware log events' }
      }
    });
  });

  // Gateway Telemetry Endpoints
  app.get('/api/gateway/status', (_req, res) => {
    res.json(smsBridge.getGatewayStatus());
  });

  app.get('/api/gateway/metrics', (_req, res) => {
    res.json(smsBridge.getGatewayMetrics());
  });

  app.get('/api/gateway/events', (_req, res) => {
    res.json({ events: smsBridge.getGatewayEvents() });
  });

  app.post('/api/gateway/commands', (req, res) => {
    try {
      const result = smsBridge.publishCommand(req.body);
      res.json({ ok: true, command: result });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message || String(err) });
    }
  });

  // Query threads and charts
  app.get('/api/threads', async (req, res) => {
    try {
      const limit = Math.min(200, Math.max(1, Number(req.query.limit || 50)));
      res.json({ items: await db.queries.recentThreads({ limit }) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/charts', async (req, res) => {
    try {
      const days = Math.min(365, Math.max(1, Number(req.query.days || 14)));
      const fromMs = Date.now() - days * 24 * 60 * 60 * 1000;
      res.json({
        fromMs,
        byDay: await db.charts.byDay({ fromMs }),
        byCategory: await db.charts.byCategory({ fromMs })
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Manual outbound SMS send endpoint
  app.post('/api/send', (req, res) => {
    const { recipient, phone, message, device_id, message_id, id, priority } = req.body || {};
    const targetPhone = phone || recipient;
    if (!targetPhone || !message) {
      return res.status(400).json({ error: 'phone/recipient and message are required' });
    }

    const payload = {
      id: id || message_id || `manual-${Date.now()}`,
      phone: targetPhone,
      message,
      priority: priority || 'normal',
      device_id: device_id || (process.env.DEVICE_ID || 'sim800-node-01')
    };

    const sent = smsBridge.publishSms(payload);
    res.json({ ok: true, payload: sent });
  });

  return app;
}
