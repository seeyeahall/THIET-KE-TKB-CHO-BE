'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, Edit3, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import {
  getDayStatus, getDominantTheme, themeEmoji,
  getDayLabelFull, formatShortDate, parseLocalDate, toDateStr,
} from '@/lib/utils/scheduleProgress';
import type { ScheduleItem } from '@/lib/types';

interface DayViewProps {
  dateStr: string;              // 'YYYY-MM-DD'
  childId: string;
  onOpenDesign: (prefilledTime?: string) => void;  // mở DayDesignModal, tuỳ chọn giờ pre-filled
  onNavigate: (date: string) => void;
  onCheckComplete: (itemId: string) => void;
}

// Màu chủ đề activity
const THEME_BG: Record<string, string> = {
  'Học tập':      'bg-blue-100 border-blue-300 text-blue-700',
  'Nghệ thuật':   'bg-pink-100 border-pink-300 text-pink-700',
  'Vận động':     'bg-green-100 border-green-300 text-green-700',
  'Thiên nhiên':  'bg-emerald-100 border-emerald-300 text-emerald-700',
  'Âm nhạc':      'bg-purple-100 border-purple-300 text-purple-700',
  'Khoa học':     'bg-cyan-100 border-cyan-300 text-cyan-700',
  'Gia đình':     'bg-orange-100 border-orange-300 text-orange-700',
  'Tự chọn':      'bg-yellow-100 border-yellow-300 text-yellow-700',
};

function themeBg(theme: string) {
  return THEME_BG[theme] ?? 'bg-gray-100 border-gray-200 text-gray-700';
}

// Timeline config
const TIMELINE_START_HOUR = 6;   // 06:00
const TIMELINE_END_HOUR   = 21;  // 21:00
const SLOT_HEIGHT_PX      = 60;  // px mỗi 60 phút

/** Chuyển HH:MM → offset px từ đầu timeline */
function timeToTopPx(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return ((h - TIMELINE_START_HOUR) * 60 + m) / 60 * SLOT_HEIGHT_PX;
}

/** Chuyển duration_minutes → chiều cao px */
function durationToPx(minutes: number): number {
  return Math.max(minutes / 60 * SLOT_HEIGHT_PX, 40); // tối thiểu 40px
}

