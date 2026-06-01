'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Megaphone } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { EmptyState } from '@/components/ui/EmptyState'

interface Announcement {
  id: string
  title: string
  body: string
  severity: string
  created_at: string | null
  community_id: string
  communities: { name: string } | { name: string }[] | null
  profiles: { full_name: string } | { full_name: string }[] | null
}

function name(c: Announcement['communities']): string {
  if (!c) return '—'
  return Array.isArray(c) ? c[0]?.name ?? '—' : c.name
}

function author(p: Announcement['profiles']): string {
  if (!p) return '—'
  return Array.isArray(p) ? p[0]?.full_name ?? '—' : p.full_name
}

const SEVERITY_STYLES: Record<string, { label: string; tag: string; bar: string }> = {
  info: {
    label: 'Información',
    tag: 'bg-indigo-500/15 text-brand-soft border-indigo-500/30',
    bar: 'bg-indigo-500',
  },
  warning: {
    label: 'Aviso',
    tag: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    bar: 'bg-amber-500',
  },
  urgent: {
    label: 'Urgente',
    tag: 'bg-red-500/15 text-red-300 border-red-500/30',
    bar: 'bg-red-500',
  },
}

export function AnnouncementsList({ announcements }: { announcements: Announcement[] }) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function remove(ann: Announcement) {
    if (!confirm(`¿Borrar el comunicado "${ann.title}"?`)) return
    setPendingId(ann.id)
    startTransition(async () => {
      const { error } = await supabase.from('announcements').delete().eq('id', ann.id)
      setPendingId(null)
      if (error) {
        toast.error(`No se pudo borrar: ${error.message}`)
        return
      }
      toast.success('Comunicado borrado')
      router.refresh()
    })
  }

  if (announcements.length === 0) {
    return (
      <EmptyState
        icon={Megaphone}
        title="Sin comunicados aún"
        description="Publica avisos para toda la comunidad — cortes de agua, juntas, recordatorios. Llegan al feed móvil y por notificación."
        action={{ type: 'hint', label: 'Pulsa "Nuevo comunicado" arriba para empezar' }}
      />
    )
  }

  return (
    <div className="space-y-3">
      {announcements.map((ann) => {
        const styles = SEVERITY_STYLES[ann.severity] ?? SEVERITY_STYLES.info
        return (
          <article
            key={ann.id}
            className="relative glass rounded-lg overflow-hidden"
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.bar}`} />
            <div className="pl-5 pr-4 py-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${styles.tag}`}>
                      {styles.label}
                    </span>
                    <span className="text-ink-faint text-xs">{name(ann.communities)}</span>
                  </div>
                  <h3 className="text-ink text-base font-semibold">{ann.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => remove(ann)}
                  disabled={pendingId === ann.id}
                  className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50"
                >
                  Borrar
                </button>
              </div>
              <p className="text-ink-soft text-sm whitespace-pre-wrap leading-relaxed">{ann.body}</p>
              <p className="text-ink-faint text-xs mt-3">
                Publicado por {author(ann.profiles)}
                {ann.created_at && (
                  <> · {formatDistanceToNow(new Date(ann.created_at), { addSuffix: true, locale: es })}</>
                )}
              </p>
            </div>
          </article>
        )
      })}
    </div>
  )
}
