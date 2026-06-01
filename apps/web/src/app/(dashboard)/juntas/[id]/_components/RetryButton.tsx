'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'

export function RetryButton({ meetingId }: { meetingId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function retry() {
    startTransition(async () => {
      const res = await fetch(`/api/meetings/${meetingId}/retry`, { method: 'POST' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body.error ?? 'No se pudo relanzar')
        return
      }
      toast.success('Reintentando procesamiento')
      router.refresh()
    })
  }

  return (
    <button
      onClick={retry}
      disabled={pending}
      className="inline-flex items-center gap-1.5 bg-red-500/15 hover:bg-red-500/25 disabled:opacity-50 text-red-700 dark:text-red-200 text-xs font-medium px-2.5 py-1 rounded border border-red-500/30"
    >
      <RefreshCw size={12} className={pending ? 'animate-spin' : ''} />
      Reintentar
    </button>
  )
}
