import express from 'express';

export function createServer({ db, smsBridge }) {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.get('/api/topics', (_req, res) => res.json(smsBridge.topics));

  app.get('/api/threads', async (req, res) => {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 50)));
    res.json({ items: await db.queries.recentThreads({ limit }) });
  });

  app.get('/api/charts', async (req, res) => {
    const days = Math.min(365, Math.max(1, Number(req.query.days || 14)));
    const fromMs = Date.now() - days * 24 * 60 * 60 * 1000;
    res.json({
      fromMs,
      byDay: await db.charts.byDay({ fromMs }),
      byCategory: await db.charts.byCategory({ fromMs })
    });
  });

  app.post('/api/send', (req, res) => {
    const { recipient, message, device_id, message_id } = req.body || {};
    if (!recipient || !message) return res.status(400).json({ error: 'recipient and message are required' });

    const payload = {
      message_id: message_id || `manual-${Date.now()}`,
      device_id: device_id || (process.env.DEVICE_ID || 'sim800-node-01'),
      recipient,
      message
    };
    smsBridge.publishSms(payload);
    res.json({ ok: true, payload });
  });

  return app;
}
