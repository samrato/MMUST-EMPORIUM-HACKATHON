# AFYAROOT - KMHFR API & Facilities Integration Documentation

This document serves as the complete technical specification for the **AFYAROOT Backend Healthcare Navigation System**, describing integration with the **Kenya Master Health Facility Registry (KMHFR)** portal (`https://kmhfr.health.go.ke` / `https://api.kmhfr.health.go.ke`).

---

## 1. System Architecture Overview

The system operates a **Dual-Layer Architecture**:
1. **Live Remote Layer**: Direct live search against official KMHFR API endpoints (`/api/facilities/facilities/` and `/api/chul/units/`).
2. **Local Synced Cache & Offline Failover**: SQLite / PostgreSQL / file-persisted dataset that ensures 0ms latency for triage, routing, and offline CHW (Community Health Worker) sync.

```
+-------------------------------------------------------------------------+
|                              CLIENT / APP                               |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                         AFYAROOT REST API SERVER                        |
|                               (server.js)                               |
+-------------------------------------------------------------------------+
       |                                                    |
       v                                                    v
+------------------------------------+    +-------------------------------+
|  LIVE KMHFR API DIRECT SEARCH      |    | LOCAL DATABASE CACHE LAYER    |
| (api.kmhfr.health.go.ke)           |    | (PostgreSQL / db.json)        |
+------------------------------------+    +-------------------------------+
```

---

## 2. API Endpoints Reference

### A. Health Facilities Search & Registry

#### `GET /api/facilities`
Retrieves facilities filtered by keyword search, location administrative boundaries, KEPH levels, or services.

* **Query Parameters**:
  * `search` or `q` *(string, optional)*: Keyword to match facility name, code (e.g. `30386`, `15915`), level, county, sub-county, ward, or status.
  * `county` *(string, optional)*: Filter by County name (e.g. `Kakamega`, `Nairobi`).
  * `subCounty` or `constituency` *(string, optional)*: Filter by Sub-County / Constituency (e.g. `Lurambi`, `Malava`).
  * `ward` *(string, optional)*: Filter by Ward (e.g. `Shirere`, `East Kabras`, `Sheywe`, `Mahiakalo`).
  * `minKephLevel` *(number, optional)*: Minimum KEPH level (e.g., `2` for Dispensary, `4` for Level 4 Hospital, `5` for Level 5 Referral).
  * `service` *(string, optional)*: Service capability filter (e.g., `Emergency Care`, `Maternity`, `Orthopedics`).

* **Example Request**:
  ```http
  GET /api/facilities?search=kakamega
  ```

* **Example Response**:
  ```json
  {
    "success": true,
    "count": 25,
    "data": [
      {
        "id": "30386",
        "name": "Kakamega Orthopaedic Hospital",
        "level": "Primary care hospitals",
        "kephLevel": 4,
        "operationStatus": "Operational",
        "county": "Kakamega",
        "subCounty": "Malava",
        "ward": "East Kabras",
        "constituency": "Malava",
        "latitude": 0.4485,
        "longitude": 34.855,
        "services": ["Outpatient", "Inpatient", "Orthopedic Surgery", "Emergency Care"],
        "specialties": ["Orthopedics", "General Surgery"],
        "contact": "+254 56 30001"
      },
      {
        "id": "15915",
        "name": "Kakamega County General Hospital",
        "level": "Secondary care hospitals",
        "kephLevel": 5,
        "operationStatus": "Operational",
        "county": "Kakamega",
        "subCounty": "Lurambi",
        "ward": "Shirere",
        "constituency": "Lurambi",
        "latitude": 0.2828,
        "longitude": 34.7519,
        "services": ["Outpatient", "Inpatient", "Maternity", "Laboratory", "Pharmacy", "Emergency Care"],
        "specialties": ["Obstetrics & Gynecology", "Pediatrics", "General Surgery"],
        "contact": "+254 56 31122"
      }
    ]
  }
  ```

---

#### `GET /api/facilities/nearby`
Retrieves facilities sorted by GIS proximity (Haversine distance algorithm) from user coordinates.

* **Query Parameters**:
  * `lat` *(number, required)*: User latitude (e.g. `0.2828`).
  * `lng` *(number, required)*: User longitude (e.g. `34.7519`).
  * `radius` *(number, optional)*: Search radius in km (default `20`).

