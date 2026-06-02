# Audio Voice System

## Muc tieu

Am thanh giup be cam thay ung dung song dong hon. Voice la tinh nang mo rong, khong bat buoc trong MVP dau tien.

## MVP

- Am thanh UI don gian khi hoan thanh hoat dong.
- Text-to-speech optional cho AI tra loi.
- Browser Speech API optional cho nhap giong noi.

## TTS providers

- OpenAI TTS.
- Gemini TTS.
- ElevenLabs.
- Edge TTS.

## STT providers

- Whisper.
- Gemini Speech.
- Browser Speech API.

## Kien truc

Frontend:

- Ghi am neu user cho phep.
- Phat audio.
- Hien trang thai dang nghe/dang noi.

Backend:

- Quan ly provider.
- Goi TTS/STT.
- Luu audio neu can.
- Tra ve audio URL hoac transcript.

## Storage audio

Audio co the luu trong Supabase Storage:

- audio/system.
- audio/tts.
- audio/uploads.

Cloudflare cache audio public ngan, khong cache audio rieng tu.

