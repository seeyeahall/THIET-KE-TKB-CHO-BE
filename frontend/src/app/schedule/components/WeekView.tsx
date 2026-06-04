'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import {
  getDayStatus, getDominantTheme, themeEmoji,
  getWeekDates, getDayLabel, getDayLabelFull, formatShortDate,
  calcWeekSummary, parseLocalDate, toDateStr,
} from '@/lib/utils/scheduleProgress';
import type { ScheduleItem, Schedule } from '@/lib/types';

interface WeekViewProps {
  childId: string;
  selectedDate: string;          // ngày đang chọn trong tuần
  onSelectDay: (date: string) => void;
  onNavigateWeek: (date: string) => void;
}

const DAY_FULL = ['Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy','Chủ Nhật'];

export default function WeekView({
  childId, selectedDate, onSelectDay, onNavigateWeek,
}: WeekViewProps) {
  const [itemsByDate, setItemsByDate] = useState<Record<string, ScheduleItem[]>>({});
  const [loading, setLoading] = useState(true);

  const weekDates = getWeekDates(selectedDate); // Mon–Sun

  const today = toDateStr(new Date());

  const navigateWeek = (delta: number) => {
    const d = parseLocalDate(weekDates[0]);
    d.setDate(d.getDate() + delta * 7);
    onNavigateWeek(toDateStr(d));
  };

  const fetchWeekData = useCallback(async () => {
    setLoading(true);
    try {
      const schedules = await api.listSchedules(childId);
      const map: Record<string, ScheduleItem[]> = {};
      schedules.forEach((sched: Schedule) => {
        if (!sched.items) return;
        const weekStart = parseLocalDate(sched.week_start_date);
        sched.items.forEach(item => {
          const itemDate = new Date(weekStart);
          const offset = item.day_of_week === 0 ? 6 : item.day_of_week - 1;
          itemDate.setDate(weekStart.getDate() + offset);
          const ds = toDateStr(itemDate);
          if (weekDates.includes(ds)) {
            (map[ds] = map[ds] ?? []).push(item);
          }
        });
      });
      setItemsByDate(map);
    } catch {
      setItemsByDate({});
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, weekDates[0]]);

  useEffect(() => { fetchWeekData(); }, [fetchWeekData]);

  // Tóm tắt tuần
  const itemsByDayArr = weekDates.map(ds => itemsByDate[ds] ?? []);
  const weekSummary = calcWeekSummary(itemsByDayArr);
  const weekLabel = `${formatShortDate(weekDates[0])} – ${formatShortDate(weekDates[6])}`;

  // Items của ngày đang chọn
  const selectedItems = itemsByDate[selectedDate] ?? [];
  const selectedStatus = getDayStatus(selectedItems, selectedDate);

  return (
    <div className="animate-fade-in-up">
      {/* ── Header tuần ────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigateWeek(-1)}
          className="p-2 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 shadow-sm"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 text-center">
          <h3 className="text-base font-black text-gray-700">{weekLabel}</h3>
          {!loading && weekSummary.totalCount > 0 && (
            <p className="text-xs font-bold text-kid-green">
              {weekSummary.doneCount}/{weekSummary.totalCount} HĐ •{' '}
              {themeEmoji(weekSummary.theme)} {weekSummary.theme}
              {weekSummary.streak >= 3 && ' 🔥'}
            </p>
          )}
        </div>
        <button
          onClick={() => navigateWeek(1)}
          className="p-2 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 shadow-sm"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* ── Tab 7 ngày ngang ───────────────────────────────── */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {weekDates.map((ds, i) => {
          const items = itemsByDate[ds] ?? [];
          const status = getDayStatus(items, ds);
          const isSelected = ds === selectedDate;
          const isToday = ds === today;

          return (
            <button
              key={ds}
              onClick={() => onSelectDay(ds)}
              className={`
                flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-2xl
                transition-all min-w-[52px]
                ${isSelected
                  ? 'bg-kid-orange text-white shadow-lg scale-105'
                  : `${status.gradient} hover:scale-105`}
                ${isToday && !isSelected ? 'ring-2 ring-kid-orange' : ''}
              `}
            >
              <span className={`text-[10px] font-black ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                {getDayLabel(ds)}
              </span>
              <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                {parseLocalDate(ds).getDate()}
              </span>
              <span className="text-base leading-none">
                {loading ? '·' : status.sticker}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Progress bar tuần ──────────────────────────────── */}
      {!loading && weekSummary.totalCount > 0 && (
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-black text-gray-500">Tiến độ tuần</span>
            <span className="text-xs font-black text-kid-green">{weekSummary.progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-kid-green to-green-400 h-2 rounded-full transition-all"
              style={{ width: `${weekSummary.progress}%` }}
            />
          </div>
          {weekSummary.streak > 0 && (
            <p className="text-[10px] text-gray-400 font-bold mt-1">
              🔥 Streak {weekSummary.streak} ngày liên tiếp
            </p>
          )}
        </div>
      )}

      {/* ── Timeline ngắn ngày đang chọn ───────────────────── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-black text-gray-700">
            {DAY_FULL[weekDates.indexOf(selectedDate)] ?? getDayLabelFull(selectedDate)}
          </h4>
          <span className="text-xl">{selectedStatus.sticker}</span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : selectedItems.length === 0 ? (
          <p className="text-gray-300 text-sm font-bold text-center py-4">
            Chưa có hoạt động nào 🌱
          </p>
        ) : (
          <div className="space-y-2">
            {[...selectedItems]
              .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''))
              .map(item => {
                const isCompleted = item.status === 'completed' || item.status === 'complete';
                const t = item.activity?.theme ?? 'Tự chọn';
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                      isCompleted ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <span className="text-lg">{themeEmoji(t)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${isCompleted ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {item.activity?.title ?? 'Hoạt động'}
                      </p>
                      {item.start_time && (
                        <p className="text-[10px] text-gray-400 font-bold">
                          {item.start_time.substring(0, 5)}
                        </p>
                      )}
                    </div>
                    {isCompleted && <span>✅</span>}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
