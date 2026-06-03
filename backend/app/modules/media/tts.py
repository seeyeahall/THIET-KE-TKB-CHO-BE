import io
from uuid import uuid4
import httpx
from app.core.config import get_settings

async def generate_tts(text: str, voice: str = "alloy") -> bytes:
    settings = get_settings()
    api_key = settings.openai_api_key
    if not api_key:
        raise RuntimeError("OpenAI API key not configured for TTS")
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(
            "https://api.openai.com/v1/audio/speech",
            headers={"Authorization": f"Bearer {api_key}"},
            json={"model": "tts-1", "input": text, "voice": voice, "response_format": "mp3"},
        )
        res.raise_for_status()
        return res.content

async def transcribe_audio(audio_bytes: bytes, filename: str = "audio.wav") -> str:
    settings = get_settings()
    api_key = settings.openai_api_key
    if not api_key:
        # Fallback to Groq whisper if no OpenAI key
        api_key = settings.groq_api_key
        if not api_key:
            raise RuntimeError("No API key configured for STT")
        url = "https://api.groq.com/openai/v1/audio/transcriptions"
        model = "whisper-large-v3"
    else:
        url = "https://api.openai.com/v1/audio/transcriptions"
        model = "whisper-1"

    async with httpx.AsyncClient(timeout=30) as client:
        files = {"file": (filename, io.BytesIO(audio_bytes), "audio/wav")}
        data = {"model": model, "language": "vi"}
        res = await client.post(
            url,
            headers={"Authorization": f"Bearer {api_key}"},
            files=files,
            data=data,
        )
        res.raise_for_status()
        return res.json().get("text", "")
