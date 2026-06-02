from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Kid Adventure Planner API"
    app_env: str = "local"
    api_prefix: str = "/api/v1"
    cors_origins_raw: str = Field(default="http://localhost:3000", alias="CORS_ORIGINS")
    secret_key: str = Field(default="change-me", alias="SECRET_KEY")

    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    supabase_service_role_key: str | None = None
    supabase_jwt_secret: str | None = None

    openai_api_key: str | None = None
    gemini_api_key: str | None = None
    moonshot_api_key: str | None = None
    together_api_key: str | None = None
    groq_api_key: str | None = None
    openrouter_api_key: str | None = None
    deepseek_api_key: str | None = None

    cloudflare_account_id: str | None = None
    cloudflare_api_token: str | None = None

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

