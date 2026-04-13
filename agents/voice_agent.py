"""Gemini-powered voice processing agent."""

from __future__ import annotations

import json
import os
from typing import Any

import google.generativeai as genai
from fastapi import UploadFile

from agents.prompts import build_voice_prompt


class VoiceAgent:
    def __init__(self, model_name: str = "gemini-2.5-pro") -> None:
        self.model_name = model_name
        api_key = os.getenv("GEMINI_API_KEY")
        self.enabled = bool(api_key)
        if self.enabled:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel(model_name)
        else:
            self.model = None

    async def process_audio(
        self,
        audio_file: UploadFile,
        memory_context: str,
    ) -> dict[str, Any]:
        audio_bytes = await audio_file.read()
        if not self.enabled or not self.model:
            return {
                "symptoms": "Audio received but Gemini is not configured.",
                "language": "eng",
                "confidence": 0.0,
            }

        prompt = build_voice_prompt(memory_context=memory_context)
        response = self.model.generate_content(
            [
                prompt,
                {
                    "mime_type": audio_file.content_type or "audio/wav",
                    "data": audio_bytes,
                },
            ]
        )
        text = (response.text or "").strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {
                "symptoms": text or "Unable to transcribe audio.",
                "language": "eng",
                "confidence": 0.0,
            }
