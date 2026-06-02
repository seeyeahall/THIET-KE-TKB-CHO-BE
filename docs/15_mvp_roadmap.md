# MVP Roadmap

## Chien luoc

Khong xay full app mot lan. Xay theo cheng nho de tiet kiem quota, de test va de sua som.

## Cheng 1: Blueprint

Ket qua:

- Bo tai lieu `/docs`.
- Chot kien truc Cloudflare + Supabase + FastAPI.
- Chot schema MVP.
- Chot roadmap code.

## Cheng 2: Backend MVP

Ket qua:

- FastAPI scaffold.
- Health endpoint.
- Supabase connection.
- CRUD children.
- CRUD activities.
- CRUD schedules.
- Schedule item complete/skip.
- AI provider registry.
- AI context builder.
- Chat endpoint.

## Cheng 3: Frontend MVP

Ket qua:

- NextJS scaffold.
- Chon nguoi choi.
- Trang chu cua be.
- Lich hom nay/tuan.
- Thu vien hoat dong.
- Chat AI.
- Phu huynh basic dashboard.

## Cheng 4: Storage va media

Ket qua:

- Upload avatar.
- Upload anh activity.
- Media metadata.
- Supabase Storage buckets.
- Cloudflare cache asset public.

## Cheng 5: Deploy

Ket qua:

- Frontend tren Cloudflare Pages.
- Backend Docker tren server.
- Supabase production project.
- Domain va HTTPS.
- Smoke test end-to-end.

## Cheng 6: Mo rong

Ket qua:

- TTS/STT.
- AI tao anh.
- Reward nang cao.
- Bao cao phu huynh.
- Export PDF.

## Uu tien neu quota han che

Neu dung account Free, nen lam theo thu tu:

1. Blueprint.
2. Backend schema va API skeleton.
3. Frontend man hinh tinh.
4. Ket noi API that.
5. AI chat.
6. Deploy.

Khong nen lam TTS/STT/AI image truoc khi MVP lich va activity chay on dinh.

## Quota/context gate truoc moi buoc

Truoc khi thuc hien moi buoc trong roadmap, AI/coder phai kiem tra quota/context con lai. Neu khong du de doc, sua, test va cap nhat docs handoff thi khong bat dau buoc do.

Buoc lon phai chia nho thanh cac buoc co ket qua ro rang:

- Backend skeleton.
- Config/env.
- Mot module API.
- Mot nhom test.
- Mot lan cap nhat docs.

## File theo doi tien do

Tu cheng 2 tro di, moi AI/coder tiep tuc du an phai cap nhat `19_implementation_progress.md` sau khi sua code, chay test hoac thay doi kien truc. Neu them module moi, cap nhat ca `17_backend_module_links.md` va `18_app_flow_graph.md`.
