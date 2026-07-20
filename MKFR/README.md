# 🚀 AFYAROOT — Real-Time Healthcare Navigation System & KMHFR Integration

**AFYAROOT** is a high-performance healthcare navigation, AI clinical triage, and hospital routing backend system integrated directly with the official **Kenya Master Health Facility Registry (KMHFR)** portal (`https://kmhfr.health.go.ke` / `https://api.kmhfr.health.go.ke`).

---

## 🌟 Key Capabilities & System Features

1. **Official KMHFR Live REST API Integration**:
   - Queries `https://api.kmhfr.health.go.ke` live for health facility capabilities, services, specialties, and Community Health Units (CHULs).
   - Features a resilience failover cache to local PostgreSQL / file database (`db.json`) ensuring **100% offline support** in low-connectivity rural health centers.

2. **Automatic Zero-Search GPS Location Resolution**:
   - Accepts GPS coordinates (`lat`, `lng`) from frontend/mobile clients without requiring user search text.
   - Automatically auto-detects the user's current **Ward**, **Sub-County / Constituency**, and **County**, returning nearby health facilities and CHUs **sorted by distance (closest first)**.

3. **Dynamic Community Health Unit (CHU / CHUL) Analytics**:
   - Provides live, non-hardcoded CHU functionality statistics (**Total CHUs**, **Fully Functional**, **Semi Functional**, **Non Functional**, **Functional Rate %**) at national, county, constituency, ward, or user GPS level.

4. **Multi-Metric Smart Hospital Routing Algorithm**:
   - Reroutes patients to the optimal health facility based on a 4-factor scoring algorithm:
     - **Symptom & Capability Match** (40%)
     - **GIS Proximity & Distance** (30%)
     - **Real-Time Outpatient Queue Length** (20%)
     - **KEPH Hospital Level** (10%)

5. **Clinical AI Triage Doctor Brain**:
   - Sorts symptoms into risk categories (Low, Moderate, Urgent, Critical Emergency) and maps required clinical services.

6. **Real-Time Hospital Capacity & Workload Layer (`live_status`)**:
   - Tracks live outpatient queue lengths, active doctors on shift, free inpatient beds, emergency unit status, and data freshness trust ratings.

---

## 📡 API Endpoints Specification

### A. Health Facilities & Registry API

| Method | Endpoint | Description | Query / Path Parameters |
|---|---|---|---|
| `GET` | `/api/facilities` | Search facilities live or auto-detect by GPS | `lat`, `lng`, `radius`, `search`/`q`, `county`, `subCounty`, `ward`, `minKephLevel`, `service` |
| `GET` | `/api/facilities/nearby` | Facilities sorted by GIS distance | `lat` *(required)*, `lng` *(required)*, `radius` |
| `GET` | `/api/facilities/:id` | Facility details + Live workload status | `:id` (Facility Code/ID, e.g. `15915`) |
| `GET` | `/api/facilities/metadata` | Catalogues of KEPH levels, services, specialties | None |
| `POST` | `/api/facilities/sync` | Sync database cache with official KMHFR API | OAuth token |

### B. Community Health Units (CHUs / CHULs) API

| Method | Endpoint | Description | Query Parameters |
|---|---|---|---|
| `GET` | `/api/facilities/chu` | Search CHUs live or auto-detect by GPS | `lat`, `lng`, `search`/`q`, `county`, `constituency`, `ward`, `status` |
| `GET` | `/api/facilities/chu/stats` | Dynamic CHU functionality statistics | `lat`, `lng`, `county`, `constituency`, `ward` |

### C. Clinical Triage, Hospital Routing & Booking API

| Method | Endpoint | Description | Query / Body Parameters |
|---|---|---|---|
| `POST` | `/api/triage` | AI Clinical Triage symptom assessment | `{ "symptoms": "severe headache and fever", "county": "Kakamega" }` |
| `POST` | `/api/conversations` | Conversational multi-turn AI doctor triage | `{ "phoneNumber": "+254700000000", "message": "Hi" }` |
| `GET` | `/api/route` | Smart hospital routing score calculator | `symptom`, `lat`, `lng`, `maxDistance` |
| `POST` | `/api/bookings` | Book appointment with SMS/WhatsApp confirmation | `{ "facilityId": "15915", "patientName": "John Doe", "date": "2026-07-25" }` |
| `GET` | `/api/live-status` | Get live workload status for hospitals | `facilityId` |
| `POST` | `/api/live-status` | Update hospital capacity feed (queues, beds, docs)| `{ "facilityId": "15915", "queue_count": 12, "beds_available": 5 }` |
| `GET` | `/api/intelligence` | Regional demand & triage intelligence logs | `county` |

---

## 💻 Frontend Integration Quickstart

### 1. Auto-GPS Location Fetching (HTML5 / React)
```javascript
// Automatically load local facilities & CHU stats using GPS coordinates
navigator.geolocation.getCurrentPosition(async (position) => {
  const { latitude, longitude } = position.coords;

  // 1. Load facilities sorted by distance
  const facRes = await fetch(`http://localhost:5000/api/facilities?lat=${latitude}&lng=${longitude}`);
  const { data: facilities } = await facRes.json();

  // 2. Load local CHU functionality statistics
  const statsRes = await fetch(`http://localhost:5000/api/facilities/chu/stats?lat=${latitude}&lng=${longitude}`);
  const stats = await statsRes.json();

  console.log("Auto-Detected Location:", stats.auto_detected_from_gps);
  console.log("Local Facilities (Closest First):", facilities);
  console.log("CHU Functional Stats:", stats.community_health_units);
});
```

---

## 🛠️ Installation & Running

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Server**:
   ```bash
   npm start
   # or
   node server.js
   ```
   *The server runs at `http://localhost:5000` with CORS enabled.*

3. **Test API via cURL**:
   ```bash
   # Search Kakamega facilities
   curl "http://localhost:5000/api/facilities?county=Kakamega"

   # CHU stats for GPS coordinates (lat=0.2828, lng=34.7519)
   curl "http://localhost:5000/api/facilities/chu/stats?lat=0.2828&lng=34.7519"

   # Access System Documentation
   curl "http://localhost:5000/docs"
   ```

---

## 📄 Documentation

- Full API & Payload Specification: [KMHFR_INTEGRATION_DOCS.md](file:///home/activator/Projects/MMUST-EMPORIUM-HACKATHON/MKFR/KMHFR_INTEGRATION_DOCS.md)
- Admin Hospital Portal: `http://localhost:5000/admin.html`
