# AI System

## Vai tro AI

AI la ban dong hanh cua be, khong phai chatbot chung chung. Moi cau tra loi phai dua tren context cua tung be.

## Context bat buoc

Truoc khi tra loi, backend can nap:

- Ho so be.
- Tuoi.
- So thich.
- Lich ngay/tuan hien tai.
- Hoat dong da lam gan day.
- Lich su tro chuyen gan day.
- Phan thuong/huy hieu.
- Ghi chu an toan tu phu huynh.

## Chuc nang AI MVP

- Chat voi be.
- Goi y hoat dong hom nay.
- Tao lich tuan moi.
- Tao hoat dong moi theo chu de/tuoi.
- Tom tat ngay cua be cho phu huynh.

## Provider registry

Moi provider gom:

- id.
- name.
- provider_type: openai, gemini, anthropic, openrouter, ollama, compatible.
- endpoint.
- api_key_encrypted.
- model.
- capabilities: chat, image, tts, stt.
- is_active.
- is_default.
- last_test_status.
- last_tested_at.

## Kiem tra provider

Khi luu provider:

1. Backend luu tam thoi secret.
2. Gui request test nho.
3. Kiem tra response hop le.
4. Neu thanh cong moi cho active.
5. Neu that bai tra loi ly do ro rang.

## Prompt chinh

AI can:

- Tra loi tieng Viet.
- Dung cau ngan, than thien voi tre 6-10 tuoi.
- Goi ten be khi phu hop.
- Uu tien hoat dong an toan, co ich.
- Khong tao noi dung gay hai.
- Khi tao lich/hoat dong phai tra JSON theo schema de backend validate.

## AI Context Memory Layer

Backend tao mot lop `AIContextService`:

- `build_child_context(child_id)`.
- `get_recent_schedule(child_id)`.
- `get_recent_activities(child_id)`.
- `get_recent_chat(child_id)`.
- `build_system_prompt(child_id)`.

Khong de frontend tu lap prompt. Frontend chi gui cau hoi/y dinh cua nguoi dung.

