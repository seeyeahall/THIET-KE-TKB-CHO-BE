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
| P1-7 | DayDesignModal.tsx | Native DnD không hỗ trợ touch mobile | P1 | ✅ DONE |
| P1-8 | home/page.tsx | UUID theme hash dùng charCodeAt(0) thiếu entropy | P1 | ✅ DONE |
| P2-1 | globals.css | Thiếu animations confetti, wiggle, float | P2 | ✅ DONE |
| P2-2 | layout.tsx | Chưa có font Baloo 2 | P2 | ✅ DONE |
| P2-3 | activities/page.tsx | Placeholder image + load categories từ API | P2 | ✅ DONE |
| P2-4 | BottomNav.tsx | Chưa có animation khi chuyển tab | P2 | ✅ DONE |
| P2-5 | home/page.tsx | Daily challenges hardcode, chưa dùng data thực | P2 | ✅ DONE |
| P3-1 | ai/router.py | client_key leak sang non-Gemini providers | P3 | ✅ DONE |
| P3-2 | providers.py | Tạo httpx client mới mỗi request | P3 | ✅ DONE |
| P3-3 | sw.js | PWA offline cache | P3 | ✅ DONE |

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

## Nâng Cấp Mới — Luồng Tạo Lịch Ngày (2026-06-05)

| ID | File | Vấn đề | Priority | Status |
|---|---|---|---|---|
| P1-NEW-1 | DayDesignModal.tsx | TIME_SLOTS bước 30p, không chọn được 9:15, 14:45 | P1 | ✅ DONE |
| P1-NEW-2 | DayDesignModal.tsx | Drop zones ẩn khi không kéo (isDragging gate) | P1 | ✅ DONE |
| P1-NEW-3 | DayDesignModal.tsx | Kéo item trong timeline không đổi start_time (useSortable chỉ sort list) | P1 | ✅ DONE |
| P1-NEW-4 | DayDesignModal.tsx | AI dùng api.sendChat() + regex thay JSON mode → parse fail | P1 | ✅ DONE |
| P1-NEW-5 | DayDesignModal.tsx | Voice không phân biệt intent add/modify/delete | P1 | ✅ DONE |
| P1-NEW-6 | DayDesignModal.tsx | Fallback hard-code start_time 08:00 khi AI parse fail | P1 | ✅ DONE |
| P1-NEW-7 | DayDesignModal.tsx | Không có TTS phản hồi sau khi voice xử lý xong | P1 | ✅ DONE |
| P1-NEW-8 | DayDesignModal.tsx | AI không nhận context items đã có (gợi ý trùng giờ) | P1 | ✅ DONE |
| P2-NEW-1 | DayView.tsx | Regex bug line 126: .replace(/:\d+$/, ':00') xóa thông tin phút | P1 | ✅ DONE |
| P2-NEW-2 | DayView.tsx | Không có visual timeline trục dọc, chỉ là list cards | P2 | ✅ DONE |
| P2-NEW-3 | DayDesignModal.tsx | interimResults:false, không hiển thị text đang nói live | P2 | ✅ DONE |
| P2-NEW-4 | DayDesignModal.tsx | Không validate trùng giờ khi thêm tay | P2 | ✅ DONE |
| P2-NEW-5 | ActivityPool.tsx | Dùng HTML5 DnD cũ song song với @dnd-kit | P2 | ✅ DONE |
| P2-NEW-6 | api.ts | Thiếu parseScheduleItemsFromText() và detectVoiceIntent() với JSON mode | P1 | ✅ DONE |

## Nâng Cấp Mới — AI Schedule Wizard (2026-06-05)

### Tổng Quan
Xây dựng hệ thống AI Schedule Wizard: Naruto nhận giọng nói/text → phân tích ngữ cảnh → gợi ý toàn bộ lịch ngày hoặc tuần → preview interactive → tự động lưu.

### Files Đã Thêm/Sửa

