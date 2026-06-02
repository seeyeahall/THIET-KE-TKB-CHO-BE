# Backend Architecture

## Lua chon

Backend dung Python FastAPI. Ly do:

- De viet API ro rang.
- Phu hop AI orchestration.
- De deploy len VPS/server rieng.
- De tich hop SDK AI, Supabase, background jobs.

## Vai tro backend

- Auth guard va session validation.
- CRUD children, activities, schedules.
- AI context builder.
- AI provider registry va test provider.
- Proxy goi AI de khong lo API key tren frontend.
- Xu ly reward khi hoan thanh hoat dong.
- Quan ly media metadata.

## Module

- auth.
- families.
- children.
- activities.
- schedules.
- ai.
- chat.
- rewards.
- media.
- admin.

## API nhom chinh

- `GET /health`.
- `GET /children`.
- `POST /children`.
- `GET /children/{child_id}`.
- `GET /activities`.
- `POST /activities`.
- `GET /schedules/current`.
- `POST /schedules`.
- `PATCH /schedule-items/{item_id}`.
- `POST /ai/chat`.
- `POST /ai/generate-schedule`.
- `POST /ai/providers`.
- `POST /ai/providers/{id}/test`.
- `POST /media/sign-upload`.

## Bao mat

- Frontend khong bao gio giu AI API key.
- Backend doc JWT tu Supabase Auth.
- Secrets luu encrypted.
- Endpoint cua be phai kiem tra family ownership.
- Admin endpoints can role rieng.

## Deploy

Backend Python khong chay truc tiep tren Cloudflare Pages. Can deploy rieng:

- VPS + Docker Compose.
- Render/Railway/Fly.io.
- Google Cloud Run.

Frontend Cloudflare Pages goi backend qua `NEXT_PUBLIC_API_BASE_URL`.

