import { Skeleton, PageHeaderSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <PageHeaderSkeleton />
      <div className="space-y-8">
        {[1, 2].map((s) => (
          <div key={s}>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-64 mb-3" />
            <div className="glass rounded-lg divide-y divide-[color:var(--glass-border)]">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-6 w-11 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
