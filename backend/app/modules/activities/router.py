from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/activities", tags=["activities"])


class ActivityCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    theme: str | None = None
    description: str | None = None
    min_age: int = Field(default=6, ge=0)
    max_age: int = Field(default=10, le=18)
    duration_minutes: int = Field(default=30, gt=0)
    difficulty: str | None = None
    requires_parent: bool = False
    status: str = "draft"


@router.get("")
def list_activities(
    age: int | None = Query(default=None, ge=0, le=18),
    theme: str | None = None,
) -> list[dict[str, str]]:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="List activities skeleton")


@router.post("")
def create_activity(payload: ActivityCreate) -> dict[str, object]:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Create activity skeleton")

