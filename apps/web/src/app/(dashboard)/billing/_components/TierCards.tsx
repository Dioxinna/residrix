'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Tier, TierKey } from '@/lib/stripe'

export function TierCards({
  tiers,
  currentTier,
  suggestedQuantity,
}: {
  tiers: Tier[]
  currentTier: TierKey | null
  suggestedQuantity: number
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [pendingKey, setPendingKey] = useState<TierKey | null>(null)
  const [quantity, setQuantity] = useState(suggestedQuantity)

  function action(tier: Tier) {
    setPendingKey(tier.key)
    if (currentTier === null) {
      startTransition(async () => {
        const res = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: tier.key, quantity }),
        })
        const body = await res.json().catch(() => ({}))
        setPendingKey(null)
        if (!res.ok || !body.url) {
          toast.error(body.error ?? 'No se pudo iniciar el checkout')
          return
        }
        window.location.href = body.url
      })
      return
    }

    if (currentTier === tier.key) return

    startTransition(async () => {
      const res = await fetch('/api/billing/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tier.key }),
      })
      const body = await res.json().catch(() => ({}))
      setPendingKey(null)
      if (!res.ok) {
        toast.error(body.error ?? 'No se pudo cambiar el plan')
        return
      }
      toast.success(`Cambiado al plan ${tier.name}`)
      router.refresh()
    })
  }

  return (
    <>
      {currentTier === null && (
        <div className="bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded-lg p-4 mb-4 flex items-center gap-3 flex-wrap">
          <label className="text-sm text-ink-soft">Cuántas comunidades quieres gestionar:</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
            disabled={pending}
            className="w-20 bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded px-3 py-1.5 text-sm text-ink focus-visible:outline-2 focus-visible:outline-[color:var(--c-violet)]"
          />
          <span className="text-xs text-ink-faint">Puedes cambiar la cantidad luego desde el portal.</span>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {tiers.map((tier) => {
          const isCurrent = currentTier === tier.key
          const isBusy = pendingKey === tier.key
          const total = quantity * tier.pricePerCommunity
          const cta = currentTier === null
            ? `Suscribirse — ${total} €/mes`
            : isCurrent
              ? 'Plan actual'
              : `Cambiar a ${tier.name}`

          return (
            <div
              key={tier.key}
              className={`relative rounded-xl border p-5 flex flex-col ${
                isCurrent
                  ? 'bg-violet-500/5 border-brand ring-2 ring-brand'
                  : 'bg-[color:var(--c-surface)] border-[color:var(--glass-border)]'
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-2.5 left-5 bg-brand text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded">
                  Tu plan
                </span>
              )}

              <h3 className="text-ink text-lg font-semibold">{tier.name}</h3>
              <p className="text-ink-faint text-xs mb-4">{tier.tagline}</p>

              <div className="mb-5">
                <span className="text-3xl font-bold text-ink">{tier.pricePerCommunity} €</span>
                <span className="text-sm text-ink-faint"> /comunidad/mes</span>
              </div>

              <ul className="space-y-2 mb-5 text-sm text-ink-soft flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-brand mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => action(tier)}
                disabled={pending || isCurrent}
                className={`w-full text-sm font-medium px-4 py-2 rounded ${
                  isCurrent
                    ? 'bg-[color:var(--glass-border)] text-ink-faint cursor-not-allowed'
                    : 'bg-brand hover:bg-brand-soft disabled:opacity-50 text-white'
                }`}
              >
                {isBusy ? '…' : cta}
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}
