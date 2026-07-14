import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`skeleton ${className}`} />
      ))}
    </>
  );
};

export const TaskCardSkeleton: React.FC = () => (
  <div className="glass-card p-6 space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-48 rounded-lg" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <Skeleton className="h-4 w-32 rounded-lg" />
    <div className="flex items-center gap-4">
      <Skeleton className="h-4 w-24 rounded-lg" />
      <Skeleton className="h-4 w-24 rounded-lg" />
    </div>
    <div className="flex gap-2 pt-2">
      <Skeleton className="h-9 w-20 rounded-xl" />
      <Skeleton className="h-9 w-20 rounded-xl" />
    </div>
  </div>
);

export const StatCardSkeleton: React.FC = () => (
  <div className="glass-card p-6 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-24 rounded-lg" />
      <Skeleton className="h-10 w-10 rounded-xl" />
    </div>
    <Skeleton className="h-8 w-16 rounded-lg" />
    <Skeleton className="h-3 w-32 rounded-lg" />
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-6 py-4 glass-card">
        <Skeleton className="h-4 w-40 rounded" />
        <Skeleton className="h-4 w-20 rounded" />
        <Skeleton className="h-6 w-16 rounded-full ml-auto" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>
    ))}
  </div>
);

export default Skeleton;
