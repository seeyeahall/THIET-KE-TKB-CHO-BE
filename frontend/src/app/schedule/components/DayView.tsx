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
  onOpenDesign: () => void;     // mở DayDesignModal
  onNavigate: (date: string) => void;
  onCheckComplete: (itemId: string) => void;
}

// ─── Slots thời gian hiển thị ─────────────────────────────────────────────────
const HOUR_SLOTS = Array.from({ length: 15 }, (_, i) => {
  const h = i + 6; // 06:00 → 20:00
  return `${String(h).padStart(2, '0')}:00`;
});

// Màu chủ đề activity
const THEME_BG: Record<string, string> = {
  'Học tập':      'bg-blue-100 border-blue-300',
  'Nghệ thuật':   'bg-pink-100 border-pink-300',
  'Vận động':     'bg-green-100 border-green-300',
  'Thiên nhiên':  'bg-emerald-100 border-emerald-300',
  'Âm nhạc':      'bg-purple-100 border-purple-300',
  'Khoa học':     'bg-cyan-100 border-cyan-300',
  'Gia đình':     'bg-orange-100 border-orange-300',
  'Tự chọn':      'bg-yellow-100 border-yellow-300',
};

function themeBg(theme: string) {
  return THEME_BG[theme] ?? 'bg-gray-100 border-gray-200';
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
    try {
      // Thử lấy items theo ngày trước
      const data = await api.getScheduleItemsByDate(childId, dateStr);
      setItems(data);
    } catch {
      // Fallback: lấy từ listSchedules, filter theo ngày
      try {
        const schedules = await api.listSchedules(childId);
        if (schedules.length > 0 && schedules[0].items) {
          const d = parseLocalDate(dateStr);
          const dow = d.getDay(); // 0=CN, 1=T2...
          const filtered = schedules[0].items.filter(i => i.day_of_week === dow);
          setItems(filtered);
        } else {
          setItems([]);
        }
      } catch {
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  }, [childId, dateStr]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleComplete = async (itemId: string) => {
    if (completing) return;
    setCompleting(itemId);
    // Optimistic
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

  // Sắp xếp items theo giờ (items có giờ lên trên)
  const itemsSorted = [...items].sort((a, b) => {
    if (!a.start_time && !b.start_time) return 0;
    if (!a.start_time) return 1;
    if (!b.start_time) return -1;
    return a.start_time.localeCompare(b.start_time);
  });

  // Group items vào slots giờ
  const slotMap: Record<string, ScheduleItem[]> = {};
  itemsSorted.forEach(item => {
    const slot = item.start_time
      ? item.start_time.substring(0, 5).replace(/:\d+$/, ':00').padEnd(5, '0')
      : '__flex__';
    (slotMap[slot] = slotMap[slot] ?? []).push(item);
  });

  const doneCount = items.filter(i => i.status === 'completed' || i.status === 'complete').length;

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
              <h3 className="text-xl font-black text-gray-800">
                {dayLabel}
              </h3>
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

      {/* ── Timeline / Danh sách hoạt động ────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-gray-100">
          <p className="text-5xl mb-3">🗺️</p>
          <p className="text-gray-500 font-black text-lg">
            {isPast ? 'Ngày này đã qua' : 'Chưa có lịch nào!'}
          </p>
          <p className="text-gray-300 text-sm mt-1">
            {isPast ? 'Hôm đó bé đã nghỉ ngơi 😴' : 'Nhấn "Thiết kế lịch" để bắt đầu!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {/* Items có giờ */}
          {itemsSorted
            .filter(i => i.start_time)
            .map(item => (
              <ActivityCard
                key={item.id}
                item={item}
                onComplete={handleComplete}
                completing={completing === item.id}
                isPast={isPast}
              />
            ))}

          {/* Items không có giờ (flexible) */}
          {slotMap['__flex__'] && slotMap['__flex__'].length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-dashed border-gray-200">
              <p className="text-xs font-bold text-gray-400 mb-2">🌊 Linh hoạt (chưa đặt giờ)</p>
              <div className="space-y-2">
                {slotMap['__flex__'].map(item => (
                  <ActivityCard
                    key={item.id}
                    item={item}
                    onComplete={handleComplete}
                    completing={completing === item.id}
                    isPast={isPast}
                    compact
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Nút Thiết kế ──────────────────────────────────────── */}
      {!isPast && (
        <button
          onClick={onOpenDesign}
          className="w-full bg-gradient-to-r from-kid-orange to-kid-yellow text-white font-black text-lg py-4 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-2"
        >
          <Edit3 size={22} />
          {items.length === 0 ? 'Tạo lịch ngày này' : 'Thiết kế lại lịch'}
        </button>
      )}
    </div>
  );
}

// ─── Activity Card ─────────────────────────────────────────────────────────────
interface ActivityCardProps {
  item: ScheduleItem;
  onComplete: (id: string) => void;
  completing: boolean;
  isPast: boolean;
  compact?: boolean;
}

function ActivityCard({ item, onComplete, completing, isPast, compact }: ActivityCardProps) {
  const theme = item.activity?.theme ?? 'Tự chọn';
  const title = item.activity?.title ?? 'Hoạt động';
  const isCompleted = item.status === 'completed' || item.status === 'complete';

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
        isCompleted
          ? 'bg-gray-50 border-gray-100 opacity-70'
          : `${themeBg(theme)} shadow-sm`
      } ${compact ? 'py-2' : ''}`}
    >
      {/* Giờ */}
      {item.start_time && !compact && (
        <div className="flex flex-col items-center min-w-[52px]">
          <span className="text-base font-black text-gray-700">
            {item.start_time.substring(0, 5)}
          </span>
          <span className="text-[10px] font-bold text-gray-400 flex items-center gap-0.5">
            <Clock size={9} />
            {item.duration_minutes}p
          </span>
        </div>
      )}

      {/* Emoji chủ đề */}
      <span className={`text-2xl ${compact ? 'text-xl' : ''}`}>
        {themeEmoji(theme)}
      </span>

      {/* Nội dung */}
      <div className="flex-1 min-w-0">
        <p className={`font-black truncate ${compact ? 'text-sm' : 'text-base'} ${
          isCompleted ? 'line-through text-gray-400' : 'text-gray-800'
        }`}>
          {title}
        </p>
        <p className="text-xs font-bold text-gray-400">
          {theme}
          {item.duration_minutes && compact ? ` • ${item.duration_minutes}p` : ''}
        </p>
      </div>

      {/* Nút check */}
      {!isPast && (
        <button
          onClick={() => onComplete(item.id)}
          disabled={isCompleted || completing}
          className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            isCompleted
              ? 'bg-kid-green text-white scale-110'
              : 'bg-white border-2 border-gray-200 text-gray-300 hover:border-kid-green hover:text-kid-green hover:scale-110'
          } ${completing ? 'animate-spin' : ''}`}
        >
          <CheckCircle2 size={22} />
        </button>
      )}
      {isCompleted && (
        <span className="text-xl flex-shrink-0">🌟</span>
      )}
    </div>
  );
}
