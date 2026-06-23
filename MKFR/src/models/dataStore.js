const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const DB_PATH = path.join(__dirname, 'db.json');

// Default backup dataset
const defaultData = {
  facilities: [
    {
      id: "KMHFR-10001",
      name: "Kenyatta National Hospital (KNH)",
      level: "Level 6 (National Referral)",
      kephLevel: 6,
      county: "Nairobi",
      subCounty: "Kibra",
      latitude: -1.3013,
      longitude: 36.8016,
      services: ["Outpatient", "Inpatient", "Maternity", "Laboratory", "Pharmacy", "Emergency Care", "Pediatrics", "Cardiology", "Oncology", "Nephrology", "Orthopedic", "General Surgery"],
      specialties: ["Cardiology", "Oncology", "Neurology", "Cardiothoracic Surgery", "Nephrology", "Orthopedic Surgery"],
      contact: "+254 20 2726300"
    },
    {
      id: "KMHFR-10002",
      name: "Kakamega County General Referral Hospital",
      level: "Level 5 (County Referral)",
      kephLevel: 5,
      county: "Kakamega",
      subCounty: "Lurambi",
      latitude: 0.2828,
      longitude: 34.7519,
      services: ["Outpatient", "Inpatient", "Maternity", "Laboratory", "Pharmacy", "Emergency Care", "Pediatrics", "Orthopedic", "General Surgery"],
      specialties: ["Obstetrics & Gynecology", "Pediatrics", "General Surgery", "Internal Medicine", "Orthopedics"],
      contact: "+254 56 31122"
    },
    {
      id: "KMHFR-10003",
      name: "Masinde Muliro University Clinic (MMUST Clinic)",
      level: "Level 2 (Dispensary)",
      kephLevel: 2,
      county: "Kakamega",
      subCounty: "Lurambi",
      latitude: 0.2882,
      longitude: 34.7675,
      services: ["Outpatient", "Laboratory", "Pharmacy", "Basic Triage"],
      specialties: ["General Medicine"],
      contact: "+254 702 597360"
    },
    {
      id: "KMHFR-10004",
      name: "M.P. Shah Hospital",
      level: "Level 5 (County Referral Private)",
      kephLevel: 5,
      county: "Nairobi",
      subCounty: "Westlands",
      latitude: -1.2647,
      longitude: 36.8118,
      services: ["Outpatient", "Inpatient", "Maternity", "Laboratory", "Pharmacy", "Emergency Care", "Pediatrics", "Cardiology", "Oncology", "Nephrology", "Orthopedic", "General Surgery"],
      specialties: ["Cardiology", "Pediatrics", "General Surgery", "Nephrology"],
      contact: "+254 20 4291000"
    },
    {
      id: "KMHFR-10005",
      name: "The Nairobi Hospital",
      level: "Level 6 (National Referral Private)",
      kephLevel: 6,
      county: "Nairobi",
      subCounty: "Dagoretti North",
      latitude: -1.2941,
      longitude: 36.8041,
      services: ["Outpatient", "Inpatient", "Maternity", "Laboratory", "Pharmacy", "Emergency Care", "Pediatrics", "Cardiology", "Oncology", "Nephrology", "Orthopedic", "General Surgery"],
      specialties: ["Cardiology", "Oncology", "Radiology", "General Surgery", "Nephrology"],
      contact: "+254 703 082000"
    },
    {
      id: "KMHFR-10006",
      name: "Mukumu Mission Hospital",
      level: "Level 4 (Sub-County Referral)",
      kephLevel: 4,
      county: "Kakamega",
      subCounty: "Shinyalu",
      latitude: 0.2052,
      longitude: 34.7788,
      services: ["Outpatient", "Inpatient", "Maternity", "Laboratory", "Pharmacy", "Emergency Care", "Pediatrics"],
      specialties: ["General Medicine", "Obstetrics & Gynecology"],
      contact: "+254 722 890456"
    },
    {
      id: "KMHFR-10007",
      name: "Alupe Sub-County Hospital",
      level: "Level 4 (Sub-County)",
      kephLevel: 4,
      county: "Busia",
      subCounty: "Teso South",
      latitude: 0.4912,
      longitude: 34.1235,
      services: ["Outpatient", "Inpatient", "Maternity", "Laboratory", "Pharmacy", "Emergency Care", "Pediatrics"],
      specialties: ["General Medicine"],
      contact: "+254 711 223344"
    }
  ],
  liveStatus: {
    "KMHFR-10001": {
      queue_count: 45,
      doctor_available: 12,
      beds_available: 8,
      emergency_status: "busy",
      updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    "KMHFR-10002": {
      queue_count: 18,
      doctor_available: 5,
      beds_available: 15,
      emergency_status: "normal",
      updated_at: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString()
    },
    "KMHFR-10003": {
      queue_count: 3,
      doctor_available: 1,
      beds_available: 0,
      emergency_status: "normal",
      updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
    },
    "KMHFR-10004": {
      queue_count: 12,
      doctor_available: 8,
      beds_available: 22,
      emergency_status: "normal",
      updated_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
    },
    "KMHFR-10005": {
      queue_count: 8,
      doctor_available: 14,
      beds_available: 35,
      emergency_status: "normal",
      updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    },
    "KMHFR-10006": {
      queue_count: 22,
      doctor_available: 2,
      beds_available: 4,
      emergency_status: "busy",
      updated_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString()
    }
  },
  bookings: [],
  triageSessions: [], // Persisting multi-turn diagnostics
  intelligenceLogs: [
    { symptom: "fever", language: "en", risk: "low", county: "Kakamega", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { symptom: "cough", language: "en", risk: "low", county: "Kakamega", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { symptom: "chest pain", language: "en", risk: "critical", county: "Nairobi", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { symptom: "severe headache", language: "sw", risk: "moderate", county: "Busia", timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() }
  ],
  chwReferrals: []
};

// Local JSON file DB management
function readJSON() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), 'utf8');
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (err) {
    return defaultData;
  }
}

function writeJSON(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    return false;
  }
}

