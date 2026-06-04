'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Baloo_2 } from 'next/font/google';
import BottomNav from '@/components/BottomNav';
import ErrorBoundary from '@/components/ErrorBoundary';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import { getSupabaseClient } from '@/lib/supabase';
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
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const offlineKeys = Object.keys(localStorage).filter(k => k.startsWith('offline_drafts_'));
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
            const weekStart = monday.toISOString().substring(0, 10);

            let scheduleId: string | null = null;
            const { data: existingSched } = await supabase
              .from('schedules').select('id').eq('child_id', childId).eq('week_start_date', weekStart).single();
            scheduleId = existingSched?.id ?? null;

            if (!scheduleId) {
              const { data: newSched } = await supabase
                .from('schedules')
                .insert({ child_id: childId, title: 'Lịch tuần của bé', week_start_date: weekStart, theme: 'Tự chọn' })
                .select('id').single();
              scheduleId = newSched?.id ?? null;
            }
            if (!scheduleId) continue;

            const dow = (new Date(item.dateStr).getDay() + 6) % 7;
            let activityId = item.activity_id;
            if (!activityId) {
              const slug = (item.activity_title ?? 'activity').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 50) + '-' + Date.now().toString(36);
              const { data: act } = await supabase
                .from('activities')
                .insert({ title: item.activity_title, theme: item.activity_theme, duration_minutes: item.duration_minutes, slug, status: 'published', created_by: 'user' })
                .select('id').single();
              activityId = act?.id;
            }
            if (!activityId) continue;

            await supabase.from('schedule_items').insert({
              activity_id: activityId, schedule_id: scheduleId, child_id: childId,
              day_of_week: dow, start_time: item.start_time, duration_minutes: item.duration_minutes, sort_order: 0,
            });
          }
          localStorage.removeItem(key);
          console.log(`Synced offline drafts for child ${childId}`);
        } catch (err) {
          console.error(`Failed to sync offline drafts for child ${childId}:`, err);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    if (navigator.onLine) handleOnline();
    return () => window.removeEventListener('online', handleOnline);
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
