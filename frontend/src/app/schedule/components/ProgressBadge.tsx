'use client';

import { getDaySticker, getDayGradientClass, themeEmoji } from '@/lib/utils/scheduleProgress';
import type { ScheduleItem } from '@/lib/types';

interface ProgressBadgeProps {
  items: ScheduleItem[];
  dateStr: string;          // 'YYYY-MM-DD'
  hasStreak?: boolean;
  theme?: string;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  onClick?: () => void;
}

export default function ProgressBadge({
  items,
  dateStr,
  hasStreak = false,
  theme,
  size = 'md',
  showCount = false,
  onClick,
}: ProgressBadgeProps) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + 'T00:00:00');
  const isPast = date < today;
  const hasItems = items.length > 0;

  const done = items.filter(i => i.status === 'completed' || i.status === 'complete').length;
  const total = items.length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  const sticker = getDaySticker(progress, hasItems, isPast);
  const gradient = getDayGradientClass(progress, hasItems, isPast);

  const sizeClass = size === 'sm'
    ? 'w-8 h-8 text-xs'
    : size === 'lg'
    ? 'w-14 h-14 text-2xl'
    : 'w-10 h-10 text-base';

  return (
    <div
      className={`relative rounded-xl ${gradient} flex flex-col items-center justify-center ${sizeClass} transition-all ${onClick ? 'cursor-pointer hover:scale-110 active:scale-95' : ''} ${hasStreak ? 'ring-2 ring-orange-400 ring-offset-1' : ''}`}
      onClick={onClick}
      title={`${progress}% hoàn thành${hasStreak ? ' 🔥 Streak!' : ''}`}
    >
      <span className="leading-none select-none">{sticker}</span>
      {showCount && total > 0 && (
        <span className="text-[9px] font-black text-gray-500 leading-none mt-0.5">
          {done}/{total}
        </span>
      )}
      {theme && size === 'lg' && (
        <span className="text-[10px] leading-none mt-0.5">{themeEmoji(theme)}</span>
      )}
      {hasStreak && (
        <span className="absolute -top-1 -right-1 text-[10px]">🔥</span>
      )}
    </div>
  );
}
