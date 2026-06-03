from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.core.security import CurrentUser, get_current_user
from app.services.activities import ActivitiesService

router = APIRouter(prefix="/activities", tags=["activities"])


def _activities_service() -> ActivitiesService:
    return ActivitiesService()


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
    user: CurrentUser = Depends(get_current_user),
) -> list[dict[str, object]]:
    return _activities_service().list_activities(theme=theme, min_age=age, max_age=age)


@router.post("")
def create_activity(
    payload: ActivityCreate,
    user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    return _activities_service().create_activity(payload.model_dump(exclude_unset=True))


@router.get("/{activity_id}")
def get_activity(
    activity_id: UUID,
    user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    activity = _activities_service().get_activity(activity_id)
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
    return activity
