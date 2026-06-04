# Schedule System

## Muc tieu

He thong lich giup be tu thiet ke ngay/tuan/thang cua minh bang cach chon hoat dong. Lich khong nen giong bang cong viec kho cung, ma nen giong ban do phieu luu trong ngay, tuan, thang.

## 4 Cap Do Xem Lich (Views)

Be va phu huynh co the chuyen doi giua 4 cap do xem:

```
NAM → THANG → TUAN → NGAY
 ↑_________________________________↑
        (click de zoom in/out)
```

### Nam View (Year View)
- Hien thi 12 thang trong nam
- Moi thang = o vuong voi mau gradient phan anh % hoan thanh trung binh
- Badge tong ket: tong hoat dong da lam, streak dai nhat, top chu de nam
- Click vao thang → chuyen sang Month View cua thang do

### Thang View (Month View)
- Grid lich 4–5 hang × 7 cot (Mon–Sun)
- Moi o ngay hien thi:
  - Nen gradient mau theo % hoan thanh (trang → xanh la dam)
  - Sticker/emoji goc tren: trang thai ngay (xem muc Trang thai ngay)
  - So hoat dong: "3/5" o goc duoi
  - Chu de ngay (icon nho)
- Hom nay: vien cam noi bat
- Click vao ngay → mo Day View cua ngay do
- Header: ten thang + nam + nut < > chuyen thang
- Footer: progress bar tong thang + top chu de thang

### Tuan View (Week View)
- Thanh 7 ngay ngang (Mon–Sun), highlight hom nay
- Moi ngay trong thanh: sticker emoji + % hoan thanh + ten chu de
- Phan chinh: hien thi hoat dong cua ngay dang chon (timeline ngan)
- Progress bar tuan: X/Y hoat dong xong (Y%)
- Chu de tuan: xac dinh theo chu de xuat hien nhieu nhat cac ngay trong tuan
- Click vao ngay → chuyen sang Day View

### Ngay View (Day View)
- Header: Ten ngay + ngay/thang + chu de ngay + emoji
- Timeline theo gio (06:00–21:00): moi activity card = 1 hang theo gio
- Moi activity card hien thi:
  - Gio bat dau + thoi luong
  - Ten hoat dong + emoji chu de
  - Trang thai: planned / completed / skipped
  - Nut check hoan thanh (be bam sau khi lam xong)
  - Nut chinh sua nhanh
- Progress ngay: X/Y hoat dong xong
- Nut chinh: "🎨 Thiet ke lich ngay nay" → mo DayDesignModal (Design Mode)
- Empty state: "Ngay nay chua co lich — thiet ke di nao!" + nut tao lich

## Trang Thai Ngay (Day Status) — He Thong Sticker

Thay vi chi dung mau don thuan, dung sticker/emoji de be hieu truc quan:

| Sticker | Y nghia | Mau nen (%HT) |
|---|---|---|
| ⭐ (ngoi sao vang) | Hoan thanh >= 80% | Gradient xanh la sang |
| 🌟 (sao long lanh) | Hoan thanh 100% | Gradient xanh la dam + glow |
| 🌱 (mam non) | Dang tien hanh 30–79% | Gradient vang nhat |
| 📅 (lich) | Da len lich day du, chua lam (0–29%) | Gradient xanh duong nhat |
| ✏️ (but chi) | Lich chua day du (con trong) | Nen xam nhat, vien dash |
| 😴 (ngu) | Ngay da qua, khong lam gi | Nen trang xam |
| 🔥 (lua) | Streak lien tiep >= 3 ngay (them vao ⭐) | Vien cam noi bat |

Quy tac chon sticker: he thong tu dong tinh toan cuoi ngay hoac khi be check hoan thanh.

## Design Mode (Che Do Thiet Ke Lich Ngay)

### Cach vao Design Mode
- Tu Day View: bam nut "🎨 Thiet ke lich ngay nay"
- Tu Month/Week View: bam nut + tren o ngay trong tuong lai
- Design Mode chi mo cho ngay hom nay hoac tuong lai (khong sua ngay da qua)

