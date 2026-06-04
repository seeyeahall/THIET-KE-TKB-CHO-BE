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

## Thiet Ke San Pham Da Chot (2026-06-03)

### He Thong Lich 4 Cap (THIET KE MOI — CHUA CODE)

Day la thiet ke dua tren phan tich ky va quyet dinh cua chu du an. Bat ky AI nao tiep tuc phai tuan theo thiet ke nay.

**4 Cap Do Xem Lich:**
```
NAM → THANG → TUAN → NGAY → DayDesignModal
```

**Year View:** Grid 12 thang, mau gradient + sticker tong ket + % trung binh.
**Month View:** Grid lich, moi o ngay co nen gradient + sticker (emoji trang thai) + so HT + icon chu de.
**Week View:** Tab 7 ngay ngang, timeline ngan, progress bar tuan.
**Day View:** Timeline theo gio, nut check hoan thanh, nut mo DayDesignModal.

**He Thong Sticker Ngay:**
- 🌟 = Hoan thanh 100%
- ⭐ = >= 80%
- 🌱 = 30-79% (dang tien hanh)
- 📅 = Da len lich, chua lam
- ✏️ = Chua len lich day du
- 😴 = Ngay da qua, bo trong
- 🔥 = Streak >= 3 ngay (them vao sticker chinh)

**Day Status → Sticker:** Moi o ngay trong Month/Week/Year tu dong cap nhat sticker theo % hoan thanh.

### DayDesignModal (THIET KE MOI — CHUA CODE)

**Cach vao:** Tu Day View bam "🎨 Thiet ke lich ngay nay".
**Loai modal:** Bottom sheet slide len tu duoi (mobile-native).
**Chi mo cho:** Ngay hom nay hoac tuong lai (ngay da qua read-only).

**3 phuong thuc them hoat dong:**
1. Keo tha (DnD) tu ActivityPool vao slot gio trong DayTimeline.
2. Nhap text nhanh (ten + gio + thoi luong).
3. AI + Voice: 🤖 chat ngan, 🎤 be noi (STT), 🎤 phu huynh noi (nut rieng biet).

### Script Khoi Dong (DA TAO)

File `local_dev.py` da tao. File `push_and_run.py` can cap nhat them menu tuong tac.

**push_and_run.bat → push_and_run.py → menu:**
```
[1] Chay LOCAL (localhost)
[2] Push Cloud (Fly.io + Cloudflare)
[3] Test backend API
[4] Thoat
```

**Luu y quan trong:** Truoc khi khoi dong, script phai kill tat ca process dang chiem port 8001 va 3000 (Windows: netstat + taskkill).

### Phan Tich Thiet Ke Sticker (Q4)

Lua chon thiet ke hap dan nhat voi be (da phan tich):

**Ket luan: Dung nen gradient nhat + sticker emoji (ket hop C)**

- Nen gradient tao cam giac "song dong" — be thay ngay nao dep, ngay nao can co gang
- Sticker emoji be hieu ngay ma khong can doc chu
- Sticker thay doi theo % tien do → be muon "up sticker" len cap cao hon (gamification)
- Khong dung GitHub-style xanh don sac → qua cold cho tre em
- Mau phai la kid-friendly: xanh la tuoi, vang am, cam am ap — KHONG xanh la dam kieu cong ty

## Trang thai hien tai (TOM TAT)

### Da hoan thanh

