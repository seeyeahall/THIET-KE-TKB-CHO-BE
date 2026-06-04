import random
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.core.dependencies import get_current_family
from app.core.security import CurrentUser, get_current_user
import httpx

router = APIRouter(prefix="/ai", tags=["chat"])


class ChatRequest(BaseModel):
    child_id: UUID
    message: str = Field(min_length=1, max_length=4000)


# Fallback responses for when no API key is configured
FALLBACK_RESPONSES = [
    "Chào bé! Hôm nay con muốn khám phá điều gì? 🚀",
    "Wow, câu hỏi hay quá! Con thử tìm hiểu thêm về chủ đề này nhé! 🔍",
    "Bé thông minh quá! Còn điều gì con tò mò không? 🤔",
    "Tuyệt vờiii! Con hãy kể cho bố mẹ nghe về điều này nhé! 🎉",
    "Mình cùng nhau tìm hiểu nhé! Con thích học về khoa học hay nghệ thuật hơn? 🎨🔬",
    "Ồ, thú vị quá! Con có muốn thử một hoạt động mới không? 🌟",
    "Bé giỏi lắm! Hãy tiếp tục khám phá nhé! 🌈",
    "Con thật sáng tạo! Mình cùng vẽ hoặc đọc sách về chủ đề này nhé! 📚",
]


def get_fallback_reply(message: str) -> str:
    msg = message.lower()
    if any(k in msg for k in ["chào", "hello", "hi"]):
        return "Chào bé! Hôm nay con muốn làm gì? 🌞"
    if any(k in msg for k in ["học", "bài tập", "toán", "tiếng việt"]):
        return "Học tập thật vui! Con cố gắng nhé, mình luôn ở đây hỗ trợ! 📚✨"
    if any(k in msg for k in ["vẽ", "tranh", "màu", "nghệ thuật"]):
        return "Con thích vẽ à? Thử vẽ một bức tranh về gia đình mình đi! 🎨👨‍👩‍👧"
    if any(k in msg for k in ["chơi", "game", "trò chơi"]):
        return "Chơi cũng là cách học đấy! Con thích trò chơi gì? 🎮🧩"
    if any(k in msg for k in ["buồn", "mệt", "không vui"]):
        return "Ơ kìa, đừng buồn nha! Nghỉ ngơi một chút, rồi mọi chuyện sẽ tốt hơn thôi! 🤗💕"
    if any(k in msg for k in ["cảm ơn", "thank"]):
        return "Không có gì đâu bé! Mình luôn sẵn sàng giúp con! 🥰"
    return random.choice(FALLBACK_RESPONSES)


@router.post("/chat")
async def chat(
    payload: ChatRequest,
    family: dict = Depends(get_current_family),
    user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    settings = get_settings()
    api_key = settings.gemini_api_key

    # Verify child belongs to family
    from app.repositories.children import ChildrenRepository
    child = ChildrenRepository().get_by_id(payload.child_id)
    if not child or str(child.get("family_id")) != str(family["id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    if not api_key:
        return {"reply": get_fallback_reply(payload.message), "provider": "fallback", "model": "rule-based"}

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"

    child_name = child.get("name", "bé")
    child_age = child.get("age", 7)
    interests = child.get("interests", [])
    interests_str = ", ".join(interests) if interests else "nhiều thứ thú vị"

    system_instruction = (
        f"Bạn là một ngườ bạn dễ thương tên là AI Companion, đồng hành cùng {child_name} "
        f"({child_age} tuổi). {child_name} thích {interests_str}. "
        f"Trả lờ ngắn gọn (1-2 câu), thân thiện, luôn khích lệ bé, dùng 1-2 emoji vui nhộn. "
        f"Nói chuyện như bạn của bé, không như giáo viên hay ngườ lớn."
    )

    req_body = {
        "contents": [{"role": "user", "parts": [{"text": payload.message}]}],
        "systemInstruction": {"role": "system", "parts": [{"text": system_instruction}]},
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 150},
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=req_body, timeout=15.0)
            resp.raise_for_status()
            data = resp.json()
            reply_text = data["candidates"][0]["content"]["parts"][0]["text"]
            return {"reply": reply_text, "provider": "Gemini", "model": "gemini-1.5-flash"}
    except Exception as e:
        return {"reply": get_fallback_reply(payload.message), "provider": "fallback", "model": "error-recovery"}
