# API Provider System

## Muc tieu

He thong khong khoa chat vao mot nha cung cap AI. Admin co the them va chon provider theo nhu cau.

## Provider ho tro

- OpenAI.
- Gemini.
- Claude.
- OpenRouter.
- Ollama.
- OpenAI-compatible endpoint.
- DeepSeek.
- Groq.
- Together AI.
- Kimi/Moonshot.

## Capability

Moi provider co the ho tro mot hoac nhieu capability:

- chat.
- image.
- tts.
- stt.

## Cau truc adapter

Backend nen co interface:

- `AIProviderAdapter.chat(messages, options)`.
- `AIProviderAdapter.generate_image(prompt, options)`.
- `AIProviderAdapter.text_to_speech(text, options)`.
- `AIProviderAdapter.speech_to_text(audio, options)`.
- `AIProviderAdapter.test_connection()`.

Moi provider co adapter rieng. OpenAI-compatible co adapter chung.

## Selection logic

- Neu endpoint yeu cau capability chat, lay default provider co `chat`.
- Neu default fail, co the fallback provider neu admin cho phep.
- Neu khong co provider kha dung, tra loi:
  "Vui long cau hinh AI truoc khi su dung."

## Luu API key

- Khong luu plain text.
- Ma hoa truoc khi luu database.
- Chi backend giai ma khi goi provider.
- Khong tra API key ve frontend.

## Logging

Can log:

- provider_id.
- capability.
- status.
- latency_ms.
- error_message rut gon.
- created_at.

Khong log full prompt cua be neu khong can. Neu log de debug, can co co che tat/bat.

## Ket qua key da test

Xem `16_runtime_key_integration.md`. Khong ghi raw API key vao file markdown hoac migration. Khi scaffold backend, chi tao `.env.example` voi placeholder va doc secret tu bien moi truong.
