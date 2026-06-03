'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Star, Zap, BookOpen, Trophy } from 'lucide-react';
import { useAppStore } from '@/lib/store';

const themes = [
  { name: 'Nhà khoa học nhí', emoji: '🔬', color: 'bg-kid-blue', icon: Zap },
  { name: 'Họa sĩ nhí', emoji: '🎨', color: 'bg-kid-pink', icon: BookOpen },
  { name: 'Nhà thám hiểm', emoji: '🗺️', color: 'bg-kid-green', icon: Trophy },
  { name: 'Thiên tài nhí', emoji: '🧩', color: 'bg-kid-orange', icon: Star },
];

export default function HomePage() {
  const router = useRouter();
  const { selectedChild, setSelectedChild } = useAppStore();

  useEffect(() => {
    if (!selectedChild) {
      router.push('/select-child');
    }
  }, [selectedChild, router]);

  if (!selectedChild) return null;

  const todayTheme = themes[Math.abs(selectedChild.id.charCodeAt(0)) % themes.length];

  return (
    <main className="min-h-screen p-6 pb-24">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-gray-500 text-sm font-bold">Xin chào, {selectedChild.name}! 👋</p>
            <h2 className="text-2xl font-black text-kid-orange">
              Hôm nay con muốn làm gì?
            </h2>
          </div>
          <div className="flex items-center gap-1 bg-kid-yellow px-4 py-2 rounded-full">
            <Star size={18} fill="currentColor" className="text-kid-orange" />
            <span className="font-black text-kid-orange text-lg">142</span>
          </div>
        </div>

        {/* Today's Theme Card */}
        <div className={`${todayTheme.color} rounded-3xl p-6 mb-6 text-white shadow-lg`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/80 font-bold text-sm mb-1">Chủ đề hôm nay</p>
              <h3 className="text-2xl font-black">
                {todayTheme.emoji} {todayTheme.name}
              </h3>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <todayTheme.icon size={28} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <h3 className="text-lg font-black text-gray-800 mb-4">🎯 Thử thách hôm nay</h3>
        <div className="space-y-3 mb-8">
          {[
            { title: 'Hoàn thành 3 hoạt động', progress: 1, total: 3, color: 'bg-kid-green' },
            { title: 'Chat với AI', progress: 0, total: 1, color: 'bg-kid-blue' },
            { title: 'Học 1 bài mới', progress: 0, total: 1, color: 'bg-kid-pink' },
          ].map((task, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-700">{task.title}</span>
                <span className="text-sm font-bold text-gray-400">
                  {task.progress}/{task.total}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className={`${task.color} h-2.5 rounded-full transition-all`}
                  style={{ width: `${(task.progress / task.total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* AI Chat Quick Access */}
        <button
          onClick={() => router.push('/chat')}
          className="w-full bg-gradient-to-r from-kid-orange to-kid-yellow text-white rounded-2xl p-5 font-black text-lg shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-3"
        >
          <Sparkles size={24} />
          Nói chuyện với AI
        </button>
      </div>
    </main>
  );
}
