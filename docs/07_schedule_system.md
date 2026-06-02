# Schedule System

## Muc tieu

He thong lich giup be tu thiet ke ngay/tuan cua minh bang cach chon hoat dong. Lich khong nen giong bang cong viec kho cung, ma nen giong hanh trinh trong ngay.

## Loai lich

- Lich ngay.
- Lich tuan.
- Lich thang sau MVP.

## Bang chinh

- schedules.
- schedule_items.
- activities.
- activity_history.

## Schedule

Truong du lieu:

- id.
- child_id.
- title.
- week_start_date.
- theme.
- status: draft, active, archived.
- created_by: parent, child, ai.

## Schedule item

Truong du lieu:

- id.
- schedule_id.
- child_id.
- activity_id.
- day_of_week.
- start_time.
- duration_minutes.
- sort_order.
- status: planned, skipped, completed.
- completed_at.

## Quy tac

- Mot be co mot lich active cho moi tuan.
- Item co the khong co gio cu the neu be chi muon danh sach phieu luu.
- Khi item completed, ghi vao activity_history va cong reward.
- Khong xoa lich cu neu da co history; chi archived.

## AI tao lich

AI chi tao de xuat. Backend validate:

- Hoat dong co ton tai hoac tao draft moi.
- Thoi luong hop le.
- Do tuoi phu hop.
- Khong trung qua nhieu item trong cung khung gio.
- Hoat dong can phu huynh phai co warning.

