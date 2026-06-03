-- Seed sample activities for MVP
-- Run after 0001_initial.sql

INSERT INTO activities (title, slug, theme, description, min_age, max_age, duration_minutes, difficulty, instructions, materials, learning_goals, safety_notes, requires_parent, created_by, status)
VALUES
  ('Ve tranh con vat', 've-tranh-con-vat', 'nghe-thuat', 'Be ve buc tranh con vat yeu thich bang mau nuoc', 6, 10, 30, 'de', '["Chuan bi giay va mau","Ve hinh con vat","To mau theo y thich"]','["Giay ve","Mau nuoc","Co ve"]','["Sang tao","Tinh kien nhan"]','De y khong de mau dinh quan ao', false, 'admin', 'published'),
  ('Doc truyen cung me', 'doc-truyen-cung-me', 'ngon-ngu', 'Cung me doc mot quyen truyen ngan tieng Viet', 6, 8, 20, 'de', '["Chon quyen truyen","Doc tung doan","Tra loi cau hoi ve noi dung"]','["Sach truyen","Ghe ngoi thoai mai"]','["Tu vung","Hieu chuyen","Lang nghe"]','Can nguoi lon doc cung', true, 'admin', 'published'),
  ('Tim hieu vu tru', 'tim-hieu-vu-tru', 'khoa-hoc', 'Xem video va ve so do he mat troi', 8, 10, 45, 'trung-binh', '["Xem video gioi thieu","Ve so do he mat troi","Ghi ten cac hanh tinh"]','["Giay A4","But chi","Mau but chi"]','["Kien thuc khoa hoc","Tu duy logic"]','Xem video khong qua 20 phut lien tuc', false, 'admin', 'published'),
  ('Tap the duc buoi sang', 'tap-the-duc-buoi-sang', 'the-chat', 'Tap the duc nhe nhang 15 phut voi nhac vui', 6, 10, 15, 'de', '["Bat nhac vui","Thuc hien dong tac co ban","Tha long 5 phut"]','["Loa phat nhac","Tham tap"]','["The chat","Tinh ky luat"]','Tap trong khong gian rong, khong co vat can', false, 'admin', 'published'),
  ('Lam do handicraft', 'lam-do-handicraft', 'nghe-thuat', 'Lam do trang tri tu giay mau va keo dan', 7, 10, 40, 'trung-binh', '["Cat giay theo mau","Dan keo va rap hinh","Trang tri them"]','["Giay mau nhieu mau","Keo dan","Keo cat"]','["Kheo tay","Tu duy khong gian"]','Dung keo can than, co nguoi lon neu can', true, 'admin', 'published')
ON CONFLICT (slug) DO NOTHING;
