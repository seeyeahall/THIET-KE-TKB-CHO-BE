# 🍥 MASTER AI HANDOFF PROMPT — Kid Adventure Planner

> **Đây là prompt handoff chuẩn.** Copy toàn bộ nội dung này và paste vào AI bất kỳ để tiếp tục nâng cấp dự án.

---

## 📋 LỆNH KHỞI ĐỘNG

Bạn là AI engineer được giao nhiệm vụ tiếp tục nâng cấp dự án **Kid Adventure Planner** tại `e:\THIET KE TKB CHO BE`.

**Bước 1:** Đọc các file sau theo thứ tự:
1. `docs/22_upgrade_plan.md` — kế hoạch nâng cấp đầy đủ với P0/P1/P2/P3
2. `docs/19_implementation_progress.md` — trạng thái hiện tại
3. `docs/17_backend_module_links.md` — kiến trúc module
4. `docs/07_schedule_system.md` — convention day_of_week (0=T2)

**Bước 2:** Xác nhận convention quan trọng:
- `day_of_week: 0=T2(Mon), 1=T3, ..., 6=CN(Sun)` — weekday() convention (Python)
- Frontend dùng `(getDay()+6)%7` để convert JS getDay() sang weekday
- AI tên: **Naruto** (Naruto Uzumaki từ anime Naruto)
- Touch DnD: `@dnd-kit/core` + `@dnd-kit/sortable`
- Chat history: Load từ DB qua `GET /api/v1/ai/chat-history?child_id=&limit=20`

**Bước 3:** Thực thi tuần tự các bước còn lại trong `docs/22_upgrade_plan.md`.

---

## 🏗️ KIẾN TRÚC DỰ ÁN

```
e:\THIET KE TKB CHO BE\
├── backend/          FastAPI Python
│   ├── app/
│   │   ├── main.py   (CORS, routers — chat_router ĐÃ XÓA)
│   │   ├── modules/ai/router.py  (POST /ai/chat, GET /ai/chat-history)
│   │   ├── modules/ai/context.py (AIContextBuilder, build_system_prompt)
│   │   └── services/schedules.py
│   └── tests/        (17 tests — phải pass)
└── frontend/         NextJS 15 TypeScript
    ├── src/app/chat/page.tsx      (Naruto AI companion)
    ├── src/app/schedule/          (4-level schedule system)
    │   └── components/
    │       ├── DayDesignModal.tsx (Touch DnD cần implement @dnd-kit)
    │       └── DayView.tsx
    └── src/lib/api.ts             (sendChat, getChatHistory)
```

## ✅ ĐÃ HOÀN THÀNH (Session 2026-06-04)

