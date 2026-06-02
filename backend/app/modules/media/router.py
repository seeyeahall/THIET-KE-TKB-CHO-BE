from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/media", tags=["media"])


class SignUploadRequest(BaseModel):
    asset_type: str = Field(pattern="^(avatar|activity|theme|chat)$")
    child_id: UUID | None = None
    filename: str = Field(min_length=1, max_length=180)
    content_type: str


@router.post("/sign-upload")
def sign_upload(payload: SignUploadRequest) -> dict[str, object]:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Sign upload skeleton")

