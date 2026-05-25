'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const STATUS_MSG: Record<string, string> = {
  pending: 'En cola para procesar…',
  transcribing: 'Transcribiendo el audio…',
  transcribed: 'Transcripción lista. Generando resumen…',
  summarizing: 'Generando acta resumida…',
}

export function StatusPoller({ status }: { status: string }) {
  const router = useRouter()
  useEffect(() => {
    const id = setInterval(() => {
      router.refresh()
    }, 3000)
    return () => clearInterval(id)
  }, [router])

  const msg = STATUS_MSG[status] ?? 'Procesando…'

  return (
    <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg px-4 py-3 mb-6 flex items-center gap-3">
      <Loader2 size={16} className="text-indigo-400 animate-spin flex-shrink-0" />
      <p className="text-sm text-indigo-200">{msg}</p>
      <span className="ml-auto text-xs text-indigo-300/60">refresca cada 3s</span>
    </div>
  )
}
