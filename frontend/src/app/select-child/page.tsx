'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Settings } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import SkeletonPage from '@/components/SkeletonPage';
import type { Child } from '@/lib/types';

export default function SelectChildPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const setSelectedChild = useAppStore((s) => s.setSelectedChild);

  useEffect(() => {
    api.listChildren()
      .then((data) => {
        setChildren(data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback demo data khi backend chua chay
        setChildren([
          { id: '1', name: 'Lan', age: 7, favorite_color: 'hồng', favorite_animal: 'thỏ', interests: ['vẽ', 'cây cối'], dislikes: ['đá bóng'] },
          { id: '2', name: 'Nam', age: 8, favorite_color: 'xanh', favorite_animal: 'cá voi', interests: ['khoa học', 'bơi'], dislikes: [] },
        ]);
        setLoading(false);
      });
  }, []);

  const avatars = ['🐰', '🦊', '🐼', '🐱', '🐶', '🦁'];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold text-kid-orange text-center mb-2">
          🚀 Kid Adventure Planner
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Hôm nay con là ai?
        </p>

        {loading ? (
          <div className="py-8">
            <SkeletonPage cardCount={3} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mb-8">
            {children.map((child, idx) => (
              <Link
                key={child.id}
                href="/home"
                onClick={() => setSelectedChild(child)}
                className="bg-white rounded-3xl p-6 shadow-lg border-2 border-transparent hover:border-kid-yellow hover:scale-105 transition-all text-center"
              >
                <div className="text-5xl mb-3">{avatars[idx % avatars.length]}</div>
                <div className="text-lg font-bold text-gray-800">{child.name}</div>
                <div className="text-sm text-gray-400">{child.age} tuổi</div>
              </Link>
            ))}

            <button className="bg-white/60 rounded-3xl p-6 border-2 border-dashed border-gray-300 hover:border-kid-green hover:bg-kid-green/10 transition-all text-center">
              <div className="text-5xl mb-3 text-kid-green">+</div>
              <div className="text-sm font-bold text-gray-500">Thêm bé</div>
            </button>
          </div>
        )}

        <Link
          href="/parent"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors"
        >
          <Settings size={18} />
          Phụ huynh
        </Link>
      </div>
    </main>
  );
}
