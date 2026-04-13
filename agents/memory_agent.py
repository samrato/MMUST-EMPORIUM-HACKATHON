"""Supabase-backed patient memory agent."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from app_supabase.client import get_supabase_client


class MemoryAgent:
    async def load_memory(self, phone: str | None) -> list[dict[str, Any]]:
        if not phone:
            return []
        client = get_supabase_client()
        result = (
            client.table("user_sessions")
            .select("session_history")
            .eq("phone", phone)
            .limit(1)
            .execute()
        )
        if not result.data:
            return []

        session = result.data[0]
        history = session.get("session_history") or []
        return history if isinstance(history, list) else []

    async def save_interaction(
        self,
        phone: str | None,
        interaction: dict[str, Any],
        *,
        language: str = "eng",
        preferred_area: str | None = None,
    ) -> list[dict[str, Any]]:
        if not phone:
            return [interaction]
        client = get_supabase_client()
        history = await self.load_memory(phone)
        history.append(interaction)
        trimmed_history = history[-10:]

        payload: dict[str, Any] = {
            "phone": phone,
            "language": language,
            "preferred_area": preferred_area,
            "last_interaction": datetime.utcnow().isoformat(),
            "session_history": trimmed_history,
            "total_interactions": len(history),
        }

        client.table("user_sessions").upsert(payload).execute()
        return trimmed_history
