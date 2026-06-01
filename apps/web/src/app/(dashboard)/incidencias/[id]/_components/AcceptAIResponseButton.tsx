'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check } from 'lucide-react'

export function AcceptAIResponseButton({
  incidenceId,
  alreadyAccepted,
}: {
  incidenceId: string
  alreadyAccepted: boolean
}) {
  const [accepted, setAccepted] = useState(alreadyAccepted)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  if (accepted) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
        <Check size={14} /> Respuesta enviada al vecino
      </span>
    )
  }

  function accept() {
    startTransition(async () => {
      const res = await fetch('/api/ai/accept-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidenceId }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body.error ?? 'No se pudo enviar')
        return
      }
      setAccepted(true)
      toast.success('Respuesta enviada al vecino')
      router.refresh()
    })
  }

  return (
    <button
      onClick={accept}
      disabled={pending}
      className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded"
    >
      {pending ? 'Enviando…' : 'Aceptar y enviar al vecino'}
    </button>
  )
}
