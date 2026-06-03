import React from 'react';
import SkeletonCard from './SkeletonCard';

interface SkeletonPageProps {
  cardCount?: number;
}

export default function SkeletonPage({ cardCount = 4 }: SkeletonPageProps) {
  return (
    <main className="min-h-screen p-6 pb-24">
      <div className="max-w-lg mx-auto">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="bg-gray-200 rounded-2xl h-8 w-48 animate-pulse" />
          <div className="bg-gray-200 rounded-xl h-10 w-24 animate-pulse" />
        </div>

        {/* Optional day selector / filter bar skeleton */}
        <div className="flex gap-1 mb-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-gray-200 rounded-2xl h-12 animate-pulse"
            />
          ))}
        </div>

        {/* Sub-header skeleton */}
        <div className="bg-gray-200 rounded-2xl h-6 w-32 animate-pulse mb-4" />

        {/* Card skeletons */}
        <div className="space-y-3">
          {Array.from({ length: cardCount }).map((_, i) => (
            <SkeletonCard key={i} height="h-24" />
          ))}
        </div>
      </div>
    </main>
  );
}
