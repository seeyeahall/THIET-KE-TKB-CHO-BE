import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kid Adventure Planner',
  description: 'Ung dung phieu luu va kham pha danh cho tre em 6-10 tuoi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased text-gray-800">{children}</body>
    </html>
  );
}
