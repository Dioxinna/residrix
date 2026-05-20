'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'

export function PortalButton() {
  const [pending, startTransition] = useTransition()

  function open() {
    startTransition(async () => {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.url) {
        toast.error(body.error ?? 'No se pudo abrir el portal')
        return
      }
      window.location.href = body.url
    })
  }

  return (
    <button
      onClick={open}
      disabled={pending}
      className="text-sm text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
    >
      {pending ? 'Abriendo…' : 'Portal de cliente →'}
    </button>
  )
}
