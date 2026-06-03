from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.database import get_supabase_client
from app.core.dependencies import get_current_family
from app.core.security import CurrentUser, get_current_user

router = APIRouter(prefix="/rewards", tags=["rewards"])


class CompleteActivityRequest(BaseModel):
    schedule_item_id: UUID
    child_id: UUID


@router.post("/complete-activity")
def complete_activity(
    payload: CompleteActivityRequest,
    family: dict = Depends(get_current_family),
    user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    client = get_supabase_client()

    # Verify child belongs to family
    from app.repositories.children import ChildrenRepository

    child = ChildrenRepository().get_by_id(payload.child_id)
    if not child or str(child.get("family_id")) != str(family["id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    # Update schedule item
    item_resp = (
        client.table("schedule_items")
        .update({"status": "completed", "completed_at": datetime.utcnow().isoformat()})
        .eq("id", str(payload.schedule_item_id))
        .eq("child_id", str(payload.child_id))
        .execute()
    )

    if not item_resp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule item not found")

    # Rewards logic
    xp_earned = 15
    coins_earned = 5

    # Update rewards
    rewards_resp = client.table("rewards").select("*").eq("child_id", str(payload.child_id)).execute()
    if rewards_resp.data:
        current_xp = rewards_resp.data[0].get("xp", 0)
        current_coins = rewards_resp.data[0].get("coins", 0)
        client.table("rewards").update({
            "xp": current_xp + xp_earned,
            "coins": current_coins + coins_earned,
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("child_id", str(payload.child_id)).execute()
    else:
        client.table("rewards").insert({
            "child_id": str(payload.child_id),
            "xp": xp_earned,
            "coins": coins_earned,
        }).execute()

    return {"status": "success", "xp_earned": xp_earned, "coins_earned": coins_earned}
