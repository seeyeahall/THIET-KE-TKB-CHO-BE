from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.core.dependencies import get_current_family
from app.core.security import CurrentUser, get_current_user
from fastapi import Request
from app.modules.ai.context import AIContextBuilder
from app.modules.ai.providers import DEFAULT_PROVIDER_CONFIGS, build_adapter

router = APIRouter(prefix="/ai", tags=["ai"])


class ProviderTestRequest(BaseModel):
    provider_type: str
    model: str | None = None


class ChatRequest(BaseModel):
    child_id: UUID
    message: str = Field(min_length=1, max_length=4000)


class GenerateScheduleRequest(BaseModel):
    child_id: UUID
    week_start_date: str
    theme: str | None = None


class GenerateImageRequest(BaseModel):
    activity_id: str
    prompt: str | None = None


@router.get("/providers")
def list_providers(
    user: CurrentUser = Depends(get_current_user),
) -> list[dict[str, object]]:
    return [
        {
            "name": provider.name,
            "provider_type": provider.provider_type,
            "model": provider.model,
            "capabilities": list(provider.capabilities),
            "api_key_env": provider.api_key_env,
        }
        for provider in DEFAULT_PROVIDER_CONFIGS
    ]


@router.post("/providers/{provider_id}/test")
async def test_provider(
    provider_id: str,
    user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    settings = get_settings()
    config = next((p for p in DEFAULT_PROVIDER_CONFIGS if p.provider_type == provider_id), None)
    if not config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found")

    api_key = getattr(settings, config.api_key_env.lower(), None) if config.api_key_env else None
    if not api_key:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"API key not configured for {config.name}")

    adapter = build_adapter(config, api_key)
    result = await adapter.test_connection()
    if result.get("status") != "ok":
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=result.get("detail", "Provider test failed"))
    return {"status": "ok", "provider": config.name}


