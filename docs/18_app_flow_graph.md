# App Flow Graph

## Flow Tong The App

```
[Khoi dong]
     |
     v
[/select-child] → Chon be / Them be / Vao phu huynh
     |
     +-- Chon be
     |        |
     |        v
     |   [/home] ─────────────────────────────────────────┐
     |      |                                              |
     |      ├── Widget lich hom nay → [/schedule Day View] |
     |      ├── Nut chat AI → [/chat]                     |
     |      ├── Xem thu vien → [/activities]              |
     |      └── BottomNav luon hien                       |
     |                                                    |
     v                                                    v
[/schedule] ←───────────────────────────── (BottomNav)
     |
     ├── Year View ──────────── click thang ──→ Month View
     ├── Month View ─────────── click ngay ───→ Day View
     ├── Week View ──────────── click tab ────→ Day View
     └── Day View
              |
              ├── Check hoan thanh ──→ Reward popup ──→ XP/Coins
              └── Nut "Thiet ke" ──→ [DayDesignModal]
                                          |
                                          ├── Keo tha (DnD)
                                          ├── Nhap text
                                          ├── AI goi y (chat)
                                          ├── Voice be (STT)
                                          └── Voice phu huynh (STT)

[/activities] ← BottomNav
     |
     ├── Filter + Search
     ├── Chi tiet activity (modal)
     └── "Them vao lich" ──→ DayDesignModal

[/chat] ← BottomNav
     |
     ├── Chat AI dong hanh (context-aware)
     ├── Voice STT (be noi)
     ├── TTS (AI doc lai)
     └── Quick action: "Tao lich tuan" ──→ AI generate → /schedule

[/parent] ← BottomNav
     |
     ├── Bao cao tien do (tuan/thang/nam)
     ├── Quan ly AI provider
     ├── Quan ly be
     ├── Thu vien hoat dong (CRUD)
     └── Chuyen doi nguoi choi
```

## Flow He Thong Lich 4 Cap

```
YEAR VIEW (grid 12 thang)
    |── Moi thang: mau gradient + sticker + %
    └── Click thang → MONTH VIEW

MONTH VIEW (grid 4-5 hang x 7 cot)
    |── Moi o ngay: nen gradient + sticker + so HT + icon chu de
    |── Hom nay: vien cam
    └── Click ngay → DAY VIEW

WEEK VIEW (tab 7 ngay ngang)
    |── Moi tab: sticker + % + chu de
    |── Phan chinh: timeline ngan ngay dang chon
    └── Click tab → DAY VIEW

DAY VIEW (timeline theo gio)
    |── Activity card: gio | ten | emoji | status | nut check | nut sua
    |── Nut check ✅ → REWARD FLOW
    └── Nut "Thiet ke" → DAYDESIGNMODAL
```

## Flow DayDesignModal (Che Do Thiet Ke)

```
[Day View] → bam "🎨 Thiet ke lich ngay nay"
    |
    v
[DayDesignModal] (Bottom Sheet slide len)
    |
    ├── [ActivityPool] (ngang phia tren, scroll)
    |       drag ─────────────────→
    |                              |
    ├── [DayTimeline] (slot theo gio)  ← drop zone sang len
    |       |
    |       └── Activity card (draggable, reorderable)
    |
    ├── [Text Input] "Ten HĐ + gio + thoi luong" → Enter → them
    |
    ├── [🤖 AI Goi y]
    |       → POST /api/v1/ai/chat (context: ngay, gio trong)
    |       → AI tra ve danh sach goi y
    |       → Hien preview cards (check de them)
    |
    ├── [🎤 Be noi]
    |       → Web Speech API (STT)
    |       → Text → POST /api/v1/ai/chat
    |       → AI xu ly → goi y danh sach
    |       → Be confirm
    |
    ├── [🎤 Phu huynh noi]
    |       → Web Speech API (STT, nut rieng biet)
    |       → Text → POST /api/v1/ai/chat (role: parent)
    |       → AI xu ly lenh phuc tap → chia thanh nhieu activity
    |       → Preview → Confirm
    |
    └── [✅ Luu lich ngay]
            → POST /api/v1/schedules (tao moi neu chua co)
            → POST /api/v1/schedules/{id}/items (tung item)
            → Dong modal, Day View cap nhat
```

## Flow AI Tao Lich

