# AFYAROOT Health Assist

AFYAROOT Health Assist is a Vite + React application designed to provide AI-guided rural health support. It functions as a Progressive Web App (PWA), enabling offline access and an installable experience. The application aims to assist users with symptom checks, emergency help, facility location, booking appointments, and basic analytics.

## Features

*   **Home Dashboard:** Central entry point for the application.
*   **Symptom Checker:** Uses a deterministic dataset-driven decision engine for symptom matching, urgency scoring, routing, and step-by-step guidance.
*   **Emergency Response Panel:** Provides tools and information for emergency situations, including voice + text turn-by-turn guidance to the nearest facility.
*   **Chat AI Assistant:** An interactive chat interface for health queries and guidance.
*   **Facility Discovery:** Helps locate nearby health facilities.
*   **Analytics/Admin Monitoring:** Provides insights, anonymous user tracking, emergency alert review queue, and AI-guided location/direction follow-up support for admin teams.
*   **Booking:** Functionality to book appointments or services.
*   **Settings:** User preferences and application configuration.

## Technology Stack

*   **Frontend Framework:** React (Vite for fast development and build)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS, PostCSS (`next-themes` for theming)
*   **UI Components:** `shadcn/ui` (built on Radix UI)
*   **Routing:** `react-router-dom`
*   **Data Fetching/State Management:** `@tanstack/react-query`
*   **Forms:** `react-hook-form` with `zod` for validation
*   **PWA:** `vite-plugin-pwa` for offline capabilities and app manifest
*   **Testing:** `vitest` with `@testing-library/react`

## Deterministic Decision Engine

The healthcare engine is **structured-data based**, deterministic, and multilingual (English/Kiswahili).

Core implementation:
* `src/services/healthDecisionEngine.ts`
  * symptom-to-dataset matching (exact/close)
  * urgency classification (`low`, `medium`, `high`, `emergency`)
  * nearest-facility routing by urgency and distance
  * safe no-match fallback guidance when symptoms do not map to dataset entries
  * patient-safe guidance generation (max 5 steps)
  * voice transcription structuring helper
  * deterministic simulation case generator
* `src/services/geminiService.ts`
  * now wraps deterministic engine flows for symptom/chat decisions
  * uses Directions API service for voice route text instead of model-generated routing
* Decision outputs are persisted both:
  * **locally** (`afyaroot-decision-cases` in localStorage)
  * **cloud log** (`ai_interactions` with `message_type: decision_engine`)

## Run locally

```bash
npm install
npm run dev
```

## Environment variables

Create `afyaroot-health-assist/.env.local` and set:

```bash
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
# Optional shared admin code for /admin/login.
VITE_ADMIN_ACCESS_CODE=your_private_admin_code
# Optional facility-specific codes (overrides defaults/shared code per facility).
# Format: facility-id:code,facility-id:code
VITE_ADMIN_FACILITY_PINS=kapsabet:1234,nandi-hills:5678
```

Default facility codes when `VITE_ADMIN_FACILITY_PINS` is not set:

- `kapsabet=1111`
- `nandi-hills=2222`
- `chepterit=3333`
- `kabiyet=4444`
- `mosoriot=5555`

## Admin side routes

The app now uses a dedicated admin side:

- `/admin/login` - facility admin login
- `/admin/dashboard` - overview and emergency queue
- `/admin/analytics` - monitoring and trends
- `/admin/bookings` - appointment operations
- `/admin/settings` - facility configuration

## Verify

```bash
npm run build
npm test
```

## Supabase integration notes

The app uses Supabase for booking storage and optional AI text-processing logs.

1. Required table for booking:

```sql
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id text not null,
  full_name text not null,
  phone text not null,
  age int not null,
  gender text,
  location text,
  symptoms text,
  medical_history text,
  emergency_contact text,
  appointment_date date not null,
  appointment_time time not null,
  urgency text not null default 'normal',
  facility_name text,
  facility_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_appointments_patient_id on appointments(patient_id);
create index if not exists idx_appointments_date_time on appointments(appointment_date, appointment_time);
```

2. Optional table for AI interaction logs (high-volume text processing):

```sql
create table if not exists ai_interactions (
  id uuid primary key default gen_random_uuid(),
  patient_id text,
  message_type text not null,
  language text not null,
  input_text text not null,
  response_text text not null,
  duration_ms int not null,
  input_chars int not null,
  response_chars int not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_interactions_patient_id on ai_interactions(patient_id);
create index if not exists idx_ai_interactions_created_at on ai_interactions(created_at desc);
```

3. Frontend request logging:

```bash
# Logging is ON by default.
# Set this only if you want to disable frontend request logging:
VITE_ENABLE_AI_LOGGING=false
```

4. `ai_interactions.message_type` now includes AI + system events (for admin tracking), including:
   - `chat`
   - `symptom_analysis`
   - `navigation`
   - `emergency_alert`
   - `facility_lookup`
   - `booking_request`
   - `appointment_lookup`
   - `decision_engine`
