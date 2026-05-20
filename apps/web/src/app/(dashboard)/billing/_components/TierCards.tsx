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
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4 flex items-center gap-3 flex-wrap">
          <label className="text-sm text-zinc-400">Cuántas comunidades quieres gestionar:</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
            disabled={pending}
            className="w-20 bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white"
          />
          <span className="text-xs text-zinc-500">Puedes cambiar la cantidad luego desde el portal.</span>
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
                  ? 'bg-indigo-500/5 border-indigo-500/40'
                  : 'bg-zinc-900 border-zinc-800'
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-2.5 left-5 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded">
                  Tu plan
                </span>
              )}

              <h3 className="text-white text-lg font-semibold">{tier.name}</h3>
              <p className="text-zinc-500 text-xs mb-4">{tier.tagline}</p>

              <div className="mb-5">
                <span className="text-3xl font-bold text-white">{tier.pricePerCommunity} €</span>
                <span className="text-sm text-zinc-500"> /comunidad/mes</span>
              </div>

              <ul className="space-y-2 mb-5 text-sm text-zinc-300 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-indigo-400 mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => action(tier)}
                disabled={pending || isCurrent}
                className={`w-full text-sm font-medium px-4 py-2 rounded ${
                  isCurrent
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white'
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
