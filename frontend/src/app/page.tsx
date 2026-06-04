'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function LandingPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function checkConnection() {
    setStatus('loading');
    setMsg('');
    try {
      const data = await api.health();
      if (data.database === 'ok') {
        setStatus('ok');
        setMsg('Kết nối Backend & Database thành công!');
      } else {
        setStatus('error');
        setMsg('Database chưa được cấu hình. Hãy kiểm tra Supabase.');
      }
    } catch {
      setStatus('error');
      setMsg('Không kết nối được Supabase. Kiểm tra biến môi trường.');
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/80 backdrop-blur rounded-3xl shadow-xl p-8 text-center border-4 border-kid-yellow">
        <div className="text-6xl mb-4">🚀</div>
        <h1 className="text-3xl font-black text-kid-orange mb-2">
          Kid Adventure Planner
        </h1>
        <p className="text-gray-600 font-bold mb-8">
          Cuộc phiêu lưu mới mỗi ngày cho bé 6-10 tuổi!
        </p>

        <Link
          href="/select-child"
          className="block w-full py-4 px-6 rounded-2xl font-black text-white bg-kid-orange hover:scale-[1.02] transition-transform shadow-lg mb-4"
        >
          🎮 Bắt đầu phiêu lưu
        </Link>

        <button
          onClick={checkConnection}
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
            ? '✅ Kết nối thành công'
            : status === 'error'
            ? '❌ Thử lại'
            : '🔍 Kiểm tra kết nối'}
        </button>

        {msg && (
          <div className={`mt-4 p-3 rounded-xl text-sm font-bold border ${
            status === 'ok'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-600 border-red-200'
          }`}>
            {msg}
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-bold">
            ✨ Powered by Supabase • Cloudflare Pages • Gemini AI
          </p>
          <p className="text-xs text-gray-300 mt-1">Forever Free Architecture</p>
        </div>
      </div>
    </main>
  );
}