| File | Loại | Thay Đổi |
|---|---|---|
| `frontend/src/lib/api.ts` | MODIFY | +3 hàm: analyzeScheduleRequest, generateSchedulePlan, executeSchedulePlan, +helper addDays |
| `frontend/src/app/schedule/components/ScheduleWizardSheet.tsx` | NEW | Wizard 3 bước: Input → Preview → Success |
| `frontend/src/app/chat/page.tsx` | MODIFY | Intent detection + CTA button + wizard state |
| `frontend/src/app/schedule/page.tsx` | MODIFY | FAB AI Planner + ScheduleWizardSheet overlay |

### Chi Tiết Các Hàm Mới

**analyzeScheduleRequest(userRequest, context)**
- Input: text/voice tự do + child context + ngày hiện tại
- Output JSON: { scope, target_date, target_week_start, theme, preferences, time_budget, naruto_intro }
- Dùng Gemini JSON mode với responseSchema nghiêm ngặt

**generateSchedulePlan(analysis, context)**
- Input: kết quả analyze + child profile + lịch đã có
- Output JSON: { title, theme, scope, items[], naruto_summary }
- items: [{ day_of_week, date_str, start_time, duration_minutes, activity_title, activity_theme, notes, emoji }]
- Context-aware: tránh trùng giờ, tránh lặp hoạt động gần đây

**executeSchedulePlan(plan, childId, weekStart, existingScheduleId?, replaceExisting?)**
- Batch save: tạo Schedule → tạo Activities → thêm schedule_items
- Merge mode (mặc định): giữ lịch cũ, thêm items mới
- Replace mode: xóa items cũ theo ngày trước khi thêm

### ScheduleWizardSheet — Wizard 3 Bước

**Step 1 — Input:**
- Voice mic: bé nói + phụ huynh nói (interim text live, waveform animation)
- Text input + quick presets (Hôm nay / Cả tuần / Nghệ thuật / Vận động...)
- Scope toggle: Ngày / Tuần
- Nút "Phân tích & Thiết kế"

**Step 2 — Preview (edit-in-place):**
- Naruto speech bubble + TTS tự đọc naruto_summary
- Timeline group theo ngày (Thứ 2 → CN)
- Mỗi item: emoji + tên + giờ + duration + nút xóa
- Tap giờ → inline time picker (step 15p)
- Conflict detection đỏ real-time
- Nút "+ Thêm" trên mỗi ngày
- Toggle: Merge vào lịch cũ / Thay thế
- Footer: [Thiết kế lại] [Lưu X hoạt động]

**Step 3 — Success:**
- Confetti animation + Naruto TTS
- Stats: X hoạt động / Y ngày
- Nút: [Xem lịch ngay]

### 2 Điểm Mở Wizard
1. **FAB trong Schedule page**: Nút Wand2 🔮 góc dưới phải, hiện trên mọi tab view
2. **CTA trong Chat page**: Khi Naruto reply đề cập "lịch/thiết kế" → hiện nút "Thiết kế lịch ngay ✨" ngay dưới bubble

### Quick Questions Mới Trong Chat
- `📅 Lên lịch hôm nay` → mở wizard với scope=day
- `📆 Tạo lịch cả tuần` → mở wizard với scope=week

### Voice → Plan Flow
```
Bé nói "Con muốn tuần có học vẽ và bơi lội"
  → STT transcript (interim text live)
  → analyzeScheduleRequest() ~1s → Naruto TTS xác nhận
  → generateSchedulePlan() ~2s → Preview + Naruto TTS summary
  → Bé chỉnh sửa (nếu muốn) → tap Lưu
  → executeSchedulePlan() ~1s → Batch save Supabase
  → Naruto TTS: "Dattebayo! Xong rồi!" → navigate về lịch
```

### Build Result
- npm run build: **✅ 14/14 pages, 0 errors** (2026-06-05)
