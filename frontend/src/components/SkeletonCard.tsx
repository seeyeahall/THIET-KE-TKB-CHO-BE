import React from 'react';

interface SkeletonCardProps {
  height?: string;
  className?: string;
}

export default function SkeletonCard({ height = 'h-24', className = '' }: SkeletonCardProps) {
  return (
    <div
      className={`bg-gray-200 rounded-2xl animate-pulse ${height} ${className}`}
      aria-hidden="true"
    />
  );
}
