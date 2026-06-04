from abc import ABC
from typing import Any
from uuid import UUID

from app.core.database import get_supabase_client, DatabaseNotConfiguredError
from app.repositories.demo_data import DEMO_DB


class BaseRepository(ABC):
    """Base repository with soft-delete support over Supabase.
    Falls back to demo data when database is not configured."""

    table_name: str = ""
    soft_delete: bool = True

    @property
    def client(self):
        return get_supabase_client()

    def _is_demo(self) -> bool:
        try:
            get_supabase_client()
            return False
        except DatabaseNotConfiguredError:
            return True

    def _demo_data(self) -> list[dict[str, Any]]:
        return list(DEMO_DB.get(self.table_name, []))

    def _table(self):
        return self.client.table(self.table_name)

    def _base_query(self):
        if self._is_demo():
            # Return a mock query object for demo mode
            return _DemoQuery(self._demo_data(), self.soft_delete)
        q = self._table().select("*")
        if self.soft_delete:
            q = q.is_("deleted_at", "null")
        return q

    def get_by_id(self, record_id: UUID | str) -> dict[str, Any] | None:
        if self._is_demo():
            for row in self._demo_data():
                if str(row.get("id")) == str(record_id):
                    return row
            return None
        q = self._base_query().eq("id", str(record_id)).limit(1)
        result = q.execute()
        data = result.data or []
        return data[0] if data else None

    def list_all(self, filters: dict[str, Any] | None = None, limit: int = 100) -> list[dict[str, Any]]:
        if self._is_demo():
            rows = self._demo_data()
            if filters:
                rows = [r for r in rows if all(str(r.get(k)) == str(v) for k, v in filters.items())]
            return rows[:limit]
        q = self._base_query()
        if filters:
            for col, val in filters.items():
                q = q.eq(col, val)
        result = q.limit(limit).execute()
        return result.data or []

    def create(self, data: dict[str, Any]) -> dict[str, Any]:
        if self._is_demo():
            new_row = dict(data)
            if "id" not in new_row:
                from uuid import uuid4
                new_row["id"] = str(uuid4())
            DEMO_DB.setdefault(self.table_name, []).append(new_row)
            return new_row
        result = self._table().insert(data).execute()
        data_out = result.data or []
        return data_out[0] if data_out else {}

    def update(self, record_id: UUID | str, data: dict[str, Any]) -> dict[str, Any] | None:
        if self._is_demo():
            for i, row in enumerate(DEMO_DB.get(self.table_name, [])):
                if str(row.get("id")) == str(record_id):
                    DEMO_DB[self.table_name][i].update(data)
                    return DEMO_DB[self.table_name][i]
            return None
        result = (
            self._table()
            .update(data)
            .eq("id", str(record_id))
            .execute()
        )
        data_out = result.data or []
        return data_out[0] if data_out else None

    def delete(self, record_id: UUID | str) -> dict[str, Any] | None:
        if self._is_demo():
            return self.update(record_id, {"deleted_at": "now()"})
        if self.soft_delete:
            return self.update(record_id, {"deleted_at": "now()"})
        result = self._table().delete().eq("id", str(record_id)).execute()
        data_out = result.data or []
        return data_out[0] if data_out else None

    def hard_delete(self, record_id: UUID | str) -> dict[str, Any] | None:
        if self._is_demo():
            DEMO_DB[self.table_name] = [r for r in DEMO_DB.get(self.table_name, []) if str(r.get("id")) != str(record_id)]
            return {}
        result = self._table().delete().eq("id", str(record_id)).execute()
        data_out = result.data or []
        return data_out[0] if data_out else None


class _DemoQuery:
    """Mock query object for demo mode that supports chaining."""

    def __init__(self, data: list[dict[str, Any]], soft_delete: bool):
        self._data = data
        self._soft_delete = soft_delete
        self._filters: list[tuple[str, Any]] = []
        self._limit: int = 100
        self._order_col: str | None = None
        self._order_desc: bool = False

    def eq(self, column: str, value: Any):
        self._filters.append((column, value))
        return self

    def is_(self, column: str, value: Any):
        if column == "deleted_at" and value == "null":
            pass  # soft-delete handled by default
        else:
            self._filters.append((column, value))
        return self

    def lte(self, column: str, value: Any):
        self._filters.append((f"{column}__lte", value))
        return self

    def gte(self, column: str, value: Any):
        self._filters.append((f"{column}__gte", value))
        return self

    def order(self, column: str, desc: bool = False):
        self._order_col = column
        self._order_desc = desc
        return self

    def limit(self, n: int):
        self._limit = n
        return self

    def execute(self):
        rows = [dict(r) for r in self._data]
        if self._soft_delete:
            rows = [r for r in rows if r.get("deleted_at") is None]
        for col, val in self._filters:
            if col.endswith("__lte"):
                c = col[:-5]
                rows = [r for r in rows if r.get(c) is not None and r.get(c) <= val]
            elif col.endswith("__gte"):
                c = col[:-5]
                rows = [r for r in rows if r.get(c) is not None and r.get(c) >= val]
            else:
                rows = [r for r in rows if str(r.get(col)) == str(val)]
        if self._order_col:
            rows.sort(key=lambda r: (r.get(self._order_col) is None, str(r.get(self._order_col) or "")), reverse=self._order_desc)
        rows = rows[:self._limit]
        return _DemoResult(rows)


class _DemoResult:
    def __init__(self, data: list[dict[str, Any]], count: int | None = None):
        self.data = data
        self.count = count if count is not None else len(data)
