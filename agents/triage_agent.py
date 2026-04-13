"""Symptom triage agent."""

from __future__ import annotations

import json
import os

import google.generativeai as genai
from pydantic import BaseModel

from agents.prompts import build_triage_prompt


class TriageResult(BaseModel):
    urgency: str
    care_mode: str = "clinic_24h"
    visit_recommended: bool = True
    advice: str
    voice_response: str = ""
    response_language: str = "eng"
    confidence: float = 0.0


class TriageAgent:
    def __init__(self, model_name: str = "gemini-2.5-pro") -> None:
        self.model_name = model_name
        api_key = os.getenv("GEMINI_API_KEY")
        self.enabled = bool(api_key)
        if self.enabled:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel(model_name)
        else:
            self.model = None

    async def classify(
        self,
        *,
        symptoms: str,
        memory_context: str,
        phone: str | None,
        response_language: str = "eng",
    ) -> TriageResult:
        if not self.enabled or not self.model:
            return self._fallback_triage(symptoms, response_language=response_language)

        prompt = build_triage_prompt(
            symptoms=symptoms,
            memory_context=memory_context,
            phone=phone,
            response_language=response_language,
        )
        response = self.model.generate_content(prompt)
        text = (response.text or "").strip()
        try:
            payload = json.loads(text)
            return TriageResult(**payload)
        except (json.JSONDecodeError, TypeError, ValueError):
            return self._fallback_triage(symptoms, response_language=response_language)

    def _fallback_triage(self, symptoms: str, *, response_language: str) -> TriageResult:
        lowered = symptoms.lower()
        red_flags = ("chest pain", "unconscious", "bleeding", "seizure", "difficulty breathing")
        yellow_flags = ("fever", "vomiting", "diarrhea", "pain", "infection")
        if any(flag in lowered for flag in red_flags):
            advice = "Go to the nearest hospital immediately."
            return TriageResult(
                urgency="RED",
                care_mode="hospital_now",
                visit_recommended=True,
                advice=advice,
                voice_response=self._localize_response("RED", response_language, advice),
                response_language=response_language,
                confidence=0.65,
            )
        if any(flag in lowered for flag in yellow_flags):
            advice = "Visit a clinic within 24 hours for assessment."
            return TriageResult(
                urgency="YELLOW",
                care_mode="clinic_24h",
                visit_recommended=True,
                advice=advice,
                voice_response=self._localize_response("YELLOW", response_language, advice),
                response_language=response_language,
                confidence=0.6,
            )
        advice = "Home care may be safe, but monitor symptoms closely."
        return TriageResult(
            urgency="GREEN",
            care_mode="home_care",
            visit_recommended=False,
            advice=advice,
            voice_response=self._localize_response("GREEN", response_language, advice),
            response_language=response_language,
            confidence=0.55,
        )

    def _localize_response(self, urgency: str, response_language: str, default_advice: str) -> str:
        language = response_language if response_language in {"eng", "kis", "luo"} else "eng"
        localized = {
            "eng": {
                "RED": "Please go to the nearest hospital immediately.",
                "YELLOW": "Please visit a clinic within 24 hours for assessment.",
                "GREEN": "Home care may be safe for now. Please monitor your symptoms closely.",
            },
            "kis": {
                "RED": "Tafadhali nenda hospitali iliyo karibu mara moja.",
                "YELLOW": "Tafadhali tembelea kliniki ndani ya saa ishirini na nne kwa uchunguzi.",
                "GREEN": "Huduma ya nyumbani inaweza kukufaa kwa sasa. Tafadhali endelea kufuatilia dalili zako kwa makini.",
            },
            "luo": {
                "RED": "Kiyie thuolo mondo idhi ospital moro machiegni piyo.",
                "YELLOW": "Kiyie thuolo mondo idhi klinik e saa mashon ariyoang'wen mondo iyud nonro.",
                "GREEN": "Rit dala nyalo bedo ber sani. Kiyie thuolo mondo iling dalili mari maber.",
            },
        }
        return localized.get(language, {}).get(urgency, default_advice)