- [x] **P0-0** Fix route conflict: xóa `chat_router` khỏi `main.py` → `ai_router` với full context hoạt động
- [x] **P0-1** Fix `__import__("datetime")` → import chuẩn trong `schedules.py`
- [x] **P0-2** Fix 3 typo trong system prompt AI (`context.py`)
- [x] **P0-3** Nâng cấp `build_system_prompt` với context đầy đủ (ngày hôm nay, lịch, phần thưởng)
- [x] **P0-4** Thêm `GET /ai/chat-history` endpoint
- [x] **P1-1** Xóa duplicate `api.chat`, thêm `api.getChatHistory`
- [x] **P1-2** Fix `day_of_week` trong `DayDesignModal.tsx`: `(getDay()+6)%7`
- [x] **P1-3** Fix `day_of_week` trong `DayView.tsx` fallback filter
- [x] **P1-4** Viết lại `chat/page.tsx` — Naruto personality + load history từ DB
- [x] **P1-5** Thêm confirm dialog khi đóng DayDesignModal có draftItems chưa lưu
- [x] **P1-6** Cài `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- [x] 17/17 backend tests pass

## 🚧 CÒN LẠI — THỰC HIỆN THEO THỨ TỰ

### P1 — Quan Trọng (làm trước)

#### [P1-7] Implement Touch DnD với @dnd-kit trong DayDesignModal
File: `frontend/src/app/schedule/components/DayDesignModal.tsx`
- Wrap `ActivityPool` items với `Draggable` từ `@dnd-kit/core`
- Wrap timeline slots với `Droppable`
- Wrap existing items trong timeline với `SortableContext` + `useSortable`
- `DndContext` cần `TouchSensor` + `PointerSensor` để hỗ trợ cả touch lẫn mouse
- Sensor config: `PointerSensor` với `activationConstraint: { distance: 8 }`, `TouchSensor` với `delay: 250, tolerance: 5`

Pattern tham khảo:
```tsx
import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
```

#### [P1-8] Fix home/page.tsx UUID theme hash
File: `frontend/src/app/home/page.tsx`
- Tìm nơi dùng `charCodeAt(0)` cho theme color
- Thay bằng hash đầy đủ: `child.id.split('').reduce((h, c) => h + c.charCodeAt(0), 0) % 360`

### P2 — Nâng Cấp UX

#### [P2-1] Thêm Animations vào globals.css
File: `frontend/src/app/globals.css`
Thêm các keyframes:
```css
@keyframes confetti-fall { ... } /* cho celebrate khi complete activity */
@keyframes star-burst { ... }    /* sticker mới mở khóa */
@keyframes wiggle { ... }        /* avatar greeting */
@keyframes float { ... }         /* XP badge floating */
```

#### [P2-2] Thêm font Baloo 2 cho bé
File: `frontend/src/app/layout.tsx`
- Thêm Google Fonts Baloo 2 (round, kid-friendly)
- Áp dụng cho headings trong schedule/home

#### [P2-3] Activities page — placeholder image
File: `frontend/src/app/activities/page.tsx`
- Khi `activity.image_url` là null → hiển thị emoji + màu gradient từ theme
- Load categories từ API thay vì hardcode

#### [P2-4] Bottom Nav animation
File: `frontend/src/components/BottomNav.tsx`
- Thêm `scale-110 + bounce` khi tab được chọn
- Thêm badge count cho schedule nếu có hoạt động hôm nay

#### [P2-5] Home page challenges
File: `frontend/src/app/home/page.tsx`
- Kết nối daily challenges với dữ liệu thực từ schedule items của ngày hôm nay
- Hiển thị progress bar thực: `completed/total`

### P3 — Tối Ưu (làm sau)

#### [P3-1] Provider selection logic fix
File: `backend/app/modules/ai/router.py`
- `client_key` (Gemini key từ header) chỉ áp dụng cho Gemini provider
- Tách logic: nếu có `client_key` → chọn Gemini provider cụ thể, không dùng cho OpenAI/OpenRouter

#### [P3-2] Shared httpx.AsyncClient
File: `backend/app/modules/ai/providers.py`
- Tạo `_client_pool: dict[str, httpx.AsyncClient]` tại module level
- `build_adapter()` reuse client từ pool thay vì tạo mới mỗi request

#### [P3-3] PWA offline support
File: `frontend/public/sw.js`
- Cache schedule data offline
- Sync khi có mạng lại

---

## 📝 QUY TẮC QUAN TRỌNG

1. **Test trước khi commit**: `pytest -v` phải pass 17 tests
2. **Build check**: `npm run build` phải 0 errors
3. **Convention**: `day_of_week: 0=T2` — KHÔNG đổi
4. **Tên AI**: Naruto (Naruto Uzumaki) — KHÔNG đổi
5. **Không xóa module admin** — giữ nguyên cho admin debug
6. **Không commit API key** — chỉ đọc từ env
7. **Sau mỗi bước**: cập nhật `19_implementation_progress.md`

## 🔧 LỆNH PHÁT TRIỂN

```bash
# Backend
cd "e:\THIET KE TKB CHO BE\backend"
python -m pytest -v                    # Chạy tests
uvicorn app.main:app --reload --port 8001  # Dev server

# Frontend  
cd "e:\THIET KE TKB CHO BE\frontend"
npm run dev                            # Dev server port 3000
npm run build                          # Build check
```
