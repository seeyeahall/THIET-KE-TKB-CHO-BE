'use client';

import { usePathname } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import ErrorBoundary from '@/components/ErrorBoundary';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import './globals.css';

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

  return (
    <html lang="vi">
      <head>
        <title>Kid Adventure Planner</title>
        <meta name="description" content="Ung dung phieu luu va kham pha danh cho tre em 6-10 tuoi" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#FFD93D" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className="antialiased text-gray-800 bg-gradient-to-br from-kid-yellow/20 via-white to-kid-blue/20 min-h-[100dvh]">
        <ServiceWorkerRegistration />
        <ErrorBoundary>
          {/* pb-nav tự động thêm padding-bottom = nav height + safe-area-inset-bottom */}
          <div key={pathname} className={`animate-fade-in-up ${needsNavPad ? 'pb-nav' : ''}`}>
            {children}
          </div>
        </ErrorBoundary>
        {showNav && <BottomNav />}
      </body>
    </html>
  );
}
