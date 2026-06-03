'use client';

import { usePathname } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import ErrorBoundary from '@/components/ErrorBoundary';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showNav = pathname !== '/' && pathname !== '/select-child' && pathname !== null;

  return (
    <html lang="vi">
      <head>
        <title>Kid Adventure Planner</title>
        <meta name="description" content="Ung dung phieu luu va kham pha danh cho tre em 6-10 tuoi" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#FFD93D" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className="antialiased text-gray-800 bg-gradient-to-br from-kid-yellow/20 via-white to-kid-blue/20 min-h-screen">
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
