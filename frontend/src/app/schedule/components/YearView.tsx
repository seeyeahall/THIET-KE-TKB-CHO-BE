'use client';

import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getDayGradientClass, getDaySticker, themeEmoji } from '@/lib/utils/scheduleProgress';
import type { ScheduleItem } from '@/lib/types';

interface YearViewProps {
  childId: string;
  year: number;
  onSelectMonth: (month: string) => void;  // 'YYYY-MM'
  onChangeYear: (year: number) => void;
}

const MONTH_NAMES_SHORT = [
  'Th.1','Th.2','Th.3','Th.4','Th.5','Th.6',
  'Th.7','Th.8','Th.9','Th.10','Th.11','Th.12',
];

// Demo: chưa có API lấy stats năm → dùng mock hoặc 0
// Khi backend sẵn sàng, thay bằng api.getChildStatsByYear()
function getMonthProgress(year: number, m: number): number {
  // Placeholder — trả về 0 cho tháng tương lai
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (year > currentYear) return 0;
  if (year === currentYear && m > currentMonth) return 0;
  // Tháng hiện tại: tiến độ một nửa (sẽ được thay bằng real data)
  if (year === currentYear && m === currentMonth) return 40;
  // Tháng đã qua: random demo
  return Math.floor(30 + ((m * 17 + year * 7) % 55));
}

function getMonthSticker(progress: number, isPast: boolean, isFuture: boolean): string {
  if (isFuture) return '';
  if (!isPast && progress === 0) return '📅';
  if (progress >= 80) return '⭐';
  if (progress >= 30) return '🌱';
  return '📅';
}

export default function YearView({ childId, year, onSelectMonth, onChangeYear }: YearViewProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const totalDone = months.reduce((acc, m) => {
    const isPast = year < currentYear || (year === currentYear && m < currentMonth);
    return acc + (isPast ? getMonthProgress(year, m) : 0);
  }, 0);
  const avgProgress = Math.round(totalDone / 12);

  return (
    <div className="animate-fade-in-up">
      {/* ── Header năm ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => onChangeYear(year - 1)}
          className="p-2 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 shadow-sm"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 text-center">
          <h3 className="text-2xl font-black text-gray-800">{year}</h3>
          <p className="text-xs font-bold text-gray-400">
            Trung bình {avgProgress}% hoàn thành
          </p>
        </div>
        <button
          onClick={() => onChangeYear(year + 1)}
          disabled={year >= currentYear}
          className="p-2 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 shadow-sm disabled:opacity-30"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* ── Grid 12 tháng (4×3) ────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {months.map(m => {
          const isCurrent = year === currentYear && m === currentMonth;
          const isPast = year < currentYear || (year === currentYear && m < currentMonth);
          const isFuture = year > currentYear || (year === currentYear && m > currentMonth);
          const progress = getMonthProgress(year, m);
          const sticker = getMonthSticker(progress, isPast, isFuture);

          // Gradient dựa trên progress
          let gradient = 'bg-gray-50 border border-dashed border-gray-200';
          if (!isFuture && progress >= 80) gradient = 'bg-gradient-to-br from-green-100 to-green-300';
          else if (!isFuture && progress >= 30) gradient = 'bg-gradient-to-br from-yellow-50 to-yellow-200';
          else if (!isFuture && isPast) gradient = 'bg-gray-100';

          return (
            <button
              key={m}
              onClick={() => onSelectMonth(`${year}-${String(m).padStart(2, '0')}`)}
              className={`
                relative rounded-2xl p-4 flex flex-col items-center gap-1
                transition-all hover:scale-105 active:scale-95 shadow-sm
                ${gradient}
                ${isCurrent ? 'ring-2 ring-kid-orange ring-offset-1' : ''}
              `}
            >
              <span className="text-sm font-black text-gray-600">
                {MONTH_NAMES_SHORT[m - 1]}
              </span>
              <span className="text-2xl leading-none">
                {isFuture ? '✨' : sticker}
              </span>
              {!isFuture && (
                <span className="text-[10px] font-black text-gray-400">
                  {progress}%
                </span>
              )}
              {isCurrent && (
                <span className="absolute top-1 right-1 text-[8px] bg-kid-orange text-white rounded px-1 font-black">
                  Now
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tóm tắt năm ────────────────────────────────────── */}
      <div className="mt-5 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h4 className="font-black text-gray-700 mb-3">Tóm tắt {year}</h4>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-2xl font-black text-kid-green">{avgProgress}%</p>
            <p className="text-[10px] font-bold text-gray-400">TB tháng</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-3">
            <p className="text-2xl font-black text-kid-orange">
              {months.filter(m => getMonthProgress(year, m) >= 80).length}
            </p>
            <p className="text-[10px] font-bold text-gray-400">Tháng ⭐</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-2xl font-black text-kid-blue">
              {months.filter(m => {
                const isFuture = year > currentYear || (year === currentYear && m > currentMonth);
                return !isFuture;
              }).length}
            </p>
            <p className="text-[10px] font-bold text-gray-400">Tháng đã qua</p>
          </div>
        </div>
      </div>
    </div>
  );
}
