import { createMongoDb } from './mongo.js';

export async function createStorage() {
  const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
  if (mongoUrl) {
    try {
      console.log('[storage] attempting connection to mongodb...');
      const mongoDb = await createMongoDb({ mongoUrl });
      console.log('[storage] mongodb connected successfully');
      return mongoDb;
    } catch (err) {
      console.warn('[storage] mongodb connection failed, falling back to memory store:', err.message);
    }
  }

  console.log('[storage] using in-memory store');
  const MAX_IN_MEMORY = 200;
  const inboundList = [];
  const outboundList = [];
  const logsList = [];

  return {
    raw: null,
    inbound: {
      insert: async (row) => {
        inboundList.push(row);
        if (inboundList.length > MAX_IN_MEMORY) inboundList.splice(0, inboundList.length - MAX_IN_MEMORY);
      }
    },
    outbound: {
      insert: async (row) => {
        outboundList.push(row);
        if (outboundList.length > MAX_IN_MEMORY) outboundList.splice(0, outboundList.length - MAX_IN_MEMORY);
      },
      updateStatus: async (row) => {
        const item = outboundList.find((o) => o.id === row.id);
        if (item) Object.assign(item, row);
      }
    },
    logs: {
      insert: async (row) => {
        logsList.push({ ...row, created_at: Date.now() });
        if (logsList.length > MAX_IN_MEMORY) logsList.splice(0, logsList.length - MAX_IN_MEMORY);
      }
    },
    charts: {
      byDay: async () => [],
      byCategory: async () => []
    },
    queries: {
      recentThreads: async ({ limit = 50 }) => {
        return inboundList.slice(-limit).reverse().map((i) => {
          const o = outboundList.find((out) => out.inbound_id === i.id);
          return {
            inbound_id: i.id,
            sender: i.sender,
            inbound_message: i.message,
            inbound_at: i.created_at,
            outbound_id: o?.id,
            outbound_message: o?.message,
            category: o?.category,
            urgency: o?.urgency,
            status: o?.status,
            outbound_at: o?.created_at
          };
        });
      }
    }
  };
}
