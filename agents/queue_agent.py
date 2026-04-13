"""Clinic queue assignment agent."""

from __future__ import annotations

from pydantic import BaseModel

from app_supabase.client import get_supabase_client


class QueueResult(BaseModel):
    clinic_id: str
    clinic_name: str
    queue_position: int
    estimated_wait: int


class QueueAgent:
    urgency_rank = {"RED": 0, "YELLOW": 1, "GREEN": 2}

    async def assign(
        self,
        *,
        triage,
        preferred_area: str,
        phone: str | None,
    ) -> QueueResult:
        if not getattr(triage, "visit_recommended", True):
            return QueueResult(
                clinic_id="",
                clinic_name="Home Care",
                queue_position=0,
                estimated_wait=0,
            )

        client = get_supabase_client()
        clinic_result = (
            client.table("clinics")
            .select("id,name,wait_minutes")
            .eq("area", preferred_area)
            .eq("status", "open")
            .order("wait_minutes")
            .limit(1)
            .execute()
        )
        if not clinic_result.data:
            fallback_result = (
                client.table("clinics")
                .select("id,name,wait_minutes")
                .eq("status", "open")
                .order("wait_minutes")
                .limit(1)
                .execute()
            )
            if not fallback_result.data:
                raise ValueError("No open clinics available.")
            clinic = fallback_result.data[0]
        else:
            clinic = clinic_result.data[0]

        queue_result = (
            client.table("user_queue")
            .select("urgency")
            .eq("clinic_id", clinic["id"])
            .execute()
        )
        queued_patients = queue_result.data or []
        higher_or_equal_priority = sum(
            1
            for row in queued_patients
            if self.urgency_rank.get(row.get("urgency", "GREEN"), 2)
            <= self.urgency_rank.get(triage.urgency, 2)
        )
        queue_position = higher_or_equal_priority + 1
        per_patient_wait = 10 if triage.urgency == "RED" else 5
        estimated_wait = int(clinic.get("wait_minutes") or 0) + max(queue_position - 1, 0) * per_patient_wait

        client.table("user_queue").insert(
            {
                "phone": phone,
                "symptoms": getattr(triage, "advice", None),
                "urgency": triage.urgency,
                "clinic_id": clinic["id"],
                "queue_position": queue_position,
                "estimated_wait": estimated_wait,
            }
        ).execute()

        return QueueResult(
            clinic_id=clinic["id"],
            clinic_name=clinic["name"],
            queue_position=queue_position,
            estimated_wait=estimated_wait,
        )