* **Example Request**:
  ```http
  GET /api/facilities/nearby?lat=0.2828&lng=34.7519&radius=10
  ```

---

#### `GET /api/facilities/:id`
Retrieves detailed static facility record combined with the **Live Workload Status Layer** (queue counts, doctor availability, bed capacity, trust freshness rating).

* **Example Request**:
  ```http
  GET /api/facilities/15915
  ```

---

### B. Community Health Units (CHUs / CHULs)

#### `GET /api/facilities/chu`
Retrieves Community Health Units filtered by keyword search, location (county, constituency, ward), or functionality status.

* **Query Parameters**:
  * `search` or `q` *(string, optional)*: Keyword to search CHU name, code (e.g., `11678-01`), linked facility, or location.
  * `county` *(string, optional)*: Filter by County name (e.g. `Kakamega`).
  * `constituency` or `subCounty` *(string, optional)*: Filter by Constituency / Sub-County (e.g. `Lurambi`).
  * `ward` *(string, optional)*: Filter by Ward (e.g. `Shirere`).
  * `status` *(string, optional)*: `Fully-Functional`, `Semi-Functional`, or `Non-Functional`.

* **Example Request**:
  ```http
  GET /api/facilities/chu?ward=Shirere
  ```

* **Example Response**:
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "id": "CHU-3001",
        "code": "11678-01",
        "name": "Shirere Community Health Unit",
        "status": "Fully-Functional",
        "county": "Kakamega",
        "subCounty": "Lurambi",
        "constituency": "Lurambi",
        "ward": "Shirere",
        "linkedFacilityId": "15915",
        "linkedFacilityName": "Kakamega County General Hospital",
        "householdsCovered": 1250,
        "chvsCount": 10,
        "latitude": 0.2828,
        "longitude": 34.7519
      }
    ]
  }
  ```

---

#### `GET /api/facilities/chu/stats`
Computes **live, non-hardcoded functionality statistics** for Community Health Units at national, county, constituency, or ward level.

* **Query Parameters**:
  * `county` *(string, optional)*
  * `constituency` or `subCounty` *(string, optional)*
  * `ward` *(string, optional)*

* **Example Request (National Level)**:
  ```http
  GET /api/facilities/chu/stats
  ```
* **Response**:
  ```json
  {
    "success": true,
    "location_filter": {
      "county": "All Counties (National)",
      "constituency": "All Constituencies",
      "ward": "All Wards"
    },
    "community_health_units": {
      "total_chus": 11678,
      "fully_functional": 8975,
      "semi_functional": 1930,
      "non_functional": 240,
      "functional_rate": "76.9%"
    }
  }
  ```

* **Example Request (County Level Filter)**:
  ```http
  GET /api/facilities/chu/stats?county=Kakamega
  ```
* **Response**:
  ```json
  {
    "success": true,
    "location_filter": {
      "county": "Kakamega",
      "constituency": "All Constituencies",
      "ward": "All Wards"
    },
    "community_health_units": {
      "total_chus": 6,
      "fully_functional": 4,
      "semi_functional": 1,
      "non_functional": 1,
      "functional_rate": "66.7%"
    }
  }
  ```

---

### D. Automatic Zero-Search GPS Location Resolution

When user GPS coordinates (`lat`, `lng`) are passed to `/api/facilities`, `/api/facilities/chu`, or `/api/facilities/chu/stats`:
1. The user **does not need to type any search query** or select location names.
2. The system automatically resolves the user's exact current **Ward**, **Sub-County / Constituency**, and **County**.
3. All local health facilities & CHUs in the user's vicinity are **automatically returned and sorted by proximity (closest first with `distance_km`)**.
4. Local CHU functionality statistics are automatically computed for the user's detected location.

* **Example Request (Passing Only GPS Coordinates)**:
  ```http
  GET /api/facilities/chu/stats?lat=0.2828&lng=34.7519
  ```
* **Auto-Detected Response**:
  ```json
  {
    "success": true,
    "auto_detected_from_gps": {
      "lat": 0.2828,
      "lng": 34.7519,
      "detected_ward": "Shirere",
      "detected_sub_county": "Lurambi",
      "detected_county": "Kakamega"
    },
    "location_filter": {
      "county": "Kakamega",
      "constituency": "Lurambi",
      "ward": "Shirere"
    },
    "community_health_units": {
      "total_chus": 1,
      "fully_functional": 1,
      "semi_functional": 0,
      "non_functional": 0,
      "functional_rate": "100.0%"
    },
    "units": [
      {
        "id": "CHU-3001",
        "code": "11678-01",
        "name": "Shirere Community Health Unit",
        "status": "Fully-Functional",
        "county": "Kakamega",
        "subCounty": "Lurambi",
        "ward": "Shirere",
        "distance_km": 0
      }
    ]
  }
  ```

---

### E. Live Registry Sync & Metadata

#### `POST /api/facilities/sync`
Synchronizes local database cache with official live KMHFR OAuth API (`https://api.kmhfr.health.go.ke`).