export default function DayView({
  dateStr,
  childId,
  onOpenDesign,
  onNavigate,
  onCheckComplete,
}: DayViewProps) {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  // Prev / Next ngày
  const navigate = (delta: number) => {
    const d = parseLocalDate(dateStr);
    d.setDate(d.getDate() + delta);
    onNavigate(toDateStr(d));
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const thisDate = new Date(dateStr + 'T00:00:00');
  const isPast = thisDate < today;
  const isToday = dateStr === toDateStr(today);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    let finalItems: ScheduleItem[] = [];
    try {
      finalItems = await api.getScheduleItemsByDate(childId, dateStr);
    } catch {
      try {
        const schedules = await api.listSchedules(childId);
        if (schedules.length > 0 && schedules[0].items) {
          const d = parseLocalDate(dateStr);
          const dow = (d.getDay() + 6) % 7; // 0=T2(Mon)...6=CN(Sun)
          finalItems = schedules[0].items.filter(i => i.day_of_week === dow);
        }
      } catch {
        // keep finalItems empty
      }
    }
    
    // Đọc offline drafts
    try {
      const offlineKey = `offline_drafts_${childId}`;
      const offlineData = JSON.parse(localStorage.getItem(offlineKey) || '[]');
      const draftsToday = offlineData.filter((i: any) => i.dateStr === dateStr).map((i: any, idx: number) => ({
        id: `offline-${idx}`,
        activity_id: i.activity_id || `act-off-${idx}`,
        schedule_id: 'offline',
        child_id: childId,
        day_of_week: 0,
        start_time: i.start_time,
        duration_minutes: i.duration_minutes,
        sort_order: 0,
        status: 'pending',
        activity: {
          id: i.activity_id || `act-off-${idx}`,
          title: i.activity_title,
          theme: i.activity_theme || 'Tự chọn',
          duration_minutes: i.duration_minutes,
          slug: `offline-act-${idx}`,
          status: 'published',
          created_by: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      finalItems = [...finalItems, ...draftsToday];
    } catch (e) { /* ignore */ }

    setItems(finalItems);
    setLoading(false);
  }, [childId, dateStr]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleComplete = async (itemId: string) => {
    if (completing) return;
    setCompleting(itemId);
    setItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, status: 'completed' as const } : i
    ));
    onCheckComplete(itemId);
    try {
      await api.updateScheduleItem(itemId, 'completed');
    } catch { /* giữ optimistic */ }
    setCompleting(null);
  };

  const status = getDayStatus(items, dateStr);
  const theme = getDominantTheme(items);
  const dayLabel = getDayLabelFull(dateStr);
  const shortDate = formatShortDate(dateStr);

  // Items có giờ cụ thể → render trên visual timeline
  const timedItems = items.filter(i => i.start_time).sort((a, b) =>
    (a.start_time ?? '').localeCompare(b.start_time ?? '')
  );
  // Items không có giờ → render dưới dạng list "linh hoạt"
  const flexItems = items.filter(i => !i.start_time);

  const doneCount = items.filter(i => i.status === 'completed' || i.status === 'complete').length;

  // Tính tổng chiều cao timeline
  const totalHours = TIMELINE_END_HOUR - TIMELINE_START_HOUR;
  const timelineHeight = totalHours * SLOT_HEIGHT_PX;

  // Danh sách giờ trục dọc
  const hourLabels = Array.from({ length: totalHours + 1 }, (_, i) => {
    const h = TIMELINE_START_HOUR + i;
    return `${String(h).padStart(2, '0')}:00`;
  });

  return (
    <div className="animate-fade-in-up">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 shadow-sm"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                {isToday ? '🌤 Hôm nay' : shortDate}
              </p>
              <h3 className="text-xl font-black text-gray-800">{dayLabel}</h3>
              {items.length > 0 && (
                <p className="text-sm font-bold text-kid-blue mt-0.5">
                  {themeEmoji(theme)} {theme}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-3xl">{status.sticker}</span>
              <span className="text-xs font-black text-gray-400">
                {items.length > 0 ? `${doneCount}/${items.length} HĐ` : ''}
              </span>
            </div>
          </div>

          {/* Progress bar ngày */}
          {items.length > 0 && (
            <div className="mt-3">
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-kid-green to-green-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 font-bold mt-1 text-right">
                {status.progress}% hoàn thành
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate(1)}
          className="p-2 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 shadow-sm"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* ── Visual Timeline ─────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <p className="text-xs font-black text-gray-500">⏰ Timeline ngày</p>
            {items.length === 0 && !isPast && (
              <span className="text-xs text-gray-400 font-bold">Nhấn + để thêm hoạt động</span>
            )}
          </div>

          {/* Timeline scroll container */}
          <div className="overflow-y-auto max-h-[480px]" style={{ scrollbarWidth: 'none' }}>
            <div className="flex" style={{ minHeight: timelineHeight + 32 }}>
              {/* Cột giờ trái */}
              <div className="flex-shrink-0 w-14 border-r border-gray-100 relative">
                {hourLabels.map((label, i) => (
                  <div
                    key={label}
                    className="absolute left-0 right-0 flex items-center justify-end pr-2"
                    style={{ top: i * SLOT_HEIGHT_PX - 8 }}
                  >
                    <span className="text-[10px] font-bold text-gray-400">{label}</span>
                  </div>
                ))}
              </div>

              {/* Vùng timeline chính */}
              <div className="flex-1 relative" style={{ height: timelineHeight }}>
                {/* Đường kẻ giờ */}
                {hourLabels.map((label, i) => (
                  <div
                    key={label}
                    className="absolute left-0 right-0 border-t border-gray-100"
                    style={{ top: i * SLOT_HEIGHT_PX }}
                  />
                ))}

                {/* Items có giờ — render với vị trí tuyệt đối */}
                {timedItems.map(item => {
                  // FIX: Không dùng regex — giữ nguyên start_time HH:MM đầy đủ
                  const timeStr = (item.start_time ?? '08:00').substring(0, 5);
                  const topPx = timeToTopPx(timeStr);
                  const heightPx = durationToPx(item.duration_minutes ?? 30);
                  const isCompleted = item.status === 'completed' || item.status === 'complete';
                  const t = item.activity?.theme ?? 'Tự chọn';

                  return (
                    <div
                      key={item.id}
                      className={`absolute left-2 right-2 rounded-xl border-2 px-3 py-2 shadow-sm transition-all
                        ${isCompleted
                          ? 'bg-gray-50 border-gray-200 opacity-70'
                          : themeBg(t)
                        }`}
                      style={{ top: topPx, height: heightPx, overflow: 'hidden' }}
                    >
                      <div className="flex items-start gap-2 h-full">
                        <div className="flex flex-col items-center min-w-[44px] flex-shrink-0">
                          <span className="text-xs font-black">{timeStr}</span>
                          <span className="text-[10px] font-bold opacity-70 flex items-center gap-0.5">
                            <Clock size={8} />{item.duration_minutes ?? 30}p
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-base leading-none">{themeEmoji(t)}</span>
                            <p className={`text-sm font-black truncate ${isCompleted ? 'line-through opacity-50' : ''}`}>
                              {item.activity?.title ?? 'Hoạt động'}
                            </p>
                          </div>
                        </div>
                        {/* Nút check */}
                        {!isPast && (
                          <button
                            onClick={() => handleComplete(item.id)}
                            disabled={isCompleted || completing === item.id}
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              isCompleted
                                ? 'bg-kid-green text-white scale-110'
                                : 'bg-white/70 border-2 border-current text-current hover:bg-white hover:scale-110'
                            } ${completing === item.id ? 'animate-spin' : ''}`}
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        )}
                        {isCompleted && <span className="text-base flex-shrink-0">🌟</span>}
                      </div>
                    </div>
                  );
                })}

                {/* Nút + trên các giờ trống (chỉ khi không phải ngày đã qua) */}
                {!isPast && hourLabels.slice(0, -1).map((label, i) => {
                  const slotHour = TIMELINE_START_HOUR + i;
                  const slotTime = `${String(slotHour).padStart(2, '0')}:00`;
                  // Kiểm tra slot này có bị item chiếm không
                  const slotTop = i * SLOT_HEIGHT_PX;
                  const isOccupied = timedItems.some(item => {
                    const [h, m] = (item.start_time ?? '').split(':').map(Number);
                    const startPx = ((h - TIMELINE_START_HOUR) * 60 + m) / 60 * SLOT_HEIGHT_PX;
                    const endPx = startPx + durationToPx(item.duration_minutes ?? 30);
                    return slotTop >= startPx - 5 && slotTop < endPx - 10;
                  });
                  if (isOccupied) return null;
                  return (
                    <button
                      key={slotTime}
                      onClick={() => onOpenDesign(slotTime)}
                      className="absolute left-2 right-2 flex items-center gap-1 text-gray-300 hover:text-kid-orange hover:bg-orange-50 rounded-lg px-2 py-1 transition-all group"
                      style={{ top: slotTop + 4, height: SLOT_HEIGHT_PX - 12 }}
                    >
                      <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        Thêm lúc {slotTime}
                      </span>
                    </button>
                  );
                })}

                {/* Empty state khi không có item */}
                {items.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-4xl mb-2">🗺️</p>
                      <p className="text-gray-400 font-black text-sm">
                        {isPast ? 'Ngày này đã qua' : 'Chưa có lịch!'}
                      </p>
                      <p className="text-gray-300 text-xs mt-1">
                        {isPast ? 'Hôm đó bé đã nghỉ ngơi 😴' : 'Hover vào slot giờ để thêm'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items linh hoạt (không có giờ) */}
          {flexItems.length > 0 && (
            <div className="border-t border-dashed border-gray-200 px-4 py-3">
              <p className="text-xs font-bold text-gray-400 mb-2">🌊 Linh hoạt (chưa đặt giờ)</p>
              <div className="space-y-2">
                {flexItems.map(item => {
                  const isCompleted = item.status === 'completed' || item.status === 'complete';
                  const t = item.activity?.theme ?? 'Tự chọn';
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 ${
                        isCompleted ? 'bg-gray-50 border-gray-100 opacity-70' : themeBg(t)
                      }`}
                    >
                      <span className="text-xl">{themeEmoji(t)}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-black truncate ${isCompleted ? 'line-through opacity-50' : ''}`}>
                          {item.activity?.title ?? 'Hoạt động'}
                        </p>
                        <p className="text-xs font-bold opacity-70">
                          {t} • {item.duration_minutes ?? 30}p
                        </p>
                      </div>
                      {!isPast && (
                        <button
                          onClick={() => handleComplete(item.id)}
                          disabled={isCompleted || completing === item.id}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            isCompleted ? 'bg-kid-green text-white' : 'bg-white/70 border-2 border-current hover:scale-110'
                          }`}
                        >
                          <CheckCircle2 size={20} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Nút Thiết kế ──────────────────────────────────────── */}
      {!isPast && (
        <button
          onClick={() => onOpenDesign()}
          className="w-full bg-gradient-to-r from-kid-orange to-kid-yellow text-white font-black text-lg py-4 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-2"
        >
          <Edit3 size={22} />
          {items.length === 0 ? 'Tạo lịch ngày này' : 'Thiết kế lại lịch'}
        </button>
      )}
    </div>
  );
}