```
[Trigger] (tu /chat hoac /schedule)
    |
    v
POST /api/v1/ai/generate-schedule
    |
    ├── Backend nap context: child profile, lich cu, activity history
    ├── Gui prompt → AI provider (Gemini / OpenAI / ...)
    ├── AI tra ve JSON {items: [...]}
    ├── Backend validate: thoi luong, do tuoi, trung gio, can phu huynh
    └── Frontend hien preview tung ngay
              |
              ├── Chap nhan → luu toan bo
              ├── Sua tung ngay → mo DayDesignModal tung ngay
              └── Huy → khong luu
```

## Flow AI Chat (Context-aware)

```
[/chat] nguoi dung nhap hoac noi
    |
    v
POST /api/v1/ai/chat
    |
    ├── AIContextBuilder nap:
    |       - Child profile (ten, tuoi, so thich)
    |       - Lich hom nay (schedule_items)
    |       - 5 tin nhan gan nhat (chat history)
    |       - XP/coins hien tai
    |       - Hoat dong da lam gan day
    |
    ├── Build system prompt co context
    ├── Gui len AI provider (retry 3 lan, timeout 30s)
    ├── Luu history vao DB
    └── Tra ve reply → frontend hien thi
             |
             └── TTS: speechSynthesis doc reply (neu bat)
```

## Flow Phan Thuong (Rewards)

```
Be bam ✅ check hoan thanh
    |
    v
Optimistic UI update (trang thai → completed, ngay)
    |
    ├── POST /api/v1/rewards/complete-activity
    |       → Update schedule_item.status = 'completed'
    |       → Cong XP (default 15) + Coins (default 5)
    |       → Ghi activity_history
    |       → Kiem tra dieu kien huy hieu
    |
    ├── Frontend: popup "+15 XP 🎉" + confetti animation
    ├── Cap nhat progress_day → doi sticker neu du nguong
    └── Neu mo khoa huy hieu: hien badge popup
```

## Flow Upload Media

```
[ImageUploader component]
    |
    v
POST /api/v1/media/sign-upload
    → Nhan signed URL + token
    |
    v
PUT signed_url (upload truc tiep len Supabase Storage)
    |
    v
POST /api/v1/media/confirm-upload
    → Luu metadata vao DB
    → Cloudflare cache URL public
    |
    v
Hien anh moi tren UI
```

## Flow Script Khoi Dong (push_and_run.py)

```
push_and_run.bat
    |
    v
python push_and_run.py
    |
    v
[Menu tuong tac]
    ├── [1] Chay LOCAL → goi local_dev.py
    |           → Kill port 8001 + 3000 neu dang chiem
    |           → Tao .env neu chua co (DEV_MODE=true)
    |           → Start uvicorn (backend port 8001)
    |           → Start npm dev (frontend port 3000)
    |           → Smoke test 3 endpoint
    |           → Mo browser localhost:3000
    |           → Giu chay den Ctrl+C
    |
    ├── [2] Push Cloud → git add + commit + push + fly deploy
    |           → Mo browser production URL
    |
    ├── [3] Test backend → start backend only + smoke test
    |
    └── [4] Thoat
```

## Flow Dev Mode (Khong Co Supabase)

```
Backend nhan request
    |
    ├── Kiem tra: co SUPABASE_URL trong env khong?
    |       → Khong → DEV_MODE = True
    |
    ├── DEV_MODE = True:
    |       → Tat ca GET endpoint tra ve demo data
    |       → POST/PATCH tra ve success (khong ghi DB that)
    |       → Auth: bat ky Bearer token → chap nhan
    |       → Demo family ID: 11111111-1111-1111-1111-111111111111
    |
    └── DEV_MODE = False:
            → Ket noi Supabase that
            → Validate JWT that
            → Ghi/doc DB that
```

## Flow Tien Do (Progress Tracking)

```
Moi lan schedule_item duoc check completed:
    |
    ├── Tinh progress_day = completed / total * 100
    ├── Xac dinh sticker_day theo nguong (xem 07_schedule_system.md)
    ├── Cap nhat progress_week
    ├── Cap nhat streak (so ngay lien tiep co it nhat 1 completed)
    └── Emit event → frontend re-render Month/Week/Year dot/sticker

Parent Dashboard (/parent):
    |
    ├── GET /api/v1/children/{id}/stats?period=week
    ├── GET /api/v1/children/{id}/stats?period=month
    ├── GET /api/v1/children/{id}/stats?period=year
    └── Hien bieu do cot + radar + streak badge
```
