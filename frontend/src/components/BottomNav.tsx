'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Compass, MessageCircle, User } from 'lucide-react';

const navItems = [
  { href: '/home',       label: 'Trang chủ', icon: Home },
  { href: '/schedule',   label: 'Lịch',      icon: Calendar },
  { href: '/activities', label: 'Khám phá',  icon: Compass },
  { href: '/chat',       label: 'AI',         icon: MessageCircle },
  { href: '/parent',     label: 'Phụ huynh', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-100 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all ${
                isActive
                  ? 'bg-kid-yellow text-kid-orange scale-105'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
