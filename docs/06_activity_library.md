# Activity Library

## Nguyen tac

Thu vien hoat dong khong hardcode trong frontend. Moi hoat dong nam trong database va co the quan ly tu admin panel.

## Truong du lieu activity

- id.
- title.
- slug.
- theme.
- description.
- image_url.
- min_age.
- max_age.
- duration_minutes.
- difficulty.
- instructions.
- materials.
- learning_goals.
- safety_notes.
- requires_parent.
- created_by: admin, ai, parent.
- status: draft, published, archived.

## Chu de mac dinh

- Thien nhien.
- Khoa hoc.
- The thao.
- Nghe thuat.
- Gia dinh.
- Cam xuc.
- Doc sach.
- Kham pha the gioi.
- Ky nang song.
- Am nhac.

## Cap do kho

- De: be co the tu lam.
- Vua: can chuan bi don gian.
- Kho: can phu huynh ho tro.

## AI tao hoat dong

Input:

- Chu de.
- Do tuoi.
- So luong.
- Thoi luong mong muon.
- Co can anh minh hoa khong.

Output JSON:

- title.
- description.
- steps.
- materials.
- learning_goals.
- safety_notes.
- duration_minutes.
- difficulty.
- image_prompt.

Backend phai validate va luu draft truoc. Admin duyet moi published.

## Seed data MVP

Can co it nhat:

- 10 hoat dong thien nhien.
- 10 hoat dong khoa hoc.
- 10 hoat dong nghe thuat.
- 10 hoat dong ky nang song.
- 5 hoat dong gia dinh.

