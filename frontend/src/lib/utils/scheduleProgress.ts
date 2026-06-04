/**
 * scheduleProgress.ts
 * Tính tiến độ, xác định sticker, gradient màu cho hệ thống lịch 4 cấp.
 */

import type { ScheduleItem } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DaySticker = '🌟' | '⭐' | '🌱' | '📅' | '✏️' | '😴';

export interface DayStatus {
  sticker: DaySticker;
  gradient: string;        // Tailwind class string
  textColor: string;       // Tailwind text class
  progress: number;        // 0–100
  hasStreak?: boolean;     // streak >= 3
}

export interface WeekSummary {
  progress: number;        // 0–100
  theme: string;
  streak: number;
  doneCount: number;
  totalCount: number;
}

export interface MonthSummary {
  progress: number;
  topThemes: string[];
  filledDays: number;      // ngày đã lên lịch
  totalDays: number;
}

// ─── Hằng số chủ đề ───────────────────────────────────────────────────────────

export const THEME_EMOJI: Record<string, string> = {
  'Học tập':      '📚',
  'Nghệ thuật':   '🎨',
  'Vận động':     '⚽',
  'Thiên nhiên':  '🌱',
  'Gia đình':     '👨‍👩‍👧',
  'Âm nhạc':      '🎵',
  'Khoa học':     '🔬',
  'Cảm xúc':      '💛',
  'Kỹ năng sống': '🌟',
  'Tự chọn':      '🎯',
  'Khác':         '🎮',
};

export function themeEmoji(theme: string): string {
  return THEME_EMOJI[theme] ?? '🎯';
}

// ─── Tính tiến độ ngày ────────────────────────────────────────────────────────

export function calcDayProgress(items: ScheduleItem[]): number {
  if (!items || items.length === 0) return 0;
  const done = items.filter(
    (i) => i.status === 'completed' || i.status === 'complete'
  ).length;
  return Math.round((done / items.length) * 100);
}

// ─── Xác định sticker ngày ────────────────────────────────────────────────────

export function getDaySticker(
  progress: number,
  hasItems: boolean,
  isPast: boolean
): DaySticker {
  if (!hasItems && isPast)  return '😴';
  if (!hasItems)            return '✏️';
  if (progress === 0)       return '📅';
  if (progress < 30)        return '📅';
  if (progress < 80)        return '🌱';
  if (progress < 100)       return '⭐';
  return '🌟';
}

// ─── Gradient Tailwind theo trạng thái ────────────────────────────────────────

export function getDayGradientClass(
  progress: number,
  hasItems: boolean,
  isPast: boolean
): string {
  if (!hasItems && isPast)  return 'bg-gray-50 border border-gray-100';
  if (!hasItems)            return 'bg-white border-2 border-dashed border-gray-200';
  if (progress === 100)     return 'bg-gradient-to-br from-green-100 to-green-300';
  if (progress >= 80)       return 'bg-gradient-to-br from-green-50 to-green-200';
  if (progress >= 30)       return 'bg-gradient-to-br from-yellow-50 to-yellow-200';
  return 'bg-gradient-to-br from-blue-50 to-blue-200';
}

export function getDayTextClass(
  progress: number,
  hasItems: boolean,
  isPast: boolean
): string {
  if (!hasItems && isPast)  return 'text-gray-300';
  if (!hasItems)            return 'text-gray-400';
  if (progress >= 80)       return 'text-green-700';
  if (progress >= 30)       return 'text-yellow-700';
  return 'text-blue-700';
}

// ─── DayStatus tổng hợp ───────────────────────────────────────────────────────

export function getDayStatus(
  items: ScheduleItem[],
  dateStr: string        // ISO date 'YYYY-MM-DD'
): DayStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + 'T00:00:00');
  const isPast = date < today;
  const hasItems = items.length > 0;
  const progress = calcDayProgress(items);

  return {
    sticker:   getDaySticker(progress, hasItems, isPast),
    gradient:  getDayGradientClass(progress, hasItems, isPast),
    textColor: getDayTextClass(progress, hasItems, isPast),
    progress,
  };
}

// ─── Chủ đề ngày / tuần ───────────────────────────────────────────────────────

export function getDominantTheme(items: ScheduleItem[]): string {
  if (!items || items.length === 0) return 'Tự chọn';
  const counts: Record<string, number> = {};
  items.forEach((i) => {
    const t = i.activity?.theme ?? 'Tự chọn';
    counts[t] = (counts[t] ?? 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Tự chọn';
}

// ─── Tóm tắt tuần ─────────────────────────────────────────────────────────────

export function calcWeekSummary(
  itemsByDay: ScheduleItem[][]   // index 0–6 (Thứ 2 = 0 ... CN = 6)
): WeekSummary {
  const all = itemsByDay.flat();
  const total = all.length;
  const done = all.filter(
    (i) => i.status === 'completed' || i.status === 'complete'
  ).length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  // Streak: số ngày liên tiếp (từ hôm nay trở về trước) có ít nhất 1 completed
  let streak = 0;
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const dayItems = itemsByDay[i] ?? [];
    const hasDone = dayItems.some(
      (x) => x.status === 'completed' || x.status === 'complete'
    );
    if (hasDone) streak++;
    else break;
  }

  return {
    progress,
    theme: getDominantTheme(all),
    streak,
    doneCount: done,
    totalCount: total,
  };
}

// ─── Tóm tắt tháng ────────────────────────────────────────────────────────────

export function calcMonthSummary(
  dayProgressList: { date: string; items: ScheduleItem[] }[]
): MonthSummary {
  const all = dayProgressList.flatMap((d) => d.items);
  const total = all.length;
  const done = all.filter(
    (i) => i.status === 'completed' || i.status === 'complete'
  ).length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  const filledDays = dayProgressList.filter((d) => d.items.length > 0).length;

  // Top 3 themes
  const counts: Record<string, number> = {};
  all.forEach((i) => {
    const t = i.activity?.theme ?? 'Tự chọn';
    counts[t] = (counts[t] ?? 0) + 1;
  });
  const topThemes = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);

  return {
    progress,
    topThemes,
    filledDays,
    totalDays: dayProgressList.length,
  };
}

// ─── Helpers ngày tháng ───────────────────────────────────────────────────────

/** 'YYYY-MM-DD' → Date (local) */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Date → 'YYYY-MM-DD' */
export function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Today as 'YYYY-MM-DD' */
export function todayStr(): string {
  return toDateStr(new Date());
}

/** 'YYYY-MM-DD' → 'dd/MM' */
export function formatShortDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** 'YYYY-MM-DD' → thứ tiếng Việt */
export function getDayLabel(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  const map = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return map[d.getDay()];
}

/** 'YYYY-MM-DD' → thứ dài */
export function getDayLabelFull(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  const map = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return map[d.getDay()];
}

/** Lấy danh sách 7 ngày của tuần chứa date */
export function getWeekDates(dateStr: string): string[] {
  const d = parseLocalDate(dateStr);
  const day = d.getDay(); // 0 = CN
  // Tuần bắt đầu T2
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day === 0 ? 7 : day) - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    return toDateStr(dt);
  });
}

/** Lấy danh sách tất cả ngày trong tháng */
export function getMonthDates(year: number, month: number): string[] {
  const days: string[] = [];
  const d = new Date(year, month - 1, 1);
  while (d.getMonth() === month - 1) {
    days.push(toDateStr(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

/** Lấy ngày đầu tuần (Thứ 2) chứa date */
export function getWeekStart(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return toDateStr(d);
}
