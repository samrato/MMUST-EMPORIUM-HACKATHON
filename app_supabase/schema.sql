CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Clinics (Kisumu real data)
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lat FLOAT,
  lng FLOAT,
  area TEXT,
  services TEXT[],
  wait_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- PATIENT MEMORY (Conversation history)
CREATE TABLE IF NOT EXISTS user_sessions (
  phone TEXT PRIMARY KEY,
  language TEXT DEFAULT 'eng' CHECK (language IN ('eng', 'kis', 'luo')),
  preferred_area TEXT,
  last_interaction TIMESTAMP DEFAULT NOW(),
  total_interactions INTEGER DEFAULT 0,
  session_history JSONB[] DEFAULT '{}'
);

-- Live Queue
CREATE TABLE IF NOT EXISTS user_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT REFERENCES user_sessions(phone),
  symptoms TEXT,
  urgency TEXT CHECK (urgency IN ('RED', 'YELLOW', 'GREEN')),
  clinic_id UUID REFERENCES clinics(id),
  queue_position INTEGER,
  estimated_wait INTEGER,
  queued_at TIMESTAMP DEFAULT NOW()
);

-- Sample Clinics INSERT
INSERT INTO clinics (name, lat, lng, area, services)
VALUES
  ('Jaramogi Oginga Odinga Hospital', -0.090, 34.758, 'Kisumu', ARRAY['emergency', 'pediatrics']),
  ('Kisumu County Referral Hospital', -0.085, 34.760, 'Kisumu', ARRAY['maternity', 'general'])
ON CONFLICT DO NOTHING;
