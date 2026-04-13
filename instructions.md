You are building **RuralHealthGuide** - AI agentic brain for rural Kenyan healthcare. Use **uv**, **Gemini 2.5 Pro**, **Supabase** (MEMORY persistence), **FastAPI**.

## 🏗️ COMPLETE PROJECT (Gemini 2.5)
rural-health-guide/
├── pyproject.toml
├── uv.lock
├── README.md
├── .env.example
├── main.py # FastAPI + full workflow
├── agents/
│ ├── _init_.py
│ ├── voice_agent.py # Gemini 2.5 multimodal
│ ├── triage_agent.py # RED/YELLOW/GREEN
│ ├── queue_agent.py
│ └── memory_agent.py # Supabase memory
├── tools/
│ └── _init_.py
│ └── supabase_tools.py
├── supabase/
│ ├── _init_.py
│ ├── schema.sql
│ └── client.py
└── tests/
└── test_patient.py



text

## 🔧 pyproject.toml (Gemini 2.5)
[project]
name = "rural-health-guide"
version = "1.0.0"
dependencies = [
"fastapi==0.104.1",
"google-generativeai==0.8.3", # Gemini 2.5 support
"langchain-google-genai==2.0.0",
"langchain-core==0.3.0",
"supabase==2.4.0",
"uvicorn[standard]==0.30.0",
"python-multipart==0.0.9",
"python-dotenv==1.0.0",
"pydantic==2.9.0",
"pydantic-settings==2.5.0"
]






## 🗄️ SUPABASE SCHEMA (With MEMORY)
```sql
-- Clinics (Kisumu real data)
CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lat FLOAT, lng FLOAT, area TEXT,
  services TEXT[],
  wait_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- PATIENT MEMORY (Conversation history)
CREATE TABLE user_sessions (
  phone TEXT PRIMARY KEY,
  language TEXT DEFAULT 'eng' CHECK (language IN ('eng','kis','luo')),
  preferred_area TEXT,
  last_interaction TIMESTAMP DEFAULT NOW(),
  total_interactions INTEGER DEFAULT 0,
  session_history JSONB[] DEFAULT '{}'
);

-- Live Queue
CREATE TABLE user_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT REFERENCES user_sessions(phone),
  symptoms TEXT,
  urgency TEXT CHECK (urgency IN ('RED','YELLOW','GREEN')),
  clinic_id UUID REFERENCES clinics(id),
  queue_position INTEGER,
  estimated_wait INTEGER,
  queued_at TIMESTAMP DEFAULT NOW()
);

-- Sample Clinics INSERT
INSERT INTO clinics (name, lat, lng, area, services) VALUES
('Jaramogi Oginga Odinga Hospital', -0.090, 34.758, 'Kisumu', ARRAY['emergency','pediatrics']),
('Kisumu County Referral Hospital', -0.085, 34.760, 'Kisumu', ARRAY['maternity','general']);
```

## 🎯 GEMINI 2.5 AGENTS (Memory-aware)

```python
# supabase/client.py
from supabase import create_client
client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# agents/memory_agent.py  
class MemoryAgent:
    async def load_memory(self, phone: str) -> List[Dict]:
        result = client.table('user_sessions').select('session_history').eq('phone', phone).execute()
        return result.data['session_history'] if result.data else []
    
    async def save_interaction(self, phone: str, interaction: Dict):
        history = await self.load_memory(phone)
        history.append(interaction)
        
        client.table('user_sessions').upsert({
            'phone': phone,
            'session_history': history[-10:],  # Last 10 interactions
            'total_interactions': len(history)
        }).execute()
```

## 🚀 MAIN ENDPOINT (/guide-patient) - FULL WORKFLOW
```python
@app.post("/guide-patient", response_model=PatientResponse)
async def guide_patient(
    phone: str,                       # Memory key
    audio_file: UploadFile = None,
    symptoms_text: str = None,
    preferred_area: str = None
):
    memory_agent = MemoryAgent()
    
    # STEP 1: Load patient memory
    memory = await memory_agent.load_memory(phone)
    memory_context = f"Prior interactions: {len(memory)}. Last: {memory[-1] if memory else 'none'}"
    
    # STEP 2: Voice processing (Gemini 2.5 multimodal)
    if audio_file:
        processed = await voice_agent.process_audio(audio_file, memory_context)
        language = processed['language']
    else:
        processed = {'symptoms': symptoms_text, 'language': 'eng'}
    
    # STEP 3: Triage with memory (Gemini 2.5)
    triage = await triage_agent.classify(
        symptoms=processed['symptoms'],
        memory_context=memory_context,
        phone=phone
    )
    
    # STEP 4: Clinic assignment + queue
    queue_result = await queue_agent.assign(
        triage=triage,
        preferred_area=preferred_area or 'Kisumu',
        phone=phone
    )
    
    # STEP 5: Save to memory
    interaction = {
        'timestamp': datetime.now().isoformat(),
        'symptoms': processed['symptoms'],
        'urgency': triage.urgency,
        'clinic': queue_result.clinic_name,
        'queue_pos': queue_result.queue_position
    }
    await memory_agent.save_interaction(phone, interaction)
    
    return PatientResponse(
        phone=phone,
        urgency=triage.urgency,
        clinic_name=queue_result.clinic_name,
        queue_position=queue_result.queue_position,
        memory_used=len(memory) + 1,
        language=processed['language']
    )
```

## 🧠 GEMINI 2.5 PROMPTS

**Voice Agent:**

Gemini 2.5 - transcribe Kiswahili/English/DhoLuo audio:
[audio_content]

Context: {memory_context}

Return JSON: {{"symptoms": "...", "language": "kis/eng/luo", "confidence": 0.95}}

text

**Triage Agent:**
Gemini 2.5 Medical AI - Rural Kenya WHO/IMCI expert.

MEMORY: {memory_context}
Symptoms: {symptoms}

Classify:
🟥 RED: Life-threatening (hospital NOW)
🟡 YELLOW: Serious (clinic <24h)
🟢 GREEN: Home care safe

JSON: {{"urgency": "RED", "advice": "Go to hospital immediately", "confidence": 0.97}}

You are an expert Python backend engineer working on a rural‑health app called "RuralHealthGuide" in Kenya.

Context:
- Stack: FastAPI, Supabase, PostGIS, Gemini 2.5 Pro, uv, Python 3.11.
- Goal: When a user opens the web UI, infer their rough location from IP/browser geolocation and then route them to the nearest open clinic in their area (using Supabase + PostGIS).

Task:
Write minimal, clean Python code for:
1. A FastAPI endpoint that:
   - Accepts phone, symptoms_text, preferred_area, and optional user_lat/user_lng.
   - Optionally infers rough location from IP/browser and calls a helper function to get the nearest clinic.
2. A helper function `get_nearest_clinic(user_lat, user_lng, area)` that:
   - Uses Supabase client to call a PostGIS‑enabled RPC function `get_nearest_clinic(lat, lng, area)`.
   - Returns the closest clinic (id, name, distance) in that area.
3. A small JS snippet to:
   - Ask the browser for geolocation permission.
   - If allowed, send the lat/lng to the FastAPI endpoint.

Constraints:
- Use async FastAPI functions.
- Use Supabase RPC; do not inline raw SQL.
- Assume the clinics table is already in Supabase with a GEOGRAPHY(POINT, 4326) column.
- Keep comments brief and inline.
- Output only code (no explanations).