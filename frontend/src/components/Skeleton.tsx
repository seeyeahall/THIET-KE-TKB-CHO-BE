export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
          <div className="h-3 bg-gray-200 rounded-lg w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-gray-200 rounded-lg w-full mb-2" />
      <div className="h-3 bg-gray-200 rounded-lg w-5/6" />
    </div>
  );
}

export function SkeletonText({ lines = 2 }: { lines?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 bg-gray-200 rounded-lg ${i === lines - 1 ? 'w-4/5' : 'w-full'}`} />
      ))}
    </div>
  );
}

export function SkeletonCircle({ size = 40 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-gray-200 animate-pulse"
      style={{ width: size, height: size }}
    />
  );
}

export function SkeletonAvatar({ size = 48 }: { size?: number }) {
  return <SkeletonCircle size={size} />;
}
