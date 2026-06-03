from typing import Any
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.core.dependencies import get_current_family
from app.core.security import get_current_user


@pytest.fixture
def mock_repos(monkeypatch: pytest.MonkeyPatch) -> dict[str, Any]:
    family_id = str(uuid4())
    child_id = str(uuid4())
    activity_id = str(uuid4())
    schedule_id = str(uuid4())
    item_id = str(uuid4())

    children_data = [
        {"id": child_id, "family_id": family_id, "name": "Lan", "age": 7, "interests": ["cây cối"], "dislikes": []},
    ]
    activities_data = [
        {"id": activity_id, "title": "Tưới cây", "slug": "tuoi-cay", "theme": "nature", "status": "published", "duration_minutes": 15},
    ]
    schedules_data = [
        {"id": schedule_id, "child_id": child_id, "title": "Tuần 1", "week_start_date": "2026-06-01", "theme": "nature"},
    ]
    items_data = [
        {"id": item_id, "schedule_id": schedule_id, "child_id": child_id, "activity_id": activity_id, "day_of_week": 0, "duration_minutes": 15, "status": "planned"},
    ]

    class FakeRepo:
        def __init__(self, data: list[dict[str, Any]]) -> None:
            self._data = data

        def get_by_id(self, record_id: Any) -> dict[str, Any] | None:
            for item in self._data:
                if str(item.get("id")) == str(record_id):
                    return item
            return None

        def get_by_family(self, family_id_query: Any) -> list[dict[str, Any]]:
            return [i for i in self._data if str(i.get("family_id")) == str(family_id_query)]

        def list_all(self, filters: dict[str, Any] | None = None, limit: int = 100) -> list[dict[str, Any]]:
            return self._data

        def create(self, data: dict[str, Any]) -> dict[str, Any]:
            data["id"] = data.get("id") or str(uuid4())
            self._data.append(data)
            return data

        def update(self, record_id: Any, data: dict[str, Any]) -> dict[str, Any] | None:
            for item in self._data:
                if str(item.get("id")) == str(record_id):
                    item.update(data)
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

    fake_children = FakeRepo(children_data)
    fake_activities = FakeRepo(activities_data)
    fake_schedules = FakeRepo(schedules_data)
    fake_items = FakeRepo(items_data)

    # Override get_current_family so endpoints see the same family_id as mock data
    async def fake_get_current_family() -> dict[str, Any]:
        return {"id": family_id, "parent_user_id": str(uuid4()), "name": "Test Family"}

    from app.main import app
    app.dependency_overrides[get_current_family] = fake_get_current_family

    # Mock repository classes in the service modules where they are imported
    monkeypatch.setattr("app.services.children.ChildrenRepository", lambda: fake_children)
    monkeypatch.setattr("app.services.activities.ActivitiesRepository", lambda: fake_activities)
    monkeypatch.setattr("app.services.schedules.SchedulesRepository", lambda: fake_schedules)
    monkeypatch.setattr("app.services.schedules.ScheduleItemsRepository", lambda: fake_items)

    return {
        "family_id": family_id,
        "child_id": child_id,
        "activity_id": activity_id,
        "schedule_id": schedule_id,
        "item_id": item_id,
    }


def test_health(client: TestClient) -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_list_children(client: TestClient, mock_repos: dict[str, Any]) -> None:
    resp = client.get("/api/v1/children")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["name"] == "Lan"


def test_get_child(client: TestClient, mock_repos: dict[str, Any]) -> None:
    child_id = mock_repos["child_id"]
    resp = client.get(f"/api/v1/children/{child_id}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Lan"


def test_create_child(client: TestClient, mock_repos: dict[str, Any]) -> None:
    payload = {"name": "Nam", "age": 8, "interests": [], "dislikes": []}
    resp = client.post("/api/v1/children", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Nam"


def test_list_activities(client: TestClient, mock_repos: dict[str, Any]) -> None:
    resp = client.get("/api/v1/activities")
    assert resp.status_code == 200


def test_get_activity(client: TestClient, mock_repos: dict[str, Any]) -> None:
    activity_id = mock_repos["activity_id"]
    resp = client.get(f"/api/v1/activities/{activity_id}")
    assert resp.status_code == 200
    assert resp.json()["title"] == "Tưới cây"


def test_create_activity(client: TestClient, mock_repos: dict[str, Any]) -> None:
    payload = {"title": "Vẽ tranh", "theme": "art", "duration_minutes": 30}
    resp = client.post("/api/v1/activities", json=payload)
    assert resp.status_code == 200


def test_list_ai_providers(client: TestClient) -> None:
    resp = client.get("/api/v1/ai/providers")
    assert resp.status_code == 200
    providers = resp.json()
    assert isinstance(providers, list)
    assert any(p["name"] == "Gemini" for p in providers)
