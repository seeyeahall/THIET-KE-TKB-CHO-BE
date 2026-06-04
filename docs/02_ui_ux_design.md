# UI/UX Design

## Nguyen tac giao dien

- Frontend la trung tam.
- Be thao tac bang hinh anh, card lon, nut ro rang, emoji va sticker.
- It chu, uu tien bieu tuong, mau sac va anh minh hoa.
- Khong tao cam giac dashboard doanh nghiep.
- Thoi khoa bieu phai giong ban do phieu luu, khong phai bang cong viec.
- Moi trang thai co feedback truc quan: mau sac, animation, am thanh nho.
- Card, nut va vung cham phai lon (min 44px) — be dung tay tap.

## He Thong Mau Sac (Kid Color System)

```
kid-green  : #4ADE80  — thien nhien, hoan thanh, tich cuc
kid-yellow : #FDE047  — nang luong, phan thuong, highlight
kid-blue   : #60A5FA  — kham pha, hoc tap, calm
kid-orange : #FB923C  — hanh dong, CTA, chu de
kid-pink   : #F472B6  — sang tao, nghe thuat, vui
```

Gradient de su dung:
- `kid-green → kid-yellow` cho tien do cao
- `kid-orange → kid-yellow` cho CTA chinh
- `kid-blue → kid-green` cho chu de kham pha

## He Thong Sticker Ngay (Day Sticker System)

Moi ngay trong lich duoc gan 1 sticker phan anh trang thai:

| Sticker | Y nghia | Mau nen |
|---|---|---|
| 🌟 | Hoan thanh 100% | Xanh la dam + glow |
| ⭐ | Hoan thanh >= 80% | Xanh la sang |
| 🌱 | Dang tien hanh 30–79% | Vang nhat |
| 📅 | Da len lich, chua lam | Xanh duong nhat |
| ✏️ | Chua len lich day du | Xam nhat, vien dash |
| 😴 | Ngay da qua, bo trong | Trang xam |
| 🔥 | Streak >= 3 ngay | Vien cam noi bat (them vao sticker chinh) |

Sticker duoc hien thi tren:
- Month View: goc tren phai moi o ngay
- Week View: duoi ten ngay trong thanh tab
- Year View: hien sticker nho tren o thang

## Man Hinh Chinh

### /select-child — Chon Nguoi Choi

Muc tieu: be chon ho so cua minh that nhanh.

Thanh phan:
- Logo/ten ung dung + tagline vui
- Danh sach avatar be (card lon, ten to, mau yeu thich)
- Nut them be moi
- Nut phu huynh (goc tren phai, icon nho)

### /home — Trang Chu Cua Be

Muc tieu: be thay ngay hom nay co gi vui va dang lam gi.

Thanh phan:
- Avatar + ten be + loi chao theo gio (Buoi sang / Chieu / Toi)
- Chu de hom nay (card lon, mau = chu de, emoji to)
- Widget "Lich hom nay": 2–3 hoat dong sap toi hoac dang den gio
  - Moi item: gio + ten hoat dong + nut check hoan thanh nhanh
- Tien do hom nay: progress bar + "X/Y hoat dong"
- XP hien tai + coins (badge goc tren)
- Nut to "Noi chuyen voi AI" → /chat
- Nut "Xem lich day du" → /schedule (Day View hom nay)

### /schedule — He Thong Lich 4 Cap

Xem chi tiet trong `07_schedule_system.md`. Tom tat:

**Thanh dieu huong view:** [Nam] [Thang] [Tuan] [Ngay]

#### Year View
- Grid 12 thang (4×3)
- Moi thang: o vuong mau gradient + sticker tong ket + % trung binh
- Badge tong nam: tong hoat dong, streak dai nhat, top chu de

#### Month View  
- Grid lich 4–5 hang × 7 cot
- Moi o ngay: nen gradient mau theo %, sticker goc tren, so hoat dong, icon chu de
- Hom nay: vien cam noi bat
- Footer: progress bar thang + top 3 chu de
- **Click vao ngay → Day View**

#### Week View
- Thanh tab 7 ngay ngang (Mon–Sun)
- Moi tab: sticker + % + chu de
- Phan chinh: timeline ngan cua ngay dang chon
- Progress bar tuan, chu de tuan, streak
- **Click vao tab ngay → Day View**

#### Day View
- Header: ten ngay + ngay/thang + sticker + chu de + % hoan thanh
- Timeline theo gio (06:00–21:00)
- Moi activity card:
  - Gio bat dau | Ten hoat dong | Emoji | Thoi luong
  - Trang thai badge (planned / done / skip)
  - Nut ✅ Check hoan thanh (be bam sau khi xong)
  - Nut ✏️ Chinh sua nhanh
