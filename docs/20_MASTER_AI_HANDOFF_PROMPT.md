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

### Quyet dinh deploy free tier (moi)

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

## Tai lieu can doc theo thu tu

Doc dung thu tu nay de tiet kiem context:

1. `19_implementation_progress.md`
   - Trang thai hien tai.
   - Checklist cheng tiep theo.
   - Known issues.
   - Quota note.

2. `00_project_overview.md`
   - Muc tieu, nguoi dung, stack, MVP.

3. `17_backend_module_links.md`
   - Graph lien ket module backend.
   - Thu muc backend can tao.
   - Dependency giua modules.

4. `18_app_flow_graph.md`
   - Flow tong the app.
   - Flow AI tao lich.
   - Flow chat AI.
   - Flow upload anh.
   - Flow test provider.

5. `09_database_schema.md`
   - Bang Supabase/Postgres MVP.
   - RLS va quan he du lieu.

6. `10_backend_architecture.md`
   - API backend FastAPI.
   - Module backend.
   - Bao mat.

7. `12_api_provider_system.md`
   - Provider adapter.
   - Provider registry.
   - Logging.

8. `16_runtime_key_integration.md`
   - Ket qua test key.
   - Env names.
   - Provider nao da test thanh cong.
   - Tuyet doi khong copy raw key vao code/docs.

Chi doc cac file khac khi dang lam dung module do:

- UI/UX: `02_ui_ux_design.md`.
- User flow: `03_user_flow.md`.
- Child experience: `04_child_experience.md`.
- AI context: `05_ai_system.md`.
- Activity library: `06_activity_library.md`.
- Schedule: `07_schedule_system.md`.
- Audio/voice: `08_audio_voice_system.md`.
- Admin: `11_admin_panel.md`.
- Storage: `13_storage_system.md`.
- Deployment: `14_deployment.md`.
- Roadmap: `15_mvp_roadmap.md`.

## Trang thai hien tai

Da hoan thanh:

- Doc `MOTA.txt`.
- Doc `TRIETLYTHIETKE.txt`.
- Tao bo tai lieu `/docs/00` den `/docs/20`.
- Test provider key tu `seeyeahall ALL key.txt` bang endpoint nhe, khong in secret.
- Chot kien truc Cloudflare Pages + FastAPI + Supabase.
- Chot flow backend, app graph va progress tracker.
- Scaffold backend FastAPI MVP (health, routes, provider interface).

Chua bat dau / Dang tiep tuc:

- Source code frontend (can scaffold de deploy Cloudflare Pages).
- Supabase migration SQL.
- Config deploy production (Render/Fly.io).
- Frontend-Backend integration.

Buoc tiep theo nen lam:

> Cheng 2.5: scaffold frontend + deploy config de co the push len server va chay ngay.
> Hoac Cheng 3: Supabase migration + noi database layer cho backend.

## Lenh tong the cho AI tiep theo

Truoc khi bat dau bat ky buoc fix code nao, phai thuc hien `Context/Quota Gate`.

### Context/Quota Gate bat buoc

1. Kiem tra quota/context con lai ma UI/session bao cao.
2. Uoc luong pham vi buoc sap lam:
   - Nho: doc 1-3 file, sua 1-2 file, test nhanh.
   - Vua: doc nhieu module, sua 3-8 file, chay test lien quan.
   - Lon: tao module moi, sua frontend/backend/database, can doc nhieu docs.
3. Chi bat dau neu quota/context con lai du cho ca 3 viec:
   - Doc tai lieu/code can thiet.
   - Sua code.
   - Test va cap nhat docs handoff.
4. Neu khong du, khong duoc bat dau fix nua. Hay:
   - Ghi lai trang thai vao `19_implementation_progress.md` neu co the.
   - De xuat chia nho buoc.
   - Bao user nen mo thread moi hoac tang quota/context.

Nguong thuc dung:

- Con tren 60%: co the lam buoc vua, nhung khong nen lam full app.
- Con 30-60%: chi lam buoc nho/vua co gioi han ro.
- Con 15-30%: chi fix nho, doc it file, test nhanh.
- Con duoi 15%: khong bat dau fix code moi; chi tong ket va cap nhat handoff.

Hay tiep tuc theo thu tu uu tien deploy:

**Neu chua co frontend skeleton:**
1. Tao thu muc `frontend/` voi NextJS + Tailwind + static export.
2. Tao trang landing don gian va trang health check goi backend.
3. Cau hinh `next.config.js` voi `output: 'export'` de deploy Cloudflare Pages.
4. Tao `package.json`, `tsconfig.json`, `tailwind.config.ts`.

**Neu chua co deploy config:**
5. Tao `render.yaml` cho Render Web Service (free tier Docker deploy).
6. Tao `fly.toml` cho Fly.io (tuy chon, on dinh hon).
7. Cap nhat `Dockerfile` neu can build args hoac health check.
8. Cap nhat `backend/app/core/config.py` cho CORS production.

**Neu chua co database migration:**
9. Tao `supabase/migrations/0001_initial.sql` theo `09_database_schema.md`.
10. Tao `supabase/seed.sql` cho activity mau (khong seed secret).

**Sau khi co deploy config:**
11. Tao script `scripts/deploy-render.sh` hoac huong dan deploy.
12. Cap nhat `14_deployment.md` voi huong dan tung buoc.
13. Cap nhat `19_implementation_progress.md`.

Neu quota hoac thoi gian han che, uu tien:
- Frontend skeleton tối thiểu + static export.
- `render.yaml` + update Dockerfile.
- Migration SQL.
- Cap nhat docs deploy.

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
- Tao helper script local neu can, nhung output phai redact secret.

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

## Tieu chuan hoan thanh cheng 2

Cheng 2 duoc xem la xong khi:

- Co `backend/` chay duoc FastAPI.
- `GET /health` tra ve OK.
- Co `.env.example`.
- Co module skeleton dung kien truc.
- Co provider adapter interface.
- Co API route skeleton cho MVP.
- Co test/smoke test toi thieu.
- `19_implementation_progress.md` duoc cap nhat.
