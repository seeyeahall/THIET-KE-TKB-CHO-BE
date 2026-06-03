from typing import Any
from uuid import uuid4

import pytest

from app.services.children import ChildrenService
from app.services.activities import ActivitiesService
from app.services.schedules import SchedulesService


class FakeRepo:
    def __init__(self, data: list[dict[str, Any]] | None = None) -> None:
        self._data = data or []
        self.calls: list[tuple[str, tuple[Any, ...]]] = []

    def get_by_id(self, record_id: Any) -> dict[str, Any] | None:
        self.calls.append(("get_by_id", (record_id,)))
        for item in self._data:
            if str(item.get("id")) == str(record_id):
                return item
        return None

    def get_by_family(self, family_id_query: Any) -> list[dict[str, Any]]:
        self.calls.append(("get_by_family", (family_id_query,)))
        return [i for i in self._data if str(i.get("family_id")) == str(family_id_query)]

    def list_all(self, filters: dict[str, Any] | None = None, limit: int = 100) -> list[dict[str, Any]]:
        self.calls.append(("list_all", (filters, limit)))
        return self._data

    def create(self, data: dict[str, Any]) -> dict[str, Any]:
        self.calls.append(("create", (data,)))
        data["id"] = data.get("id") or str(uuid4())
        self._data.append(data)
        return data

    def update(self, record_id: Any, data: dict[str, Any]) -> dict[str, Any] | None:
        self.calls.append(("update", (record_id, data)))
        for item in self._data:
            if str(item.get("id")) == str(record_id):
                item.update(data)
                return item
        return None

    def delete(self, record_id: Any) -> dict[str, Any] | None:
        self.calls.append(("delete", (record_id,)))
        for item in self._data:
            if str(item.get("id")) == str(record_id):
                item["deleted_at"] = "now()"
                return item
        return None

    def list_by_schedule(self, schedule_id_query: Any) -> list[dict[str, Any]]:
        return [i for i in self._data if str(i.get("schedule_id")) == str(schedule_id_query)]

    def list_published(self, **kwargs: Any) -> list[dict[str, Any]]:
        return [i for i in self._data if i.get("status") == "published"]

    def get_current_by_child(self, child_id_query: Any, week_start: Any = None) -> dict[str, Any] | None:
        for item in self._data:
            if str(item.get("child_id")) == str(child_id_query):
                return item
        return None

    def list_by_child(self, child_id_query: Any, limit: int = 10) -> list[dict[str, Any]]:
        return [i for i in self._data if str(i.get("child_id")) == str(child_id_query)]

    def update_status(self, item_id: Any, status: str, notes: Any = None) -> dict[str, Any] | None:
        for item in self._data:
            if str(item.get("id")) == str(item_id):
                item["status"] = status
                return item
        return None


@pytest.fixture(autouse=True)
def mock_supabase(monkeypatch: pytest.MonkeyPatch) -> None:
    """Prevent real Supabase client initialization during service tests."""
    monkeypatch.setattr("app.repositories.base.get_supabase_client", lambda: object())


# ChildrenService tests

def test_children_service_list_children() -> None:
    family_id = str(uuid4())
    child = {"id": str(uuid4()), "family_id": family_id, "name": "Lan", "age": 7}
    repo = FakeRepo([child])
    service = ChildrenService()
    service.repo = repo  # type: ignore[assignment]
    result = service.list_children(family_id)
    assert len(result) == 1
    assert result[0]["name"] == "Lan"


def test_children_service_create_child() -> None:
    family_id = str(uuid4())
    repo = FakeRepo()
    rewards_repo = FakeRepo()
    service = ChildrenService()
    service.repo = repo  # type: ignore[assignment]
    service.rewards_repo = rewards_repo  # type: ignore[assignment]
    result = service.create_child(family_id, {"name": "Nam", "age": 8})
    assert result["name"] == "Nam"
    assert result["family_id"] == family_id
    assert any(c[0] == "create" for c in rewards_repo.calls)


def test_children_service_get_child() -> None:
    child_id = str(uuid4())
    child = {"id": child_id, "name": "Na", "age": 6}
    repo = FakeRepo([child])
    service = ChildrenService()
    service.repo = repo  # type: ignore[assignment]
    result = service.get_child(child_id)
    assert result is not None
    assert result["name"] == "Na"


# ActivitiesService tests

def test_activities_service_list_published() -> None:
    activity = {"id": str(uuid4()), "title": "Tưới cây", "theme": "nature", "status": "published"}
    repo = FakeRepo([activity])
    service = ActivitiesService()
    service.repo = repo  # type: ignore[assignment]
    result = service.list_activities(theme="nature")
    assert len(result) == 1


def test_activities_service_create_slug() -> None:
    repo = FakeRepo()
    service = ActivitiesService()
    service.repo = repo  # type: ignore[assignment]
    result = service.create_activity({"title": "Vẽ tranh"})
    assert result["slug"] == "ve-tranh"


# SchedulesService tests

def test_schedules_service_get_current() -> None:
    child_id = str(uuid4())
    schedule_id = str(uuid4())
    schedule = {"id": schedule_id, "child_id": child_id, "title": "Tuần 1"}
    item = {"id": str(uuid4()), "schedule_id": schedule_id, "child_id": child_id, "activity_id": str(uuid4()), "day_of_week": 0, "duration_minutes": 15, "status": "planned"}
    schedule_repo = FakeRepo([schedule])
    items_repo = FakeRepo([item])
    service = SchedulesService()
    service.repo = schedule_repo  # type: ignore[assignment]
    service.items_repo = items_repo  # type: ignore[assignment]
    result = service.get_current_schedule(child_id)
    assert result is not None
    assert result["title"] == "Tuần 1"
    assert len(result["items"]) == 1


def test_schedules_service_create_with_items() -> None:
    schedule_repo = FakeRepo()
    items_repo = FakeRepo()
    service = SchedulesService()
    service.repo = schedule_repo  # type: ignore[assignment]
    service.items_repo = items_repo  # type: ignore[assignment]
    result = service.create_schedule({
        "child_id": str(uuid4()),
        "title": "Tuần 2",
        "week_start_date": "2026-06-01",
        "items": [{"activity_id": str(uuid4()), "day_of_week": 1, "duration_minutes": 30}],
    })
    assert result["title"] == "Tuần 2"
    assert len(result["items"]) == 1
