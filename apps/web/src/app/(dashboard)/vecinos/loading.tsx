import { Skeleton, TableSkeleton, PageHeaderSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <PageHeaderSkeleton />
      <Skeleton className="h-4 w-40 mb-3" />
      <Skeleton className="h-28 w-full mb-8" />
      <Skeleton className="h-4 w-48 mb-3" />
      <TableSkeleton rows={4} />
    </div>
  )
}
