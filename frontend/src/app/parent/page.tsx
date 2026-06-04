'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, UserPlus, Settings, LogOut, ChevronRight, Crown, Loader2, CheckCircle2, Globe, Key } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';

const AI_PROVIDERS = [
  { key: 'GEMINI_API_KEY', label: 'Gemini API Key', placeholder: 'AIzaSy...' },
  { key: 'OPENAI_API_KEY', label: 'OpenAI API Key', placeholder: 'sk-...' },
  { key: 'GROQ_API_KEY', label: 'Groq API Key', placeholder: 'gsk_...' },
  { key: 'DEEPSEEK_API_KEY', label: 'DeepSeek API Key', placeholder: 'sk-...' },
];

export default function ParentPage() {
  const router = useRouter();
  const { selectedChild, setSelectedChild, setAuthToken } = useAppStore();
  const [showAddChild, setShowAddChild] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState({ completed: 0, total: 0, xp: 0 });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Add child form state
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState(5);
  const [childInterests, setChildInterests] = useState('');
  const [addingChild, setAddingChild] = useState(false);

  useEffect(() => {
    if (selectedChild) {
      api.getChildStats(selectedChild.id)
        .then((res) => {
          setStats({
            completed: res.completed_activities ?? 0,
            total: res.total_activities ?? 0,
            xp: res.xp ?? 0,
          });
        })
        .catch(() => {
          // Fallback when backend offline
          setStats({ completed: 8, total: 12, xp: 142 });
        });
    }
  }, [selectedChild]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthToken(null);
    setSelectedChild(null);
    router.push('/login');
  };

  const handleAddChild = async () => {
    if (!childName.trim()) return;
    setAddingChild(true);
    try {
      const interestsArray = childInterests.split(',').map((s) => s.trim()).filter(Boolean);
      await api.createChild({
        name: childName,
        age: childAge,
        interests: interestsArray,
      });
      router.push('/select-child');
    } catch (e) {
      // Fallback: add to local store
      const newChild = {
        id: `local-${Date.now()}`,
        name: childName,
        age: childAge,
        interests: childInterests.split(',').map((s) => s.trim()).filter(Boolean),
      };
      // Store in localStorage for demo
      const existing = JSON.parse(localStorage.getItem('demo_children') || '[]');
      existing.push(newChild);
      localStorage.setItem('demo_children', JSON.stringify(existing));
      router.push('/select-child');
    } finally {
      setAddingChild(false);
    }
  };

  const [backendUrl, setBackendUrl] = useState('');
  const [providerKeys, setProviderKeys] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBackendUrl(localStorage.getItem('BACKEND_API_URL') || '');
      const keys: Record<string, string> = {};
      AI_PROVIDERS.forEach((p) => {
        keys[p.key] = localStorage.getItem(p.key) || '';
      });
      setProviderKeys(keys);
    }
  }, []);

  const saveSettings = () => {
    if (typeof window === 'undefined') return;
    if (backendUrl) {
      localStorage.setItem('BACKEND_API_URL', backendUrl);
    } else {
      localStorage.removeItem('BACKEND_API_URL');
    }
    AI_PROVIDERS.forEach((p) => {
      const value = providerKeys[p.key];
      if (value) localStorage.setItem(p.key, value);
      else localStorage.removeItem(p.key);
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const testConnection = async () => {
    try {
      const res = await api.health();
      alert(`✅ Kết nối OK!\nStatus: ${res.status}\nDatabase: ${res.database}`);
    } catch (e) {
      alert('❌ Không kết nối được backend. Kiểm tra URL và CORS.');
    }
  };

  return (
    <main className="min-h-[100dvh] p-6 pb-nav bg-gray-50">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-black text-kid-orange">
            👨‍👩‍👧 Phụ huynh
          </h2>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-500 transition-colors bg-white p-3 rounded-2xl shadow-sm"
          >
            <LogOut size={20} />
          </button>
        </div>

        {/* Current Child */}
        {selectedChild && (
          <div className="bg-gradient-to-r from-kid-yellow to-kid-orange/30 rounded-[2rem] p-6 mb-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-3xl shadow-sm">
                👶
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-black text-gray-800">{selectedChild.name}</h3>
                  <Crown size={16} className="text-kid-orange" />
                </div>
                <p className="text-sm font-bold text-gray-600">
                  {selectedChild.age} tuổi • Thích {selectedChild.interests?.join(', ') || 'khám phá'}
                </p>
              </div>
              <ChevronRight size={24} className="text-white opacity-50" />
            </div>
          </div>
        )}

        {/* Stats */}
        {selectedChild && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8">
            <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
              📊 Tổng kết hoạt động
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 rounded-2xl p-3">
                <div className="text-2xl font-black text-kid-orange">{stats.total}</div>
                <div className="text-xs font-bold text-gray-400">Đã lên lịch</div>
              </div>
              <div className="bg-kid-green/10 rounded-2xl p-3">
                <div className="text-2xl font-black text-kid-green">{stats.completed}</div>
                <div className="text-xs font-bold text-kid-green">Hoàn thành</div>
              </div>
              <div className="bg-kid-blue/10 rounded-2xl p-3">
                <div className="text-2xl font-black text-kid-blue">{stats.xp}</div>
                <div className="text-xs font-bold text-kid-blue">Điểm XP</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <h3 className="text-lg font-black text-gray-800 mb-4">⚡ Thao tác nhanh</h3>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setShowAddChild(true)}
            className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:border-kid-green hover:shadow-md transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-2xl bg-kid-green/10 text-kid-green flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UserPlus size={24} />
            </div>
            <div className="font-black text-gray-800 text-base mb-1">Thêm bé</div>
            <div className="text-xs text-gray-400 font-bold">Tạo hồ sơ mới</div>
          </button>

          <button 
            onClick={() => setShowSettings(true)}
            className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:border-kid-blue hover:shadow-md transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-2xl bg-kid-blue/10 text-kid-blue flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Settings size={24} />
            </div>
            <div className="font-black text-gray-800 text-base mb-1">Cài đặt</div>
            <div className="text-xs text-gray-400 font-bold">API & kết nối</div>
          </button>
        </div>

        {/* Switch Child */}
        <button
          onClick={() => router.push('/select-child')}
          className="w-full bg-kid-yellow text-kid-orange font-black py-4 rounded-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={20} />
          Chuyển đổi hồ sơ bé
        </button>

        {/* Add Child Modal */}
        {showAddChild && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl">
              <h3 className="text-2xl font-black text-gray-800 mb-6">👧👦 Thêm bé mới</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">Tên của bé</label>
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="VD: Ken, Bin..."
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-800 focus:outline-none focus:border-kid-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">Tuổi</label>
                  <input
                    type="number"
                    value={childAge}
                    onChange={(e) => setChildAge(parseInt(e.target.value))}
                    min={1}
                    max={15}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-800 focus:outline-none focus:border-kid-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">Sở thích (cách nhau dấu phẩy)</label>
                  <input
                    type="text"
                    value={childInterests}
                    onChange={(e) => setChildInterests(e.target.value)}
                    placeholder="Khủng long, vẽ tranh, đá bóng..."
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-800 focus:outline-none focus:border-kid-green"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowAddChild(false)}
                  className="flex-1 bg-gray-100 text-gray-600 font-black py-3 rounded-xl hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddChild}
                  disabled={!childName.trim() || addingChild}
                  className="flex-1 bg-kid-green text-white font-black py-3 rounded-xl hover:bg-green-600 flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {addingChild ? <Loader2 className="animate-spin" size={18} /> : 'Tạo hồ sơ'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-start overflow-y-auto z-50 p-6 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl my-8">
              <h3 className="text-2xl font-black text-gray-800 mb-6">⚙️ Cài đặt hệ thống</h3>
              
              {/* Backend URL */}
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe size={16} className="text-kid-blue" />
                    <label className="text-sm font-bold text-gray-600">Backend API URL</label>
                  </div>
                  <input
                    type="text"
                    placeholder="http://localhost:8001"
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    className="w-full bg-white border-2 border-gray-200 rounded-lg px-3 py-2 font-mono text-sm focus:border-kid-blue focus:outline-none"
                  />
                  <button
                    onClick={testConnection}
                    className="mt-2 w-full bg-kid-blue/10 text-kid-blue font-bold py-2 rounded-lg text-sm hover:bg-kid-blue/20 transition-colors"
                  >
                    Kiểm tra kết nối
                  </button>
                </div>

                {/* AI Provider Keys */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Key size={16} className="text-kid-orange" />
                    <label className="text-sm font-bold text-gray-600">Khóa API AI</label>
                  </div>
                  <div className="space-y-3">
                    {AI_PROVIDERS.map((provider) => (
                      <div key={provider.key}>
                        <label className="block text-xs font-bold text-gray-400 mb-1">{provider.label}</label>
                        <input
                          type="password"
                          placeholder={provider.placeholder}
                          value={providerKeys[provider.key] || ''}
                          onChange={(e) => setProviderKeys((prev) => ({ ...prev, [provider.key]: e.target.value }))}
                          className="w-full bg-white border-2 border-gray-200 rounded-lg px-3 py-2 font-mono text-sm focus:border-kid-orange focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">Các khóa được lưu trực tiếp trên thiết bị của bạn, không gửi lên server.</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="text-sm font-bold text-gray-500">Phiên bản ứng dụng</div>
                  <div className="text-lg font-black text-gray-800">1.1.0</div>
                </div>
              </div>

              <button
                onClick={saveSettings}
                className="w-full bg-kid-blue text-white font-black py-3 rounded-xl hover:bg-blue-600 flex items-center justify-center gap-2"
              >
                {settingsSaved ? <CheckCircle2 size={18} /> : null}
                {settingsSaved ? 'Đã lưu!' : 'Lưu cấu hình'}
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="w-full mt-2 bg-gray-100 text-gray-600 font-black py-3 rounded-xl hover:bg-gray-200"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
