-- AFYAROOT Database Schema (PostgreSQL)

-- 1. KMHFR Data Layer (Static Foundation)
CREATE TABLE IF NOT EXISTS facilities (
    id VARCHAR(50) PRIMARY KEY, -- KMHFR Code (e.g. KMHFR-10001)
    name VARCHAR(255) NOT NULL,
    level VARCHAR(100) NOT NULL,
    keph_level INT NOT NULL DEFAULT 2,
    county VARCHAR(100) NOT NULL,
    sub_county VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    services TEXT[] NOT NULL, -- Array of supported services
    specialties TEXT[] NOT NULL, -- Array of clinical specialties
    contact VARCHAR(50)
);

-- 2. Live Hospital Status Layer (Capacity Feeds)
CREATE TABLE IF NOT EXISTS facility_live_status (
    facility_id VARCHAR(50) PRIMARY KEY REFERENCES facilities(id) ON DELETE CASCADE,
    queue_count INT NOT NULL DEFAULT 0,
    doctor_available INT NOT NULL DEFAULT 0,
    beds_available INT NOT NULL DEFAULT 0,
    emergency_status VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (emergency_status IN ('normal', 'busy', 'critical')),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Care Delivery Layer (Booking System)
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(50) PRIMARY KEY, -- e.g. BK-123456
    facility_id VARCHAR(50) NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    patient_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    service_needed VARCHAR(255) NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'checked-in', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Conversational Doctor-Triage Sessions
CREATE TABLE IF NOT EXISTS triage_sessions (
    id VARCHAR(50) PRIMARY KEY, -- e.g. TS-123456
    county VARCHAR(100) NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    initial_symptoms TEXT NOT NULL,
    questions TEXT[] NOT NULL, -- List of diagnostic questions to ask
    answers TEXT[] NOT NULL, -- Mapped answers collected from patient
    current_index INT NOT NULL DEFAULT 0, -- Current question index
    finalized BOOLEAN NOT NULL DEFAULT FALSE,
    risk VARCHAR(20),
    urgency VARCHAR(20),
    required_services TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Population & Demand Intelligence Triage Logs
CREATE TABLE IF NOT EXISTS triage_logs (
    id SERIAL PRIMARY KEY,
    symptom TEXT NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    risk VARCHAR(20) NOT NULL,
    county VARCHAR(100) NOT NULL,
    is_emergency BOOLEAN NOT NULL DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Community Health Worker Mode (Referrals)
CREATE TABLE IF NOT EXISTS chw_referrals (
    id VARCHAR(50) PRIMARY KEY,
    chw_id VARCHAR(50) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    household_id VARCHAR(50) NOT NULL DEFAULT 'HH-GENERIC',
    symptoms TEXT NOT NULL,
    triage_risk VARCHAR(20) NOT NULL,
    referred_facility_id VARCHAR(50) NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for high-frequency queries
CREATE INDEX IF NOT EXISTS idx_facilities_county ON facilities(county);
CREATE INDEX IF NOT EXISTS idx_facilities_coords ON facilities(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_live_status_updated ON facility_live_status(updated_at);
CREATE INDEX IF NOT EXISTS idx_triage_logs_county ON triage_logs(county);
CREATE INDEX IF NOT EXISTS idx_triage_logs_timestamp ON triage_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_triage_sessions_finalized ON triage_sessions(finalized);
