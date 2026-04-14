import { createDb as createSqliteDb } from './db.js';
import { createMongoDb } from './mongo.js';

export async function createStorage() {
  const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI || '';
  if (mongoUrl) {
    // eslint-disable-next-line no-console
    console.log('[storage] using mongodb');
    return await createMongoDb({ mongoUrl });
  }

  // eslint-disable-next-line no-console
  console.log('[storage] using sqlite');
  return createSqliteDb({ sqlitePath: process.env.SQLITE_PATH || './data/app.db' });
}

