'use client';

import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001';

export default function HomePage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function checkHealth() {
    setStatus('loading');
    setMsg('');
    try {
      const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setStatus('ok');
        setMsg(JSON.stringify(data));
      } else {
        setStatus('error');
        setMsg(`Lỗi ${res.status}`);
      }
    } catch (e) {
      setStatus('error');
      setMsg('Không kết nối được backend');
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/80 backdrop-blur rounded-3xl shadow-xl p-8 text-center border-4 border-kid-yellow">
        <h1 className="text-3xl font-bold text-kid-orange mb-2">
          🚀 Kid Adventure Planner
        </h1>
        <p className="text-gray-600 mb-6">
          Cuộc phiêu lưu mới mỗi ngày cho bé 6-10 tuổi!
        </p>

        <button
          onClick={checkHealth}
          disabled={status === 'loading'}
          className={`w-full py-3 px-6 rounded-2xl font-bold text-white transition-transform active:scale-95 shadow-lg ${
            status === 'ok'
              ? 'bg-kid-green'
              : status === 'error'
              ? 'bg-kid-pink'
              : 'bg-kid-blue hover:bg-kid-blue/90'
          }`}
        >
          {status === 'loading'
            ? '⏳ Đang kiểm tra...'
            : status === 'ok'
            ? '✅ API hoạt động'
            : status === 'error'
            ? '❌ Thử lại'
            : '🔍 Kiểm tra API'}
        </button>

        {msg && (
          <div className="mt-4 p-3 rounded-xl bg-gray-50 text-sm text-gray-700 break-all">
            {msg}
          </div>
        )}

        <div className="mt-6 text-xs text-gray-400">
          API: {API_BASE}
        </div>
      </div>
    </main>
  );
}
