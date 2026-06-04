# Deployment

## Kien truc deploy

```text
User
  |
Cloudflare DNS/CDN
  |
  |-- Frontend: Cloudflare Pages
  |
  |-- Backend API: FastAPI server
        |
        |-- Supabase Postgres
        |-- Supabase Auth
        |-- Supabase Storage
        |-- External AI providers
```

## Frontend — Cloudflare Pages (Free Tier)

**Tai sao chon Cloudflare Pages:**
- Free tier khong gioi han bandwidth.
- Ho tro custom domain mien phi.
- CDN toan cau nhanh.
- Phu hop NextJS static export.

**Cau hinh build:**
- Framework preset: `Next.js` (nhung chi static export).
- Build command: `npm run build`.
- Output directory: `dist_new` (cau hinh trong `next.config.js`, doi tu `dist` de tranh xung dot voi process serve).

**Env frontend (khong chua secret backend):**
- `NEXT_PUBLIC_API_BASE_URL=https://kid-adventure-api.onrender.com` (hoac domain backend).
- `NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co`.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...`.

**Quan trong:**
- `next.config.js` phai co `output: 'export'`.
- Khong dung `getServerSideProps` hoac API routes NextJS vi static export khong ho tro.
- Moi API call phai qua backend FastAPI.

## Backend — Render Web Service (Free Tier)

**Tai sao chon Render:**
- Free tier Web Service ho tro Docker.
- Deploy tu Git repo tu dong.
- Dung Dockerfile san co, khong can chinh sua nhieu.

**Nhuoc diem free tier:**
- Instance se sleep sau 15 phut khong co request.
- Cold start ~30-60 giay cho request dau tien sau khi sleep.
- Neu can uptime cao hon, dung Fly.io hoac upgrade Render.

**Cach deploy len Render:**
1. Dang ky render.com, ket noi Git repo.
2. Tao `New Web Service`.
3. Chon repo, nhanh (branch).
4. Runtime: `Docker`.
5. Root directory: `backend`.
6. Dockerfile path: `backend/Dockerfile`.
7. Add environment variables tu `.env.example` (dien gia tri that tren dashboard).
8. `CORS_ORIGINS` phai bao gom domain Cloudflare Pages (vi du: `https://kid-adventure-planner.pages.dev,http://localhost:3000`).
9. Deploy.

**Env backend tren Render:**
- `APP_ENV=production`
- `CORS_ORIGINS=https://your-frontend.pages.dev,http://localhost:3000`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `SECRET_KEY`
- `AI_KEY_ENCRYPTION_KEY`
- `OPENAI_API_KEY`, `GEMINI_API_KEY`, ... (cac key da test thanh cong).

## Backend — Fly.io (Tuy chon, on dinh hon)

**Tai sao chon Fly.io:**
- Free credit $5/thang, du chay app nho 24/7.
- Khong bi sleep nhu Render free.
- Gan server o Singapore/Tokyo, latency tot cho VN.

**Cach deploy:**
1. Cai `flyctl`.
2. Chay `fly launch` trong thu muc `backend/`.
3. Chon app name, region (singapore hoac hkg).
4. `fly deploy`.
5. Cau hinh secrets: `fly secrets set KEY=VALUE`.

Da co file `fly.toml` trong `backend/` de tao san cau hinh.

## Supabase (Free Tier)

**Cai dat:**
1. Tao project moi tren supabase.com.
2. Vao SQL Editor, chay migration tu `supabase/migrations/0001_initial.sql`.
3. Vao Authentication -> Providers -> Email, bat `Confirm email` (tuy chon).
4. Lay `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` tu Project Settings -> API.
5. Lay `SUPABASE_JWT_SECRET` tu Project Settings -> API -> JWT Settings.

**Storage buckets can tao:**
- `avatars`: cho avatar be.
- `activities`: cho anh hoat dong.
- `themes`: cho anh chu de.

## Cloudflare

**Can cau hinh:**
- Domain (tuy chon, co the dung subdomain `.pages.dev` mien phi).
- Pages project ket noi Git repo.
- Neu dung custom domain, them DNS record A/CNAME den backend.

## Checklist deploy lan dau

- [ ] Supabase project created + migration run.
- [ ] Storage buckets created.
- [ ] Backend deployed (Render hoac Fly.io).
- [ ] `GET https://backend-domain/health` tra ve OK.
- [ ] Frontend build local thanh cong voi `output: 'export'`.
- [ ] Frontend deployed tren Cloudflare Pages.
- [ ] Frontend goi duoc API backend (check CORS).
- [ ] Auth dang ky/dang nhap hoat dong.
- [ ] Khong co API key AI trong frontend bundle.
- [ ] RLS bat tren cac bang nhay cam.
- [ ] CORS chi cho domain frontend.
- [ ] Backend `/health` chay duoc.
- [ ] Log loi khong lo secret.

## Checklist production bao mat

- Khong co API key trong frontend.
- RLS bat.
- CORS chi cho domain frontend.
- Backend co `/health`.
- Log loi khong lo secret.
- Backup database.
- Test upload/download storage.
- Test AI provider.
