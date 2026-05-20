import { Skeleton, PageHeaderSkeleton, StatsSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="p-8">
      <PageHeaderSkeleton />
      <StatsSkeleton />
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="px-6 py-4 border-b border-zinc-800">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="divide-y divide-zinc-800">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4">
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
