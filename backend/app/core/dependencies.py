from fastapi import Depends, HTTPException, status
from app.core.security import CurrentUser, get_current_user
from app.core.database import get_supabase_client


async def get_current_family(
    user: CurrentUser = Depends(get_current_user),
) -> dict:
    """Resolve the family record for the authenticated parent user."""
    client = get_supabase_client()
    result = (
        client.table("families")
        .select("*")
        .eq("parent_user_id", user.user_id)
        .limit(1)
        .execute()
    )
    data = result.data or []
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found for this user",
        )
    return data[0]