| Thanh phan | Trang thai | Chi tiet |
|---|---|---|
| Blueprint docs | Done | 22 file markdown trong `/docs` |
| Backend FastAPI MVP | Done | Repository + Service layer, Auth JWT, AI Provider HTTP integration, AI Context Builder, Middleware, 17/17 tests pass |
| Database schema + migrations | Done | `0001_initial.sql` + `0002_optimizations.sql` |
| Frontend scaffold | Done | NextJS + Tailwind + static export, landing page + health check |
| Frontend PWA MVP | Done | 7 screens + BottomNav + Zustand store + API client. Build 14 pages. |
| Auth UI | Done | `/login`, `/register` with Supabase Auth |
| PWA offline | Done | Service worker + cache strategies |
| Skeletons + ErrorBoundary | Done | Loading states + error recovery |
| DND components | Done | DayColumn, ActivityPool, ScheduleItemCard da tao nhung CHUA DUOC TICH HOP vao page chinh |
| Animations | Done | Page transitions + micro-interactions |
| Storage + Media | Done | Supabase Storage buckets, signed upload API, ImageUploader |
| Deploy config | Done | `render.yaml`, `fly.toml`, `wrangler.toml`, Dockerfile, deploy scripts, smoke test |
| AI Image Generation | Done | `POST /ai/generate-image` voi Pollinations.ai fallback |
| TTS/STT | Done | Web Speech API tren frontend (`speechSynthesis` + `SpeechRecognition`) |
| Rewards | Done | `POST /rewards/complete-activity` voi XP/Coins popup |
| Dev mode | Done | Backend chay duoc ma khong can Supabase — tra ve demo data cho tat ca endpoint |
| Bug fixes (3 issues user) | Done | Fix schedule add, chat AI, parent settings + dev mode 404/500 |
| local_dev.py | Done | Script khoi dong local dev (backend + frontend + smoke test + menu) |
| **Bug Fixes UI/Flow (7.0)** | **Done** (2026-06-04) | Fix BottomNav che man hinh (safe-area CSS), fix state kep schedule page (dung Zustand store), fix Home→Day View navigation, fix sticker refresh sau check complete, mo rong DayDesignModal drop zones (31 slots) |

### Chua lam / Can lam tiep (CHUONG TRINH NANG CAP)

| Thanh phan | Trang thai | Chi tiet |
|---|---|---|
| Lich 4 cap (Year/Month/Week/Day) | Chua code | Thiet ke xong (xem 07_schedule_system.md, 02_ui_ux_design.md) |
| Sticker system (Day Status) | Chua code | Thiet ke xong (xem 02_ui_ux_design.md) |
| DayDesignModal | Chua code | Thiet ke xong (xem 07_schedule_system.md, 03_user_flow.md) |
| Tich hop DnD vao trang lich | Chua code | Component da co, can ket noi vao DayDesignModal |
| Push_and_run.py menu | Chua code | Can them menu tuong tac [1] local [2] cloud |
| Progress tracking (week/month/year) | Chua code | Backend: endpoint stats period, Frontend: bieu do |
| Widget lich hom nay tren Home | Chua code | Ket noi API that, hien 2-3 hoat dong sap toi |
| Deploy production | Ready | Code san sang, can push va cau hinh env tren Render/Cloudflare |

## Tai lieu can doc theo thu tu

Doc dung thu tu nay de tiet kiem context:

1. `19_implementation_progress.md`
   - Trang thai hien tai, checklist, known issues, recent changes.

2. `00_project_overview.md`
   - Muc tieu, nguoi dung, stack, MVP.

3. `02_ui_ux_design.md`
   - Nguyen tac giao dien, he thong sticker, man hinh chinh, DayDesignModal.

4. `07_schedule_system.md`
   - Thiet ke 4 cap xem lich, sticker system, DayDesignModal detail, tinh toan tien do.

5. `03_user_flow.md`
   - Luong 4 cap xem lich, luong DayDesignModal, luong voice, luong phan thuong.

6. `18_app_flow_graph.md`
   - Flow tong the app, flow he thong lich 4 cap, flow DayDesignModal, flow script.

7. `10_backend_architecture.md` (neu lam backend)
8. `17_backend_module_links.md` (neu lam backend)

Chi doc cac file khac khi dang lam dung module do:
- AI context: `05_ai_system.md`
- Activity library: `06_activity_library.md`
- Audio/voice: `08_audio_voice_system.md`
- Admin: `11_admin_panel.md`
- Storage: `13_storage_system.md`
- Deployment: `14_deployment.md`
- Roadmap: `15_mvp_roadmap.md`
- Runtime key: `16_runtime_key_integration.md`

## Huong dan nhanh cho tung cong viec

### Neu dang lam Frontend — He Thong Lich Moi (BUOC TIEP THEO)

**Trang thai hien tai (2026-06-04):**
- Tat ca component da tao: YearView, MonthView, WeekView, DayView, DayDesignModal, ProgressBadge
- `store.ts` da co day du state: viewMode, selectedDate, selectedMonth, selectedYear, designMode
- `api.ts` da co: listSchedulesByMonth, getScheduleItemsByDate
- `schedule/page.tsx` da refactor: dung Zustand store, co globalRefreshKey, khong con state kep
- Bug Fixes UI/Flow (7.0) da hoan thanh

