'use client';

import { useState } from 'react';
import ScheduleItemCard from './ScheduleItemCard';

interface ScheduleItem {
  id: string;
  day_of_week: number;
  start_time: string;
  duration_minutes: number;
  activity_title: string;
  activity_theme: string;
  status: string;
}

interface DayColumnProps {
  dayIndex: number;
  dayLabel: string;
  items: ScheduleItem[];
  onDrop: (itemId: string, dayIndex: number) => void;
  onDragStart: (id: string) => void;
  onComplete: (id: string) => void;
}

export default function DayColumn({ dayIndex, dayLabel, items, onDrop, onDragStart, onComplete }: DayColumnProps) {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        const itemId = e.dataTransfer.getData('text/plain');
        if (itemId) onDrop(itemId, dayIndex);
      }}
      className={`min-h-[120px] rounded-2xl p-3 transition-all ${
        isOver ? 'bg-kid-yellow/20 border-2 border-dashed border-kid-orange' : 'bg-gray-50/50 border-2 border-transparent'
      }`}
    >
      <div className="text-xs font-black text-gray-400 mb-2 text-center">{dayLabel}</div>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', item.id);
              onDragStart(item.id);
            }}
          >
            <ScheduleItemCard
              id={item.id}
              start_time={item.start_time}
              duration_minutes={item.duration_minutes}
              activity_title={item.activity_title}
              activity_theme={item.activity_theme}
              status={item.status}
              onDragStart={() => {}}
              onComplete={onComplete}
            />
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-4 text-gray-300 text-xs font-bold">Thả vào đây</div>
        )}
      </div>
    </div>
  );
}
