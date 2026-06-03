# MASTER AI HANDOFF PROMPT

## Cach dung file nay

Neu ban la AI/coder tiep tuc du an nay, hay doc file nay truoc. File nay la lenh tong the de nam nhanh kien truc, trang thai, thu tu tai lieu can doc va buoc tiep theo. Khong can do tim toan bo repo truoc khi doc file nay.

## Vai tro cua ban

Ban la software engineer tiep tuc xay dung ung dung `Kid Adventure Planner`.

Muc tieu san pham:

> Xay dung ung dung phieu luu va kham pha danh cho tre em 6-10 tuoi, trong do thoi khoa bieu chi la cong cu giup be tu tao hanh trinh moi ngay.

Khong duoc thiet ke app nhu ung dung quan ly lich/kpi kho cung. Frontend phai vui, truc quan, nhieu hinh anh, it chu, giong tro choi.

## Kien truc da chot

- Frontend: `NextJS + TypeScript + Tailwind + PWA`.
- Frontend hosting: `Cloudflare Pages` (free tier, static export).
- Backend: `Python FastAPI`.
- Backend hosting: `Render` (free Web Service Docker) hoac `Fly.io` (free $5 credit/thang). Uu tien Render cho de setup, Fly.io cho on dinh hon.
- Database: `Supabase Postgres` (free tier 500MB).
- Auth: `Supabase Auth`.
- Storage: `Supabase Storage`.
- CDN/domain/cache/security: `Cloudflare`.
- AI providers: OpenAI, Gemini, OpenRouter, DeepSeek, Groq, Together, Kimi/Moonshot, va provider OpenAI-compatible.

Python backend khong chay truc tiep tren Cloudflare Pages. Cloudflare Pages chi host frontend.

### Quyet dinh deploy free tier

De push va chay duoc ngay tren tai khoan free:

1. **Frontend**: Cloudflare Pages (free, khong gioi han bandwidth).
   - NextJS phai dung `output: 'export'` de build static.
   - Khong dung API routes cua NextJS; moi API goi backend FastAPI rieng.
   
2. **Backend**: Render Web Service (free tier).
   - Deploy bang Dockerfile da co.
   - Free tier se sleep sau 15 phut khong co request; lan request dau se co cold start ~30-60s.
   - Neu can uptime cao hon, dung Fly.io (free $5 credit/thang du chay 24/7 cho app nho).
   
3. **Database + Auth + Storage**: Supabase (free tier).
   - Tao project, lay URL + anon key + service role key.
   - Chay migration SQL de tao bang.
   - Bat Auth provider email/password.
   
4. **CORS**: Backend phai cho phep domain frontend Cloudflare Pages.
   - Vi du: `https://kid-adventure-planner.pages.dev` va `http://localhost:3000`.
   
5. **Env variables**: Khong bao gio commit secret. Dung `.env.example` lam template.

## Trang thai hien tai (TOM TAT)

### Da hoan thanh

| Thanh phan | Trang thai | Chi tiet |
|---|---|---|
| Blueprint docs | Done | 22 file markdown trong `/docs` |
| Backend FastAPI MVP | Done | Repository + Service layer, Auth JWT, AI Provider HTTP integration, AI Context Builder, Middleware, 17/17 tests pass |
| Database schema + migrations | Done | `0001_initial.sql` + `0002_optimizations.sql` (updated_at, soft delete, CHECK constraints, composite indexes, RLS policies) |
| Frontend scaffold | Done | NextJS + Tailwind + static export, landing page + health check |
| Frontend PWA MVP | Done | 7 screens + BottomNav + Zustand store + API client. Build 13 pages. |
| Auth UI | Done | `/login`, `/register` with Supabase Auth |
| PWA offline | Done | Service worker + cache strategies |
| Skeletons + ErrorBoundary | Done | Loading states + error recovery |
| DND Schedule | Done | Native HTML5 drag-and-drop schedule builder |
| Animations | Done | Page transitions + micro-interactions |
| Storage + Media | Done | Supabase Storage buckets, signed upload API, ImageUploader |
| Deploy config | Done | `render.yaml`, `fly.toml`, `wrangler.toml`, Dockerfile, deploy scripts, smoke test |

### Dang lam

| Thanh phan | Trang thai | Chi tiet |
|---|---|---|
| Frontend PWA MVP | Done | Da tao man hinh chon be, trang chu, lich, thu vien, chat AI, dashboard phu huynh, bottom nav. Build thanh cong. |

### Chua bat dau / Dang cho

| Thanh phan | Trang thai | Chi tiet |
|---|---|---|
| Mo rong | Future | TTS/STT, AI image, rewards nang cao |

## Tai lieu can doc theo thu tu

