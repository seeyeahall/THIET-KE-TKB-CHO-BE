'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const router = useRouter();
  const [geminiKey, setGeminiKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();

    setStatus('loading');
    setMsg('');

    try {
      // Luu Gemini API Key vao localStorage (dung boi Edge Function via x-gemini-api-key header)
      if (geminiKey) {
        localStorage.setItem('GEMINI_API_KEY', geminiKey);
      }

      // Kiem tra ket noi Supabase
      const { api } = await import('@/lib/api');
      const health = await api.health();

      if (health.status === 'ok') {
        setStatus('success');
        setMsg('Cài đặt thành công! Supabase đã được kết nối. Đang chuyển hướng...');
        setTimeout(() => router.push('/'), 2000);
      } else {
        setStatus('error');
        setMsg('Không kết nối được Supabase. Kiểm tra biến môi trường NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      }
    } catch (err: unknown) {
      setStatus('error');
      const message = err instanceof Error ? err.message : 'Unknown error';
      setMsg(`Lỗi: ${message}`);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border-4 border-kid-orange">
        <div className="text-4xl mb-4 text-center">⚙️</div>
        <h1 className="text-2xl font-black text-kid-blue mb-2 text-center">
          Cài đặt API Key
        </h1>
        <p className="text-gray-500 text-sm mb-6 text-center">
          Nhập Gemini API Key để bật tính năng AI chat và tạo lịch thông minh.
        </p>

        <div className="mb-4 p-3 bg-blue-50 rounded-xl text-xs text-blue-700 font-bold">
          💡 Lấy API Key miễn phí tại{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline">
            aistudio.google.com
          </a>
        </div>

        <form onSubmit={handleSetup} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Gemini API Key (tùy chọn)
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-kid-blue font-mono text-xs"
            />
            <p className="text-xs text-gray-400 mt-1">
              Nếu không nhập, app sẽ dùng chế độ Naruto cơ bản (không cần AI).
            </p>
          </div>

          {msg && (
            <div className={`p-3 rounded-xl text-sm font-bold ${
              status === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
            }`}>
              {msg}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className="w-full py-3 mt-2 rounded-xl font-bold text-white bg-kid-orange hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? 'Đang lưu...' : status === 'success' ? 'Đã lưu ✓' : 'Lưu cài đặt'}
          </button>

          <div className="text-center mt-4">
            <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm font-medium">
              Quay lại trang chủ
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
