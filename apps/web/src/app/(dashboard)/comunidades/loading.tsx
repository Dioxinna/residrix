import { TableSkeleton, PageHeaderSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <PageHeaderSkeleton />
      <TableSkeleton rows={5} />
    </div>
  )
}
