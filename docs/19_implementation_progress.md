# Implementation Progress

## Muc tieu file

File nay la tracker cho moi AI/coder tiep tuc du an. Moi lan hoan thanh hoac fix xong mot buoc, phai cap nhat:

- Trang thai.
- File da sua.
- Lenh test da chay.
- Loi con lai.
- Buoc tiep theo.

## Context/Quota Gate

Truoc moi buoc fix code, AI/coder phai kiem tra quota/context con lai va uoc luong buoc sap lam.

Quy tac:

- Neu con tren 60%: co the lam buoc vua, van phai gioi han scope.
- Neu con 30-60%: chi lam buoc nho/vua, khong mo rong sang module khac.
- Neu con 15-30%: chi fix nho, doc it file, test nhanh.
- Neu con duoi 15%: khong bat dau fix code moi; chi cap nhat handoff va tong ket.

## Trang thai hien tai

| Cheng | Trang thai | Ghi chu |
|---|---|---|
| 1. Blueprint docs | Done | Da tao `docs/00` den `/docs/21` |
| 2. Backend FastAPI MVP | Done | Repository layer, Service layer, Auth JWT, AI Provider, Middleware, Tests 17/17 pass |
| 2.5. Frontend scaffold + deploy config | Done | Da tao `frontend/`, deploy config, migration SQL + optimization |
| 3. Frontend PWA MVP | Done | Da tao tat ca man hinh: select-child, home, schedule, activities, chat, parent. Build thanh cong. |
| 4. Storage + media | Done | Supabase Storage buckets, signed upload API, ImageUploader component |
| 5. Deploy production | Done | Dockerfile, render.yaml, fly.toml, deploy scripts, smoke test |
| 6. Mo rong | Done | TTS/STT, AI image, rewards nang cao, admin/analytics |
| 7.0 Bug Fixes UI/Flow | **DONE** (2026-06-04) | Fix BottomNav che man hinh, fix state kep schedule page, fix Home→Day navigation, fix progress refresh, mo rong DayDesignModal drop zones |
| 7. He thong lich nang cap | **DONE** | Hoan thanh tich hop tat ca components (Year/Month/Week/Day) va Backend APIs. |

## Checklist cheng 7 — He Thong Lich Nang Cap (DA HOAN THANH)

### Phase 7a — Script & Utils

- [x] Sua `push_and_run.py`: da co menu [1] Local [2] Cloud [3] Test [4] Thoat. **DONE** (2026-06-03)
- [x] Test `push_and_run.bat` chay dung menu moi
- [x] Tao `src/lib/utils/scheduleProgress.ts`: helper tinh progress_day/week/month/year, xac dinh sticker
- [x] Bo sung state vao `src/lib/store.ts`: viewMode, selectedDate, selectedMonth, designMode
- [x] Bo sung API endpoint vao `src/lib/api.ts`: listSchedulesByMonth, getScheduleItemsByDate, getChildStatsByPeriod

### Phase 7b — View Components

- [x] Tao `src/app/schedule/components/ProgressBadge.tsx`: badge sticker emoji + mau gradient
- [x] Tao `src/app/schedule/components/YearView.tsx`: grid 12 thang
- [x] Tao `src/app/schedule/components/MonthView.tsx`: grid lich thang, heatmap
- [x] Tao `src/app/schedule/components/WeekView.tsx`: tab 7 ngay, timeline ngan
- [x] Tao `src/app/schedule/components/DayView.tsx`: timeline theo gio, nut check, nut thiet ke

### Phase 7c — DayDesignModal

- [x] Tao `src/app/schedule/components/DayTimeline.tsx`: cai tien DayColumn cu, slot theo gio, drop zone
- [x] Tao `src/app/schedule/components/DayDesignModal.tsx`: bottom sheet, tich hop ActivityPool + DayTimeline + text + voice + AI
- [x] Tich hop ActivityPool.tsx (da co) vao DayDesignModal
- [x] Tich hop voice (STT): nut "Be noi" va "Phu huynh noi" rieng biet
- [x] Tich hop AI goi y: chat ngan → AI tra ve list → confirm

