'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Baloo_2 } from 'next/font/google';
import BottomNav from '@/components/BottomNav';
import ErrorBoundary from '@/components/ErrorBoundary';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import { api } from '@/lib/api';
import './globals.css';

const baloo = Baloo_2({
  subsets: ['vietnamese', 'latin'],
  display: 'swap',
  variable: '--font-baloo',
  weight: ['400', '500', '600', '700', '800'],
});

// Các route KHÔNG hiện BottomNav
const NO_NAV_ROUTES = ['/', '/select-child', '/login', '/register', '/setup'];
// Chat dùng fixed layout riêng — padding được xử lý trong chat/page.tsx
const FIXED_LAYOUT_ROUTES = ['/chat'];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showNav = pathname !== null && !NO_NAV_ROUTES.includes(pathname);
  const needsNavPad = showNav && !FIXED_LAYOUT_ROUTES.includes(pathname ?? '');

  useEffect(() => {
    const handleOnline = async () => {
      if (typeof window === 'undefined') return;
      const keys = Object.keys(localStorage);
      const offlineKeys = keys.filter(k => k.startsWith('offline_drafts_'));
      
      for (const key of offlineKeys) {
        const childId = key.replace('offline_drafts_', '');
        try {
          const drafts = JSON.parse(localStorage.getItem(key) || '[]');
          if (drafts.length === 0) continue;
          
          console.log(`Syncing ${drafts.length} offline drafts for child ${childId}...`);
          
          for (const item of drafts) {
            const weekDate = new Date(item.dateStr);
            const day = weekDate.getDay();
            const mondayOffset = day === 0 ? -6 : 1 - day;
            const monday = new Date(weekDate);
            monday.setDate(weekDate.getDate() + mondayOffset);
            const weekStart = `${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,'0')}-${String(monday.getDate()).padStart(2,'0')}`;
            
            let scheduleId: string | null = null;
            try {
              const existing = await api.listSchedules(childId);
              const sched = existing.find(s => s.week_start_date === weekStart);
              if (sched) scheduleId = sched.id;
            } catch {}
            
            if (!scheduleId) {
              const newSched = await api.createSchedule({
                child_id: childId,
                title: `Lịch tuần của bé`,
                week_start_date: weekStart,
                theme: 'Tự chọn',
                items: [],
              });
              scheduleId = newSched.id;
            }
            
            const dow = (new Date(item.dateStr).getDay() + 6) % 7;
            
            let activityId = item.activity_id;
            if (!activityId) {
              const act = await api.createActivity({
                title: item.activity_title,
                theme: item.activity_theme,
                duration_minutes: item.duration_minutes,
              });
              activityId = act.id;
            }
            
            await api.addScheduleItem(scheduleId!, {
              activity_id: activityId,
              day_of_week: dow,
              start_time: item.start_time,
              duration_minutes: item.duration_minutes,
              sort_order: 0,
            });
          }
          
          localStorage.removeItem(key);
          console.log(`Successfully synced offline drafts for child ${childId}`);
        } catch (err) {
          console.error(`Failed to sync offline drafts for child ${childId}:`, err);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    if (navigator.onLine) {
      handleOnline();
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <html lang="vi">
      <head>
        <title>Kid Adventure Planner</title>
        <meta name="description" content="Ung dung phieu luu va kham pha danh cho tre em 6-10 tuoi" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#FFD93D" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className={`${baloo.variable} font-sans antialiased text-gray-800 bg-gradient-to-br from-kid-yellow/20 via-white to-kid-blue/20 min-h-[100dvh]`}>
        <ServiceWorkerRegistration />
        <ErrorBoundary>
          <div key={pathname} className="animate-fade-in-up">
            {children}
          </div>
        </ErrorBoundary>
        {showNav && <BottomNav />}
      </body>
    </html>
  );
}
