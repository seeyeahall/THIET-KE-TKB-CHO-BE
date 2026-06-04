from datetime import date, timedelta
from typing import Any
from uuid import UUID, uuid4

from app.repositories.schedules import SchedulesRepository, ScheduleItemsRepository


class SchedulesService:
    def __init__(self) -> None:
        self.repo = SchedulesRepository()
        self.items_repo = ScheduleItemsRepository()

    def get_current_schedule(self, child_id: UUID | str, week_start: date | None = None) -> dict[str, Any] | None:
        schedule = self.repo.get_current_by_child(child_id, week_start)
        if not schedule:
            return None
        items = self.items_repo.list_by_schedule(schedule["id"])
        schedule["items"] = items
        return schedule

    def list_schedules(self, child_id: UUID | str, month: str | None = None, limit: int = 10) -> list[dict[str, Any]]:
        return self.repo.list_by_child(child_id, month=month, limit=limit)

    def get_schedule_items_by_date(self, child_id: UUID | str, date_str: str) -> list[dict[str, Any]]:
        # date_str: YYYY-MM-DD
        target_date = date.fromisoformat(date_str)
        # week starts on Monday
        week_start = target_date - timedelta(days=target_date.weekday())
        day_of_week = target_date.weekday()

        schedule = self.repo.get_current_by_child(child_id, week_start)
        if not schedule:
            return []
        
        items = self.items_repo.list_by_schedule(schedule["id"])
        # filter out items not matching day_of_week
        return [item for item in items if item.get("day_of_week") == day_of_week]

    def create_schedule(self, data: dict[str, Any]) -> dict[str, Any]:
        items_data = data.pop("items", [])
        payload = {
            "id": str(uuid4()),
            **data,
        }
        schedule = self.repo.create(payload)

        created_items: list[dict[str, Any]] = []
        for item in items_data:
            item_payload = {
                "id": str(uuid4()),
                "schedule_id": schedule["id"],
                "child_id": schedule["child_id"],
                **item,
            }
            created_items.append(self.items_repo.create(item_payload))

        schedule["items"] = created_items
        return schedule

    def add_schedule_item(self, schedule_id: UUID | str, data: dict[str, Any]) -> dict[str, Any]:
        schedule = self.repo.get_by_id(schedule_id)
        if not schedule:
            raise ValueError("Schedule not found")
        item_payload = {
            "id": str(uuid4()),
            "schedule_id": str(schedule_id),
            "child_id": schedule["child_id"],
            **data,
        }
        return self.items_repo.create(item_payload)

    def update_schedule_item_status(
        self,
        item_id: UUID | str,
        status: str,
        notes: str | None = None,
    ) -> dict[str, Any] | None:
        return self.items_repo.update_status(item_id, status, notes)

    def delete_schedule(self, schedule_id: UUID | str) -> dict[str, Any] | None:
        # Soft delete items first, then schedule
        schedule = self.repo.get_by_id(schedule_id)
        if schedule:
            items = self.items_repo.list_by_schedule(schedule_id)
            for item in items:
                self.items_repo.delete(item["id"])
        return self.repo.delete(schedule_id)
