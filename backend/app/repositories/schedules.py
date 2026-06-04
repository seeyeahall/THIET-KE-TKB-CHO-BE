from datetime import date
from typing import Any
from uuid import UUID

from app.repositories.base import BaseRepository


class SchedulesRepository(BaseRepository):
    table_name = "schedules"
    soft_delete = True

    def get_current_by_child(self, child_id: UUID | str, week_start: date | None = None) -> dict[str, Any] | None:
        q = self._base_query().eq("child_id", str(child_id))
        if week_start:
            q = q.eq("week_start_date", week_start.isoformat())
        else:
            # Default to current week if not specified (client should pass it)
            pass
        result = q.order("week_start_date", desc=True).limit(1).execute()
        data = result.data or []
        return data[0] if data else None

    def list_by_child(self, child_id: UUID | str, month: str | None = None, limit: int = 10) -> list[dict[str, Any]]:
        q = self._base_query().eq("child_id", str(child_id))
        if month:
            q = q.gte("week_start_date", f"{month}-01").lte("week_start_date", f"{month}-31")
        q = q.order("week_start_date", desc=True).limit(limit)
        result = q.execute()
        return result.data or []


class ScheduleItemsRepository(BaseRepository):
    table_name = "schedule_items"
    soft_delete = True

    def list_by_schedule(self, schedule_id: UUID | str) -> list[dict[str, Any]]:
        q = (
            self._base_query()
            .eq("schedule_id", str(schedule_id))
            .order("day_of_week", desc=False)
            .order("sort_order", desc=False)
        )
        result = q.execute()
        return result.data or []

    def list_by_child(self, child_id: UUID | str, status: str | None = None) -> list[dict[str, Any]]:
        q = self._base_query().eq("child_id", str(child_id))
        if status:
            q = q.eq("status", status)
        result = q.order("day_of_week", desc=False).order("sort_order", desc=False).execute()
        return result.data or []

    def update_status(self, item_id: UUID | str, status: str, notes: str | None = None) -> dict[str, Any] | None:
        payload: dict[str, Any] = {"status": status}
        if status == "complete":
            payload["completed_at"] = "now()"
        if notes:
            payload["notes"] = notes
        return self.update(item_id, payload)
