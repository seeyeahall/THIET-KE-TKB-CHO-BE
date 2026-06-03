'use client';

import { Clock } from 'lucide-react';

interface ScheduleItemCardProps {
  id: string;
  start_time: string;
  duration_minutes: number;
  activity_title: string;
  activity_theme: string;
  status: string;
  onDragStart: (id: string) => void;
  onComplete: (id: string) => void;
}

export default function ScheduleItemCard({
  id,
  start_time,
  duration_minutes,
  activity_title,
  activity_theme,
  status,
  onDragStart,
  onComplete,
}: ScheduleItemCardProps) {
  const isCompleted = status === 'completed';

  return (
    <div
      draggable
      onDragStart={() => onDragStart(id)}
      className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-3 cursor-move hover:shadow-md hover:border-kid-yellow transition-all active:opacity-50"
    >
      <div className="bg-kid-yellow/30 text-kid-orange font-black text-xs px-2 py-1.5 rounded-xl min-w-[60px] text-center flex items-center justify-center gap-1">
        <Clock size={12} />
        {start_time}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`font-bold text-sm truncate ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{activity_title}</h4>
        <p className="text-xs text-gray-400">
          {duration_minutes} phút • {activity_theme}
        </p>
      </div>
      {!isCompleted ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete(id);
          }}
          className="w-7 h-7 rounded-full bg-kid-green/20 text-kid-green flex items-center justify-center flex-shrink-0 hover:bg-kid-green hover:text-white transition-colors"
        >
          ✓
        </button>
      ) : (
        <div className="w-7 h-7 rounded-full bg-kid-yellow text-white flex items-center justify-center flex-shrink-0">
          🌟
        </div>
      )}
    </div>
  );
}
