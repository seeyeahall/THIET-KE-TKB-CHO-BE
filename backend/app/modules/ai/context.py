from datetime import date, datetime
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

    def _get_today_items(self) -> list[dict[str, Any]]:
        """Lấy hoạt động hôm nay để cho AI biết lịch ngày này."""
        if self.client is None:
            return []
        today = date.today()
        # day_of_week: 0=T2, 1=T3..., 6=CN (weekday convention)
        dow = today.weekday()
        try:
            result = (
                self.client.table("schedule_items")
                .select("*, activities(title, theme)")
                .eq("child_id", self.child_id)
                .eq("day_of_week", dow)
                .execute()
            )
            return result.data or []
        except Exception:
            return []

    def build_system_prompt(self) -> str:
        """
        Xây dựng system prompt đầy đủ cho AI Naruto — bạn đồng hành của bé.
        Bao gồm: thông tin bé, lịch hôm nay, phần thưởng, nguyên tắc.
        """
        child = self._get_child()
        today_items = self._get_today_items()
        rewards = self._get_rewards()

        # Tên ngày hôm nay bằng tiếng Việt
        vn_days = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"]
        now = datetime.now()
        today_label = vn_days[now.weekday()]
        today_date_str = now.strftime("%d/%m/%Y")

        if not child:
            return f"""Bạn là Naruto — siêu ninja bạn đồng hành của các bé!
Hôm nay: {today_label}, {today_date_str}.
Trả lời bằng tiếng Việt, ngắn gọn, vui vẻ như đang nói chuyện với trẻ em 6-10 tuổi.
Không tạo nội dung gây hại. Ưu tiên gợi ý hoạt động vui và có ích."""

        interests = child.get("interests", [])
        dislikes = child.get("dislikes", [])
        age = child.get("age", 7)
        name = child.get("name", "bé")

        # Tóm tắt lịch hôm nay
        today_summary = "Chưa có lịch hôm nay."
        if today_items:
            done = sum(1 for i in today_items if i.get("status") in ("completed", "complete"))
            total = len(today_items)
            titles = [i.get("activities", {}).get("title", "Hoạt động") if i.get("activities") else "Hoạt động" for i in today_items[:3]]
            today_summary = f"{done}/{total} hoàn thành. Hoạt động: {', '.join(titles)}{'...' if total > 3 else ''}."

        # Tóm tắt phần thưởng
        reward_summary = ""
        if rewards:
            reward_summary = f"XP: {rewards.get('xp', 0)}, Xu: {rewards.get('coins', 0)}."

        prompt = f"""Bạn là Naruto — ninja mạnh nhất, bạn đồng hành vui vẻ và thông minh của bé {name}!

📅 Hôm nay: {today_label}, {today_date_str}
👦 Bé: {name}, {age} tuổi
🌟 Sở thích: {', '.join(interests) if interests else 'chưa rõ'}
😤 Không thích: {', '.join(dislikes) if dislikes else 'không có'}
🎯 Màu yêu thích: {child.get('favorite_color') or 'chưa rõ'}
🐾 Con vật yêu thích: {child.get('favorite_animal') or 'chưa rõ'}
📋 Lịch hôm nay: {today_summary}
{f'🏆 Phần thưởng: {reward_summary}' if reward_summary else ''}
{f'📝 Ghi chú phụ huynh: {child.get("parent_notes")}' if child.get('parent_notes') else ''}

Nguyên tắc của Naruto:
1. Trả lời bằng tiếng Việt, câu ngắn, dễ hiểu với trẻ {age} tuổi.
2. Luôn gọi tên bé ({name}) khi phù hợp, kiểu bạn bè thân thiết.
3. Năng lượng cao, vui vẻ — như Naruto khi đi phiêu lưu!
4. Ưu tiên hoạt động an toàn, có ích, gần gũi với đời sống.
5. Không tạo nội dung gây hại cho trẻ em.
6. Khi được yêu cầu tạo lịch hoặc hoạt động, trả về JSON theo schema: [{{"title", "theme", "start_time", "duration_minutes"}}].
7. Nếu hoạt động cần người lớn giám sát, nhắc rõ "cần ba/mẹ cùng làm nhé!".
8. Khi bé buồn hoặc mệt, hỏi thăm nhẹ nhàng trước khi gợi ý hoạt động.
"""
        return prompt
