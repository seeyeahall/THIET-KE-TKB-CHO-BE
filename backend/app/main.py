from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.exceptions import setup_exception_handlers
from app.core.middleware import RateLimitMiddleware, RequestLoggingMiddleware
from app.modules.activities.router import router as activities_router
from app.modules.ai.router import router as ai_router
# NOTE: chat/router.py đã bị xóa khỏi routing — duplicate của ai/router.py POST /ai/chat
# ai_router có đầy đủ AI context builder, multi-provider, chat history save
from app.modules.children.router import router as children_router
from app.modules.media.router import router as media_router
from app.modules.rewards.router import router as rewards_router
from app.modules.schedules.router import router as schedules_router
from app.modules.admin.router import router as admin_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    import logging
    logger = logging.getLogger("uvicorn.info")
    logger.info(f"Starting {settings.app_name}")
    logger.info(f"Environment: {settings.app_env}")
    logger.info(f"CORS origins: {settings.cors_origins}")
    yield
    logger.info(f"Shutting down {settings.app_name}")


app = FastAPI(title=settings.app_name, lifespan=lifespan)

# Exception handlers
setup_exception_handlers(app)

# Middleware (order matters: outer first)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RateLimitMiddleware, max_requests=60, window_seconds=60)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, object]:
    from app.core.database import get_supabase_client, DatabaseNotConfiguredError
    db_status = "ok"
    try:
        client = get_supabase_client()
        # Lightweight query to verify connection
        client.table("children").select("id", count="exact").limit(1).execute()
    except DatabaseNotConfiguredError:
        db_status = "not_configured"
    except Exception:
        db_status = "error"

    return {
        "status": "ok",
        "service": settings.app_name,
        "env": settings.app_env,
        "database": db_status,
    }


app.include_router(children_router, prefix=settings.api_prefix)
app.include_router(activities_router, prefix=settings.api_prefix)
app.include_router(schedules_router, prefix=settings.api_prefix)
app.include_router(ai_router, prefix=settings.api_prefix)
# chat_router removed — ai_router handles POST /ai/chat with full context
app.include_router(media_router, prefix=settings.api_prefix)
app.include_router(rewards_router, prefix=settings.api_prefix)
app.include_router(admin_router, prefix=settings.api_prefix)
