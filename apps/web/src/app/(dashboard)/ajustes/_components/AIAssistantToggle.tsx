'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'

export function AIAssistantToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function toggle() {
    const next = !enabled
    setEnabled(next) // optimista
    startTransition(async () => {
      const res = await fetch('/api/firms/ai-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setEnabled(!next)
        toast.error(body.error ?? 'No se pudo actualizar')
        return
      }
      toast.success(next ? 'Asistente IA activado' : 'Asistente IA desactivado')
      router.refresh()
    })
  }

  return (
    <section className="bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded-xl p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
          <Sparkles size={18} className="text-brand" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h2 className="text-ink font-semibold text-sm">Asistente IA</h2>
            <button
              onClick={toggle}
              disabled={pending}
              role="switch"
              aria-checked={enabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--c-violet)] ${
                enabled ? 'bg-brand' : 'bg-[color:var(--glass-border)]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <p className="text-sm text-ink-soft">
            Cuando está activo, cada incidencia nueva se clasifica automáticamente y la IA sugiere una respuesta al vecino. Tú decides si la envías.
          </p>
          {!enabled && (
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
              Apagado: las incidencias se guardan tal cual, sin clasificación ni sugerencia.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
