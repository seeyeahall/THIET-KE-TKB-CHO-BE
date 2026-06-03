from typing import Any
from uuid import UUID

from app.repositories.base import BaseRepository


class ChildrenRepository(BaseRepository):
    table_name = "children"
    soft_delete = True

    def get_by_family(self, family_id: UUID | str) -> list[dict[str, Any]]:
        return self.list_all({"family_id": str(family_id)})
