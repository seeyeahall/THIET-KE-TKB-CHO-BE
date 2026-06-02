from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.modules.activities.router import router as activities_router
from app.modules.ai.router import router as ai_router
from app.modules.chat.router import router as chat_router
from app.modules.children.router import router as children_router
from app.modules.media.router import router as media_router
from app.modules.schedules.router import router as schedules_router

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name, "env": settings.app_env}


app.include_router(children_router, prefix=settings.api_prefix)
app.include_router(activities_router, prefix=settings.api_prefix)
app.include_router(schedules_router, prefix=settings.api_prefix)
app.include_router(ai_router, prefix=settings.api_prefix)
app.include_router(chat_router, prefix=settings.api_prefix)
app.include_router(media_router, prefix=settings.api_prefix)

