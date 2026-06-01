'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Building2 } from 'lucide-react'
import { CommunityDialog, type CommunityRow } from './CommunityDialog'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { EmptyState } from '@/components/ui/EmptyState'

interface CommunityWithStats extends CommunityRow {
  created_at: string | null
  stats: {
    incidencesTotal: number
    incidencesOpen: number
    vecinos: number
  }
}

export function CommunitiesTable({
  communities,
  firmId,
}: {
  communities: CommunityWithStats[]
  firmId: string
}) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function remove(c: CommunityWithStats) {
    const impactParts = []
    if (c.stats.vecinos > 0) impactParts.push(`${c.stats.vecinos} vecino(s) quedarán huérfanos`)
    if (c.stats.incidencesTotal > 0) impactParts.push(`${c.stats.incidencesTotal} incidencia(s) se borrarán`)
    const impact = impactParts.length > 0 ? `\n\nIMPACTO:\n• ${impactParts.join('\n• ')}\n• Todos los comunicados y documentos asociados se borrarán también` : ''

    if (!confirm(`¿Borrar "${c.name}"? Esta acción NO se puede deshacer.${impact}`)) return

    setPendingId(c.id)
    startTransition(async () => {
      const { error } = await supabase.from('communities').delete().eq('id', c.id)
      setPendingId(null)
      if (error) {
        toast.error(`No se pudo borrar: ${error.message}`)
        return
      }
      toast.success('Comunidad borrada')
      router.refresh()
    })
  }

  if (communities.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="Aún no tienes comunidades"
        description="Crea tu primera comunidad para empezar a gestionar incidencias, comunicados y vecinos. La primera es gratis."
        action={{ type: 'hint', label: 'Pulsa "Nueva comunidad" arriba para empezar' }}
      />
    )
  }

  return (
    <div className="glass rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[color:var(--c-surface)] text-ink-faint text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Nombre</th>
            <th className="text-left px-4 py-3 font-medium">Dirección</th>
            <th className="text-left px-4 py-3 font-medium">Unidades</th>
            <th className="text-left px-4 py-3 font-medium">Vecinos</th>
            <th className="text-left px-4 py-3 font-medium">Incidencias</th>
            <th className="text-right px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {communities.map((c) => {
            const isPending = pendingId === c.id
            return (
              <tr key={c.id} className="text-ink-soft">
                <td className="px-4 py-3 text-ink font-medium">{c.name}</td>
                <td className="px-4 py-3 text-ink-soft">
                  <div>{c.address}</div>
                  <div className="text-xs text-ink-faint">{c.postal_code} {c.city}</div>
                </td>
                <td className="px-4 py-3 text-ink-soft">{c.units_count}</td>
                <td className="px-4 py-3">{c.stats.vecinos}</td>
                <td className="px-4 py-3">
                  <span className="text-ink">{c.stats.incidencesOpen}</span>
                  <span className="text-ink-faint"> / {c.stats.incidencesTotal}</span>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <CommunityDialog
                    mode="edit"
                    community={c}
                    firmId={firmId}
                    trigger="Editar"
                  />
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => remove(c)}
                    className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50"
                  >
                    Borrar
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
