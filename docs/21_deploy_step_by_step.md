# Huong Dan Deploy Tu A-Z Cho Nguoi Moi Bat Dau

> File nay huong dan tung buoc thao tac that de dua ung dung len server mien phi. Khong can biet lap trinh nang cao, chi can lam dung thu tu.

## Truoc khi bat dau — can chuan bi gi

1. **May tinh** co trinh duyet (Chrome/Firefox/Edge).
2. **Tai khoan email** de dang ky cac dich vu.
3. **Code du an** da co tren may (thu muc `E:\THIET KE TKB CHO BE` hoac noi ban luu).
4. Trinh duyet mo san 4 tab:
   - [github.com](https://github.com)
   - [supabase.com](https://supabase.com)
   - [render.com](https://render.com)
   - [cloudflare.com](https://cloudflare.com)

---

## Buoc 1: Dua code len GitHub (de server tu dong lay)

Muc dich: Render va Cloudflare Pages se tu dong lay code tu GitHub moi khi ban cap nhat.

### 1.1 Tao tai khoan GitHub
- Vao [github.com](https://github.com), bam **Sign up**, dung email cua ban.
- Xac nhan email, dang nhap.

### 1.2 Tao kho luu tru (repository) moi
- Tren GitHub, bam nut **+** (goc phai tren) → **New repository**.
- **Repository name**: `kid-adventure-planner`.
- Chon **Public** (mien phi, ai cung xem duoc code — nhung da loai bo secret roi nen khong sao).
- Bo chon "Add a README".
- Bam **Create repository**.

### 1.3 Tai code len GitHub bang Git Bash

**Mo Git Bash** (nhan chuot phai vao thu muc du an → chon `Git Bash Here`).

Chay tung lenh sau (copy roi chuot phai vao cua so Git Bash de paste):

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/TEN_CUA_BAN/kid-adventure-planner.git
git push -u origin main
```

**Thay `TEN_CUA_BAN` bang ten nguoi dung GitHub cua ban.**

Neu hoi mat khau, dung **Personal Access Token** (xem phu luc duoi) thay vi mat khau GitHub thong thuong.

**Kiem tra:** Vao lai trang GitHub, refresh — ban se thay tat ca file code da xuat hien.

---

## Buoc 2: Tao database tren Supabase (mien phi)

Muc dich: Day la noi luu du lieu be, lich, hoat dong, tai khoan.

### 2.1 Tao tai khoan Supabase
- Vao [supabase.com](https://supabase.com), bam **Start your project**.
- Dang ky bang email (co the dung chung email GitHub).
- Chon **Continue with GitHub** cho nhanh.

### 2.2 Tao project moi
- Bam **New project**.
- Chon to chuc (organization) mac dinh.
- **Name**: `kid-adventure`.
- **Database Password**: dat mot mat khau manh, **ghi lai vao Notepad** — se can sau.
- **Region**: chon `Southeast Asia (Singapore)` gan Viet Nam nhat.
- Bam **Create new project** — doi khoang 2 phut.

### 2.3 Chay file tao bang (migration)
- Vao project vua tao → menu ben trai chon **SQL Editor**.
- Bam **New query**.
- Mo file tren may: `supabase/migrations/0001_initial.sql`.
- Copy toan bo noi dung file → paste vao khung SQL Editor tren Supabase.
- Bam **Run** — doi cho den khi hien thong bao xanh "Success".

**Kiem tra:** Menu ben trai → **Table Editor** — ban se thay cac bang: `activities`, `children`, `families`, ... xuat hien.

### 2.4 Them du lieu mau (seed)
- Trong **SQL Editor**, tao query moi.
- Mo file `supabase/seed.sql` tren may → copy toan bo → paste vao → **Run**.

**Kiem tra:** Vao **Table Editor** → chon bang `activities` — se thay 5 hoat dong mau.

### 2.5 Lay thong tin ket noi (quan trong)
- Vao project → menu tren cung **Project Settings** → **API**.
- Ghi lai 3 thong tin nay vao Notepad:
  - **URL**: `https://xxxx.supabase.co`
  - **anon public**: `eyJ...` (dai, bat dau bang `eyJ`)
  - **service_role secret**: `eyJ...` (co nhan cua service_role — **rat quan trong, dung lo cho ai**)

https://ypfyanoqliynjiywuukv.supabase.co
sb_publishable_XjKdpkF-FPmLc_8aU3wTig_fR3epLYs
supabase login
supabase init
supabase link --project-ref ypfyanoqliynjiywuukv

anon public
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
service_role secret
YOUR_SERVICE_ROLE_SECRET_KEY

Publishable key
Name	API Key
default YOUR_PUBLISHABLE_KEY

Secret keys
Name	API Key
default YOUR_SECRET_KEY
---

Project name
ypfyanoqliynjiywuukv
Project ID
ypfyanoqliynjiywuukv
Project region
ap-northeast-1

Northeast Asia (Tokyo)



## Buoc 3: Deploy backend len Render (mien phi)

Muc dich: Dua may chu Python FastAPI len internet de frontend goi duoc.

### 3.1 Dang ky Render
- Vao [render.com](https://render.com), bam **Get started for free**.
- Dang ky bang email hoac **Continue with GitHub** (khuyen dung).

### 3.2 Tao Web Service moi
- Sau khi dang nhap, bam nut **New +** (goc tren) → **Web Service**.
- Chon repo `kid-adventure-planner` vua tao o Buoc 1.
- Bam **Connect**.

### 3.3 Cau hinh dich vu
- **Name**: `kid-adventure-api`.
- **Region**: chon `Singapore`.
- **Branch**: `main`.
- **Runtime**: chon **Docker**.
- **Root Directory**: nhap `backend`.
- Docker Command: de trong (tu dong dung Dockerfile).
- **Instance Type**: de mac dinh `Free`.

### 3.4 Them bien moi truong (Environment Variables)

Bam nut **Advanced** → **Add Environment Variable**. Them tung bien sau:

| Key | Value | Ghi chu |
|---|---|---|
| `APP_ENV` | `production` | |
| `API_PREFIX` | `/api/v1` | |
| `CORS_ORIGINS` | `http://localhost:3000,https://kid-adventure-planner.pages.dev` | Sau nay thay domain Pages that vao |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | Tu Buoc 2.5 |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Tu Buoc 2.5 (service_role) |
| `SUPABASE_JWT_SECRET` | `tim-trong-JWT-Settings` | Xem duoi |
| `SECRET_KEY` | `mot-chuoi-ngau-nhien-dai` | Tu dat, tren 32 ky tu |
| `GEMINI_API_KEY` | `AI...` | Tu file key da test |
| `DEEPSEEK_API_KEY` | `sk-...` | Tu file key da test |

**Lay SUPABASE_JWT_SECRET:**
- Vao Supabase project → **Project Settings** → **API** → cuon xuong **JWT Settings** → **JWT Secret**.
- Copy gia tri do vao bien `SUPABASE_JWT_SECRET` tren Render.

**Cac key AI:** Mo file `seeyeahall ALL key.txt`, lay cac key da test thanh cong (Gemini #2-#6, DeepSeek #1, v.v.).

### 3.5 Deploy
- Bam **Create Web Service**.
- Doi khoang 3-5 phut de build lan dau.
- Khi hien **"Your service is live"**, bam vao link co dang `https://kid-adventure-api.onrender.com`.

**Kiem tra:** Mo link do tren trinh duyet, them `/health` vao cuoi → ban se thay:
```json
{"status":"ok","service":"Kid Adventure Planner API","env":"production"}
```

**Neu loi:** Vao tab **Logs** tren Render de xem ly do (thuong thieu env hoac sai gia tri).

---

## Buoc 4: Deploy frontend len Cloudflare Pages (mien phi)

Muc dich: Dua trang web len internet de be va phu huynh truy cap.

### 4.1 Dang ky Cloudflare
- Vao [cloudflare.com](https://cloudflare.com), bam **Sign Up**.
- Dang ky bang email, xac nhan.

### 4.2 Tao Pages project
- Dang nhap → menu ben trai chon **Pages**.
- Bam **Create a project**.
- Chon tab **Connect to Git**.
- Ket noi tai khoan GitHub → chon repo `kid-adventure-planner`.
- Bam **Begin setup**.

### 4.3 Cau hinh build
- **Project name**: `kid-adventure-planner`.
- **Production branch**: `main`.
- **Framework preset**: chon **Next.js**.
- **Build command**: thay thanh `cd frontend && npm install && npm run build`.
- **Build output directory**: nhap `frontend/dist`.

### 4.4 Them bien moi truong
- Bam **Add environment variable**:
  - `NODE_VERSION` = `20`
  - `NEXT_PUBLIC_API_BASE_URL` = `https://kid-adventure-api.onrender.com` (link tu Buoc 3.5)
  - `NEXT_PUBLIC_SUPABASE_URL` = `https://xxxx.supabase.co` (tu Buoc 2.5)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJ...` (anon key tu Buoc 2.5)

### 4.5 Deploy
- Bam **Save and Deploy**.
- Doi 2-3 phut build.

**Kiem tra:** Khi xong, Cloudflare se cho mot link dang `https://kid-adventure-planner.pages.dev`. Mo len se thay trang chu vui ve cua app.

**Thu nghiem:** Bam nut **"Kiểm tra API"** — neu backend dang chay, se hien xanh "API hoạt động".

---

## Buoc 5: Ket noi frontend va backend (quan trong)

Sau khi co domain that cua frontend, ban phai cho backend biet de backend chap nhan ket noi.

### 5.1 Lay domain that cua frontend
- Copy link Cloudflare Pages, vi du: `https://kid-adventure-planner.pages.dev`.

### 5.2 Cap nhat Render
- Vao [render.com](https://render.com) → chon service `kid-adventure-api`.
- Tab **Environment** → tim bien `CORS_ORIGINS`.
- Sua gia tri thanh: `https://kid-adventure-planner.pages.dev,http://localhost:3000`.
- Bam **Save Changes** — Render se tu dong deploy lai (doi 1 phut).

### 5.3 Kiem tra lai
- Mo frontend → bam **"Kiểm tra API"** → phai hien xanh.
- Neu van do, thu refresh trang hoac doi 30 giay roi thu lai.

---

## Buoc 6: Cac buoc sau deploy

### 6.1 Them bao mat (khuyen cao)
- Vao Supabase → **Authentication** → **Providers** → bat **Email**.
- Bat **Confirm email** neu muon bao mat cao hon.

### 6.2 Tuy chinh ten mien (domain rieng)
- Neu muon ten dep hon nhu `kidplanner.vn`:
  - Mua ten mien tai tenten.vn hoac matbao.net.
  - Tren Cloudflare Pages → **Custom domains** → them ten mien.
  - Tren Render → **Settings** → **Custom Domain** → them ten mien.

### 6.3 Backup du lieu
- Supabase tu dong backup hang ngay tren free tier.
- Ban cung co the vao **Database** → **Backups** de khoi phuc neu loi.

---

## Phu luc: Loai bo secret khoi code truoc khi push

Chay doan nay trong Git Bash de dam bao khong day file secret len GitHub:

```bash
# dam bao file secret khong bi commit
cat .gitignore
```

Neu chua co dong `*.txt` hoac ten file secret, them vao:

```bash
echo "*.txt" >> .gitignore
echo ".env" >> .gitignore
git add .gitignore
git commit -m "chore: ignore secrets"
git push
```

**File `seeyeahall ALL key.txt` chua cac key AI that — tuyet doi khong duoc push len GitHub.**

---

## Phu luc: Lay GitHub Personal Access Token

Tu nam 2023, GitHub yeu cau dung token thay mat khau khi push tu dong lenh:

1. Tren GitHub → click avatar → **Settings**.
2. Cuon xuong cuoi → **Developer settings** → **Personal access tokens** → **Tokens (classic)**.
3. Bam **Generate new token (classic)**.
4. Dat ten: `deploy-token`.
5. Han: chon **No expiration** hoac **90 days**.
6. Tich chon quyen: **repo** (toan bo).
7. Bam **Generate token** — copy chuoi token hien ra.
8. Khi Git Bash hoi mat khau, paste token nay vao.

---

## Bang tong hop cac link sau khi xong

| Dich vu | Link cua ban | Dung de |
|---|---|---|
| Frontend | `https://kid-adventure-planner.pages.dev` | Be va phu huynh truy cap |
| Backend API | `https://kid-adventure-api.onrender.com/health` | Kiem tra server |
| Supabase | `https://supabase.com/dashboard/project/...` | Quan ly database |
| Render Dashboard | `https://dashboard.render.com` | Quan ly server |
| Cloudflare Pages | `https://dash.cloudflare.com` → Pages | Quan ly website |

---

## Ghi chu cuoi

- **Render free tier** se "ngu" sau 15 phut khong co ai truy cap. Lan dau mo app co the cham 30-60 giay. Neu muon nhanh hon, dung **Fly.io** (co huong dan trong `backend/fly.toml`).
- **Supabase free tier** gioi han 500MB du lieu — du cho hang tram be va lich.
- Moi khi sua code va muon cap nhat server, chi can:
  ```bash
  git add .
  git commit -m "update"
  git push
  ```
  Render va Cloudflare Pages se tu dong cap nhat.
