from datetime import date, time
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.core.dependencies import get_current_family
from app.core.security import CurrentUser, get_current_user
from app.services.schedules import SchedulesService

router = APIRouter(tags=["schedules"])


def _schedules_service() -> SchedulesService:
    return SchedulesService()


class ScheduleItemCreate(BaseModel):
    activity_id: UUID
    day_of_week: int = Field(ge=0, le=6)
    start_time: time | None = None
    duration_minutes: int = Field(gt=0)
    sort_order: int = 0


class ScheduleCreate(BaseModel):
    child_id: UUID
    title: str = Field(min_length=1, max_length=120)
    week_start_date: date
    theme: str | None = None
    items: list[ScheduleItemCreate] = Field(default_factory=list)


class ScheduleItemStatusUpdate(BaseModel):
    status: str = Field(pattern="^(complete|skip)$")
    notes: str | None = None


@router.get("/schedules")
def list_schedules(
    child_id: UUID = Query(),
    family: dict = Depends(get_current_family),
    user: CurrentUser = Depends(get_current_user),
) -> list[dict[str, object]]:
    # Verify child belongs to family
    from app.repositories.children import ChildrenRepository
    child = ChildrenRepository().get_by_id(child_id)
    if not child or str(child.get("family_id")) != str(family["id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    return _schedules_service().list_schedules(child_id)


@router.get("/schedules/current")
def get_current_schedule(
    child_id: UUID = Query(),
    week_start: date | None = Query(default=None),
    family: dict = Depends(get_current_family),
    user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    # Verify child belongs to family
    from app.repositories.children import ChildrenRepository
    child = ChildrenRepository().get_by_id(child_id)
    if not child or str(child.get("family_id")) != str(family["id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    schedule = _schedules_service().get_current_schedule(child_id, week_start)
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No schedule found")
    return schedule


@router.post("/schedules")
def create_schedule(
    payload: ScheduleCreate,
    family: dict = Depends(get_current_family),
    user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    # Verify child belongs to family
    from app.repositories.children import ChildrenRepository
    child = ChildrenRepository().get_by_id(payload.child_id)
    if not child or str(child.get("family_id")) != str(family["id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    return _schedules_service().create_schedule(payload.model_dump(exclude_unset=True))


@router.post("/schedules/{schedule_id}/items")
def add_schedule_item(
    schedule_id: UUID,
    payload: ScheduleItemCreate,
    family: dict = Depends(get_current_family),
    user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    from app.repositories.schedules import SchedulesRepository
    schedule = SchedulesRepository().get_by_id(schedule_id)
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    
    from app.repositories.children import ChildrenRepository
    child = ChildrenRepository().get_by_id(schedule["child_id"])
    if not child or str(child.get("family_id")) != str(family["id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
        
    return _schedules_service().add_schedule_item(schedule_id, payload.model_dump(exclude_unset=True))



@router.patch("/schedule-items/{item_id}")
def update_schedule_item_status(
    item_id: UUID,
    payload: ScheduleItemStatusUpdate,
    family: dict = Depends(get_current_family),
    user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    # Verify item belongs to family via child
    from app.repositories.schedules import ScheduleItemsRepository
    item = ScheduleItemsRepository().get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    from app.repositories.children import ChildrenRepository
    child = ChildrenRepository().get_by_id(item["child_id"])
    if not child or str(child.get("family_id")) != str(family["id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    updated = _schedules_service().update_schedule_item_status(item_id, payload.status, payload.notes)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return updated