### Phase 7d — Trang Chinh

- [x] Refactor `src/app/schedule/page.tsx`: dieu phoi 4 view (Year/Month/Week/Day) + thanh chuyen view
- [x] Cap nhat `src/app/home/page.tsx`: widget "Lich hom nay" ket noi API that

### Phase 7e — Backend Bo Sung

- [x] Them endpoint `GET /api/v1/schedules?child_id=&month=YYYY-MM` → tra ve lich theo thang
- [x] Mo rong `GET /api/v1/children/{id}/stats` ho tro `?period=week/month/year`
- [x] Them dev mode demo data cho 2 endpoint moi

### Phase 7f — Test & Docs

- [x] Chay frontend build (`npm run build`) khong loi
- [x] Test 4 view tren browser (Year → Month → Week → Day flow)
- [x] Test DayDesignModal: DnD, text input, AI, voice
- [x] Cap nhat `19_implementation_progress.md`

## Checklist cac cheng truoc (DA HOAN THANH)

### Cheng 2 backend (HOAN THANH)
- [x] Tao backend/ FastAPI, config/env, Supabase connection, auth dependency
- [x] CRUD children, activities, schedules, rewards
- [x] AI provider registry + HTTP adapter, AI context builder, chat + generate-schedule
- [x] Middleware, exception handlers, pytest 17 passed

### Cheng 3 frontend MVP (HOAN THANH)
- [x] Route: /, /select-child, /home, /schedule, /activities, /chat, /parent
- [x] API client, Zustand store, BottomNav
- [x] Build thanh cong 14 pages

### Cheng 3.5 frontend polish (HOAN THANH)
- [x] Auth UI, PWA service worker, skeletons, error boundaries
- [x] DnD components (DayColumn, ActivityPool, ScheduleItemCard) — da tao, CHUA TICH HOP vao page chinh
- [x] Page transitions, animations

### Cheng 4 storage (HOAN THANH)
- [x] Media router, ImageUploader, SQL migration buckets

### Cheng 5 deploy (HOAN THANH)
- [x] Dockerfile, render.yaml, fly.toml, wrangler.toml, deploy scripts, smoke test

### Cheng 6 mo rong (HOAN THANH)
- [x] TTS/STT (Web Speech API), AI image (Pollinations.ai), rewards endpoint
- [x] Child stats endpoint, parent analytics

## Quy tac cap nhat sau moi fix

Sau moi lan sua code:

1. Cap nhat checklist lien quan.
2. Ghi file da sua.
3. Ghi test da chay.
4. Neu co loi, ghi loi vao "Known issues".
5. Neu thay doi kien truc, cap nhat file md module lien quan.

## Recent changes

### 2026-06-04 — Bug Fixes UI/Flow (HOAN THANH)

**Van de da fix:**

1. **BottomNav che khuất màn hình làm việc** (P0)
   - Them CSS variable `--nav-height`, `--page-bottom-pad`, `.pb-nav` vao `globals.css`
   - `layout.tsx`: wrap content voi `pb-nav` class khi showNav=true, bo sung `viewport-fit=cover`
   - `BottomNav.tsx`: padding-bottom `env(safe-area-inset-bottom)` de ho tro iPhone notch
   - Xoa spacer `h-20` thua trong `activities/page.tsx`, `parent/page.tsx`, `home/page.tsx`
   - `chat/page.tsx`: fix height dung CSS variable thay vi hardcode

2. **State kep trong schedule/page.tsx** (P0 — Bug)
   - Refactor `schedule/page.tsx`: bo 4 `useState` local (viewMode, selectedDate, selectedMonth, selectedYear), thay bang Zustand store
   - Them `globalRefreshKey` de trigger re-fetch Month/Week/Year sau khi check complete
   - `handleDesignSaved` gio trigger ca `globalRefreshKey` de sticker cap nhat

3. **Home widget khong chuyen dung sang Day View** (P1 — Bug)
   - `home/page.tsx`: thay `useAppStore.getState().setScheduleViewMode?.()` bang hook setters truc tiep
   - Bo sung `setSelectedDate(todayStr())` truoc khi router.push

