from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.dependencies import get_current_family
from app.core.security import CurrentUser, get_current_user
from app.services.children import ChildrenService

router = APIRouter(prefix="/children", tags=["children"])


def _children_service() -> ChildrenService:
    return ChildrenService()


class ChildCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    age: int = Field(ge=1, le=17)
    favorite_color: str | None = None
    favorite_animal: str | None = None
    interests: list[str] = Field(default_factory=list)
    dislikes: list[str] = Field(default_factory=list)
    parent_notes: str | None = None


@router.get("")
def list_children(
    family: dict = Depends(get_current_family),
    user: CurrentUser = Depends(get_current_user),
) -> list[dict[str, object]]:
    return _children_service().list_children(family["id"])


@router.post("")
def create_child(
    payload: ChildCreate,
    family: dict = Depends(get_current_family),
    user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    return _children_service().create_child(family["id"], payload.model_dump(exclude_unset=True))


@router.get("/{child_id}")
def get_child(
    child_id: UUID,
    family: dict = Depends(get_current_family),
    user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    child = _children_service().get_child(child_id)
    if not child or str(child.get("family_id")) != str(family["id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    return child


@router.get("/{child_id}/stats")
def get_child_stats(
    child_id: UUID,
    family: dict = Depends(get_current_family),
    user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    child = _children_service().get_child(child_id)
    if not child or str(child.get("family_id")) != str(family["id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    from app.core.database import get_supabase_client, DatabaseNotConfiguredError
    try:
        client = get_supabase_client()
    except DatabaseNotConfiguredError:
        # Dev mode: return simulated stats
        return {
            "completed_activities": 3,
            "total_activities": 5,
            "xp": 45,
            "coins": 15,
            "dev_mode": True,
        }

    # Get completed activities count
    items_resp = client.table("schedule_items").select("id", count="exact").eq("child_id", str(child_id)).eq("status", "completed").execute()
    completed_count = items_resp.count if items_resp.count is not None else 0

    # Get total activities count
    total_resp = client.table("schedule_items").select("id", count="exact").eq("child_id", str(child_id)).execute()
    total_count = total_resp.count if total_resp.count is not None else 0

    # Get XP and Coins
    rewards_resp = client.table("rewards").select("xp", "coins").eq("child_id", str(child_id)).execute()
    xp = 0
    coins = 0
    if rewards_resp.data:
        xp = rewards_resp.data[0].get("xp", 0)
        coins = rewards_resp.data[0].get("coins", 0)

    return {
        "completed_activities": completed_count,
        "total_activities": total_count,
        "xp": xp,
        "coins": coins
    }

