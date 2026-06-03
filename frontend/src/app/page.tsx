'use client';

import { useState } from 'react';
import Link from 'next/link';

import { api, getApiBaseUrl } from '@/lib/api';

export default function LandingPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'not_configured' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [apiUrl, setApiUrl] = useState('');

  // Lấy URL khởi tạo
  if (typeof window !== 'undefined' && !apiUrl && status === 'idle') {
    setApiUrl(getApiBaseUrl());
  }

  async function checkHealth() {
    setStatus('loading');
    setMsg('');
    if (typeof window !== 'undefined' && apiUrl) {
      localStorage.setItem('BACKEND_API_URL', apiUrl);
    }
    try {
      const data = await api.health();
      if (data.database === 'not_configured') {
        setStatus('not_configured');
        setMsg('Cơ sở dữ liệu chưa được cài đặt. Vui lòng chạy Setup.');
      } else if (data.status === 'ok') {
        setStatus('ok');
        setMsg('Kết nối Backend & Database thành công!');
      } else {
        setStatus('error');
        setMsg(`Trạng thái không xác định: ${JSON.stringify(data)}`);
      }
    } catch (e) {
      setStatus('error');
      setMsg('Không kết nối được backend. Hãy kiểm tra URL.');
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
          onClick={checkHealth}
          disabled={status === 'loading'}
          className={`w-full py-3 px-6 rounded-2xl font-bold text-white transition-transform active:scale-95 shadow-lg ${
            status === 'ok'
              ? 'bg-kid-green'
              : status === 'not_configured'
              ? 'bg-kid-pink'
              : status === 'error'
              ? 'bg-kid-pink'
              : 'bg-kid-blue hover:bg-kid-blue/90'
          }`}
        >
          {status === 'loading'
            ? '⏳ Đang kiểm tra...'
            : status === 'ok'
            ? '✅ API hoạt động'
            : status === 'not_configured'
            ? '❌ Thiếu Database'
            : status === 'error'
            ? '❌ Thử lại'
            : '🔍 Kiểm tra API'}
        </button>

        {status === 'not_configured' && (
          <Link
            href="/setup"
            className="block w-full mt-3 py-3 px-6 rounded-2xl font-black text-white bg-kid-orange hover:bg-orange-600 transition-colors shadow-lg"
          >
            ⚙️ Cài đặt Database & API
          </Link>
        )}

        {msg && (
          <div className="mt-4 p-3 rounded-xl bg-gray-50 text-sm text-gray-700 break-all border border-gray-200">
            {msg}
          </div>
        )}

        <div className="mt-6 text-left">
          <label className="block text-xs font-bold text-gray-400 mb-1">Cấu hình Backend API URL (Dành cho Admin):</label>
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://kid-adventure-api.onrender.com"
            className="w-full text-xs text-gray-600 p-2 rounded-lg border border-gray-200 focus:outline-none focus:border-kid-blue"
          />
        </div>
      </div>
    </main>
  );
}