Doc dung thu tu nay de tiet kiem context:

1. `19_implementation_progress.md`
   - Trang thai hien tai, checklist, known issues, recent changes.

2. `00_project_overview.md`
   - Muc tieu, nguoi dung, stack, MVP.

3. `02_ui_ux_design.md`
   - Nguyen tac giao dien, man hinh chinh, mau sac, responsive.

4. `03_user_flow.md`
   - Luong khoi tao, luong be hang ngay, luong tao lich.

5. `09_database_schema.md`
   - Bang Supabase/Postgres MVP.
   - RLS va quan he du lieu.

6. `10_backend_architecture.md`
   - API backend FastAPI.
   - Module backend.
   - Bao mat.

7. `17_backend_module_links.md`
   - Graph lien ket module backend.
   - Thu muc backend can tao.
   - Dependency giua modules.

8. `18_app_flow_graph.md`
   - Flow tong the app.
   - Flow AI tao lich.
   - Flow chat AI.
   - Flow upload anh.
   - Flow test provider.

Chi doc cac file khac khi dang lam dung module do:

- Child experience: `04_child_experience.md`.
- AI context: `05_ai_system.md`.
- Activity library: `06_activity_library.md`.
- Schedule: `07_schedule_system.md`.
- Audio/voice: `08_audio_voice_system.md`.
- Admin: `11_admin_panel.md`.
- Storage: `13_storage_system.md`.
- Deployment: `14_deployment.md`.
- Roadmap: `15_mvp_roadmap.md`.
- Runtime key: `16_runtime_key_integration.md`.

## Huong dan nhanh cho tung cong viec

### Neu dang lam Frontend MVP (Cheng 3) — DA XONG

**Cac man hinh da tao:**
1. `/` — Landing page voi CTA + health check API.
2. `/select-child` — Chon nguoi choi (avatar be, nut them be, nut phu huynh). Fallback demo data.
3. `/home` — Trang chu cua be (chu de hom nay, tien do thu thach, quick chat AI).
4. `/schedule` — Lich tuan (thanh chon ngay, danh sach hoat dong, AI tao lich).
5. `/activities` — Thu vien hoat dong (search, filter theme, card hoat dong).
6. `/chat` — Chat AI dong hanh (messenger UI, typing indicator, error fallback).
7. `/parent` — Dashboard phu huynh (thong ke, chuyen doi nguoi choi, cai dat).
8. `BottomNav` — Navigation 5 tab (home, schedule, activities, chat, parent).

**Kien truc frontend:**
- `output: 'export'` trong `next.config.js` → khong dung API routes, khong dung `next/image` optimized.
- Moi API call backend qua `fetch` den `NEXT_PUBLIC_API_BASE_URL`.
- Auth: Dung local dev fallback (chua co Supabase Auth UI).
- State: Zustand + persist middleware (`authToken`, `selectedChild`).
- Types: `frontend/src/lib/types.ts` — shared interfaces.
- API: `frontend/src/lib/api.ts` — centralized client voi auth headers.

**File da tao/sua:**
- `frontend/src/lib/api.ts`
- `frontend/src/lib/store.ts`
- `frontend/src/lib/types.ts`
- `frontend/src/components/BottomNav.tsx`
- `frontend/src/app/layout.tsx`
- `frontend/src/app/page.tsx`
- `frontend/src/app/select-child/page.tsx`
- `frontend/src/app/home/page.tsx`
- `frontend/src/app/schedule/page.tsx`
- `frontend/src/app/activities/page.tsx`
- `frontend/src/app/chat/page.tsx`
- `frontend/src/app/parent/page.tsx`

### Buoc tiep theo (Cheng 3.5)
1. Them auth UI (login/register Supabase Auth).
2. PWA service worker + offline support.
3. Loading skeletons + error boundaries.
4. Drag-and-drop thiet ke lich.
5. Animation/transition giua man hinh.

### Neu dang lam Backend

**Kien truc da chot:**
- `app/repositories/` — BaseRepository + implementations (soft-delete, lazy client).
- `app/services/` — Business logic (ChildrenService, ActivitiesService, SchedulesService).
- `app/modules/*/router.py` — FastAPI routers, lazy init service.
- `app/core/security.py` — JWT validation, `get_current_user`, `get_current_family`.
- `app/core/middleware.py` — RequestLoggingMiddleware, RateLimitMiddleware.

**Chay test:**
```bash
cd backend
python -m pytest -v
```

**Chay local:**
```bash
cd backend
uvicorn app.main:app --reload --port 8001
```

### Neu dang lam Database

**Migrations:**
- `supabase/migrations/0001_initial.sql` — Schema ban dau.
- `supabase/migrations/0002_optimizations.sql` — Optimizations (updated_at, soft delete, indexes, RLS).