- Empty state: "Ngay nay chua co lich — thiet ke di nao! 🗺️"
- **Nut chinh: "🎨 Thiet ke lich ngay nay" → mo DayDesignModal**
- Navigation: < ngay truoc | ngay sau >

### DayDesignModal — Che Do Thiet Ke Lich Ngay

Mo bang bottom sheet slide len (mobile-native feel).
Chi cho phep sua ngay hom nay hoac tuong lai.

**Giao dien:**
```
┌─────────────────────────────────────────┐
│  🎨 Thiet ke: Thu 3, 03/06/2026        │
│  ────────────────────────────────────── │
│  [ActivityPool - keo tu day]            │
│  📚 Doc sach  🎨 Ve tranh  ⚽ Bong da  │
│  ────────────────────────────────────── │
│  Timeline ngay:                         │
│  07:00 [ tha hoat dong vao day ]       │
│  07:30 [ tha hoat dong vao day ]       │
│  08:00 ┌── 📚 Doc sach (30 phut) ──┐   │
│  08:30 └───────────────────────────┘   │
│  09:00 [ tha hoat dong vao day ]       │
│  ────────────────────────────────────── │
│  [🎤 Be noi] [Nhap ten hoat dong...] [🤖] │
│  [           ✅ Luu lich ngay          ] │
└─────────────────────────────────────────┘
```

**3 cach them hoat dong:**
1. Keo tha tu ActivityPool vao slot gio
2. Nhap text: ten + gio + thoi luong
3. AI + Voice:
   - 🤖 Chat ngan voi AI de tao goi y
   - 🎤 "Be noi": STT → AI → danh sach goi y → be confirm
   - 🎤 "Phu huynh noi": nut rieng → phu huynh ra lenh → tao lich

### /activities — Thu Vien Hoat Dong

Muc tieu: be/phu huynh tim hoat dong theo chu de.

Thanh phan:
- Filter ngang: chu de (emoji + ten), do tuoi, thoi luong
- Grid card hoat dong (2 cot tren mobile, 3 tren tablet)
- Moi card: anh/emoji to, ten, thoi luong, badge chu de, badge do kho
- Chi tiet hoat dong (modal): mo ta, nguyen vat lieu, huong dan ngan, badge "can phu huynh"
- Nut "Them vao lich ngay nay" → chuyen sang DayDesignModal

### /chat — AI Dong Hanh

Muc tieu: tro chuyen va xin goi y theo context cua be.

Thanh phan:
- Khung chat messenger style
- AI biet ten be, so thich, lich hom nay, lich su hoat dong
- Goi y cau hoi nhanh (chip): "Hom nay minh lam gi?", "Goi y hoat dong vui", "Dat lich giup con"
- Nut microphone (be noi bang giong)
- Nut loa (AI doc lai tra loi)
- Typing indicator khi AI dang suy nghi

### /parent — Dashboard Phu Huynh

Muc tieu: phu huynh quan ly va theo doi.

Thanh phan:
- Tong quan nhanh: tong be, hoat dong tuan, XP tich luy
- Chon be de xem bao cao
- Bao cao tien do: progress theo tuan/thang/nam (bieu do cot + radar)
- Lich tuan hien tai cua be (read-only, link sang /schedule)
- Quan ly AI provider: nhap key, kiem tra ket noi
- Quan ly hoat dong: them/sua/xoa activity trong library
- Chuyen doi nguoi choi

## Responsive

- Mobile-first (6–10 tuoi dung dien thoai / tablet)
- Desktop phuc vu phu huynh quan ly
- Bottom navigation (5 tab) tren mobile
- Sidebar navigation tren desktop (neu can)
- Tat ca nut touch phai >= 44×44px

## Animation va Micro-interaction

- Page transition: fade-in-up nhe (150ms)
- Card hover: scale(1.02) + shadow nhe
- Button press: scale(0.97)
- Activity complete: confetti nho + XP float len
- Sticker appear: bounce nhe khi duoc mo khoa
- Progress bar: animate width tu 0 → gia tri thuc
- Drop zone DnD: glow + border dash khi co item dang keo den

## Typography

- Font: Inter (Google Fonts) hoac Nunito (kid-friendly, round)
- Heading: font-black (900), size 2xl–4xl
- Body: font-bold (700) cho nhan, font-medium cho noi dung
- Khong dung font-normal cho be — chu can dam va ro