// PostgreSQL Integration Configs
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'afyaroot_db',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

let pool = null;
let usePostgres = false;

// Attempt to connect to PostgreSQL
async function initDB() {
  try {
    pool = new Pool(poolConfig);
    await pool.query('SELECT NOW()');
    usePostgres = true;
    console.log(`📡 [Database] PostgreSQL connected successfully to '${poolConfig.database}' on ${poolConfig.host}:${poolConfig.port}`);
    
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schemaSql);
    console.log("⚡ [Database] PostgreSQL database tables verified and loaded.");

    const checkFac = await pool.query('SELECT COUNT(*) FROM facilities');
    if (parseInt(checkFac.rows[0].count) === 0) {
      console.log("🌱 [Database] Mapped zero records. Seeding default KMHFR and Live status records into Postgres...");
      
      for (const f of defaultData.facilities) {
        await pool.query(
          `INSERT INTO facilities (id, name, level, keph_level, county, sub_county, latitude, longitude, services, specialties, contact)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [f.id, f.name, f.level, f.kephLevel, f.county, f.subCounty, f.latitude, f.longitude, f.services, f.specialties, f.contact]
        );
      }

      for (const [fid, status] of Object.entries(defaultData.liveStatus)) {
        await pool.query(
          `INSERT INTO facility_live_status (facility_id, queue_count, doctor_available, beds_available, emergency_status, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [fid, status.queue_count, status.doctor_available, status.beds_available, status.emergency_status, status.updated_at]
        );
      }
      
      console.log("✅ [Database] PostgreSQL tables successfully seeded.");
    }
  } catch (err) {
    usePostgres = false;
    console.warn(`⚠️ [Database] PostgreSQL unavailable (${err.message}). Gracefully falling back to file-persisted JSON database.`);
    readJSON();
  }
}

// Run DB Initialization immediately
initDB();