**Chay migration:**
1. Vao Supabase SQL Editor.
2. Chay `0001_initial.sql` truoc.
3. Chay `0002_optimizations.sql` sau.
4. Chay `supabase/seed.sql` de them activities mau.

### Neu dang Deploy

**Backend (Render):**
1. Push code len GitHub.
2. Ket noi Render Web Service voi repo.
3. Cau hinh env variables trong Render Dashboard.
4. Deploy.

**Frontend (Cloudflare Pages):**
1. `npm run build` trong `frontend/`.
2. Deploy thu muc `frontend/dist/`.
3. Cau hinh env `NEXT_PUBLIC_API_BASE_URL`.

Chi tiet trong `docs/14_deployment.md` va `docs/21_deploy_step_by_step.md`.

## Quy tac bao mat key

File `seeyeahall ALL key.txt` co secret that.

Khong duoc:

- In raw key ra console/response.
- Copy raw key vao markdown.
- Copy raw key vao source code.
- Dua key vao frontend.
- Commit file key vao git/public repo.

Duoc:

- Tao `.env.example` voi placeholder.
- Doc key tu env runtime.
- Ghi provider va key index da test thanh cong.

Provider da test thanh cong:

- OpenAI key #2.
- Gemini key #2 den #6.
- Kimi/Moonshot key #2 va #6.
- Together key #1.
- Groq key #1.
- OpenRouter key #1.
- DeepSeek key #1.

## Quy tac cap nhat sau khi lam viec

Sau moi lan sua code hoac docs:

1. Cap nhat `19_implementation_progress.md`.
2. Ghi file da tao/sua.
3. Ghi lenh test da chay.
4. Ghi loi con lai vao `Known issues`.
5. Neu thay doi module backend, cap nhat `17_backend_module_links.md`.
6. Neu thay doi flow app, cap nhat `18_app_flow_graph.md`.
7. Neu thay doi provider/key/env, cap nhat `16_runtime_key_integration.md`.
8. Neu thay doi roadmap, cap nhat `15_mvp_roadmap.md`.
9. Neu thay doi schema/database, cap nhat `09_database_schema.md`.
10. Neu thay doi deploy/env, cap nhat `14_deployment.md`.
11. Neu thay doi quy tac handoff hoac thu tu lam viec, cap nhat chinh file `20_MASTER_AI_HANDOFF_PROMPT.md`.

Sau moi lan fix xong, phai de lai du thong tin de AI khac tiep tuc ma khong can do tim:

- Buoc vua lam.
- File da sua.
- Test da chay va ket qua.
- Buoc tiep theo cu the.
- Module/docs nao can doc neu tiep tuc.
- Quota/context con lai neu UI co bao.

## Dinh huong thiet ke

Moi quyet dinh code phai giu dung nguyen tac:

- Be la nguoi dung trung tam.
- App la cuoc phieu luu, khong phai bang viec can lam.
- Frontend vui va truc quan.
- Backend don gian, ro module, de mo rong.
- AI phai nap context cua tung be truoc khi tra loi.
- Activity library va schedule phai luu database, khong hardcode.
- Secrets chi nam backend/env.

## Tieu chuan hoan thanh cheng

### Cheng 2 (Backend MVP) — DA XONG

- Co `backend/` chay duoc FastAPI.
- Repository + Service layer hoat dong.
- Auth JWT validation that.
- AI Provider HTTP integration (retry, timeout).
- AI Context Builder query DB.
- Chat + Generate Schedule endpoints.
- Middleware (logging, rate limiting, exception handlers).
- pytest 17 passed.
- `19_implementation_progress.md` duoc cap nhat.

### Cheng 3 (Frontend PWA MVP) — DA XONG

- Route structure day du: `/`, `/select-child`, `/home`, `/schedule`, `/activities`, `/chat`, `/parent`.
- API client tập trung voi auth token.
- State management (Zustand + persist).
- BottomNav 5-tab navigation.
- Demo data fallback cho tat ca cac man hinh.
- Frontend build thanh cong voi `output: 'export'` (11 static pages).

### Cheng 3.5 (Frontend Polish)

- Auth UI (login/register Supabase Auth).
- PWA service worker + offline support.
- Loading skeletons + error boundaries.
- Drag-and-drop schedule builder.
- Page transitions/animations.

### Cheng 4 (Storage + Media)

- Upload avatar/anh hoat dong len Supabase Storage.
- Cloudflare cache asset public.
- Media metadata endpoints.

### Cheng 5 (Deploy Production)

- Backend Docker tren Render/Fly.io.
- Frontend static export tren Cloudflare Pages.
- Supabase production project.
- Smoke test end-to-end.
