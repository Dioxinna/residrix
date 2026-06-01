'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, ExternalLink } from 'lucide-react'
import { UrgencyBadge } from '@/components/ui/badges'
import { PROVIDER_LABEL, type ProviderType } from '@/lib/ai/types'

export interface GroupedIncidence {
  id: string
  title: string
  description: string
  category: string
  urgency: string
  status: string
  ai_summary: string | null
  ai_response: string | null
  ai_response_accepted_at: string | null
  ai_group_key: string | null
  ai_suggested_provider: string | null
  created_at: string | null
  communities: { id: string; name: string; firm_id: string }
  profiles: { full_name: string; unit_number: string | null } | null
}

const CATEGORY_LABEL: Record<string, string> = {
  plumbing: 'Fontanería', electricity: 'Electricidad', cleaning: 'Limpieza',
  elevator: 'Ascensor', structure: 'Estructura', access: 'Acceso',
  noise: 'Ruido', other: 'Otros',
}

export function GroupCard({
  groupKey,
  incidences,
}: {
  groupKey: string | null
  incidences: GroupedIncidence[]
}) {
  const [expanded, setExpanded] = useState(incidences.length <= 3)
  const first = incidences[0]
  const providerType = firstProvider(incidences)
  const summary = first?.ai_summary ?? first?.title ?? ''
  const visible = expanded ? incidences : incidences.slice(0, 2)

  return (
    <section className="glass rounded-xl overflow-hidden">
      <header className="px-6 py-4 border-b border-[color:var(--glass-border)] flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {groupKey ? (
              <span className="text-[10px] uppercase tracking-wide font-bold text-brand-soft bg-indigo-500/10 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                {groupKey}
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wide font-bold text-ink-soft glass-strong px-1.5 py-0.5 rounded">
                Sin agrupar
              </span>
            )}
            <span className="text-xs text-ink-faint">
              {incidences.length} incidencia{incidences.length === 1 ? '' : 's'}
            </span>
            {providerType && (
              <span className="text-[10px] uppercase tracking-wide font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                Sugerido: {PROVIDER_LABEL[providerType]}
              </span>
            )}
          </div>
          <p className="text-ink text-sm font-medium truncate">{summary}</p>
        </div>
      </header>

      <ul className="divide-y divide-[color:var(--glass-border)]">
        {visible.map((inc) => (
          <IncidenceRow key={inc.id} inc={inc} />
        ))}
      </ul>

      {incidences.length > visible.length && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full text-center py-3 text-xs text-ink-faint hover:text-ink-soft border-t border-[color:var(--glass-border)]"
        >
          Mostrar {incidences.length - visible.length} más
        </button>
      )}
    </section>
  )
}

function IncidenceRow({ inc }: { inc: GroupedIncidence }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [accepted, setAccepted] = useState(!!inc.ai_response_accepted_at)

  function acceptResponse() {
    startTransition(async () => {
      const res = await fetch('/api/ai/accept-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidenceId: inc.id }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body.error ?? 'No se pudo enviar la respuesta')
        return
      }
      setAccepted(true)
      toast.success('Respuesta enviada al vecino')
      router.refresh()
    })
  }

  return (
    <li className="px-6 py-4">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
        <div className="min-w-0">
          <Link
            href={`/incidencias/${inc.id}`}
            className="text-ink text-sm font-medium hover:text-brand-soft inline-flex items-center gap-1"
          >
            {inc.title}
            <ExternalLink size={12} className="text-ink-faint" />
          </Link>
          <p className="text-xs text-ink-faint mt-0.5">
            {inc.communities.name}
            {inc.profiles?.full_name && ` · ${inc.profiles.full_name}`}
            {inc.profiles?.unit_number && ` (${inc.profiles.unit_number})`}
            {' · '}
            {CATEGORY_LABEL[inc.category] ?? inc.category}
          </p>
        </div>
        <UrgencyBadge urgency={inc.urgency as 'low' | 'medium' | 'high' | 'critical'} />
      </div>

      {inc.ai_response ? (
        <div className="bg-brand/8 border border-brand/25 rounded-xl p-3 mt-2">
          <p className="text-[10px] uppercase tracking-wide font-bold text-brand-soft mb-1.5">
            ✦ Respuesta sugerida
          </p>
          <p className="text-ink text-sm leading-relaxed whitespace-pre-wrap">{inc.ai_response}</p>
          <div className="flex items-center justify-end gap-2 mt-3">
            {accepted ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <Check size={14} /> Enviada al vecino
              </span>
            ) : (
              <button
                onClick={acceptResponse}
                disabled={pending}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded"
              >
                {pending ? 'Enviando…' : 'Aceptar y enviar al vecino'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-ink-faint mt-2 italic">Sin respuesta sugerida (IA no procesó esta incidencia).</p>
      )}
    </li>
  )
}

function firstProvider(items: GroupedIncidence[]): ProviderType | null {
  for (const i of items) {
    if (i.ai_suggested_provider && i.ai_suggested_provider in PROVIDER_LABEL) {
      return i.ai_suggested_provider as ProviderType
    }
  }
  return null
}
