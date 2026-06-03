'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const { setAuthToken } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (data.session?.access_token) {
      setAuthToken(data.session.access_token);
      router.push('/select-child');
    } else {
      setError('Không nhận được token. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-kid-yellow/30 via-white to-kid-blue/20">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-kid-yellow flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Sparkles size={28} className="text-kid-orange" />
            </div>
            <h1 className="text-2xl font-black text-gray-800">Chào mừng trở lại!</h1>
            <p className="text-sm font-bold text-gray-400 mt-1">Đăng nhập để tiếp tục khám phá</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="me@example.com"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 focus:border-kid-orange focus:ring-2 focus:ring-kid-orange/20 outline-none transition-all text-sm font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">Mật khẩu</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 focus:border-kid-orange focus:ring-2 focus:ring-kid-orange/20 outline-none transition-all text-sm font-bold"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 text-sm font-bold p-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-kid-orange text-white font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-kid-orange/20"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập 🚀'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm font-bold text-gray-400">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="text-kid-orange hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
