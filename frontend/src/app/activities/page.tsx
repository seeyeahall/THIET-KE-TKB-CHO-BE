'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Clock, Flame, BookOpen, Palette, TreePine, Dumbbell, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import SkeletonCard from '@/components/SkeletonCard';
import type { Activity } from '@/lib/types';

const CATEGORIES = [
  { id: 'all', label: 'Tất cả', icon: Flame },
  { id: 'Học tập', label: 'Học tập', icon: BookOpen },
  { id: 'Nghệ thuật', label: 'Nghệ thuật', icon: Palette },
  { id: 'Thiên nhiên', label: 'Thiên nhiên', icon: TreePine },
  { id: 'Vận động', label: 'Vận động', icon: Dumbbell },
];

export default function ActivitiesPage() {
  const router = useRouter();
  const { selectedChild } = useAppStore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!selectedChild) {
      router.push('/select-child');
      return;
    }
    api.listActivities()
      .then((data) => {
        if (data.length > 0) setActivities(data);
        else throw new Error('empty');
      })
      .catch(() => {
        // Demo data
        setActivities([
          { id: '1', title: 'Vẽ tranh cây cối', slug: 've-tranh-cay-coi', description: 'Dùng màu nước vẽ cây trong vườn', theme: 'Nghệ thuật', duration_minutes: 30, difficulty: 'Dễ', requires_parent: false, status: 'published' },
          { id: '2', title: 'Đọc truyện khoa học', slug: 'doc-truyen-khoa-hoc', description: 'Khám phá vũ trụ qua sách tranh', theme: 'Học tập', duration_minutes: 20, difficulty: 'Dễ', requires_parent: false, status: 'published' },
          { id: '3', title: 'Trồng cây đậu', slug: 'trong-cay-dau', description: 'Theo dõi sự mọc của hạt đậu', theme: 'Thiên nhiên', duration_minutes: 15, difficulty: 'Dễ', requires_parent: true, status: 'published' },
          { id: '4', title: 'Thể dục buổi sáng', slug: 'the-duc-buoi-sang', description: 'Nhảy dây và vươn vai', theme: 'Vận động', duration_minutes: 15, difficulty: 'Dễ', requires_parent: false, status: 'published' },
          { id: '5', title: 'Làm thí nghiệm nước', slug: 'lam-thi-nghiem-nuoc', description: 'Quan sát nổi chìm của vật', theme: 'Học tập', duration_minutes: 25, difficulty: 'Trung bình', requires_parent: true, status: 'published' },
          { id: '6', title: 'Làm đồ handmade', slug: 'lam-do-handmade', description: 'Tái chế giấy làm thiệp', theme: 'Nghệ thuật', duration_minutes: 40, difficulty: 'Trung bình', requires_parent: true, status: 'published' },
        ]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedChild, router]);

  const filtered = activities.filter((a) => {
    const matchCat = category === 'all' || a.theme === category;
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleGenerateImage = async (activityId: string) => {
    setGeneratingIds((prev) => new Set(prev).add(activityId));
    try {
      const result = await api.generateImage(activityId);
      setActivities((prev) =>
        prev.map((a) => (a.id === activityId ? { ...a, image_url: result.image_url } : a))
      );
    } catch (err) {
      // Fallback: set a placeholder on error so UI doesn't break
      const fallbackUrl = `https://picsum.photos/seed/${activityId}/400/300`;
      setActivities((prev) =>
        prev.map((a) => (a.id === activityId ? { ...a, image_url: fallbackUrl } : a))
      );
    } finally {
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(activityId);
        return next;
      });
    }
  };

  if (!selectedChild) return null;

  return (
    <main className="min-h-screen p-6 pb-24">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <h2 className="text-2xl font-black text-kid-orange mb-6">
          🎯 Khám phá hoạt động
        </h2>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm hoạt động..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-gray-700 border border-gray-100 focus:outline-none focus:border-kid-yellow focus:ring-2 focus:ring-kid-yellow/20"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                  active
                    ? 'bg-kid-yellow text-kid-orange'
                    : 'bg-white text-gray-500 border border-gray-100'
                }`}
              >
                <Icon size={14} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Activity Cards */}
        <div className="grid gap-3">
          {loading && (
            <>
              <SkeletonCard height="h-28" />
              <SkeletonCard height="h-28" />
              <SkeletonCard height="h-28" />
              <SkeletonCard height="h-28" />
            </>
          )}
          {!loading && filtered.map((activity) => (
            <div
              key={activity.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-kid-yellow hover:shadow-md transition-all"
            >
              {activity.image_url && (
                <div className="mb-3 overflow-hidden rounded-xl">
                  <img
                    src={activity.image_url}
                    alt={activity.title}
                    className="w-full h-40 object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-800">{activity.title}</h3>
                <span className="text-xs font-bold px-2 py-1 rounded-lg bg-gray-100 text-gray-500">
                  {activity.difficulty}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-3">{activity.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {activity.duration_minutes} phút
                  </span>
                  <span className="bg-kid-yellow/20 text-kid-orange px-2 py-0.5 rounded-full">
                    {activity.theme}
                  </span>
                </div>
                <button
                  onClick={() => handleGenerateImage(activity.id)}
                  disabled={generatingIds.has(activity.id)}
                  className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-kid-yellow/20 text-kid-orange hover:bg-kid-yellow/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Tạo ảnh AI"
                >
                  <Sparkles size={14} className={generatingIds.has(activity.id) ? 'animate-spin' : ''} />
                  {generatingIds.has(activity.id) ? 'Đang tạo...' : 'Tạo ảnh AI'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 font-bold">
            Không tìm thấy hoạt động nào 🔍
          </div>
        )}
      </div>
    </main>
  );
}
