from typing import Any
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings, get_settings
from app.core.dependencies import get_current_family
from app.core.security import CurrentUser, get_current_user
from app.main import app


class FakeSupabaseResponse:
    def __init__(self, data: list[dict[str, Any]] | None = None) -> None:
        self.data = data or []


class FakeSupabaseQuery:
    def __init__(self, data: list[dict[str, Any]] | None = None) -> None:
        self._data = data or []

    def select(self, *args: Any, **kwargs: Any) -> "FakeSupabaseQuery":
        return self

    def insert(self, *args: Any, **kwargs: Any) -> "FakeSupabaseQuery":
        return self

    def update(self, *args: Any, **kwargs: Any) -> "FakeSupabaseQuery":
        return self

    def delete(self, *args: Any, **kwargs: Any) -> "FakeSupabaseQuery":
        return self

    def eq(self, *args: Any, **kwargs: Any) -> "FakeSupabaseQuery":
        return self

    def is_(self, *args: Any, **kwargs: Any) -> "FakeSupabaseQuery":
        return self

    def order(self, *args: Any, **kwargs: Any) -> "FakeSupabaseQuery":
        return self

    def limit(self, *args: Any, **kwargs: Any) -> "FakeSupabaseQuery":
        return self

    def execute(self) -> FakeSupabaseResponse:
        return FakeSupabaseResponse(self._data)


class FakeSupabaseClient:
    def __init__(self, data: list[dict[str, Any]] | None = None) -> None:
        self._data = data or []

    def table(self, table_name: str) -> FakeSupabaseQuery:
        return FakeSupabaseQuery(self._data)


@pytest.fixture(autouse=True)
def fake_supabase_client(monkeypatch: pytest.MonkeyPatch) -> None:
    """Prevent real Supabase client initialization during all tests."""
    from app.core.database import get_supabase_client as _real_get_client
    _real_get_client.cache_clear()
    fake = FakeSupabaseClient()
    monkeypatch.setattr("app.core.database.get_supabase_client", lambda: fake)
    monkeypatch.setattr("app.repositories.base.get_supabase_client", lambda: fake)


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    # Ensure settings have minimal required values for tests
    def override_get_settings() -> Settings:
        return Settings(
            app_name="Kid Adventure Planner API",
            app_env="test",
            api_prefix="/api/v1",
            cors_origins_raw="http://localhost:3000",
            secret_key="test-secret",
            supabase_url="http://localhost:54321",
            supabase_service_role_key="test-service-key",
            supabase_jwt_secret="test-jwt-secret",
        )

    monkeypatch.setattr("app.core.config.get_settings", override_get_settings)

    # Override auth dependencies globally for the test app
    _family_id = str(uuid4())
    _user_id = str(uuid4())

    async def fake_get_current_user() -> CurrentUser:
        return CurrentUser(user_id=_user_id)

    async def fake_get_current_family() -> dict[str, Any]:
        return {"id": _family_id, "parent_user_id": _user_id, "name": "Test Family"}

    app.dependency_overrides[get_current_user] = fake_get_current_user
    app.dependency_overrides[get_current_family] = fake_get_current_family

    yield TestClient(app)

    # Clean up overrides after test
    app.dependency_overrides.clear()
