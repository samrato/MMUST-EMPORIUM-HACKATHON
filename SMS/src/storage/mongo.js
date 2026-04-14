import mongoose from 'mongoose';

const InboundSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    device_id: { type: String },
    sender: { type: String, required: true, index: true },
    message: { type: String, required: true },
    provider: { type: String },
    modem_timestamp: { type: String },
    created_at: { type: Number, required: true, index: true }
  },
  { versionKey: false }
);

const OutboundSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    inbound_id: { type: String, index: true },
    device_id: { type: String, required: true },
    recipient: { type: String, required: true, index: true },
    message: { type: String, required: true },
    category: { type: String },
    urgency: { type: String },
    status: { type: String, required: true },
    success: { type: Boolean, default: null },
    error: { type: String, default: null },
    provider_reference: { type: String, default: null },
    created_at: { type: Number, required: true, index: true },
    updated_at: { type: Number, default: null }
  },
  { versionKey: false }
);

const LogSchema = new mongoose.Schema(
  {
    level: { type: String, required: true },
    message: { type: String, required: true },
    meta_json: { type: String, default: null },
    created_at: { type: Number, required: true, index: true }
  },
  { versionKey: false }
);

let models;
function getModels() {
  if (models) return models;
  models = {
    Inbound: mongoose.model('InboundSms', InboundSchema, 'inbound_sms'),
    Outbound: mongoose.model('OutboundSms', OutboundSchema, 'outbound_sms'),
    Log: mongoose.model('AppLog', LogSchema, 'app_logs')
  };
  return models;
}

export async function createMongoDb({ mongoUrl }) {
  if (!mongoUrl) throw new Error('mongoUrl is required');
  await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 10_000 });

  const { Inbound, Outbound, Log } = getModels();

  return {
    raw: mongoose,
    inbound: {
      insert: async (row) => {
        await Inbound.create({ ...row, _id: row.id });
      }
    },
    outbound: {
      insert: async (row) => {
        await Outbound.create({ ...row, _id: row.id });
      },
      updateStatus: async (row) => {
        await Outbound.updateOne(
          { _id: row.id },
          {
            $set: {
              status: row.status,
              success: row.success ?? null,
              error: row.error ?? null,
              provider_reference: row.provider_reference ?? null,
              updated_at: row.updated_at ?? Date.now()
            }
          }
        );
      }
    },
    logs: {
      insert: async (row) => {
        await Log.create({
          level: row.level,
          message: row.message,
          meta_json: row.meta_json ?? null,
          created_at: Date.now()
        });
      }
    },
    charts: {
      byDay: async ({ fromMs }) => {
        const rows = await Inbound.aggregate([
          { $match: { created_at: { $gte: fromMs } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: { $toDate: '$created_at' } } },
              inbound_count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, day: '$_id', inbound_count: 1 } }
        ]);
        return rows;
      },
      byCategory: async ({ fromMs }) => {
        const rows = await Outbound.aggregate([
          { $match: { created_at: { $gte: fromMs } } },
          { $group: { _id: '$category', outbound_count: { $sum: 1 } } },
          { $sort: { outbound_count: -1 } },
          { $project: { _id: 0, category: '$_id', outbound_count: 1 } }
        ]);
        return rows;
      }
    },
    queries: {
      recentThreads: async ({ limit }) => {
        const inbound = await Inbound.find().sort({ created_at: -1 }).limit(limit).lean();
        const inboundIds = inbound.map((i) => i._id);
        const outbound = await Outbound.find({ inbound_id: { $in: inboundIds } }).lean();
        const byInbound = new Map(outbound.map((o) => [o.inbound_id, o]));
        return inbound.map((i) => {
          const o = byInbound.get(i._id);
          return {
            inbound_id: i._id,
            sender: i.sender,
            inbound_message: i.message,
            inbound_at: i.created_at,
            outbound_id: o?._id,
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

