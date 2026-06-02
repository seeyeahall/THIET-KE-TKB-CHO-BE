from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_returns_ok() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_ai_providers_are_listed_without_secrets() -> None:
    response = client.get("/api/v1/ai/providers")

    assert response.status_code == 200
    providers = response.json()
    assert providers
    assert "api_key" not in providers[0]
    assert "api_key_env" in providers[0]

