from datetime import date, time
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

router = APIRouter(tags=["schedules"])


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


@router.get("/schedules/current")
def get_current_schedule(child_id: UUID = Query()) -> dict[str, object]:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Current schedule skeleton")


@router.post("/schedules")
def create_schedule(payload: ScheduleCreate) -> dict[str, object]:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Create schedule skeleton")


@router.patch("/schedule-items/{item_id}")
def update_schedule_item_status(item_id: UUID, payload: ScheduleItemStatusUpdate) -> dict[str, object]:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Schedule item status skeleton")
