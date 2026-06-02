export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-[color:var(--glass-border)] rounded ${className}`} />
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded-lg overflow-hidden">
      <div className="px-4 py-3 flex gap-4 border-b border-[color:var(--glass-border)]">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </div>
      <div className="divide-y divide-[color:var(--glass-border)]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-4 flex items-center gap-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-8">
      <Skeleton className="h-7 w-48 mb-2" />
      <Skeleton className="h-4 w-80" />
    </div>
  )
}

// Static class map: Tailwind cannot see interpolated class names like
// `lg:grid-cols-${count}`, so they must be spelled out literally.
const GRID_COLS: Record<number, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
}

export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 ${GRID_COLS[count] ?? 'lg:grid-cols-4'} gap-4 mb-8`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded-xl p-5">
          <Skeleton className="h-3 w-24 mb-3" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  )
}