**Buoc con lai cho Cheng 7 that su:**
1. Test 4 view tren browser + mobile (Year → Month → Week → Day flow)
2. Test DayDesignModal: DnD, text input, AI, voice
3. Test check complete activity → sticker cap nhat tren MonthView
4. Test Home widget "Xem day du" → chuyen dung sang Day View hom nay
5. Backend bo sung endpoint `?month=YYYY-MM` neu chua ho tro
6. Progress tracking hien dung tren tung cap (progress_day, streak, top_themes)
7. Widget lich hom nay tren /home ket noi API that (hien da co)

**File hien co can biet:**
- `frontend/src/app/schedule/page.tsx` — da refactor dung store (2026-06-04)
- `frontend/src/app/schedule/components/DayColumn.tsx` — DnD component (se tich hop)
- `frontend/src/app/schedule/components/ActivityPool.tsx` — Activity pool (se tich hop)
- `frontend/src/app/schedule/components/ScheduleItemCard.tsx` — Card (se cai tien)

### Neu dang lam push_and_run.py menu

Sua `push_and_run.py`: them menu tuong tac (input "1/2/3/4"), goi `local_dev.py` cho option 1, giu deploy code hien tai cho option 2.

**Luu y quan trong:** local_dev.py da xu ly kill port truoc khi start. Phai dam bao su dung `netstat + taskkill` tren Windows de khong bi conflict port.

### Neu dang lam Backend

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

**Hoac dung script:**
```bash
python local_dev.py --backend
```

### Neu dang Deploy

**Backend (Render):**
1. Push code len GitHub.
2. Ket noi Render Web Service voi repo.
3. Cau hinh env variables trong Render Dashboard.
4. Deploy.

**Frontend (Cloudflare Pages):**
1. `npm run build` trong `frontend/`.
2. Deploy thu muc `frontend/dist_new/`.
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

## Dinh huong thiet ke

Moi quyet dinh code phai giu dung nguyen tac:

- Be la nguoi dung trung tam.
- App la cuoc phieu luu, khong phai bang viec can lam.
- Frontend vui va truc quan — sticker, mau sac, animation.
- Lich la "ban do hanh trinh" khong phai "bang excel".
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

### Cheng 3 (Frontend PWA MVP) — DA XONG

- Route structure day du: `/`, `/select-child`, `/home`, `/schedule`, `/activities`, `/chat`, `/parent`.
- API client tap trung voi auth token.
- State management (Zustand + persist).
- BottomNav 5-tab navigation.
- Demo data fallback cho tat ca cac man hinh.
- Frontend build thanh cong (14 static pages).

### Cheng 3.5 (Frontend Polish) — DA XONG

- Auth UI (login/register Supabase Auth).
- PWA service worker + offline support.
- Loading skeletons + error boundaries.
- DnD components da tao (chua tich hop vao page chinh).
- Page transitions/animations.

### Cheng 4 (Storage + Media) — DA XONG

- Upload avatar/anh hoat dong len Supabase Storage.
- Cloudflare cache asset public.
- Media metadata endpoints.
- AI image generation voi Pollinations.ai fallback.

### Cheng 5 (Deploy Production) — SAN SANG

- Backend Docker tren Render/Fly.io.
- Frontend static export tren Cloudflare Pages.
- Supabase production project.
- Smoke test end-to-end.

### Cheng 7 (He Thong Lich Nang Cap) — CHUA BAT DAU

Tieu chuan hoan thanh:
- 4 cap do xem lich hoat dong: Year, Month, Week, Day.
- Moi o ngay trong Month/Year hien sticker va mau gradient dung theo trang thai.
- Click vao ngay → mo Day View.
- Day View hien timeline hoat dong theo gio.
- Nut check hoan thanh hoat dong trong Day View.
- Nut "Thiet ke lich ngay nay" mo DayDesignModal.
- DayDesignModal co DnD + text + AI + Voice (be + phu huynh rieng biet).
- push_and_run.py co menu chon local hoac cloud.
- Widget lich hom nay tren /home ket noi API that.
- Progress tracking hien dung tren tung cap (progress_day, streak, top_themes).
