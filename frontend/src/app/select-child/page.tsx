'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Settings, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { audio } from '@/lib/audio';
import SkeletonPage from '@/components/SkeletonPage';
import type { Child } from '@/lib/types';

export default function SelectChildPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const setSelectedChild = useAppStore((s) => s.setSelectedChild);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildAge, setNewChildAge] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim() || !newChildAge) return;
    setIsSubmitting(true);
    try {
      const newChild = await api.createChild({
        name: newChildName,
        age: Number(newChildAge),
        interests: [],
        dislikes: [],
      });
      setChildren([...children, newChild]);
      setShowAddModal(false);
      setNewChildName('');
      setNewChildAge('');
    } catch (err) {
      alert('Không thể tạo bé mới: ' + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteChild = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Bạn có chắc muốn xoá hồ sơ của bé ${name}? Mọi dữ liệu lịch của bé sẽ bị xoá.`)) return;
    try {
      await api.deleteChild(id);
      setChildren(children.filter(c => c.id !== id));
    } catch (err) {
      alert('Không thể xoá bé: ' + (err as Error).message);
    }
  };

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
              <div key={child.id} className="relative group">
                <Link
                  href="/home"
                  onClick={() => { setSelectedChild(child); audio.sfx('pop'); }}
                  className="block bg-white rounded-3xl p-6 shadow-lg border-2 border-transparent hover:border-kid-yellow hover:scale-105 transition-all text-center h-full"
                >
                  <div className="text-5xl mb-3">{avatars[idx % avatars.length]}</div>
                  <div className="text-lg font-bold text-gray-800">{child.name}</div>
                  <div className="text-sm text-gray-400">{child.age} tuổi</div>
                </Link>
                <button
                  onClick={(e) => handleDeleteChild(e, child.id, child.name)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-100 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                  title="Xoá bé"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white/60 rounded-3xl p-6 border-2 border-dashed border-gray-300 hover:border-kid-green hover:bg-kid-green/10 transition-all text-center flex flex-col items-center justify-center min-h-[140px]"
            >
              <div className="text-5xl mb-3 text-kid-green">+</div>
              <div className="text-sm font-bold text-gray-500">Thêm bé</div>
            </button>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full animate-slide-up shadow-2xl border-4 border-kid-green">
              <h2 className="text-xl font-black text-kid-green mb-4 text-center">Thêm Bé Mới 🚀</h2>
              <form onSubmit={handleAddChild} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tên của bé</label>
                  <input
                    autoFocus
                    type="text"
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                    className="w-full p-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-kid-green font-bold text-gray-800"
                    placeholder="VD: Bin, Bo, Na..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tuổi của bé</label>
                  <input
                    type="number"
                    min="1"
                    max="18"
                    value={newChildAge}
                    onChange={(e) => setNewChildAge(e.target.value ? Number(e.target.value) : '')}
                    className="w-full p-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-kid-green font-bold text-gray-800"
                    placeholder="VD: 7"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newChildName.trim() || !newChildAge}
                    className="flex-[2] py-3 rounded-xl font-black text-white bg-kid-green hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang thêm...' : 'Lưu bé mới'}
                  </button>
                </div>
              </form>
            </div>
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
