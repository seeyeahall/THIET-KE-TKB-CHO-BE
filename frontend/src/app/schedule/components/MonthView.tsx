'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import {
  getDayStatus, getDominantTheme, themeEmoji,
  getMonthDates, getDayLabel, calcMonthSummary, parseLocalDate, toDateStr,
} from '@/lib/utils/scheduleProgress';
import type { ScheduleItem, Schedule } from '@/lib/types';

interface MonthViewProps {
  childId: string;
  monthStr: string;            // 'YYYY-MM'
  onSelectDay: (date: string) => void;
  onChangeMonth: (month: string) => void;
  selectedDate: string;
}

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTH_NAMES = [
  'Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
  'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12',
];

export default function MonthView({
  childId,
  monthStr,
  onSelectDay,
  onChangeMonth,
  selectedDate,
}: MonthViewProps) {
  const [itemsByDate, setItemsByDate] = useState<Record<string, ScheduleItem[]>>({});
  const [loading, setLoading] = useState(true);

  const [year, month] = monthStr.split('-').map(Number);

  const changeMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    onChangeMonth(`${y}-${m}`);
  };

  const fetchMonthData = useCallback(async () => {
    setLoading(true);
    try {
      const schedules = await api.listSchedulesByMonth(childId, monthStr);
      const map: Record<string, ScheduleItem[]> = {};

      schedules.forEach((sched: Schedule) => {
        if (!sched.items) return;
        // Tính ngày thực tế từ week_start_date + day_of_week
        const weekStart = parseLocalDate(sched.week_start_date);
        sched.items.forEach(item => {
          const itemDate = new Date(weekStart);
          // day_of_week: 0=CN,1=T2..6=T7 → Mon=0 offset
          const offset = item.day_of_week === 0 ? 6 : item.day_of_week - 1;
          itemDate.setDate(weekStart.getDate() + offset);
          const ds = toDateStr(itemDate);
          (map[ds] = map[ds] ?? []).push(item);
        });
      });
      setItemsByDate(map);
    } catch {
      setItemsByDate({});
    } finally {
      setLoading(false);
    }
  }, [childId, monthStr]);

  useEffect(() => { fetchMonthData(); }, [fetchMonthData]);

  // Build calendar grid (Mon–Sun, padding với null)
  const monthDates = getMonthDates(year, month);
  const firstDate = parseLocalDate(monthDates[0]);
  const firstDow = firstDate.getDay(); // 0=CN
  const leadingNulls = firstDow === 0 ? 6 : firstDow - 1;

  const cells: (string | null)[] = [
    ...Array(leadingNulls).fill(null),
    ...monthDates,
  ];
  // Pad to multiple of 7
  while (cells.length % 7 !== 0) cells.push(null);

  const today = toDateStr(new Date());

  const dayProgressList = monthDates.map(ds => ({
    date: ds,
    items: itemsByDate[ds] ?? [],
  }));
  const monthlySummary = calcMonthSummary(dayProgressList);

  return (
    <div className="animate-fade-in-up">
      {/* ── Header tháng ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => changeMonth(-1)}
          className="p-2 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 shadow-sm"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 text-center">
          <h3 className="text-xl font-black text-gray-800">
            {MONTH_NAMES[month - 1]}, {year}
          </h3>
          {!loading && (
            <p className="text-xs font-bold text-gray-400">
              {monthlySummary.filledDays}/{monthlySummary.totalDays} ngày có lịch
            </p>
          )}
        </div>
        <button
          onClick={() => changeMonth(1)}
          className="p-2 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 shadow-sm"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* ── Labels ngày ─────────────────────────────────────── */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map(d => (
          <div key={d} className="text-center text-xs font-black text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* ── Grid lịch ──────────────────────────────────────── */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((dateStr, idx) => {
          if (!dateStr) return <div key={`empty-${idx}`} />;

          const items = itemsByDate[dateStr] ?? [];
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const status = getDayStatus(items, dateStr);
          const dayNum = parseLocalDate(dateStr).getDate();
          const theme = getDominantTheme(items);

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDay(dateStr)}
              className={`
                relative aspect-square rounded-xl p-1 flex flex-col items-center justify-center
                transition-all hover:scale-105 active:scale-95
                ${status.gradient}
                ${isToday ? 'ring-2 ring-kid-orange ring-offset-1' : ''}
                ${isSelected && !isToday ? 'ring-2 ring-kid-blue ring-offset-1' : ''}
              `}
            >
              {/* Số ngày */}
              <span className={`text-xs font-black leading-none ${
                isToday ? 'text-kid-orange' : status.textColor
              }`}>
                {dayNum}
              </span>
              {/* Sticker */}
              <span className="text-base leading-none mt-0.5">
                {loading ? '' : status.sticker}
              </span>
              {/* Theme icon nếu có */}
              {items.length > 0 && !loading && (
                <span className="text-[9px] leading-none">{themeEmoji(theme)}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Footer tóm tắt tháng ─────────────────────────── */}
      {!loading && monthlySummary.totalDays > 0 && (
        <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-black text-gray-600">Tiến độ tháng</span>
            <span className="text-sm font-black text-kid-green">
              {monthlySummary.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
            <div
              className="bg-gradient-to-r from-kid-green to-green-400 h-2.5 rounded-full transition-all"
              style={{ width: `${monthlySummary.progress}%` }}
            />
          </div>
          {monthlySummary.topThemes.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs font-bold text-gray-400">Chủ đề:</span>
              {monthlySummary.topThemes.map(t => (
                <span key={t} className="text-xs bg-gray-100 rounded-full px-2 py-0.5 font-bold text-gray-600">
                  {themeEmoji(t)} {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
