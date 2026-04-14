import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

export function createDb({ sqlitePath }) {
  const dir = path.dirname(sqlitePath);
  if (dir && dir !== '.' && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(sqlitePath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS inbound_sms (
      id TEXT PRIMARY KEY,
      device_id TEXT,
      sender TEXT NOT NULL,
      message TEXT NOT NULL,
      provider TEXT,
      modem_timestamp TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS outbound_sms (
      id TEXT PRIMARY KEY,
      inbound_id TEXT,
      device_id TEXT NOT NULL,
      recipient TEXT NOT NULL,
      message TEXT NOT NULL,
      category TEXT,
      urgency TEXT,
      status TEXT NOT NULL,
      success INTEGER,
      error TEXT,
      provider_reference TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS app_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      meta_json TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000)
    );
  `);

  const inboundInsert = db.prepare(
    `INSERT INTO inbound_sms (id, device_id, sender, message, provider, modem_timestamp, created_at)
     VALUES (@id, @device_id, @sender, @message, @provider, @modem_timestamp, @created_at)`
  );

  const outboundInsert = db.prepare(
    `INSERT INTO outbound_sms (id, inbound_id, device_id, recipient, message, category, urgency, status, created_at)
     VALUES (@id, @inbound_id, @device_id, @recipient, @message, @category, @urgency, @status, @created_at)`
  );

  const outboundUpdateStatus = db.prepare(
    `UPDATE outbound_sms
      SET status=@status, success=@success, error=@error, provider_reference=@provider_reference, updated_at=@updated_at
      WHERE id=@id`
  );

  const logsInsert = db.prepare(`INSERT INTO app_logs (level, message, meta_json) VALUES (@level, @message, @meta_json)`);

  const chartsByDay = db.prepare(
    `SELECT
      date(created_at/1000, 'unixepoch', 'localtime') AS day,
      COUNT(*) AS inbound_count
     FROM inbound_sms
     WHERE created_at >= @fromMs
     GROUP BY day
     ORDER BY day ASC`
  );

  const chartsByCategory = db.prepare(
    `SELECT category, COUNT(*) AS outbound_count
     FROM outbound_sms
     WHERE created_at >= @fromMs
     GROUP BY category
     ORDER BY outbound_count DESC`
  );

  const recentThreads = db.prepare(
    `SELECT i.id AS inbound_id, i.sender, i.message AS inbound_message, i.created_at AS inbound_at,
            o.id AS outbound_id, o.message AS outbound_message, o.category, o.urgency, o.status, o.created_at AS outbound_at
     FROM inbound_sms i
     LEFT JOIN outbound_sms o ON o.inbound_id = i.id
     ORDER BY i.created_at DESC
     LIMIT @limit`
  );

  return {
    raw: db,
    inbound: { insert: (row) => inboundInsert.run(row) },
    outbound: {
      insert: (row) => outboundInsert.run(row),
      updateStatus: (row) => outboundUpdateStatus.run(row)
    },
    logs: { insert: (row) => logsInsert.run({ ...row, meta_json: row.meta_json ?? null }) },
    charts: {
      byDay: ({ fromMs }) => chartsByDay.all({ fromMs }),
      byCategory: ({ fromMs }) => chartsByCategory.all({ fromMs })
    },
    queries: {
      recentThreads: ({ limit }) => recentThreads.all({ limit })
    }
  };
}

