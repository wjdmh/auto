'use client';

export default function SkeletonLoader() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="px-5 pt-10 pb-8">
        <div className="h-3 w-28 bg-[var(--card)] rounded-md mb-3" />
        <div className="h-8 w-48 bg-[var(--card)] rounded-lg mb-6" />
        <div className="h-5 w-32 bg-[var(--card)] rounded-md mb-8" />
        <div className="bg-[var(--card)] rounded-2xl p-5 h-20" />
      </div>

      {/* Market status skeleton */}
      <div className="px-5 pb-4">
        <div className="h-10 bg-[var(--card)] rounded-xl" />
      </div>

      {/* Cards skeleton */}
      <div className="px-5 pt-4 space-y-3">
        <div className="h-4 w-20 bg-[var(--card)] rounded-md mb-3" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[var(--card)] rounded-2xl p-5 space-y-3">
            <div className="flex justify-between">
              <div className="h-5 w-16 bg-[var(--card-inner)] rounded-md" />
              <div className="h-5 w-14 bg-[var(--card-inner)] rounded-full" />
            </div>
            <div className="h-4 w-full bg-[var(--card-inner)] rounded-md" />
            <div className="h-4 w-3/4 bg-[var(--card-inner)] rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
