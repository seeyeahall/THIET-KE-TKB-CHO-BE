# Storage System

## Lua chon ket hop Cloudflare va Supabase

Supabase dung lam noi luu tru goc cho:

- Database Postgres.
- Auth.
- Storage bucket.

Cloudflare dung cho:

- Hosting frontend qua Cloudflare Pages.
- DNS/domain.
- CDN/cache cho asset public.
- WAF/rate limiting neu can.
- Redirect va header bao mat.

## Bucket Supabase

- `avatars`.
- `activity-images`.
- `theme-images`.
- `stickers`.
- `audio`.
- `generated`.
- `exports`.

## Loai asset

- Avatar be.
- Anh hoat dong.
- Anh chu de.
- Sticker/huy hieu.
- Audio system.
- Audio TTS.
- File export PDF/CSV.

## Public vs private

Public:

- Anh activity published.
- Anh chu de public.
- Sticker public.

Private/signed:

- Avatar be neu gia dinh muon rieng tu.
- Audio rieng cua be.
- Export cua gia dinh.

## Cloudflare cache

- Cache asset public tu Supabase Storage de tang toc.
- Khong cache response AI/chat.
- Khong cache endpoint co thong tin ca nhan.
- Dung cache busting bang path/version khi thay anh.

## Media metadata

Moi file upload can co row trong `media_assets`:

- bucket.
- path.
- public_url.
- asset_type.
- source.
- owner/family/child neu co.
- metadata.

## Upload flow

1. Frontend yeu cau backend tao signed upload URL.
2. Backend kiem tra quyen.
3. Frontend upload len Supabase Storage.
4. Backend luu metadata.
5. Frontend dung URL de hien thi.

