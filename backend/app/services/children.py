from typing import Any
from uuid import UUID, uuid4

from app.repositories.children import ChildrenRepository
from app.repositories.base import BaseRepository


class ChildrenService:
    def __init__(self) -> None:
        self.repo = ChildrenRepository()
        self.rewards_repo = BaseRepository()
        self.rewards_repo.table_name = "rewards"
        self.rewards_repo.soft_delete = False

    def list_children(self, family_id: UUID | str) -> list[dict[str, Any]]:
        return self.repo.get_by_family(family_id)

    def get_child(self, child_id: UUID | str) -> dict[str, Any] | None:
        return self.repo.get_by_id(child_id)

    def create_child(self, family_id: UUID | str, data: dict[str, Any]) -> dict[str, Any]:
        payload = {
            "id": str(uuid4()),
            "family_id": str(family_id),
            **data,
        }
        child = self.repo.create(payload)
        # Auto-create rewards record for new child
        self.rewards_repo.create({
            "child_id": child["id"],
            "coins": 0,
            "xp": 0,
        })
        return child

    def update_child(self, child_id: UUID | str, data: dict[str, Any]) -> dict[str, Any] | None:
        return self.repo.update(child_id, data)

    def delete_child(self, child_id: UUID | str) -> dict[str, Any] | None:
        return self.repo.delete(child_id)