### Giao dien Design Mode (Bottom Sheet)
- Mo bang bottom sheet slide len tu duoi man hinh (A)
- Phu huynh va be deu co the dung (phan quyen theo login role)

### 3 Phuong Thuc Them Hoat Dong

**1. Keo tha (DnD):**
- ActivityPool hien thi ngang phia tren (horizontal scroll)
- Timeline ngay chia theo slot gio (15 phut / slot)
- Keo activity tu pool → tha vao slot gio
- Keo hoat dong trong timeline → doi slot (reorder)
- Drop zone sang len vang khi dang keo den

**2. Nhap text nhanh:**
- Input box o duoi: "Ten hoat dong + gio bat dau + thoi luong"
- Autocomplete tu activity library
- Nhap xong Enter la them vao timeline

**3. AI goi y + Voice:**
- Nut 🤖 "AI goi y": chat ngan → "Bay gio 3 gio, be muon lam gi?"
- Nut 🎤 Be noi: STT → AI xu ly → tra ve danh sach goi y → be confirm
- Nut 🎤 Phu huynh noi: nut rieng biet → phu huynh ra lenh → tao lich cho be
- AI hieu context (ten be, so thich, lich hien tai, thoi gian con lai)

### Luu va Dong Bo
- Bam "✅ Luu lich ngay" → luu xuong backend
- Khi backend offline: luu localStorage, dong bo sau khi co mang
- Sau khi luu: dong Design Mode, hien Day View da cap nhat

## Tinh Toan Tien Do

### Cap Ngay
```
progress_day = completed_items / total_items * 100
theme_day = theme xuat hien nhieu nhat trong ngay
```

### Cap Tuan
```
progress_week = sum(completed_items cac ngay) / sum(total_items cac ngay) * 100
theme_week = theme xuat hien nhieu nhat trong tuan
streak = so ngay lien tiep co it nhat 1 hoat dong completed
```

### Cap Thang
```
progress_month = trung binh progress_day cua cac ngay trong thang
top_themes_month = top 3 theme xuat hien nhieu nhat
```

### Cap Nam
```
progress_year = trung binh progress_month
top_themes_year = top 5 theme, radar chart
best_week = tuan co progress_week cao nhat
best_streak = streak dai nhat trong nam
```

## Bang Du Lieu Chinh

- `schedules` — moi be co toi da 1 schedule active moi tuan.
- `schedule_items` — tung hoat dong trong lich, gan voi ngay + gio.
- `activities` — thu vien hoat dong.
- `activity_history` — lich su khi item da completed.

## Truong Du Lieu

### Schedule
- id, child_id, title, week_start_date, theme, status (draft/active/archived), created_by (parent/child/ai)

### Schedule Item
- id, schedule_id, child_id, activity_id
- day_of_week (0=CN, 1=T2..6=T7)
- start_time, duration_minutes, sort_order
- status: planned / skipped / completed
- completed_at, notes

## Quy Tac Nghiep Vu

- Mot be co mot schedule active moi tuan; co the co nhieu schedule draft.
- Item co the khong co gio cu the (flexible schedule).
- Khi item completed: ghi vao activity_history + cong XP/coins vao bang rewards.
- Khong xoa schedule cu da co history; chi archived.
- AI chi tao de xuat; backend validate truoc khi luu.
- Ngay da qua khong cho sua (read-only trong Day View, Design Mode bi khoa).

## AI Tao Lich

AI nhan:
- Child profile (ten, tuoi, so thich, chu de yeu thich)
- Lich hien tai cua tuan
- Lich su hoat dong (nhung gi da lam, da bo qua)
- Yeu cau cu the (ngay nao, thoi gian nao, chu de gi)

AI tra ve JSON:
```json
{
  "items": [
    { "day_of_week": 2, "start_time": "08:00", "duration_minutes": 30,
      "activity_title": "Doc sach tranh", "activity_theme": "Doc sach" }
  ]
}
```

Backend validate: hoat dong co ton tai, thoi luong hop le, do tuoi phu hop, khong trung gio, canh bao hoat dong can phu huynh.
