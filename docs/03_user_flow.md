# User Flow

## Luong Khoi Tao

1. Phu huynh dang ky/dang nhap.
2. Tao ho so be dau tien (ten, tuoi, avatar, so thich, mau yeu thich, con vat yeu thich).
3. Cau hinh AI provider neu chua co (trong /parent > Settings).
4. Tao lich ngay dau tien bang thu cong hoac AI.
5. Be vao trang chu va bat dau dung.

## Luong Be Hang Ngay

1. Be chon avatar cua minh tren /select-child.
2. Be thay trang chu (/home):
   - Chu de hom nay
   - 2–3 hoat dong sap toi (widget lich hom nay)
   - Tien do hom nay (X/Y hoat dong)
3. Be bam check hoan thanh hoat dong nao do xong.
4. He thong cong XP + coins + hien popup "Tuyet voi!".
5. AI goi y hoat dong tiep theo theo context.

## Luong Xem Lich (4 Cap)

```
/schedule
└── Year View (nam)
    └── Month View (thang)
        └── Week View (tuan)
            └── Day View (ngay)
                └── DayDesignModal (thiet ke lich)
```

### Luong Month View → Day View
1. Vao /schedule → hien thi Month View (mac dinh).
2. Nguoi dung thay grid lich thang: moi o ngay co sticker + mau tien do.
3. Click vao mot ngay → mo Day View cua ngay do.
4. Day View hien timeline hoat dong + nut check hoan thanh + nut thiet ke.

### Luong Week View → Day View
1. Bam tab "Tuan" → hien thanh 7 tab ngay.
2. Moi tab: sticker + % tien do + chu de.
3. Click vao tab ngay → Day View cua ngay do (hien o phia duoi hoac chuyen trang).

### Luong Year View → Month View
1. Bam tab "Nam" → hien grid 12 thang.
2. Moi thang: mau gradient + % trung binh + sticker tong ket.
3. Click vao thang → Month View cua thang do.

## Luong Xem va Check Hoan Thanh (Day View)

1. Mo Day View cua ngay bat ky.
2. Xem timeline hoat dong theo gio.
3. Be hoan thanh hoat dong ngoai doi thuc.
4. Bam nut ✅ tren activity card tuong ung.
5. He thong cap nhat trang thai → sticker cua ngay tu dong doi → XP duoc cong.

## Luong Thiet Ke Lich Ngay (DayDesignModal)

1. Tu Day View, bam "🎨 Thiet ke lich ngay nay".
2. DayDesignModal mo len (bottom sheet slide tu duoi).
3. Nguoi dung chon phuong thuc them hoat dong:
   - **Keo tha**: keo activity tu ActivityPool → tha vao slot gio trong timeline.
   - **Nhap text**: go ten hoat dong + gio + thoi luong vao input box.
   - **AI goi y**: bam 🤖 → chat ngan → AI tao danh sach → xem preview → confirm.
   - **Voice be**: bam 🎤 (be noi) → STT → AI xu ly → goi y → be confirm.
   - **Voice phu huynh**: bam 🎤 (phu huynh noi) → STT → AI tao lich → confirm.
4. Chuan bi xong → bam "✅ Luu lich ngay".
5. Backend luu, dong modal, Day View cap nhat.

## Luong AI Tao Lich Tuan

1. Tu /schedule hoac /chat, bam "🤖 AI len lich tuan".
2. Backend nap:
   - Child profile (ten, tuoi, so thich, chu de yeu thich)
   - Lich hien tai cua tuan
   - Lich su hoat dong
3. AI tao lich dang JSON theo schema.
4. Backend validate ket qua (thoi luong, do tuoi, khong trung gio).
5. Frontend hien preview lich tuan moi.
6. Phu huynh/be chap nhan → luu vao database.
7. Hoac: chinh sua tung ngay bang DayDesignModal sau do.

## Luong Voice trong DayDesignModal

```
Be bam 🎤 "Be noi"
    → Web Speech API ghi am
    → STT chuyen thanh text
    → Gui text len backend /api/v1/ai/chat
    → AI hieu yeu cau (context: ngay, gio trong, so thich be)
    → AI tra ve danh sach goi y
    → Frontend hien danh sach goi y de be/phu huynh confirm
    → Sau khi confirm → them vao timeline
```

```
Phu huynh bam 🎤 "Phu huynh noi"
    → Tuong tu nhung AI biet la phu huynh dang ra lenh
    → AI co the xu ly lenh phuc tap hon (vi du: "Thu 3 sang hoc toan, chieu boi loi, toi ve tranh")
    → AI tach ra thanh 3 activity + gio → hien preview → confirm
```

## Luong Quan Ly AI Provider

1. Phu huynh vao /parent > Settings.
2. Nhap provider, endpoint, API key, model.
3. Bam "Kiem tra ket noi".
4. Backend gui request test.
5. Neu thanh cong: provider duoc kich hoat, hien badge "Dang hoat dong".
6. Neu that bai: thong bao loi, khong dat lam mac dinh.

## Luong Storage Media

1. Upload avatar/anh hoat dong tu /parent hoac ImageUploader.
2. Frontend goi /api/v1/media/sign-upload → nhan signed URL.
3. Frontend upload truc tiep len Supabase Storage.
4. Frontend goi /api/v1/media/confirm-upload → luu metadata.
5. Frontend lay anh qua public URL hoac signed URL.
6. Cloudflare cache anh public de tang toc.

## Luong Phan Thuong (Rewards)

1. Be bam check hoan thanh activity.
2. Frontend goi POST /api/v1/rewards/complete-activity.
3. Backend cap nhat schedule_item.status = 'completed'.
4. Backend cong XP va coins vao bang rewards.
5. Backend ghi vao activity_history.
6. Frontend hien popup: "+15 XP 🎉" animation + confetti.
7. Neu du dieu kien → mo khoa huy hieu moi.

## Luong Theo Doi Tien Do

```
Moi lan be check hoan thanh:
    → Tinh lai progress_day
    → Neu progress_day thay doi nguong → doi sticker ngay
    → Cap nhat progress_week
    → Cap nhat streak

Phu huynh xem /parent:
    → Chon be → xem bieu do tien do (tuan/thang/nam)
    → Xem top chu de
    → Xem streak hien tai
```