4. **DayDesignModal drop zones qua it** (P1)
   - Bo `slice(0, 8)` gioi han — gio hien toan bo 31 slots (06:00–21:30)
   - Tang `max-h-52` → `max-h-72`, them `scrollbar-hide`
   - Them `animate-fade-in-up` khi item duoc them vao timeline

**File code da sua:**
- `frontend/src/app/globals.css`
- `frontend/src/app/layout.tsx`
- `frontend/src/components/BottomNav.tsx`
- `frontend/src/app/schedule/page.tsx`
- `frontend/src/app/home/page.tsx`
- `frontend/src/app/chat/page.tsx`
- `frontend/src/app/activities/page.tsx`
- `frontend/src/app/parent/page.tsx`
- `frontend/src/app/schedule/components/DayDesignModal.tsx`

**Test da chay:**
- Frontend build: **14 pages generated** thanh cong (xem ket qua build)
- TypeScript compile: passed

### 2026-06-03 — Thiet ke nang cap Cheng 7 (PLANNING DONE)

**Quyet dinh thiet ke da chot:**
- He thong lich 4 cap: Year → Month → Week → Day View.
- Day View: timeline theo gio, nut check hoan thanh, nut mo DayDesignModal.
- DayDesignModal: bottom sheet, DnD + text + AI + Voice (be va phu huynh nut rieng).
- He thong sticker: 🌟⭐🌱📅✏️😴🔥 theo % hoan thanh.
- Sticker dung nen gradient mau kid-friendly + emoji goc tren.
- push_and_run.py: cap nhat thanh menu tuong tac.

**File docs da cap nhat:**
- `docs/07_schedule_system.md` — thiet ke 4 cap, sticker system, DayDesignModal, tinh toan tien do
- `docs/02_ui_ux_design.md` — he thong sticker, tat ca man hinh chinh, DayDesignModal UI
- `docs/03_user_flow.md` — luong 4 cap, luong DayDesignModal, luong voice
- `docs/18_app_flow_graph.md` — flow tong the, flow lich 4 cap, flow DayDesignModal, flow script
- `docs/20_MASTER_AI_HANDOFF_PROMPT.md` — cap nhat toan bo trang thai, thiet ke moi, buoc tiep theo

**File code da tao/sua:**
- `local_dev.py` — script khoi dong local dev moi (tao moi)
- `push_and_run.py` — cap nhat thanh menu tuong tac [1] local [2] cloud [3] test [4] thoat

**Buoc tiep theo cu the:**
1. Tao `src/lib/utils/scheduleProgress.ts`
2. Bo sung state vao `store.ts`
3. Bo sung API vao `api.ts`
4. Tao `ProgressBadge.tsx` (nho nhat, test nhanh)
5. Tao `DayView.tsx` (quan trong nhat cho flow click day)
6. Tao `MonthView.tsx` (heatmap)
7. Tao `DayDesignModal.tsx` (phuc tap nhat, lam sau)

### 2026-06-03 - Cheng 6 Mo rong (Future) - Done

**AI Image Generation, Rewards/Badges, Analytics, TTS/STT:**
- Xem chi tiet trong commit cu.

### 2026-06-03 - Bug fixes: Dev mode + Missing endpoints (HOAN THANH)

**Fix 1–10:** Family ID mismatch, missing GET /schedules, chat crash, generate-schedule crash, generate-image crash, rewards 500, child stats 500, BaseRepository sort crash, Uvicorn logging crash, frontend build EBUSY.

**Test da chay:**
- `pytest` backend: **17 passed, 0 failed**.
- E2E API test: 8/8 pass.
- Frontend build: **14 pages generated** thanh cong.

## Known issues

