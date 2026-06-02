from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    user_id: str
    role: str = "authenticated"


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> CurrentUser:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    # TODO: Validate Supabase JWT signature and claims when SUPABASE_JWT_SECRET is configured.
    token = credentials.credentials.strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid bearer token")
    return CurrentUser(user_id="supabase-user-placeholder")

