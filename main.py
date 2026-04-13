"""FastAPI entrypoint for RuralHealthGuide."""

from __future__ import annotations

from datetime import datetime

from fastapi import FastAPI, File, Form, UploadFile
from pydantic import BaseModel

from agents.memory_agent import MemoryAgent
from agents.queue_agent import QueueAgent
from agents.triage_agent import TriageAgent
from agents.voice_agent import VoiceAgent

app = FastAPI(title="AfyaRoot")

voice_agent = VoiceAgent()
triage_agent = TriageAgent()
queue_agent = QueueAgent()


class PatientResponse(BaseModel):
    phone: str | None = None
    urgency: str
    care_mode: str
    visit_recommended: bool
    advice: str
    voice_response: str
    response_language: str
    clinic_name: str
    queue_position: int
    estimated_wait: int
    memory_used: int
    language: str


@app.post("/guide-patient", response_model=PatientResponse)
async def guide_patient(
    phone: str | None = Form(default=None),
    audio_file: UploadFile | None = File(default=None),
    symptoms_text: str | None = Form(default=None),
    preferred_area: str | None = Form(default=None),
) -> PatientResponse:
    memory_agent = MemoryAgent()
    normalized_phone = phone.strip() if phone else None
    if normalized_phone == "":
        normalized_phone = None

    memory = await memory_agent.load_memory(normalized_phone)
    memory_context = f"Prior interactions: {len(memory)}. Last: {memory[-1] if memory else 'none'}"

    if audio_file is not None:
        processed = await voice_agent.process_audio(audio_file, memory_context)
        language = processed["language"]
    else:
        processed = {"symptoms": symptoms_text or "", "language": "eng"}
        language = processed["language"]

    triage = await triage_agent.classify(
        symptoms=processed["symptoms"],
        memory_context=memory_context,
        phone=normalized_phone,
        response_language=language,
    )

    queue_result = await queue_agent.assign(
        triage=triage,
        preferred_area=preferred_area or "Kisumu",
        phone=normalized_phone,
    )

    interaction = {
        "timestamp": datetime.now().isoformat(),
        "symptoms": processed["symptoms"],
        "urgency": triage.urgency,
        "clinic": queue_result.clinic_name,
        "queue_pos": queue_result.queue_position,
    }
    await memory_agent.save_interaction(
        normalized_phone,
        interaction,
        language=language,
        preferred_area=preferred_area or "Kisumu",
    )

    return PatientResponse(
        phone=normalized_phone,
        urgency=triage.urgency,
        care_mode=triage.care_mode,
        visit_recommended=triage.visit_recommended,
        advice=triage.advice,
        voice_response=triage.voice_response,
        response_language=triage.response_language,
        clinic_name=queue_result.clinic_name,
        queue_position=queue_result.queue_position,
        estimated_wait=queue_result.estimated_wait,
        memory_used=len(memory) + 1,
        language=language,
    )
