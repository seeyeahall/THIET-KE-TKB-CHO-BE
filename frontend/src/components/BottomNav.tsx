'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Compass, MessageCircle, User } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { todayStr } from '@/lib/utils/scheduleProgress';

const navItems = [
  { href: '/home',       label: 'Trang chủ', icon: Home },
  { href: '/schedule',   label: 'Lịch',      icon: Calendar },
  { href: '/activities', label: 'Khám phá',  icon: Compass },
  { href: '/chat',       label: 'AI',         icon: MessageCircle },
  { href: '/parent',     label: 'Phụ huynh', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { selectedChild } = useAppStore();
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    if (!selectedChild) return;
    api.getScheduleItemsByDate(selectedChild.id, todayStr())
      .then(items => {
        // Show count of remaining planned/uncompleted items or total items
        // Let's show total planned + incomplete items for today
        const activeItems = items.filter(
          item => item.status !== 'completed' && item.status !== 'complete' && item.status !== 'skipped'
        );
        setTodayCount(activeItems.length);
      })
      .catch(() => setTodayCount(0));
  }, [selectedChild, pathname]); // Re-fetch on child change or route change

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-100 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const isScheduleTab = item.href === '/schedule';
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all ${
                isActive
                  ? 'bg-kid-yellow text-kid-orange animate-tab-active scale-110'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold mt-0.5">{item.label}</span>
              {isScheduleTab && todayCount > 0 && (
                <span className="absolute top-1 right-2 bg-red-500 text-white font-black text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {todayCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
