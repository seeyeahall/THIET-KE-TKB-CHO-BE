from typing import Any
from uuid import UUID

from app.repositories.base import BaseRepository


class ActivitiesRepository(BaseRepository):
    table_name = "activities"
    soft_delete = True

    def get_by_slug(self, slug: str) -> dict[str, Any] | None:
        q = (
            self._base_query()
            .eq("slug", slug)
            .limit(1)
        )
        result = q.execute()
        data = result.data or []
        return data[0] if data else None

    def list_published(self, theme: str | None = None, min_age: int | None = None, max_age: int | None = None) -> list[dict[str, Any]]:
        q = self._base_query().eq("status", "published")
        if theme:
            q = q.eq("theme", theme)
        if min_age is not None:
            q = q.lte("min_age", min_age)
        if max_age is not None:
            q = q.gte("max_age", max_age)
        result = q.execute()
        return result.data or []
