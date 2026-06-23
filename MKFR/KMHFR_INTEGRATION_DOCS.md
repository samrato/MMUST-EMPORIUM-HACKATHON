# KMHFR API Integration Documentation (Truth Source Layer)

This document outlines the official endpoints consumed from the **Kenya Master Health Facility Registry (KMHFR)** portal (http://kmhfr.health.go.ke/) to establish our static foundation. These endpoints allow the system to map all registered hospitals, dispensaries, health centers, and specialties in Kenya.

---

## 1. Authentication

KMHFR API uses OAuth2 standard token-based authentication.

### **Endpoint: POST `/api/o/token/`**
- **Purpose**: Retrieve an access token.
- **Headers**:
  - `Content-Type: application/x-www-form-urlencoded`
- **Request Body**:
  ```json
  {
    "grant_type": "password",
    "username": "your_client_username",
    "password": "your_client_password",
    "client_id": "your_oauth_client_id",
    "client_secret": "your_oauth_client_secret"
  }
  ```
- **Response**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "expires_in": 86400,
    "token_type": "Bearer",
    "scope": "read write"
  }
  ```

---

## 2. Facility Registry & Metadata Endpoints

To populate the **KMHFR Data Layer (Static Foundation)**, the AFYAROOT backend requires endpoints to fetch facility records, coordinates, levels, and services.

### **Endpoint 1: Fetch Facilities List (Filtered)**
* **HTTP Method**: `GET`
* **URL**: `/api/facilities/facilities/`
* **Query Parameters**:
  - `county`: Filter by county code/name (e.g., `Kakamega`, `Nairobi`)
  - `keph_level`: Filter by KEPH classification levels (e.g., `2`, `4`, `5`, `6`)
  - `active`: `true` (Only return operational facilities)
  - `page_size`: Pagination limit (default `100`)
* **Headers**:
  - `Authorization: Bearer <access_token>`
* **Response Payload (Standard Schema)**:
  ```json
  {
    "count": 14250,
    "next": "http://api.kmhfr.health.go.ke/api/facilities/facilities/?page=2",
    "previous": null,
    "results": [
      {
        "id": "7662c930-b3a6-4a9c-a110-388a1e27a9e6",
        "code": 10002,
        "name": "Kakamega County General Referral Hospital",
        "facility_type_name": "County Referral Hospital",
        "keph_level": "Level 5",
        "keph_level_value": 5,
        "county_name": "Kakamega",
        "sub_county_name": "Lurambi",
        "constituency_name": "Lurambi",
        "ward_name": "Sheywe",
        "lat": 0.2828,
        "long": 34.7519,
        "is_open": true
      }
    ]
  }
  ```

---

### **Endpoint 2: Fetch Detailed Facility Info (GIS, Services & Contacts)**
This endpoint fetches precise GIS points, contact channels, and operational capabilities.
* **HTTP Method**: `GET`
* **URL**: `/api/facilities/facilities/{facility_id}/`
* **Headers**:
  - `Authorization: Bearer <access_token>`
* **Response Payload**:
  ```json
  {
    "id": "7662c930-b3a6-4a9c-a110-388a1e27a9e6",
    "code": 10002,
    "name": "Kakamega County General Referral Hospital",
    "keph_level": "Level 5",
    "coordinates": {
      "type": "Point",
      "coordinates": [34.7519, 0.2828] // [longitude, latitude]
    },
    "contacts": [
      { "contact_type_name": "LANDLINE", "contact": "+254 56 31122" },
      { "contact_type_name": "EMAIL", "contact": "info@kakamegareferral.go.ke" }
    ],
    "services": [
      { "service_name": "Outpatient Services", "category": "General Outpatient" },
      { "service_name": "Emergency Care", "category": "Emergency Services" },
      { "service_name": "Maternity Services", "category": "Reproductive Health" },
      { "service_name": "Basic Laboratory Services", "category": "Diagnostics" }
    ]
  }
  ```

---

### **Endpoint 3: Retrieve Services Catalogue**
Returns the master index of all services that facilities can offer in Kenya.
* **HTTP Method**: `GET`
* **URL**: `/api/facilities/services/`
* **Headers**:
  - `Authorization: Bearer <access_token>`
* **Response Payload**:
  ```json
  {
    "results": [
      { "id": "1", "name": "Outpatient" },
      { "id": "2", "name": "Emergency Care" },
      { "id": "3", "name": "Maternity" },
      { "id": "4", "name": "Laboratory" }
    ]
  }
  ```

---

### **Endpoint 4: Retrieve Specialties Catalogue**
Returns the clinical specialties (e.g. Oncology, Cardiology) to map complex triages.
* **HTTP Method**: `GET`
* **URL**: `/api/facilities/specialities/`
* **Response Payload**:
  ```json
  {
    "results": [
      { "id": "10", "name": "Cardiology" },
      { "id": "11", "name": "Oncology" },
      { "id": "12", "name": "General Surgery" }
    ]
  }
  ```

---

## 3. Data Integration Strategy in AFYAROOT

Since KMHFR is a static dictionary that rarely changes, the AFYAROOT backend implements a caching layer. 
1. **Initial Seed Sync**: During deployment, the system calls `/api/facilities/facilities/` and caches operational details into our database.
2. **Weekly Sync Cron**: A background task updates coordinate changes and new facilities.
3. **Local Failover**: In the event of KMHFR downtime, the system fails over to the local database cache to prevent disruption of triage and routing.
