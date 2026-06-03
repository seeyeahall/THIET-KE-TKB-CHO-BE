'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Rocket, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';

export default function RegisterPage() {
  const router = useRouter();
  const setAuthToken = useAppStore((s) => s.setAuthToken);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { family_name: familyName } },
    });
    if (error) {
      setError(error.message);
    } else if (data.session) {
      setAuthToken(data.session.access_token);
      router.push('/select-child');
    } else {
      setError('Vui lòng kiểm tra email để xác nhận tài khoản!');
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎉</div>
          <h1 className="text-2xl font-black text-kid-orange">Tạo tài khoản mới!</h1>
          <p className="text-gray-500 font-bold text-sm mt-1">Bắt đầu cuộc phiêu lưu cùng bé</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
            <div className="flex items-center px-4 py-3">
              <User size={18} className="text-gray-400 mr-3" />
              <input
                type="text"
                required
                placeholder="Tên gia đình (ví dụ: Nhà Bông)"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm font-bold text-gray-700 placeholder:text-gray-300"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
            <div className="flex items-center px-4 py-3">
              <Mail size={18} className="text-gray-400 mr-3" />
              <input
                type="email"
                required
                placeholder="Email của phụ huynh"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm font-bold text-gray-700 placeholder:text-gray-300"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
            <div className="flex items-center px-4 py-3">
              <Lock size={18} className="text-gray-400 mr-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Mật khẩu (ít nhất 6 ký tự)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm font-bold text-gray-700 placeholder:text-gray-300"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 text-sm font-bold px-4 py-3 rounded-2xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-kid-green text-white font-black py-4 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Rocket size={18} />
                Đăng ký
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-sm font-bold text-gray-400">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-kid-orange hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </main>
  );
}
