import React from 'react';

// ============================================================
// Skeleton Loader Components
// Show content-shaped placeholders while data loads
// Feels 10x faster than a spinner even at the same load time
// ============================================================

/** Base skeleton block with shimmer animation */
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />
);

/** Card skeleton for jobs, events, news grid items */
export const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
    <Skeleton className="h-48 rounded-none" />
    <div className="p-6 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  </div>
);

/** Grid of card skeletons */
export const CardGridSkeleton: React.FC<{ count?: number; cols?: number }> = ({ count = 6, cols = 3 }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols} gap-8`}>
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

/** Hero banner skeleton (for featured event/article) */
export const HeroSkeleton: React.FC = () => (
  <div className="relative h-[450px] rounded-[2.5rem] overflow-hidden animate-pulse bg-slate-200">
    <div className="absolute bottom-0 left-0 right-0 p-10 md:p-16 space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-6 w-28 rounded-full bg-slate-300" />
        <Skeleton className="h-6 w-20 rounded-full bg-slate-300" />
      </div>
      <Skeleton className="h-12 w-3/4 bg-slate-300" />
      <Skeleton className="h-6 w-1/2 bg-slate-300" />
      <div className="flex gap-3">
        <Skeleton className="h-14 w-40 rounded-2xl bg-slate-300" />
        <Skeleton className="h-14 w-40 rounded-2xl bg-slate-300" />
      </div>
    </div>
  </div>
);

/** Job list item skeleton */
export const JobListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 animate-pulse">
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/3 mb-3" />
        <Skeleton className="h-3 w-full mb-2" />
        <div className="flex gap-2 mt-3">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

/** Alumni directory card skeleton */
export const AlumniCardSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex flex-col items-center animate-pulse">
        <Skeleton className="w-20 h-20 rounded-full mb-4" />
        <Skeleton className="h-5 w-32 mb-2" />
        <div className="flex gap-2 mb-3">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-40 mb-2" />
        <Skeleton className="h-4 w-28" />
        <div className="flex gap-2 mt-4 w-full">
          <Skeleton className="h-9 flex-1 rounded-xl" />
          <Skeleton className="h-9 w-16 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);

/** Dashboard widget skeleton */
export const DashboardSkeleton: React.FC = () => (
  <div className="p-6 max-w-7xl mx-auto space-y-8 animate-pulse">
    {/* Hero */}
    <Skeleton className="h-44 rounded-3xl" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-52 rounded-3xl" />
          <Skeleton className="h-52 rounded-3xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-52 rounded-2xl" />
      </div>
    </div>
  </div>
);

/** Page-level loading skeleton with fade-in */
export const PageSkeleton: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
      <p className="text-sm font-medium text-slate-400">Loading...</p>
    </div>
  </div>
);

export default Skeleton;
