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
      operationStatus: "Operational",
      county: "Nairobi",
      subCounty: "Kibra",
      ward: "Woodley/Kenyatta Golf Course",
      constituency: "Kibra",
      latitude: -1.3013,
      longitude: 36.8016,
      services: ["Outpatient", "Inpatient", "Maternity", "Laboratory", "Pharmacy", "Emergency Care", "Pediatrics", "Cardiology", "Oncology", "Nephrology", "Orthopedic", "General Surgery"],
      specialties: ["Cardiology", "Oncology", "Neurology", "Cardiothoracic Surgery", "Nephrology", "Orthopedic Surgery"],
      contact: "+254 20 2726300"
    },
    {
      id: "30386",
      name: "Kakamega Orthopaedic Hospital",
      level: "Primary care hospitals",
      kephLevel: 4,
      operationStatus: "Operational",
      county: "Kakamega",
      subCounty: "Malava",
      ward: "East Kabras",
      constituency: "Malava",
      latitude: 0.4485,
      longitude: 34.8550,
      services: ["Outpatient", "Inpatient", "Orthopedic Surgery", "Emergency Care"],
      specialties: ["Orthopedics", "General Surgery"],
      contact: "+254 56 30001"
    },
    {
      id: "17825",
      name: "Kakamega Grace Medical Centre",
      level: "Medical Center",
      kephLevel: 3,
      operationStatus: "Operational",
      county: "Kakamega",
      subCounty: "Lurambi",
      ward: "Shirere",
      constituency: "Lurambi",
      latitude: 0.2830,
      longitude: 34.7520,
      services: ["Outpatient", "Laboratory", "Pharmacy", "Maternity"],
      specialties: ["General Medicine"],
      contact: "+254 56 30002"
    },
    {
      id: "25996",
      name: "Equity Afia Medical Clinic (Kakamega)",
      level: "Medical Clinic",
      kephLevel: 2,
      operationStatus: "Operational",
      county: "Kakamega",
      subCounty: "Lurambi",
      ward: "Shirere",
      constituency: "Lurambi",
      latitude: 0.2840,
      longitude: 34.7530,
      services: ["Outpatient", "Laboratory", "Pharmacy", "Consultation"],
      specialties: ["General Practice", "Pediatrics"],
      contact: "+254 700 395395"
    },
    {
      id: "23989",
      name: "St.Christine Medical Centre-Kakamega",
      level: "Medical Clinic",
      kephLevel: 2,
      operationStatus: "Operational",
      county: "Kakamega",
      subCounty: "Lurambi",
      ward: "Sheywe",
      constituency: "Lurambi",
      latitude: 0.2820,
      longitude: 34.7510,
      services: ["Outpatient", "Laboratory", "Pharmacy"],
      specialties: ["General Medicine"],
      contact: "+254 56 30004"
    },
    {
      id: "15914",
      name: "Kakamega Forest Dispensary",
      level: "Dispensary",
      kephLevel: 2,
      operationStatus: "Operational",
      county: "Kakamega",
      subCounty: "Shinyalu",
      ward: "Isukha Central",
      constituency: "Shinyalu",
      latitude: 0.2350,
      longitude: 34.8600,
      services: ["Outpatient", "Basic Triage", "Immunization"],
      specialties: ["Nursing"],
      contact: "+254 56 30005"
    },
    {
      id: "34063",
      name: "Kakamega Dental Suite",
      level: "Medical Clinic",
      kephLevel: 2,
      operationStatus: "Operational",
      county: "Kakamega",
      subCounty: "Lurambi",
      ward: "Mahiakalo",
      constituency: "Lurambi",
      latitude: 0.2890,
      longitude: 34.7600,
      services: ["Dental Care", "Outpatient", "Oral Surgery"],
      specialties: ["Dentistry"],
      contact: "+254 56 30006"
    },
    {
      id: "33831",
      name: "St. Raphael Kakamega Medical Clinic",
      level: "Medical Clinic",
      kephLevel: 2,
      operationStatus: "Operational",
      county: "Kakamega",
      subCounty: "Lurambi",
      ward: "Shirere",
      constituency: "Lurambi",
      latitude: 0.2850,
      longitude: 34.7540,
      services: ["Outpatient", "Laboratory", "Pharmacy"],
      specialties: ["General Practice"],
      contact: "+254 56 30007"
    },
    {
      id: "33689",
      name: "Sonar Imaging Centre-Kakamega",
      level: "Medical Center",
      kephLevel: 3,
      operationStatus: "Operational",
      county: "Kakamega",
      subCounty: "Lurambi",
      ward: "Mahiakalo",
      constituency: "Lurambi",
      latitude: 0.2880,
      longitude: 34.7610,
      services: ["Ultrasound", "X-Ray", "Radiology"],
      specialties: ["Radiology"],
      contact: "+254 56 30008"
    },
    {
      id: "24868",
      name: "Oasis Doctors Plaza Kakamega",
      level: "Primary care hospitals",
      kephLevel: 4,
      operationStatus: "Operational",
      county: "Kakamega",
      subCounty: "Lurambi",
      ward: "Shirere",
      constituency: "Lurambi",
      latitude: 0.2860,
      longitude: 34.7550,
      services: ["Outpatient", "Inpatient", "Maternity", "Consultation", "Pharmacy"],
      specialties: ["Obstetrics & Gynecology", "Pediatrics", "General Surgery"],
      contact: "+254 56 30009"
    },
    {
      id: "32949",
      name: "West Hill Eye Centre-Kakamega",
      level: "Medical Clinic",
      kephLevel: 2,
      operationStatus: "Operational",
      county: "Kakamega",
      subCounty: "Lurambi",
      ward: "Shirere",
      constituency: "Lurambi",
      latitude: 0.2835,
      longitude: 34.7525,
      services: ["Ophthalmology", "Optometry", "Eye Surgery"],
      specialties: ["Ophthalmology"],
      contact: "+254 56 30010"
    },
    {
      id: "32950",
      name: "Avenue Health Care Limited-Kakamega",
      level: "Basic Health Centre",
      kephLevel: 3,
      operationStatus: "Operational",
      county: "Kakamega",
      subCounty: "Lurambi",
      ward: "Sheywe",
      constituency: "Lurambi",
      latitude: 0.2815,
      longitude: 34.7505,
      services: ["Outpatient", "Laboratory", "Pharmacy", "Emergency Care"],
      specialties: ["General Medicine", "Pediatrics"],
      contact: "+254 56 30011"
    },
    {
      id: "21434",
      name: "Marie Stopes Kakamega Clinic",
      level: "Medical Clinic",
      kephLevel: 2,
      operationStatus: "Operational",
      county: "Kakamega",
      subCounty: "Lurambi",
      ward: "Sheywe",
      constituency: "Lurambi",
      latitude: 0.2810,
      longitude: 34.7500,
      services: ["Reproductive Health", "Family Planning", "Outpatient"],
      specialties: ["Obstetrics & Gynecology"],
      contact: "+254 56 30012"
    },
    {
      id: "23968",
      name: "Kakamega Medcare Clinic",
      level: "Medical Clinic",
      kephLevel: 2,
      operationStatus: "Operational",
      county: "Kakamega",
      subCounty: "Lurambi",
      ward: "Sheywe",
      constituency: "Lurambi",
      latitude: 0.2812,
      longitude: 34.7502,
      services: ["Outpatient", "Laboratory", "Pharmacy"],
      specialties: ["General Medicine"],
      contact: "+254 56 30013"
    },
    {
      id: "28940",
      name: "Eminent Smiles Dental Clinic Kakamega",
      level: "Medical Clinic",
      kephLevel: 2,
      operationStatus: "Operational",
      county: "Kakamega",
      subCounty: "Lurambi",
      ward: "Mahiakalo",
      constituency: "Lurambi",
      latitude: 0.2885,
      longitude: 34.7605,
      services: ["Dental Care", "Oral Hygiene"],
      specialties: ["Dentistry"],
      contact: "+254 56 30014"
    },
    {
      id: "24247",
      name: "Bliss GVS Health Care Ltd Kakamega",
      level: "Medical Clinic",
      kephLevel: 2,
      operationStatus: "Operational",
      county: "Kakamega",
      subCounty: "Lurambi",
      ward: "Mahiakalo",
      constituency: "Lurambi",
      latitude: 0.2882,
      longitude: 34.7602,
      services: ["Outpatient", "Laboratory", "Pharmacy", "Consultation"],
      specialties: ["General Practice"],
      contact: "+254 56 30015"
    },
    {
      id: "15892",
      name: "Gk Prisons Dispensary (Kakamega Central)",
      level: "Dispensary",
      kephLevel: 2,
      operationStatus: "Operational",
      county: "Kakamega",
      subCounty: "Lurambi",
      ward: "Shirere",
      constituency: "Lurambi",
      latitude: 0.2845,
      longitude: 34.7535,
      services: ["Outpatient", "Basic Triage", "Pharmacy"],
      specialties: ["General Practice"],
      contact: "+254 56 30016"
    },
    {
      id: "29077",
      name: "Kakamega Satelite Blood Transfusion Centre",
      level: "Satellite Blood Bank",
      kephLevel: 2,
      operationStatus: "Operational",
      county: "Kakamega",
      subCounty: "Lurambi",
      ward: "Shirere",
      constituency: "Lurambi",
      latitude: 0.2838,
      longitude: 34.7528,
      services: ["Blood Donation", "Blood Transfusion Services", "Laboratory"],
      specialties: ["Hematology"],
      contact: "+254 56 30017"
    },
    {
      id: "27335",
      name: "Kakamega High School Medical Clinic",
      level: "Medical Clinic",
      kephLevel: 2,
      operationStatus: "Operational",
      county: "Kakamega",
      subCounty: "Lurambi",
      ward: "Shirere",
      constituency: "Lurambi",
      latitude: 0.2842,
      longitude: 34.7532,
      services: ["Outpatient", "First Aid", "Basic Triage"],
      specialties: ["School Health"],
      contact: "+254 56 30018"
    },
    {
      id: "23500",
      name: "Kakamega Hilltop Medical Clinic",
      level: "Medical Clinic",
      kephLevel: 2,
      operationStatus: "Operational",
      county: "Kakamega",
      subCounty: "Lurambi",
      ward: "Butsotso East",
      constituency: "Lurambi",
      latitude: 0.2900,
      longitude: 34.7450,
      services: ["Outpatient", "Laboratory", "Pharmacy"],
      specialties: ["General Practice"],
      contact: "+254 56 30019"
    },
    {
      id: "15844",
      name: "Kakamega Central Nursing Home",
      level: "Comprehensive Health Centre",
      kephLevel: 3,
      operationStatus: "Operational",
      county: "Kakamega",
      subCounty: "Lurambi",
      ward: "Sheywe",
      constituency: "Lurambi",
      latitude: 0.2825,
      longitude: 34.7515,
      services: ["Outpatient", "Inpatient", "Maternity", "Pharmacy", "Laboratory"],
      specialties: ["Nursing Care", "General Medicine"],
      contact: "+254 56 30020"
    },
    {
      id: "15915",
      name: "Kakamega County General Hospital",
      level: "Secondary care hospitals",
      kephLevel: 5,
      operationStatus: "Operational",
      county: "Kakamega",
      subCounty: "Lurambi",
      ward: "Shirere",
      constituency: "Lurambi",
      latitude: 0.2828,
      longitude: 34.7519,
      services: ["Outpatient", "Inpatient", "Maternity", "Laboratory", "Pharmacy", "Emergency Care", "Pediatrics", "Orthopedic", "General Surgery"],
      specialties: ["Obstetrics & Gynecology", "Pediatrics", "General Surgery", "Internal Medicine", "Orthopedics"],
      contact: "+254 56 31122"
    },
    {
      id: "21905",
      name: "The Agakhan Medical Centre Kakamega",
      level: "Medical Clinic",
      kephLevel: 2,
      operationStatus: "Operational",
      county: "Kakamega",
      subCounty: "Lurambi",
      ward: "Mahiakalo",
      constituency: "Lurambi",
      latitude: 0.2888,
      longitude: 34.7608,
      services: ["Outpatient", "Laboratory", "Pharmacy", "Consultation"],
      specialties: ["General Medicine", "Pediatrics"],
      contact: "+254 56 30021"
    },
    {
      id: "21020",
      name: "Kakamega County Beyond Zero Mobile Clinic",
      level: "Dispensary",
      kephLevel: 2,
      operationStatus: "Operational",
      county: "Kakamega",
      subCounty: "Lurambi",
      ward: "Shirere",
      constituency: "Lurambi",
      latitude: 0.2832,
      longitude: 34.7522,
      services: ["Mobile Health", "Maternal Health", "Outpatient", "Immunization"],
      specialties: ["Maternal & Child Health"],
      contact: "+254 56 30022"
    },
    {
      id: "KMHFR-10003",
      name: "Masinde Muliro University Clinic (MMUST Clinic)",
      level: "Level 2 (Dispensary)",
      kephLevel: 2,
      operationStatus: "Operational",
      county: "Kakamega",
      subCounty: "Lurambi",
      ward: "Mahiakalo",
      constituency: "Lurambi",
      latitude: 0.2882,
      longitude: 34.7675,
      services: ["Outpatient", "Laboratory", "Pharmacy", "Basic Triage"],
      specialties: ["General Medicine"],
      contact: "+254 702 597360"
    },
    {
      id: "KMHFR-10006",
      name: "Mukumu Mission Hospital",
      level: "Level 4 (Sub-County Referral)",
      kephLevel: 4,
      operationStatus: "Operational",
      county: "Kakamega",
      subCounty: "Shinyalu",
      ward: "Isukha Central",
      constituency: "Shinyalu",
      latitude: 0.2052,
      longitude: 34.7788,
      services: ["Outpatient", "Inpatient", "Maternity", "Laboratory", "Pharmacy", "Emergency Care", "Pediatrics"],
      specialties: ["General Medicine", "Obstetrics & Gynecology"],
      contact: "+254 722 890456"
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
  chwReferrals: [],
  conversations: [],
  messages: []
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
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
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
    const dbTarget = process.env.DATABASE_URL
      ? 'Neon PostgreSQL Cloud DB (neondb)'
      : `'${poolConfig.database}' on ${poolConfig.host}:${poolConfig.port}`;
    console.log(`📡 [Database] PostgreSQL connected successfully to ${dbTarget}`);
    
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schemaSql);
    console.log("⚡ [Database] PostgreSQL database tables verified and loaded.");

    const checkFac = await pool.query('SELECT COUNT(*) FROM facilities');
    if (parseInt(checkFac.rows[0].count) === 0) {
      console.log("🌱 [Database] Mapped zero records. Seeding default KMHFR and Live status records into Postgres...");
      
      for (const f of defaultData.facilities) {
        await pool.query(
          `INSERT INTO facilities (id, name, level, keph_level, county, sub_county, latitude, longitude, services, specialties, contact)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO NOTHING`,
          [f.id, f.name, f.level, f.kephLevel, f.county, f.subCounty, f.latitude, f.longitude, f.services, f.specialties, f.contact]
        );
      }

      for (const [fid, status] of Object.entries(defaultData.liveStatus)) {
        const facExists = await pool.query('SELECT id FROM facilities WHERE id = $1', [fid]);
        if (facExists.rows.length > 0) {
          await pool.query(
            `INSERT INTO facility_live_status (facility_id, queue_count, doctor_available, beds_available, emergency_status, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (facility_id) DO NOTHING`,
            [fid, status.queue_count, status.doctor_available, status.beds_available, status.emergency_status, status.updated_at || new Date()]
          );
        }
      }
      
      console.log("✅ [Database] PostgreSQL tables successfully seeded into Neon DB.");
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
      return readJSON().facilities || [];
    }
  },

  getChus: async () => {
    if (usePostgres) {
      try {
        const res = await pool.query(`SELECT id, code, name, status, county, sub_county as "subCounty", constituency, ward, linked_facility_id as "linkedFacilityId", linked_facility_name as "linkedFacilityName", households_covered as "householdsCovered", chvs_count as "chvsCount", latitude, longitude FROM community_health_units`);
        return res.rows;
      } catch (e) {
        return readJSON().chus || [];
      }
    } else {
      return readJSON().chus || [];
    }
  },

  getChuById: async (id) => {
    const list = await module.exports.getChus();
    return list.find(c => c.id === id || c.code === id) || null;
  },

  upsertChu: async (chu) => {
    const db = readJSON();
    if (!db.chus) db.chus = [];
    const idx = db.chus.findIndex(c => c.id === chu.id || c.code === chu.code);
    if (idx !== -1) {
      db.chus[idx] = { ...db.chus[idx], ...chu };
    } else {
      db.chus.push(chu);
    }
    writeJSON(db);
    return chu;
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
  },

  getConversationByPhoneOrWebId: async (phoneNumber, webUserId) => {
    if (usePostgres) {
      let query = `SELECT id, phone_number as "phoneNumber", web_user_id as "webUserId", channel, created_at as "createdAt" FROM conversations WHERE `;
      const params = [];
      if (phoneNumber && webUserId) {
        query += `phone_number = $1 OR web_user_id = $2`;
        params.push(phoneNumber, webUserId);
      } else if (phoneNumber) {
        query += `phone_number = $1`;
        params.push(phoneNumber);
      } else if (webUserId) {
        query += `web_user_id = $1`;
        params.push(webUserId);
      } else {
        return null;
      }
      const res = await pool.query(query, params);
      return res.rows[0] || null;
    } else {
      const db = readJSON();
      if (!db.conversations) db.conversations = [];
      return db.conversations.find(c => 
        (phoneNumber && c.phoneNumber === phoneNumber) || 
        (webUserId && c.webUserId === webUserId)
      ) || null;
    }
  },

  createConversation: async (conversation) => {
    if (usePostgres) {
      const res = await pool.query(
        `INSERT INTO conversations (id, phone_number, web_user_id, channel, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING id, phone_number as "phoneNumber", web_user_id as "webUserId", channel, created_at as "createdAt"`,
        [conversation.id, conversation.phoneNumber, conversation.webUserId, conversation.channel]
      );
      return res.rows[0];
    } else {
      const db = readJSON();
      if (!db.conversations) db.conversations = [];
      const newConv = {
        id: conversation.id,
        phoneNumber: conversation.phoneNumber,
        webUserId: conversation.webUserId,
        channel: conversation.channel,
        createdAt: new Date().toISOString()
      };
      db.conversations.push(newConv);
      writeJSON(db);
      return newConv;
    }
  },

  getMessagesByConversationId: async (conversationId) => {
    if (usePostgres) {
      const res = await pool.query(
        `SELECT id, conversation_id as "conversationId", sender, message, channel, classification, ai_model as "aiModel", status, timestamp
         FROM messages WHERE conversation_id = $1 ORDER BY timestamp ASC`,
        [conversationId]
      );
      return res.rows;
    } else {
      const db = readJSON();
      if (!db.messages) db.messages = [];
      return db.messages
        .filter(m => m.conversationId === conversationId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }
  },

  createMessage: async (msg) => {
    if (usePostgres) {
      const res = await pool.query(
        `INSERT INTO messages (id, conversation_id, sender, message, channel, classification, ai_model, status, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING id, conversation_id as "conversationId", sender, message, channel, classification, ai_model as "aiModel", status, timestamp`,
        [msg.id, msg.conversationId, msg.sender, msg.message, msg.channel, msg.classification, msg.aiModel, msg.status || 'sent']
      );
      return res.rows[0];
    } else {
      const db = readJSON();
      if (!db.messages) db.messages = [];
      const newMsg = {
        id: msg.id,
        conversationId: msg.conversationId,
        sender: msg.sender,
        message: msg.message,
        channel: msg.channel,
        classification: msg.classification,
        aiModel: msg.aiModel,
        status: msg.status || 'sent',
        timestamp: new Date().toISOString()
      };
      db.messages.push(newMsg);
      writeJSON(db);
      return newMsg;
    }
  },

  getMessagesByCategory: async (category) => {
    if (usePostgres) {
      const res = await pool.query(
        `SELECT id, conversation_id as "conversationId", sender, message, channel, classification, ai_model as "aiModel", status, timestamp
         FROM messages WHERE classification->>'category' = $1 ORDER BY timestamp DESC`,
        [category]
      );
      return res.rows;
    } else {
      const db = readJSON();
      if (!db.messages) db.messages = [];
      return db.messages
        .filter(m => m.classification?.category === category)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
  },

  upsertFacility: async (fac) => {
    if (usePostgres) {
      await pool.query(
        `INSERT INTO facilities (id, name, level, keph_level, county, sub_county, latitude, longitude, services, specialties, contact)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           level = EXCLUDED.level,
           keph_level = EXCLUDED.keph_level,
           county = EXCLUDED.county,
           sub_county = EXCLUDED.sub_county,
           latitude = EXCLUDED.latitude,
           longitude = EXCLUDED.longitude,
           services = EXCLUDED.services,
           specialties = EXCLUDED.specialties,
           contact = EXCLUDED.contact`,
        [
          fac.id, 
          fac.name, 
          fac.level || 'Health Center', 
          fac.kephLevel || 3, 
          fac.county || 'Kakamega', 
          fac.subCounty || 'Kakamega Central', 
          fac.latitude ? parseFloat(fac.latitude) : 0.0, 
          fac.longitude ? parseFloat(fac.longitude) : 0.0, 
          fac.services || [], 
          fac.specialties || [], 
          fac.contact || ''
        ]
      );
    } else {
      const db = readJSON();
      if (!db.facilities) db.facilities = [];
      const idx = db.facilities.findIndex(f => f.id === fac.id);
      
      const mapped = {
        id: fac.id,
        name: fac.name,
        level: fac.level || 'Health Center',
        kephLevel: fac.kephLevel || 3,
        county: fac.county || 'Kakamega',
        subCounty: fac.subCounty || 'Kakamega Central',
        latitude: fac.latitude ? parseFloat(fac.latitude) : 0.0,
        longitude: fac.longitude ? parseFloat(fac.longitude) : 0.0,
        services: fac.services || [],
        specialties: fac.specialties || [],
        contact: fac.contact || ''
      };

      if (idx !== -1) {
        db.facilities[idx] = mapped;
      } else {
        db.facilities.push(mapped);
      }
      writeJSON(db);
    }
  }
};
