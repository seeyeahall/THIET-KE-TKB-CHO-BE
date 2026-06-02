from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/children", tags=["children"])


class ChildCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    age: int = Field(ge=6, le=10)
    favorite_color: str | None = None
    favorite_animal: str | None = None
    interests: list[str] = Field(default_factory=list)
    dislikes: list[str] = Field(default_factory=list)
    parent_notes: str | None = None


@router.get("")
def list_children() -> list[dict[str, str]]:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="List children skeleton")


@router.post("")
def create_child(payload: ChildCreate) -> dict[str, object]:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Create child skeleton")


@router.get("/{child_id}")
def get_child(child_id: UUID) -> dict[str, str]:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Get child skeleton")
