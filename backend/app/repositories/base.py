from abc import ABC
from typing import Any
from uuid import UUID

from app.core.database import get_supabase_client


class BaseRepository(ABC):
    """Base repository with soft-delete support over Supabase."""

    table_name: str = ""
    soft_delete: bool = True

    @property
    def client(self):
        return get_supabase_client()

    def _table(self):
        return self.client.table(self.table_name)

    def _base_query(self):
        q = self._table().select("*")
        if self.soft_delete:
            q = q.is_("deleted_at", "null")
        return q

    def get_by_id(self, record_id: UUID | str) -> dict[str, Any] | None:
        q = self._base_query().eq("id", str(record_id)).limit(1)
        result = q.execute()
        data = result.data or []
        return data[0] if data else None

    def list_all(self, filters: dict[str, Any] | None = None, limit: int = 100) -> list[dict[str, Any]]:
        q = self._base_query()
        if filters:
            for col, val in filters.items():
                q = q.eq(col, val)
        result = q.limit(limit).execute()
        return result.data or []

    def create(self, data: dict[str, Any]) -> dict[str, Any]:
        result = self._table().insert(data).execute()
        data_out = result.data or []
        return data_out[0] if data_out else {}

    def update(self, record_id: UUID | str, data: dict[str, Any]) -> dict[str, Any] | None:
        result = (
            self._table()
            .update(data)
            .eq("id", str(record_id))
            .execute()
        )
        data_out = result.data or []
        return data_out[0] if data_out else None

    def delete(self, record_id: UUID | str) -> dict[str, Any] | None:
        if self.soft_delete:
            return self.update(record_id, {"deleted_at": "now()"})
        result = self._table().delete().eq("id", str(record_id)).execute()
        data_out = result.data or []
        return data_out[0] if data_out else None

    def hard_delete(self, record_id: UUID | str) -> dict[str, Any] | None:
        result = self._table().delete().eq("id", str(record_id)).execute()
        data_out = result.data or []
        return data_out[0] if data_out else None
