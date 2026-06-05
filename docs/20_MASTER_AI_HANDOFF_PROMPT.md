# 🍥 MASTER AI HANDOFF PROMPT — Kid Adventure Planner

> **Đây là prompt handoff chuẩn.** Copy toàn bộ nội dung này và paste vào AI bất kỳ để tiếp tục nâng cấp dự án.

---

## 📋 LỆNH KHỞI ĐỘNG

Bạn là AI engineer được giao nhiệm vụ tiếp tục nâng cấp dự án **Kid Adventure Planner** tại `e:\THIET KE TKB CHO BE`.

**Bước 1:** Đọc các file sau theo thứ tự:
1. `docs/22_upgrade_plan.md` — kế hoạch nâng cấp đầy đủ với trạng thái từng item
2. `docs/19_implementation_progress.md` — trạng thái triển khai mới nhất
3. `docs/07_schedule_system.md` — schedule system + AI Wizard convention
4. `docs/17_backend_module_links.md` — kiến trúc module

**Bước 2:** Xác nhận convention quan trọng:
- `day_of_week: 0=T2(Mon), 1=T3, ..., 6=CN(Sun)` — weekday() convention (Python)
- Frontend convert: `(jsDate.getDay() + 6) % 7`
- AI tên: **Naruto** (Naruto Uzumaki) — avatar 🍥, catchphrase "Dattebayo!"
- Touch DnD: `@dnd-kit/core` + `@dnd-kit/sortable`
- Database: **Supabase** (không có FastAPI backend — đã migrate)

**Bước 3:** Thực thi tuần tự các bước còn lại trong `docs/22_upgrade_plan.md`.

---

## 🏗️ KIẾN TRÚC DỰ ÁN (2026-06-05)

```
e:\THIET KE TKB CHO BE\
└── frontend/         NextJS 14 TypeScript + Supabase-native
    └── src/
        ├── app/
        │   ├── chat/page.tsx              ← Naruto AI companion + ScheduleWizardSheet
        │   ├── schedule/
        │   │   ├── page.tsx               ← FAB AI Planner + ScheduleWizardSheet
        │   │   └── components/
        │   │       ├── ScheduleWizardSheet.tsx  ← [NEW] AI Wizard 3 bước
        │   │       ├── DayDesignModal.tsx       ← Tạo lịch ngày thủ công
        │   │       └── DayView.tsx              ← Visual timeline
        │   └── [home, activities, parent, ...]
        └── lib/
            ├── api.ts      ← Supabase + Gemini AI (includin 3 Wizard functions)
            ├── supabase.ts ← Client config
            └── types.ts    ← Child, Activity, Schedule, ScheduleItem
```

---

## ✅ ĐÃ HOÀN THÀNH — Session 2026-06-04/05

### Nhóm P0 — Critical Fixes (✅ 100%)
- [x] Fix AI context pipeline (chat_router conflict)
- [x] Fix datetime import trong schedules.py
- [x] Fix typos trong system prompt AI
- [x] Thêm GET /ai/chat-history endpoint
- [x] 17/17 backend tests pass

### Nhóm P1 — Luồng Tạo Lịch Ngày (✅ 100%)
- [x] Fix day_of_week convention (DayDesignModal + DayView)
- [x] Viết lại chat/page.tsx — Naruto personality + load history DB
- [x] Confirm dialog khi đóng DayDesignModal có draft chưa lưu
- [x] Cài @dnd-kit/core + @dnd-kit/sortable
- [x] Fix AI parse JSON (Gemini JSON mode, bỏ regex)
- [x] Voice intent detection (add/modify/delete)
- [x] TTS phản hồi sau voice
- [x] Conflict detection khi thêm item
- [x] Visual timeline trục dọc trong DayView
- [x] interimResults:true — hiển thị text đang nói live

### Nhóm AI Schedule Wizard (✅ 100% — 2026-06-05)
- [x] **api.ts**: `analyzeScheduleRequest()` — Gemini JSON, phân tích scope/theme/preferences
- [x] **api.ts**: `generateSchedulePlan()` — Tạo full plan context-aware
- [x] **api.ts**: `executeSchedulePlan()` — Batch save Supabase
- [x] **ScheduleWizardSheet.tsx**: Wizard 3 bước (Input/Preview/Success)
  - Voice (bé + phụ huynh) + interim text live
  - Quick presets 6 loại
  - Preview group by day + edit-in-place + conflict detect
  - Toggle Merge/Thay thế lịch cũ
  - Naruto TTS mỗi bước
- [x] **chat/page.tsx**: Intent detection → CTA "Thiết kế lịch ngay ✨" trong bubble
- [x] **schedule/page.tsx**: FAB Wand2 góc dưới phải

**Build**: ✅ `npm run build` — 14/14 pages, 0 errors

---

## 🚧 CÒN LẠI — THỰC HIỆN THEO THỨ TỰ

### P1 — Quan Trọng (làm trước)

#### [P1-7] Implement Touch DnD với @dnd-kit trong DayDesignModal
File: `frontend/src/app/schedule/components/DayDesignModal.tsx`
- Wrap ActivityPool items với `useDraggable` từ `@dnd-kit/core`
- Wrap timeline slots với `useDroppable`
- Wrap existing items với `SortableContext` + `useSortable`
- Sensor config: `PointerSensor { distance: 8 }` + `TouchSensor { delay: 250, tolerance: 5 }`

```tsx
import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
```

#### [P1-8] Fix home/page.tsx UUID theme hash
File: `frontend/src/app/home/page.tsx`
- Thay `charCodeAt(0)` bằng: `child.id.split('').reduce((h, c) => h + c.charCodeAt(0), 0) % 360`

### P2 — Nâng Cấp UX

#### [P2-1] Animations vào globals.css
```css
@keyframes confetti-fall { ... }  /* complete activity */
@keyframes wiggle { ... }         /* avatar greeting */
@keyframes float { ... }          /* XP badge floating */
```

#### [P2-2] Font Baloo 2 (round, kid-friendly)
File: `frontend/src/app/layout.tsx`

#### [P2-3] Activities page — emoji placeholder + load categories từ API
File: `frontend/src/app/activities/page.tsx`

#### [P2-4] BottomNav animation — scale + bounce khi chọn tab
File: `frontend/src/components/BottomNav.tsx`

#### [P2-5] Home daily challenges — dùng data thực từ schedule items hôm nay
File: `frontend/src/app/home/page.tsx`

### P3 — Tối Ưu (làm sau)

#### [P3-3] PWA offline support
File: `frontend/public/sw.js`

---

## 📝 QUY TẮC QUAN TRỌNG

1. **Build check**: `npm run build` phải 0 errors trước khi xong
2. **Convention**: `day_of_week: 0=T2` — KHÔNG đổi
3. **Tên AI**: Naruto (Naruto Uzumaki) — KHÔNG đổi
4. **Không commit API key** — chỉ đọc từ `localStorage.getItem('GEMINI_API_KEY')`
5. **Sau mỗi bước**: cập nhật `docs/19_implementation_progress.md` và `docs/22_upgrade_plan.md`
6. **Gemini JSON mode**: LUÔN dùng `responseSchema` thay vì regex parsing

## 🔧 LỆNH PHÁT TRIỂN

```bash
# Frontend (Supabase-native, không cần backend riêng)
cd "e:\THIET KE TKB CHO BE\frontend"
npm run dev          # Dev server port 3000
npm run build        # Build check (phải 0 errors)
```

## 🔑 ENV VARIABLES CẦN THIẾT

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# Gemini API key nhập runtime: Settings → Nhập key → lưu localStorage
```
