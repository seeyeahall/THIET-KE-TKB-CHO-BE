from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.modules.ai.providers import DEFAULT_PROVIDER_CONFIGS

router = APIRouter(prefix="/ai", tags=["ai"])


class ProviderTestRequest(BaseModel):
    provider_type: str
    model: str | None = None


class ChatRequest(BaseModel):
    child_id: UUID
    message: str = Field(min_length=1, max_length=4000)


class GenerateScheduleRequest(BaseModel):
    child_id: UUID
    week_start_date: str
    theme: str | None = None


@router.get("/providers")
def list_providers() -> list[dict[str, object]]:
    return [
        {
            "name": provider.name,
            "provider_type": provider.provider_type,
            "model": provider.model,
            "capabilities": list(provider.capabilities),
            "api_key_env": provider.api_key_env,
        }
        for provider in DEFAULT_PROVIDER_CONFIGS
    ]


@router.post("/providers")
def create_provider(payload: ProviderTestRequest) -> dict[str, object]:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Create provider skeleton")


@router.post("/providers/{provider_id}/test")
def test_provider(provider_id: UUID) -> dict[str, object]:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Provider test skeleton")


@router.post("/generate-schedule")
def generate_schedule(payload: GenerateScheduleRequest) -> dict[str, object]:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="AI schedule generation skeleton")

