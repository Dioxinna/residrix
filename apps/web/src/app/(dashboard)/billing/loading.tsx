import { Skeleton, PageHeaderSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <PageHeaderSkeleton />
      <div className="bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded-xl p-6 mb-8">
        <Skeleton className="h-3 w-32 mb-3" />
        <Skeleton className="h-5 w-48 mb-6" />
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[color:var(--glass-border)]">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded-xl p-5">
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-3 w-32 mb-4" />
            <Skeleton className="h-8 w-20 mb-5" />
            <div className="space-y-2 mb-5">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-3 w-full" />
              ))}
            </div>
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
