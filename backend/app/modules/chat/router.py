from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/ai", tags=["chat"])


class ChatRequest(BaseModel):
    child_id: UUID
    message: str = Field(min_length=1, max_length=4000)


@router.post("/chat")
def chat(payload: ChatRequest) -> dict[str, object]:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="AI chat skeleton")