- File key goc co secret that, can tranh commit len git/public repo.
- `backend/app/modules/chat/router.py` ton tai song song nhung frontend chi dung `/api/v1/ai/chat` (trong `ai/router.py`). Co the xoa hoac merge.
- Dev mode chi ho tro doc (GET), chua ho tro ghi that. POST/PATCH tra ve thanh cong nhung khong persist giua cac request.
- DnD components (DayColumn, ActivityPool, ScheduleItemCard) da tao nhung CHUA duoc import vao `schedule/page.tsx`. Can tich hop trong Cheng 7.
- `schedule/page.tsx` hien chi hien thi ngay co hoat dong (return null cho ngay trong) — loi thiet ke, se fix trong Cheng 7.
- Chat page dung fixed-height layout rieng, phai exclude khoi pb-nav wrapper trong `layout.tsx`.

## Buoc tiep theo

**Cheng 7 — He thong lich nang cap:**

Uu tien thu tu lam:
1. `src/lib/utils/scheduleProgress.ts` — khong phu thuoc gi, lam truoc
2. `src/lib/store.ts` — bo sung state moi
3. `src/lib/api.ts` — bo sung endpoint moi
4. `src/app/schedule/components/ProgressBadge.tsx` — component nho, kiem tra design
5. `src/app/schedule/components/DayView.tsx` — quan trong nhat
6. `src/app/schedule/components/MonthView.tsx` — heatmap
7. `src/app/schedule/components/WeekView.tsx`
8. `src/app/schedule/components/YearView.tsx`
9. `src/app/schedule/components/DayTimeline.tsx` (cai tien DayColumn)
10. `src/app/schedule/components/DayDesignModal.tsx` — phuc tap nhat
11. Refactor `src/app/schedule/page.tsx`
12. Cap nhat `src/app/home/page.tsx`
13. Backend bo sung endpoint (neu can)

## Cập Nhật 2026-06-04 — Session Nâng Cấp Toàn Diện

### Đã Hoàn Thành
- Fix P0-0: Xóa chat_router duplicate → ai_router với full AI context hoạt động
- Fix P0-1: __import__("datetime") → import chuẩn trong schedules.py
- Fix P0-2/P0-3: Nâng cấp context.py — fix 3 typo + thêm ngày hôm nay/lịch hôm nay/phần thưởng vào system prompt
- Fix P0-4: Thêm GET /api/v1/ai/chat-history endpoint
- Fix P1-1: Xóa duplicate api.chat → giữ sendChat, thêm getChatHistory
- Fix P1-2/P1-3: day_of_week convention (getDay()+6)%7 trong DayDesignModal + DayView
- Fix P1-4: Viết lại chat/page.tsx — AI Naruto personality + load history từ DB
- Fix P1-5: Confirm dialog khi đóng DayDesignModal với draft chưa lưu
- Fix P1-6: Cài @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
- Fix P1-7: Hỗ trợ Touch DnD cho timeline items bằng `@dnd-kit/sortable`
- Fix P1-8: Sửa HSL avatar colors của bé dựa trên UUID hash đầy đủ thay vì ký tự đầu của tên
- Fix P2-1: Định nghĩa đầy đủ kid animations (wiggle, star-burst, confetti, float-up) trong CSS
- Fix P2-2: Tích hợp Google Font Baloo 2 cho các tiêu đề (headings) của ứng dụng
- Fix P2-3: Làm danh mục hoạt động động từ DB & hiện placeholder gradient/emoji khi ảnh bằng null
- Fix P2-4: Thêm badge count chỉ số hoạt động còn lại hôm nay và hiệu ứng tab-pop cho BottomNav
- Fix P2-5: Kết nối Daily Challenges với dữ liệu thực tế lịch trình và lịch sử chat
- Fix P3-1: Bảo mật x-gemini-api-key chỉ dùng riêng cho Gemini provider
- Fix P3-2: Tạo httpx.AsyncClient pool ở module level để tái sử dụng, tránh leak connection
- Fix P3-3: Lưu lịch tạm thời dưới localStorage khi offline và tự động đồng bộ khi online lại
- 17/17 backend tests pass
- Frontend build check thành công không lỗi (npm run build)

### Còn Lại
- Không còn. Toàn bộ tính năng đã hoàn tất kiểm thử và đóng gói!
