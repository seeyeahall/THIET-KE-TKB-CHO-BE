# 22 — Upgrade Plan (Chi Tiết Kỹ Thuật)

## Tổng Quan

Kế hoạch nâng cấp toàn diện Kid Adventure Planner dựa trên audit thực tế code (2026-06-04).
Convention: `day_of_week 0=T2`, AI tên Naruto, Touch DnD dùng @dnd-kit.

## Phân Loại Bug

| ID | File | Vấn đề | Priority | Status |
|---|---|---|---|---|
| P0-0 | main.py | chat_router chặn ai_router → AI không có context | P0 | ✅ DONE |
| P0-1 | schedules.py | `__import__("datetime")` code smell | P0 | ✅ DONE |
| P0-2 | context.py | 3 typo trong system prompt | P0 | ✅ DONE |
| P0-3 | context.py | System prompt thiếu ngày hiện tại, lịch hôm nay | P0 | ✅ DONE |
| P0-4 | ai/router.py | Thiếu GET /ai/chat-history endpoint | P0 | ✅ DONE |
| P1-1 | api.ts | Duplicate api.chat + api.sendChat | P1 | ✅ DONE |
| P1-2 | DayDesignModal.tsx | day_of_week dùng getDay() (0=CN) thay vì weekday | P1 | ✅ DONE |
| P1-3 | DayView.tsx | Fallback filter cũng dùng getDay() sai | P1 | ✅ DONE |
| P1-4 | chat/page.tsx | Không load history từ DB, không có Naruto personality | P1 | ✅ DONE |
| P1-5 | DayDesignModal.tsx | Không có confirm khi đóng với draft chưa lưu | P1 | ✅ DONE |
| P1-6 | package.json | Chưa có @dnd-kit | P1 | ✅ DONE |
| P1-7 | DayDesignModal.tsx | Native DnD không hỗ trợ touch mobile | P1 | ⏳ TODO |
| P1-8 | home/page.tsx | UUID theme hash dùng charCodeAt(0) thiếu entropy | P1 | ⏳ TODO |
| P2-1 | globals.css | Thiếu animations confetti, wiggle, float | P2 | ⏳ TODO |
| P2-2 | layout.tsx | Chưa có font Baloo 2 | P2 | ⏳ TODO |
| P2-3 | activities/page.tsx | Placeholder image + load categories từ API | P2 | ⏳ TODO |
| P2-4 | BottomNav.tsx | Chưa có animation khi chuyển tab | P2 | ⏳ TODO |
| P2-5 | home/page.tsx | Daily challenges hardcode, chưa dùng data thực | P2 | ⏳ TODO |
| P3-1 | ai/router.py | client_key leak sang non-Gemini providers | P3 | ⏳ TODO |
| P3-2 | providers.py | Tạo httpx client mới mỗi request | P3 | ⏳ TODO |
| P3-3 | sw.js | PWA offline cache | P3 | ⏳ TODO |

## Convention Bắt Buộc

### day_of_week
- Backend Python: `date.weekday()` → 0=Mon(T2), 6=Sun(CN) ✅
- Database: lưu theo weekday convention (0=T2)
- Frontend convert: `(jsDate.getDay() + 6) % 7` ✅
- Công thức ngược (weekday → getDay): `(dow + 1) % 7`

### AI Naruto
- Avatar: 🍥 (naruto emoji)
- Màu: gradient orange-400 → yellow-400
- Catchphrase: "Dattebayo!"
- Personality: Ninja, vui vẻ, năng lượng cao
- Ngôn ngữ: Tiếng Việt, thân thiện với trẻ 6-10 tuổi

### @dnd-kit Setup (P1-7 detail)
```tsx
import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';

const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
);

// ActivityPool items: useDraggable({ id: `pool-${activity.id}` })
// Timeline slots: useDroppable({ id: `slot-${hour}` })
// Existing items in timeline: useSortable({ id: item.id })
```

## Xác Nhận Từ User (2026-06-04)

- day_of_week: 0=T2 ✅
- Touch DnD: @dnd-kit ✅  
- Chat history: load từ DB ✅
- Admin debug: giữ nguyên ✅
- AI name: Naruto (Naruto Uzumaki) ✅