@router.post("/chat")
async def chat(
    request: Request,
    payload: ChatRequest,
    family: dict = Depends(get_current_family),
    user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    # Verify child belongs to family
    from app.repositories.children import ChildrenRepository
    child = ChildrenRepository().get_by_id(payload.child_id)
    if not child or str(child.get("family_id")) != str(family["id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    builder = AIContextBuilder(payload.child_id)
    system_prompt = builder.build_system_prompt()
    recent_chat = builder.get_recent_chat(limit=6)

    messages = [{"role": "system", "content": system_prompt}]
    for m in recent_chat:
        messages.append({"role": m["role"], "content": m["message"]})
    messages.append({"role": "user", "content": payload.message})

    # Use default provider (first configured one with an API key)
    settings = get_settings()
    config = None
    api_key = None
    client_key = request.headers.get("x-gemini-api-key")
    
    for p in DEFAULT_PROVIDER_CONFIGS:
        key = client_key if client_key else getattr(settings, p.api_key_env.lower(), None) if p.api_key_env else None
        if key:
            config = p
            api_key = key
            break

    if not config:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="No AI provider configured")

    adapter = build_adapter(config, api_key)
    result = await adapter.chat(messages)

    if "error" in result:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=result["error"])

    # Save chat history
    from app.core.database import get_supabase_client
    client = get_supabase_client()
    client.table("chat_history").insert({
        "child_id": str(payload.child_id),
        "role": "user",
        "message": payload.message,
    }).execute()
    client.table("chat_history").insert({
        "child_id": str(payload.child_id),
        "role": "assistant",
        "message": result["content"],
        "metadata": {"model": result.get("model"), "provider": config.name},
    }).execute()

    return {"reply": result["content"], "provider": config.name, "model": result.get("model")}


@router.post("/generate-schedule")
async def generate_schedule(
    request: Request,
    payload: GenerateScheduleRequest,
    family: dict = Depends(get_current_family),
    user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    from app.repositories.children import ChildrenRepository
    child = ChildrenRepository().get_by_id(payload.child_id)
    if not child or str(child.get("family_id")) != str(family["id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    builder = AIContextBuilder(payload.child_id)
    system_prompt = builder.build_system_prompt()
    context = builder.build()

    schedule_schema = {
        "type": "json_schema",
        "json_schema": {
            "name": "weekly_schedule",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "theme": {"type": "string"},
                    "items": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "day_of_week": {"type": "integer", "minimum": 0, "maximum": 6},
                                "start_time": {"type": "string", "pattern": "^([01]?[0-9]|2[0-3]):[0-5][0-9]$"},
                                "duration_minutes": {"type": "integer", "minimum": 5},
                                "activity_title": {"type": "string"},
                                "activity_theme": {"type": "string"},
                                "notes": {"type": "string"},
                            },
                            "required": ["day_of_week", "start_time", "duration_minutes", "activity_title", "activity_theme"],
                            "additionalProperties": False,
                        },
                    },
                },
                "required": ["title", "theme", "items"],
                "additionalProperties": False,
            },
        },
    }

    prompt = f"""Tạo lịch tuần cho bé từ {payload.week_start_date}.
Chủ đề tuần: {payload.theme or 'tự chọn phù hợp với sở thích của bé'}.

Context bé:
{context['child']}

Sở thích: {context['child'].get('interests', [])}
Hoạt động gần đây: {[a.get('activities', {}).get('title') for a in context['recent_activities'][:5]]}

Yêu cầu:
- Mỗi ngày 3-5 hoạt động
- Cân bằng giữa học tập, vận động, nghệ thuật, thiên nhiên
- Thờ gian hợp lý cho trẻ {context['child'].get('age', 7)} tuổi
- Trả về JSON theo schema."""

    settings = get_settings()
    config = None
    api_key = None
    client_key = request.headers.get("x-gemini-api-key")
    
    for p in DEFAULT_PROVIDER_CONFIGS:
        key = client_key if client_key else getattr(settings, p.api_key_env.lower(), None) if p.api_key_env else None
        if key:
            config = p
            api_key = key
            break

    if not config:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="No AI provider configured")

    adapter = build_adapter(config, api_key)
    result = await adapter.chat(
        messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": prompt}],
        options={"response_format": schedule_schema, "temperature": 0.7},
    )

    if "error" in result:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=result["error"])

    import json
    try:
        schedule_data = json.loads(result["content"])
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"AI returned invalid JSON: {exc}") from exc

    return {
        "schedule": schedule_data,
        "provider": config.name,
        "model": result.get("model"),
    }


@router.post("/generate-image")
async def generate_image(
    request: Request,
    payload: GenerateImageRequest,
    user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    from app.repositories.activities import ActivitiesRepository

    repo = ActivitiesRepository()
    activity = repo.get_by_id(payload.activity_id)
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")

    # Build kid-friendly prompt
    if payload.prompt:
        image_prompt = payload.prompt
    else:
        title = activity.get("title", "")
        description = activity.get("description", "")
        image_prompt = (
            f"A cute watercolor illustration of a 7-year-old Vietnamese child doing '{title}'. "
            f"{description} Bright colors, playful, children's book style, soft edges, friendly atmosphere."
        )

    # Pick first configured provider
    settings = get_settings()
    config = None
    api_key = None
    client_key = request.headers.get("x-gemini-api-key")
    
    for p in DEFAULT_PROVIDER_CONFIGS:
        key = client_key if client_key else getattr(settings, p.api_key_env.lower(), None) if p.api_key_env else None
        if key:
            config = p
            api_key = key
            break

    if not config:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="No AI provider configured")

    adapter = build_adapter(config, api_key)
    result = await adapter.generate_image(image_prompt)

    if "error" in result:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=result["error"])

    # Use Pollinations AI as free fallback if provider doesn't support image generation
    image_url = result.get("image_url")
    if not image_url or result.get("fallback"):
        import urllib.parse
        safe_prompt = urllib.parse.quote(image_prompt)
        image_url = f"https://image.pollinations.ai/prompt/{safe_prompt}?width=400&height=300&nologo=true"

    # Save to database
    repo.update(payload.activity_id, {"image_url": image_url})

    return {"image_url": image_url, "activity_id": payload.activity_id}
