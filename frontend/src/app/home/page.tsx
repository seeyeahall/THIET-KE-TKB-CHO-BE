'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Star, Zap, BookOpen, Trophy, CheckCircle2, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { todayStr, getDayStatus, themeEmoji, getDominantTheme, parseLocalDate, toDateStr } from '@/lib/utils/scheduleProgress';
import type { ScheduleItem } from '@/lib/types';

const themes = [
  { name: 'Nhà khoa học nhí', emoji: '🔬', color: 'bg-kid-blue', icon: Zap },
  { name: 'Họa sĩ nhí', emoji: '🎨', color: 'bg-kid-pink', icon: BookOpen },
  { name: 'Nhà thám hiểm', emoji: '🗺️', color: 'bg-kid-green', icon: Trophy },
  { name: 'Thiên tài nhí', emoji: '🧩', color: 'bg-kid-orange', icon: Star },
];

export default function HomePage() {
  const router = useRouter();
  const { selectedChild, setScheduleViewMode, setSelectedDate } = useAppStore();
  const [todayItems, setTodayItems] = useState<ScheduleItem[]>([]);
  const [stats, setStats] = useState({ xp: 0, coins: 0 });
  const [completing, setCompleting] = useState<string | null>(null);
  const [rewardPop, setRewardPop] = useState(false);

  useEffect(() => {
    if (!selectedChild) { router.push('/select-child'); return; }

    // Lấy lịch hôm nay
    const today = todayStr();
    api.getScheduleItemsByDate(selectedChild.id, today)
      .then(setTodayItems)
      .catch(() => {
        // Fallback: filter từ listSchedules
        api.listSchedules(selectedChild.id).then(scheds => {
          if (scheds.length > 0 && scheds[0].items) {
            const d = parseLocalDate(today);
            const dow = d.getDay();
            setTodayItems(scheds[0].items.filter(i => i.day_of_week === dow).slice(0, 3));
          }
        }).catch(() => {});
      });

    // Lấy XP/coins
    api.getChildStats(selectedChild.id)
      .then(s => setStats({ xp: s.xp ?? 0, coins: s.coins ?? 0 }))
      .catch(() => {});
  }, [selectedChild, router]);

  if (!selectedChild) return null;

  const todayTheme = themes[Math.abs(selectedChild.id.charCodeAt(0)) % themes.length];
  const today = todayStr();
  const dayStatus = getDayStatus(todayItems, today);
  const dominantTheme = getDominantTheme(todayItems);
  const doneCount = todayItems.filter(i => i.status === 'completed' || i.status === 'complete').length;

  const handleCompleteItem = async (itemId: string) => {
    if (completing) return;
    setCompleting(itemId);
    setTodayItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, status: 'completed' as const } : i
    ));
    setRewardPop(true);
    setTimeout(() => setRewardPop(false), 2500);
    try {
      await api.completeActivity(selectedChild.id, itemId);
    } catch {}
    setCompleting(null);
  };

  return (
    <main className="min-h-[100dvh] p-5 pb-6">
      <div className="max-w-lg mx-auto">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-gray-400 text-sm font-bold">
              {new Date().getHours() < 12 ? '🌅 Buổi sáng vui vẻ!' : new Date().getHours() < 18 ? '🌤 Buổi chiều năng động!' : '🌙 Buổi tối tuyệt vời!'}
            </p>
            <h2 className="text-2xl font-black text-kid-orange">
              Xin chào, {selectedChild.name}! 👋
            </h2>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 bg-kid-yellow px-3 py-1.5 rounded-full shadow-sm">
              <Star size={16} fill="currentColor" className="text-kid-orange" />
              <span className="font-black text-kid-orange">{stats.xp} XP</span>
            </div>
            <div className="flex items-center gap-1 bg-blue-100 px-3 py-1.5 rounded-full">
              <span className="text-sm">🪙</span>
              <span className="font-black text-blue-600 text-sm">{stats.coins}</span>
            </div>
          </div>
        </div>

        {/* ── Chủ đề hôm nay ────────────────────────────────── */}
        <div className={`${todayTheme.color} rounded-3xl p-5 mb-5 text-white shadow-lg`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/70 font-bold text-xs mb-1 uppercase tracking-wide">Chủ đề hôm nay</p>
              <h3 className="text-2xl font-black">
                {todayTheme.emoji} {todayTheme.name}
              </h3>
              {todayItems.length > 0 && (
                <p className="text-white/80 text-sm font-bold mt-1">
                  {themeEmoji(dominantTheme)} {dominantTheme}
                </p>
              )}
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <todayTheme.icon size={28} strokeWidth={2.5} />
            </div>
          </div>

          {/* Progress hôm nay */}
          {todayItems.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/70 font-bold mb-1">
                <span>Tiến độ hôm nay</span>
                <span>{doneCount}/{todayItems.length} hoạt động</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-2.5">
                <div
                  className="bg-white h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${dayStatus.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Widget Lịch hôm nay ────────────────────────────── */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-gray-800">
              {dayStatus.sticker} Lịch hôm nay
            </h3>
            <button
              onClick={() => { setScheduleViewMode('day'); setSelectedDate(todayStr()); router.push('/schedule'); }}
              className="flex items-center gap-1 text-xs font-bold text-kid-blue hover:underline"
            >
              Xem đầy đủ <ChevronRight size={14} />
            </button>
          </div>

          {todayItems.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-3xl mb-2">🗺️</p>
              <p className="text-gray-400 font-bold text-sm">Chưa có lịch nào hôm nay</p>
              <button
                onClick={() => router.push('/schedule')}
                className="mt-3 bg-kid-orange text-white font-black text-sm px-4 py-2 rounded-xl hover:scale-[1.02] transition-transform"
              >
                Tạo lịch ngay!
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayItems.slice(0, 3).map(item => {
                const isCompleted = item.status === 'completed' || item.status === 'complete';
                const theme = item.activity?.theme ?? 'Tự chọn';
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                      isCompleted ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-gray-50 border-transparent hover:border-kid-blue/20'
                    }`}
                  >
                    <span className="text-xl">{themeEmoji(theme)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-black text-sm truncate ${isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {item.activity?.title ?? 'Hoạt động'}
                      </p>
                      {item.start_time && (
                        <p className="text-xs font-bold text-gray-400">
                          {item.start_time.substring(0, 5)} • {item.duration_minutes}p
                        </p>
                      )}
                    </div>
                    {isCompleted ? (
                      <span className="text-xl">🌟</span>
                    ) : (
                      <button
                        onClick={() => handleCompleteItem(item.id)}
                        disabled={completing === item.id}
                        className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 text-gray-300 flex items-center justify-center hover:border-kid-green hover:text-kid-green hover:scale-110 transition-all"
                      >
                        <CheckCircle2 size={20} />
                      </button>
                    )}
                  </div>
                );
              })}
              {todayItems.length > 3 && (
                <p className="text-xs text-gray-400 font-bold text-center">
                  +{todayItems.length - 3} hoạt động khác...
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Thử thách hôm nay ─────────────────────────────── */}
        <h3 className="text-base font-black text-gray-800 mb-3">🎯 Thử thách</h3>
        <div className="space-y-2.5 mb-6">
          {[
            { title: 'Hoàn thành 3 hoạt động', progress: doneCount, total: 3, color: 'bg-kid-green' },
            { title: 'Chat với AI', progress: 0, total: 1, color: 'bg-kid-blue' },
            { title: 'Học 1 bài mới', progress: 0, total: 1, color: 'bg-kid-pink' },
          ].map((task, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-700 text-sm">{task.title}</span>
                <span className="text-sm font-black text-gray-400">
                  {Math.min(task.progress, task.total)}/{task.total}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`${task.color} h-2 rounded-full transition-all duration-700`}
                  style={{ width: `${Math.min((task.progress / task.total) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* ── Nút chat AI ────────────────────────────────────── */}
        <button
          onClick={() => router.push('/chat')}
          className="w-full bg-gradient-to-r from-kid-orange to-kid-yellow text-white rounded-2xl p-5 font-black text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-3"
        >
          <Sparkles size={24} />
          Nói chuyện với AI
        </button>


      </div>

      {/* ── Reward popup ───────────────────────────────────── */}
      {rewardPop && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
          <div className="animate-bounce bg-kid-yellow text-kid-orange font-black text-2xl px-8 py-4 rounded-full shadow-2xl border-4 border-white">
            🎉 +15 XP
          </div>
        </div>
      )}
    </main>
  );
}
