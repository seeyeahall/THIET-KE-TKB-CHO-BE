from typing import Any
from uuid import UUID, uuid4

from app.repositories.activities import ActivitiesRepository


class ActivitiesService:
    def __init__(self) -> None:
        self.repo = ActivitiesRepository()

    def list_activities(
        self,
        theme: str | None = None,
        min_age: int | None = None,
        max_age: int | None = None,
    ) -> list[dict[str, Any]]:
        return self.repo.list_published(theme=theme, min_age=min_age, max_age=max_age)

    def get_activity(self, activity_id: UUID | str) -> dict[str, Any] | None:
        return self.repo.get_by_id(activity_id)

    def create_activity(self, data: dict[str, Any]) -> dict[str, Any]:
        payload = {
            "id": str(uuid4()),
            **data,
        }
        if not payload.get("slug") and payload.get("title"):
            import re
            import unicodedata
            title = unicodedata.normalize("NFKD", payload["title"])
            title = title.encode("ascii", "ignore").decode("ascii")
            payload["slug"] = re.sub(r"[^\w\s-]", "", title).strip().lower().replace(" ", "-")
        return self.repo.create(payload)

    def update_activity(self, activity_id: UUID | str, data: dict[str, Any]) -> dict[str, Any] | None:
        return self.repo.update(activity_id, data)

    def delete_activity(self, activity_id: UUID | str) -> dict[str, Any] | None:
        return self.repo.delete(activity_id)
