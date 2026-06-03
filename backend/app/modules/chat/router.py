import httpx
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from app.core.config import get_settings

router = APIRouter(prefix="/ai", tags=["chat"])


class ChatRequest(BaseModel):
    child_id: UUID
    message: str = Field(min_length=1, max_length=4000)


@router.post("/chat")
async def chat(payload: ChatRequest) -> dict[str, object]:
    settings = get_settings()
    api_key = settings.gemini_api_key
    if not api_key:
        # Fallback dummy response if no API key is provided
        return {"reply": "Xin chào! (Bạn cần cấu hình GEMINI_API_KEY để kích hoạt tính năng chat thật nha)"}
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    system_instruction = "Bạn là một người bạn dễ thương, đồng hành cùng trẻ em (khoảng 4-10 tuổi). Trả lời thật ngắn gọn (dưới 2 câu), thân thiện, luôn khích lệ bé và sử dụng 1-2 emoji vui nhộn."
    
    req_body = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": payload.message}]
            }
        ],
        "systemInstruction": {
            "role": "system",
            "parts": [{"text": system_instruction}]
        },
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 100
        }
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=req_body, timeout=10.0)
            resp.raise_for_status()
            data = resp.json()
            reply_text = data["candidates"][0]["content"]["parts"][0]["text"]
            return {"reply": reply_text}
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return {"reply": "Oops! Não bộ điện tử của tớ đang bận xíu. Bé thử lại sau nha! 🤖"}