#### `GET /api/facilities/metadata`
Returns index catalogues of KEPH levels, services, and specialties.

---

## 3. Remote KMHFR Official API Integration

AFYAROOT directly queries official KMHFR OAuth REST endpoints when credentials are set in environment variables:

| Remote Endpoint | Purpose |
|---|---|
| `POST https://api.kmhfr.health.go.ke/o/token/` | Retrieves Bearer OAuth2 Access Token |
| `GET https://api.kmhfr.health.go.ke/api/facilities/facilities/` | Query active facilities by search/county/keph_level |
| `GET https://api.kmhfr.health.go.ke/api/chul/units/` | Query Community Health Units live |
| `GET https://api.kmhfr.health.go.ke/api/facilities/services/` | Master healthcare services index |

---

## 5. Frontend Integration Guide (JavaScript & React Examples)

### A. Zero-Search Auto-Location Hook (HTML / Vanilla JS / React)
Automatically gets user GPS coordinates and fetches nearby facilities & CHUs without requiring any manual search input:

```javascript
// Get user's current GPS position and load local facilities & health stats
function loadLocalHealthData() {
  if (!navigator.geolocation) {
    console.warn("Geolocation not supported by browser");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude, longitude } = position.coords;

    // 1. Fetch nearby facilities sorted by proximity (closest first)
    const facRes = await fetch(`http://localhost:5000/api/facilities?lat=${latitude}&lng=${longitude}`);
    const facData = await facRes.json();
    console.log("Closest Facilities:", facData.data);

    // 2. Fetch CHU functionality stats for detected GPS location
    const statsRes = await fetch(`http://localhost:5000/api/facilities/chu/stats?lat=${latitude}&lng=${longitude}`);
    const statsData = await statsRes.json();
    console.log("Detected Location:", statsData.auto_detected_from_gps);
    console.log("Local CHU Stats:", statsData.community_health_units);
  }, (err) => {
    console.error("GPS location permission denied:", err);
  });
}
```

### B. Search Input Bar Integration
```javascript
// Connect a UI search bar to query KMHFR registry
async function handleFacilitySearch(keyword) {
  const res = await fetch(`http://localhost:5000/api/facilities?search=${encodeURIComponent(keyword)}`);
  const result = await res.json();
  return result.data; // Array of matching health facilities
}
```

### C. County & Ward Dropdown Filter Integration
```javascript
// Load CHU functionality dashboard for selected county or ward
async function loadCountyDashboard(countyName, wardName = '') {
  let url = `http://localhost:5000/api/facilities/chu/stats?county=${encodeURIComponent(countyName)}`;
  if (wardName) url += `&ward=${encodeURIComponent(wardName)}`;

  const res = await fetch(url);
  const data = await res.json();
  return data.community_health_units;
  /* Returns:
     {
       total_chus: 6,
       fully_functional: 4,
       semi_functional: 1,
       non_functional: 1,
       functional_rate: "66.7%"
     }
  */
}
```

### D. React Custom Hook Example
```jsx
import { useState, useEffect } from 'react';

export function useLocalHealthRegistry() {
  const [facilities, setFacilities] = useState([]);
  const [chuStats, setChuStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      
      const [facRes, statsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/facilities?lat=${latitude}&lng=${longitude}`),
        fetch(`http://localhost:5000/api/facilities/chu/stats?lat=${latitude}&lng=${longitude}`)
      ]);

      const facData = await facRes.json();
      const statsData = await statsRes.json();

      setFacilities(facData.data || []);
      setChuStats(statsData);
      setLoading(false);
    });
  }, []);

  return { facilities, chuStats, loading };
}
```

