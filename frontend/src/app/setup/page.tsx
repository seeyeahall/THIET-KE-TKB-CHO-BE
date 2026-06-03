'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, getApiBaseUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const router = useRouter();
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseUrl || !supabaseKey) {
      setMsg('Vui lòng nhập đầy đủ thông tin Supabase');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setMsg('');

    try {
      const token = localStorage.getItem('auth_token') || '';
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/v1/admin/setup-system`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          supabase_url: supabaseUrl,
          supabase_service_role_key: supabaseKey
        })
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMsg('Cài đặt thành công! Hệ thống đang tự động khởi động lại...');
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setStatus('error');
        setMsg(`Lỗi: ${data.detail || JSON.stringify(data)}`);
      }
    } catch (err: any) {
      setStatus('error');
      setMsg(`Không thể gửi cấu hình: ${err.message}`);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border-4 border-kid-orange">
        <div className="text-4xl mb-4 text-center">⚙️</div>
        <h1 className="text-2xl font-black text-kid-blue mb-2 text-center">
          Cài đặt Hệ thống
        </h1>
        <p className="text-gray-500 text-sm mb-6 text-center">
          Dành cho Admin: Cấu hình kết nối cơ sở dữ liệu Supabase để ứng dụng hoạt động.
        </p>

        <form onSubmit={handleSetup} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Supabase URL</label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xxxx.supabase.co"
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-kid-blue"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Supabase Service Role Key</label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIs..."
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-kid-blue text-xs font-mono"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Lấy từ Project Settings &gt; API &gt; service_role (secret)</p>
          </div>

          {msg && (
            <div className={`p-3 rounded-xl text-sm ${status === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
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
