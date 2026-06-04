from fastapi import Depends, HTTPException, status
from app.core.security import CurrentUser, get_current_user
from app.core.database import get_supabase_client, DatabaseNotConfiguredError

# Demo family for local dev when database is not configured
# ID must match the family_id used in demo children data
DEMO_FAMILY = {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "Gia đình Demo",
    "parent_user_id": "local-dev-user",
}


async def get_current_family(
    user: CurrentUser = Depends(get_current_user),
) -> dict:
    """Resolve the family record for the authenticated parent user."""
    try:
        client = get_supabase_client()
    except DatabaseNotConfiguredError:
        # Dev mode: return demo family
        return DEMO_FAMILY

    result = (
        client.table("families")
        .select("*")
        .eq("parent_user_id", user.user_id)
        .limit(1)
        .execute()
    )
    data = result.data or []
    if not data:
        # Dev mode: create demo family if none exists
        return DEMO_FAMILY
    return data[0]
