from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

import httpx


@dataclass(frozen=True)
class ProviderConfig:
    name: str
    provider_type: str
    model: str | None = None
    endpoint: str | None = None
    api_key_env: str | None = None
    capabilities: tuple[str, ...] = ("chat",)


_client_pool: dict[str, httpx.AsyncClient] = {}


def get_shared_client(provider_type: str) -> httpx.AsyncClient:
    if provider_type not in _client_pool:
        _client_pool[provider_type] = httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=5.0))
    return _client_pool[provider_type]


class AIProviderAdapter(ABC):
    def __init__(self, config: ProviderConfig, api_key: str | None = None, client: httpx.AsyncClient | None = None) -> None:
        self.config = config
        self.api_key = api_key
        self.client = client if client is not None else get_shared_client(config.provider_type)

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

    def _default_headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers


class OpenAICompatibleAdapter(AIProviderAdapter):
    async def chat(self, messages: list[dict[str, str]], options: dict[str, Any] | None = None) -> dict[str, Any]:
        opts = options or {}
        endpoint = self.config.endpoint or "https://api.openai.com/v1/chat/completions"
        model = self.config.model or opts.get("model", "gpt-4o-mini")
        payload = {
            "model": model,
            "messages": messages,
            "temperature": opts.get("temperature", 0.7),
            "max_tokens": opts.get("max_tokens", 2048),
        }
        if opts.get("response_format"):
            payload["response_format"] = opts["response_format"]

        for attempt in range(3):
            try:
                resp = await self.client.post(endpoint, json=payload, headers=self._default_headers())
                resp.raise_for_status()
                data = resp.json()
                return {
                    "content": data["choices"][0]["message"]["content"],
                    "model": data.get("model"),
                    "usage": data.get("usage"),
                    "raw": data,
                }
            except httpx.HTTPStatusError as exc:
                if attempt == 2:
                    return {"error": f"HTTP {exc.response.status_code}: {exc.response.text}"}
            except Exception as exc:
                if attempt == 2:
                    return {"error": str(exc)}
        return {"error": "Max retries exceeded"}

    async def generate_image(self, prompt: str, options: dict[str, Any] | None = None) -> dict[str, Any]:
        # Only native OpenAI supports DALL-E image generation reliably
        if self.config.provider_type != "openai":
            return {"fallback": True, "provider": self.config.name}

        endpoint = "https://api.openai.com/v1/images/generations"
        payload = {
            "model": "dall-e-3",
            "prompt": prompt,
            "n": 1,
            "size": "1024x1024",
        }
        if options:
            payload.update(options)

        for attempt in range(3):
            try:
                resp = await self.client.post(endpoint, json=payload, headers=self._default_headers())
                resp.raise_for_status()
                data = resp.json()
                image_url = data["data"][0]["url"] if data.get("data") else None
                if image_url:
                    return {"image_url": image_url, "provider": self.config.name, "raw": data}
                return {"error": "No image URL in response", "raw": data}
            except httpx.HTTPStatusError as exc:
                if attempt == 2:
                    return {"error": f"HTTP {exc.response.status_code}: {exc.response.text}"}
            except Exception as exc:
                if attempt == 2:
                    return {"error": str(exc)}
        return {"error": "Max retries exceeded"}

    async def test_connection(self) -> dict[str, Any]:
        endpoint = self.config.endpoint or "https://api.openai.com/v1/models"
        try:
            resp = await self.client.get(endpoint, headers=self._default_headers())
            resp.raise_for_status()
            return {"status": "ok", "provider": self.config.name}
        except httpx.HTTPStatusError as exc:
            return {"status": "error", "detail": f"HTTP {exc.response.status_code}"}
        except Exception as exc:
            return {"status": "error", "detail": str(exc)}


class GeminiAdapter(AIProviderAdapter):
    async def chat(self, messages: list[dict[str, str]], options: dict[str, Any] | None = None) -> dict[str, Any]:
        opts = options or {}
        model = self.config.model or "gemini-1.5-flash"
        endpoint = self.config.endpoint or f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        # Convert OpenAI-style messages to Gemini contents
        contents = []
        for m in messages:
            role = m.get("role", "user")
            gemini_role = "user" if role != "assistant" else "model"
            contents.append({"role": gemini_role, "parts": [{"text": m.get("content", "")}]})
        payload = {"contents": contents}
        if opts.get("response_format"):
            payload["generationConfig"] = {"responseMimeType": "application/json"}

        headers = self._default_headers()
        if self.api_key:
            endpoint = f"{endpoint}?key={self.api_key}"
            headers.pop("Authorization", None)

        for attempt in range(3):
            try:
                resp = await self.client.post(endpoint, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                candidates = data.get("candidates", [])
                text = candidates[0]["content"]["parts"][0]["text"] if candidates else ""
                return {"content": text, "model": model, "usage": data.get("usageMetadata"), "raw": data}
            except httpx.HTTPStatusError as exc:
                if attempt == 2:
                    return {"error": f"HTTP {exc.response.status_code}: {exc.response.text}"}
            except Exception as exc:
                if attempt == 2:
                    return {"error": str(exc)}
        return {"error": "Max retries exceeded"}

    async def test_connection(self) -> dict[str, Any]:
        model = self.config.model or "gemini-1.5-flash"
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models?key={self.api_key or ''}"
        try:
            resp = await self.client.get(endpoint)
            resp.raise_for_status()
            return {"status": "ok", "provider": self.config.name}
        except httpx.HTTPStatusError as exc:
            return {"status": "error", "detail": f"HTTP {exc.response.status_code}"}
        except Exception as exc:
            return {"status": "error", "detail": str(exc)}


DEFAULT_PROVIDER_CONFIGS: tuple[ProviderConfig, ...] = (
    ProviderConfig(name="Gemini", provider_type="gemini", model="gemini-1.5-flash", api_key_env="GEMINI_API_KEY"),
    ProviderConfig(name="OpenRouter", provider_type="openrouter", endpoint="https://openrouter.ai/api/v1/chat/completions", api_key_env="OPENROUTER_API_KEY"),
    ProviderConfig(name="DeepSeek", provider_type="deepseek", endpoint="https://api.deepseek.com/v1/chat/completions", api_key_env="DEEPSEEK_API_KEY"),
    ProviderConfig(name="Groq", provider_type="groq", endpoint="https://api.groq.com/openai/v1/chat/completions", api_key_env="GROQ_API_KEY"),
    ProviderConfig(name="OpenAI", provider_type="openai", endpoint="https://api.openai.com/v1/chat/completions", api_key_env="OPENAI_API_KEY"),
    ProviderConfig(name="Together AI", provider_type="together", endpoint="https://api.together.xyz/v1/chat/completions", api_key_env="TOGETHER_API_KEY"),
    ProviderConfig(name="Kimi/Moonshot", provider_type="moonshot", endpoint="https://api.moonshot.ai/v1/chat/completions", api_key_env="MOONSHOT_API_KEY"),
)


def build_adapter(config: ProviderConfig, api_key: str | None = None) -> AIProviderAdapter:
    client = get_shared_client(config.provider_type)
    if config.provider_type == "gemini":
        return GeminiAdapter(config, api_key, client=client)
    return OpenAICompatibleAdapter(config, api_key, client=client)
