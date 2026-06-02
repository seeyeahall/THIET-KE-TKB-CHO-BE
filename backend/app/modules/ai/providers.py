from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ProviderConfig:
    name: str
    provider_type: str
    model: str | None = None
    endpoint: str | None = None
    api_key_env: str | None = None
    capabilities: tuple[str, ...] = ("chat",)


class AIProviderAdapter(ABC):
    def __init__(self, config: ProviderConfig) -> None:
        self.config = config

    @abstractmethod
    async def chat(self, messages: list[dict[str, str]], options: dict[str, Any] | None = None) -> dict[str, Any]:
        raise NotImplementedError

    async def generate_image(self, prompt: str, options: dict[str, Any] | None = None) -> dict[str, Any]:
        raise NotImplementedError("Image generation is not implemented for this provider")

    async def text_to_speech(self, text: str, options: dict[str, Any] | None = None) -> bytes:
        raise NotImplementedError("Text to speech is not implemented for this provider")

    async def speech_to_text(self, audio: bytes, options: dict[str, Any] | None = None) -> dict[str, Any]:
        raise NotImplementedError("Speech to text is not implemented for this provider")

    @abstractmethod
    async def test_connection(self) -> dict[str, Any]:
        raise NotImplementedError


class OpenAICompatibleAdapter(AIProviderAdapter):
    async def chat(self, messages: list[dict[str, str]], options: dict[str, Any] | None = None) -> dict[str, Any]:
        raise NotImplementedError("Provider HTTP integration will be implemented after config storage")

    async def test_connection(self) -> dict[str, Any]:
        raise NotImplementedError("Provider test endpoint will be implemented after config storage")


DEFAULT_PROVIDER_CONFIGS: tuple[ProviderConfig, ...] = (
    ProviderConfig(name="Gemini", provider_type="gemini", api_key_env="GEMINI_API_KEY"),
    ProviderConfig(name="OpenRouter", provider_type="openrouter", api_key_env="OPENROUTER_API_KEY"),
    ProviderConfig(name="DeepSeek", provider_type="deepseek", api_key_env="DEEPSEEK_API_KEY"),
    ProviderConfig(name="Groq", provider_type="groq", api_key_env="GROQ_API_KEY"),
    ProviderConfig(name="OpenAI", provider_type="openai", api_key_env="OPENAI_API_KEY"),
    ProviderConfig(name="Together AI", provider_type="together", api_key_env="TOGETHER_API_KEY"),
    ProviderConfig(name="Kimi/Moonshot", provider_type="moonshot", api_key_env="MOONSHOT_API_KEY"),
)