module.exports = {
  isPostgresActive: () => usePostgres,

  getFacilities: async () => {
    if (usePostgres) {
      const res = await pool.query(
        `SELECT id, name, level, keph_level as "kephLevel", county, sub_county as "subCounty", 
                latitude, longitude, services, specialties, contact FROM facilities`
      );
      return res.rows;
    } else {
      return readJSON().facilities;
    }
  },

  getFacilityById: async (id) => {
    if (usePostgres) {
      const res = await pool.query(
        `SELECT id, name, level, keph_level as "kephLevel", county, sub_county as "subCounty", 
                latitude, longitude, services, specialties, contact FROM facilities WHERE id = $1`,
        [id]
      );
      return res.rows[0] || null;
    } else {
      return readJSON().facilities.find(f => f.id === id) || null;
    }
  },

  getLiveStatus: async () => {
    if (usePostgres) {
      const res = await pool.query(`SELECT facility_id, queue_count, doctor_available, beds_available, emergency_status, updated_at FROM facility_live_status`);
      const statusMap = {};
      res.rows.forEach(r => {
        statusMap[r.facility_id] = {
          queue_count: r.queue_count,
          doctor_available: r.doctor_available,
          beds_available: r.beds_available,
          emergency_status: r.emergency_status,
          updated_at: r.updated_at
        };
      });
      return statusMap;
    } else {
      return readJSON().liveStatus;
    }
  },

  getLiveStatusById: async (facilityId) => {
    if (usePostgres) {
      const res = await pool.query(
        `SELECT queue_count, doctor_available, beds_available, emergency_status, updated_at FROM facility_live_status WHERE facility_id = $1`,
        [facilityId]
      );
      return res.rows[0] || null;
    } else {
      return readJSON().liveStatus[facilityId] || null;
    }
  },

  getBookings: async () => {
    if (usePostgres) {
      const res = await pool.query(
        `SELECT id, facility_id as "facilityId", patient_name as "patientName", phone_number as "phoneNumber", 
                date, time, service_needed as "serviceNeeded", language, status, created_at as "createdAt" FROM bookings`
      );
      return res.rows;
    } else {
      return readJSON().bookings;
    }
  },

  getBookingById: async (id) => {
    if (usePostgres) {
      const res = await pool.query(
        `SELECT id, facility_id as "facilityId", patient_name as "patientName", phone_number as "phoneNumber", 
                date, time, service_needed as "serviceNeeded", language, status, created_at as "createdAt" FROM bookings WHERE id = $1`,
        [id]
      );
      return res.rows[0] || null;
    } else {
      return readJSON().bookings.find(b => b.id === id) || null;
    }
  },

  getIntelligenceLogs: async () => {
    if (usePostgres) {
      const res = await pool.query(`SELECT symptom, language, risk, county, is_emergency, timestamp FROM triage_logs`);
      return res.rows;
    } else {
      return readJSON().intelligenceLogs;
    }
  },

  getChwReferrals: async () => {
    if (usePostgres) {
      const res = await pool.query(
        `SELECT id, chw_id as "chwId", patient_name as "patientName", household_id as "householdId", 
                symptoms, triage_risk as "triageRisk", referred_facility_id as "referredFacilityId", synced_at as "syncedAt" FROM chw_referrals`
      );
      return res.rows;
    } else {
      return readJSON().chwReferrals;
    }
  },

  updateLiveStatus: async (facilityId, statusUpdate) => {
    if (usePostgres) {
      const current = await pool.query(`SELECT * FROM facility_live_status WHERE facility_id = $1`, [facilityId]);
      const status = current.rows[0] || { queue_count: 0, doctor_available: 0, beds_available: 0, emergency_status: 'normal' };
      
      const queue = statusUpdate.queue_count !== undefined ? statusUpdate.queue_count : status.queue_count;
      const doc = statusUpdate.doctor_available !== undefined ? statusUpdate.doctor_available : status.doctor_available;
      const bed = statusUpdate.beds_available !== undefined ? statusUpdate.beds_available : status.beds_available;
      const emergency = statusUpdate.emergency_status !== undefined ? statusUpdate.emergency_status : status.emergency_status;

      const res = await pool.query(
        `INSERT INTO facility_live_status (facility_id, queue_count, doctor_available, beds_available, emergency_status, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (facility_id) DO UPDATE SET
            queue_count = EXCLUDED.queue_count,
            doctor_available = EXCLUDED.doctor_available,
            beds_available = EXCLUDED.beds_available,
            emergency_status = EXCLUDED.emergency_status,
            updated_at = NOW()
         RETURNING queue_count, doctor_available, beds_available, emergency_status, updated_at`,
        [facilityId, queue, doc, bed, emergency]
      );
      return res.rows[0];
    } else {
      const db = readJSON();
      const existing = db.liveStatus[facilityId] || {
        queue_count: 0,
        doctor_available: 0,
        beds_available: 0,
        emergency_status: "normal"
      };

      db.liveStatus[facilityId] = {
        ...existing,
        ...statusUpdate,
        updated_at: new Date().toISOString()
      };
      writeJSON(db);
      return db.liveStatus[facilityId];
    }
  },

  addBooking: async (booking) => {
    const bookingId = "BK-" + Math.floor(100000 + Math.random() * 900000);
    if (usePostgres) {
      const res = await pool.query(
        `INSERT INTO bookings (id, facility_id, patient_name, phone_number, date, time, service_needed, language, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW())
         RETURNING id, facility_id as "facilityId", patient_name as "patientName", phone_number as "phoneNumber", 
                   date, time, service_needed as "serviceNeeded", language, status, created_at as "createdAt"`,
        [bookingId, booking.facilityId, booking.patientName, booking.phoneNumber, booking.date, booking.time, booking.serviceNeeded, booking.language]
      );
      return res.rows[0];
    } else {
      const db = readJSON();
      const newBooking = {
        id: bookingId,
        createdAt: new Date().toISOString(),
        status: "pending",
        ...booking
      };
      db.bookings.push(newBooking);
      writeJSON(db);
      return newBooking;
    }
  },

  updateBookingStatus: async (bookingId, status) => {
    if (usePostgres) {
      const res = await pool.query(
        `UPDATE bookings SET status = $1 WHERE id = $2 
         RETURNING id, facility_id as "facilityId", patient_name as "patientName", phone_number as "phoneNumber", 
                   date, time, service_needed as "serviceNeeded", language, status, created_at as "createdAt"`,
        [status, bookingId]
      );
      return res.rows[0] || null;
    } else {
      const db = readJSON();
      const idx = db.bookings.findIndex(b => b.id === bookingId);
      if (idx !== -1) {
        db.bookings[idx].status = status;
        writeJSON(db);
        return db.bookings[idx];
      }
      return null;
    }
  },

  logTriageSession: async (log) => {
    if (usePostgres) {
      const res = await pool.query(
        `INSERT INTO triage_logs (symptom, language, risk, county, is_emergency, timestamp)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING symptom, language, risk, county, is_emergency, timestamp`,
        [log.symptom, log.language, log.risk, log.county, !!log.is_emergency]
      );
      return res.rows[0];
    } else {
      const db = readJSON();
      const newLog = {
        timestamp: new Date().toISOString(),
        ...log
      };
      db.intelligenceLogs.push(newLog);
      writeJSON(db);
      return newLog;
    }
  },

  addChwReferral: async (referral) => {
    const referralId = "REF-" + Math.floor(100000 + Math.random() * 900000);
    if (usePostgres) {
      const res = await pool.query(
        `INSERT INTO chw_referrals (id, chw_id, patient_name, household_id, symptoms, triage_risk, referred_facility_id, synced_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING id, chw_id as "chwId", patient_name as "patientName", household_id as "householdId", 
                   symptoms, triage_risk as "triageRisk", referred_facility_id as "referredFacilityId", synced_at as "syncedAt"`,
        [referralId, referral.chwId, referral.patientName, referral.householdId, referral.symptoms, referral.triageRisk, referral.referredFacilityId]
      );
      return res.rows[0];
    } else {
      const db = readJSON();
      const newReferral = {
        id: referralId,
        timestamp: new Date().toISOString(),
        ...referral
      };
      db.chwReferrals.push(newReferral);
      writeJSON(db);
      return newReferral;
    }
  },

  // Conversational Doctor-Triage Session Management
  createTriageSession: async (session) => {
    if (usePostgres) {
      const res = await pool.query(
        `INSERT INTO triage_sessions (id, county, language, initial_symptoms, questions, answers, current_index, finalized, risk, urgency, required_services)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id, county, language, initial_symptoms as "initialSymptoms", questions, answers, current_index as "currentIndex", finalized, risk, urgency, required_services as "requiredServices"`,
        [session.id, session.county, session.language, session.initialSymptoms, session.questions, session.answers, session.currentIndex, session.finalized, session.risk, session.urgency, session.requiredServices]
      );
      return res.rows[0];
    } else {
      const db = readJSON();
      if (!db.triageSessions) db.triageSessions = [];
      db.triageSessions.push(session);
      writeJSON(db);
      return session;
    }
  },

  getTriageSession: async (id) => {
    if (usePostgres) {
      const res = await pool.query(
        `SELECT id, county, language, initial_symptoms as "initialSymptoms", questions, answers, current_index as "currentIndex", finalized, risk, urgency, required_services as "requiredServices"
         FROM triage_sessions WHERE id = $1`,
        [id]
      );
      return res.rows[0] || null;
    } else {
      const db = readJSON();
      if (!db.triageSessions) db.triageSessions = [];
      return db.triageSessions.find(s => s.id === id) || null;
    }
  },

  updateTriageSession: async (id, updates) => {
    if (usePostgres) {
      const current = await pool.query(`SELECT * FROM triage_sessions WHERE id = $1`, [id]);
      if (current.rows.length === 0) return null;
      const s = current.rows[0];

      const idx = updates.currentIndex !== undefined ? updates.currentIndex : s.current_index;
      const ans = updates.answers !== undefined ? updates.answers : s.answers;
      const fin = updates.finalized !== undefined ? updates.finalized : s.finalized;
      const r = updates.risk !== undefined ? updates.risk : s.risk;
      const u = updates.urgency !== undefined ? updates.urgency : s.urgency;
      const srvs = updates.requiredServices !== undefined ? updates.requiredServices : s.required_services;

      const res = await pool.query(
        `UPDATE triage_sessions SET
           current_index = $2,
           answers = $3,
           finalized = $4,
           risk = $5,
           urgency = $6,
           required_services = $7
         WHERE id = $1
         RETURNING id, county, language, initial_symptoms as "initialSymptoms", questions, answers, current_index as "currentIndex", finalized, risk, urgency, required_services as "requiredServices"`,
        [id, idx, ans, fin, r, u, srvs]
      );
      return res.rows[0];
    } else {
      const db = readJSON();
      if (!db.triageSessions) db.triageSessions = [];
      const idx = db.triageSessions.findIndex(s => s.id === id);
      if (idx !== -1) {
        db.triageSessions[idx] = {
          ...db.triageSessions[idx],
          ...updates
        };
        writeJSON(db);
        return db.triageSessions[idx];
      }
      return null;
    }
  }
};
