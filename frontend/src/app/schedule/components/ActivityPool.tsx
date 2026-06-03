'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Activity } from '@/lib/types';

interface ActivityPoolProps {
  onDragStart: (activity: Activity) => void;
}

export default function ActivityPool({ onDragStart }: ActivityPoolProps) {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    api.listActivities()
      .then((data) => {
        if (data.length > 0) setActivities(data.slice(0, 6));
        else throw new Error('empty');
      })
      .catch(() => {
        setActivities([
          { id: 'pool-1', title: 'Vẽ tranh', slug: 've-tranh', theme: 'Nghệ thuật', duration_minutes: 30, difficulty: 'Dễ', requires_parent: false, status: 'published' },
          { id: 'pool-2', title: 'Đọc sách', slug: 'doc-sach', theme: 'Học tập', duration_minutes: 20, difficulty: 'Dễ', requires_parent: false, status: 'published' },
          { id: 'pool-3', title: 'Bơi lội', slug: 'boi-loi', theme: 'Vận động', duration_minutes: 45, difficulty: 'Trung bình', requires_parent: true, status: 'published' },
          { id: 'pool-4', title: 'Trồng cây', slug: 'trong-cay', theme: 'Thiên nhiên', duration_minutes: 20, difficulty: 'Dễ', requires_parent: true, status: 'published' },
          { id: 'pool-5', title: 'Làm toán', slug: 'lam-toan', theme: 'Học tập', duration_minutes: 25, difficulty: 'Dễ', requires_parent: false, status: 'published' },
        ]);
      });
  }, []);

  return (
    <div className="mb-6">
      <h3 className="text-sm font-black text-gray-500 mb-3">📦 Kho hoạt động (kéo thả)</h3>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {activities.map((activity) => (
          <div
            key={activity.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify(activity));
              onDragStart(activity);
            }}
            className="flex-shrink-0 bg-white rounded-xl p-3 shadow-sm border border-gray-100 cursor-move hover:border-kid-yellow hover:shadow-md transition-all w-32 text-center"
          >
            <div className="text-2xl mb-1">
              {activity.theme === 'Nghệ thuật' ? '🎨' : activity.theme === 'Học tập' ? '📚' : activity.theme === 'Vận động' ? '⚽' : activity.theme === 'Thiên nhiên' ? '🌱' : '🎯'}
            </div>
            <div className="text-xs font-bold text-gray-700 truncate">{activity.title}</div>
            <div className="text-[10px] text-gray-400 font-bold">{activity.duration_minutes} phút</div>
          </div>
        ))}
      </div>
    </div>
  );
}
