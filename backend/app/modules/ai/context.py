from typing import Any
from uuid import UUID

from app.core.database import get_supabase_client, DatabaseNotConfiguredError


class AIContextBuilder:
    def __init__(self, child_id: UUID | str) -> None:
        self.child_id = str(child_id)
        try:
            self.client = get_supabase_client()
        except DatabaseNotConfiguredError:
            self.client = None

    def build(self) -> dict[str, Any]:
        return {
            "child": self._get_child(),
            "recent_schedule": self._get_recent_schedule(),
            "recent_activities": self._get_recent_activities(),
            "recent_chat": self._get_recent_chat(),
            "rewards": self._get_rewards(),
        }

    def _get_child(self) -> dict[str, Any] | None:
        if self.client is None:
            from app.repositories.children import ChildrenRepository
            return ChildrenRepository().get_by_id(self.child_id)
        result = self.client.table("children").select("*").eq("id", self.child_id).limit(1).execute()
        data = result.data or []
        return data[0] if data else None

    def _get_recent_schedule(self, limit: int = 7) -> list[dict[str, Any]]:
        if self.client is None:
            return []
        result = (
            self.client.table("schedule_items")
            .select("*, schedules!inner(week_start_date, theme), activities(title, theme)")
            .eq("child_id", self.child_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []

    def _get_recent_activities(self, limit: int = 10) -> list[dict[str, Any]]:
        if self.client is None:
            return []
        result = (
            self.client.table("activity_history")
            .select("*, activities(title, theme)")
            .eq("child_id", self.child_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []

    def _get_recent_chat(self, limit: int = 10) -> list[dict[str, Any]]:
        if self.client is None:
            return []
        result = (
            self.client.table("chat_history")
            .select("*")
            .eq("child_id", self.child_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return list(reversed(result.data or []))

    def _get_rewards(self) -> dict[str, Any] | None:
        if self.client is None:
            return None
        result = self.client.table("rewards").select("*").eq("child_id", self.child_id).limit(1).execute()
        data = result.data or []
        return data[0] if data else None

    def build_system_prompt(self) -> str:
        child = self._get_child()
        if not child:
            return "Bạn là bạn đồng hành thông minh, thân thiện của trẻ em."

        interests = child.get("interests", [])
        dislikes = child.get("dislikes", [])
        age = child.get("age", 7)

        prompt = f"""Bạn là bạn đồng hành AI của bé {child['name']}, {age} tuổi.

Thông tin về bé:
- Màu yêu thích: {child.get('favorite_color') or 'chưa rõ'}
- Con vật yêu thích: {child.get('favorite_animal') or 'chưa rõ'}
- Sở thích: {', '.join(interests) if interests else 'chưa rõ'}
- Không thích: {', '.join(dislikes) if dislikes else 'chưa rõ'}

Nguyên tắc:
1. Trả lờ bằng tiếng Việt, câu ngắn, dễ hiểu với trẻ {age} tuổi.
2. Luôn gọi tên bé khi phù hợp.
3. Ưu tiên hoạt động an toàn, có ích, gần gũi với đờ sống.
4. Không tạo nội dung gây hại.
5. Khi được yêu cầu tạo lịch hoặc hoạt động, trả về JSON theo schema đã định nghĩa.
6. Nếu hoạt động cần ngườ lớn giám sát, nhắc rõ.
"""
        return prompt
