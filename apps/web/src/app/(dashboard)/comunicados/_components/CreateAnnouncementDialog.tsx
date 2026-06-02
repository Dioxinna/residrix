'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { AnnouncementSeverity } from '@residrix/types'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'

interface Community {
  id: string
  name: string
}

const SEVERITIES: { value: AnnouncementSeverity; label: string }[] = [
  { value: 'info', label: 'Información' },
  { value: 'warning', label: 'Aviso' },
  { value: 'urgent', label: 'Urgente' },
]

export function CreateAnnouncementDialog({
  communities,
  authorId,
}: {
  communities: Community[]
  authorId: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [communityId, setCommunityId] = useState(communities[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [severity, setSeverity] = useState<AnnouncementSeverity>('info')

  const supabase = createSupabaseBrowserClient()

  function reset() {
    setTitle('')
    setBody('')
    setSeverity('info')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!communityId || !title.trim() || !body.trim()) {
      toast.error('Faltan campos obligatorios')
      return
    }
    startTransition(async () => {
      const { error } = await supabase.from('announcements').insert({
        community_id: communityId,
        author_id: authorId,
        title: title.trim(),
        body: body.trim(),
        severity,
      })
      if (error) {
        toast.error(`No se pudo publicar: ${error.message}`)
        return
      }
      toast.success('Comunicado publicado')
      reset()
      setOpen(false)
      router.refresh()
    })
  }

  if (communities.length === 0) {
    return (
      <button
        disabled
        className="bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] text-ink-faint text-sm px-4 py-2 rounded cursor-not-allowed"
        title="Crea primero una comunidad"
      >
        Nuevo comunicado
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-brand hover:bg-brand-soft text-white text-sm font-medium px-4 py-2 rounded"
      >
        Nuevo comunicado
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nuevo comunicado"
        busy={pending}
        className="max-w-lg"
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Comunidad">
            <select
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
              required
              className="w-full bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {communities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Severidad">
            <div className="flex gap-2">
              {SEVERITIES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSeverity(s.value)}
                  className={`flex-1 text-sm px-3 py-2 rounded border ${
                    severity === s.value
                      ? s.value === 'urgent'
                        ? 'bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-300'
                        : s.value === 'warning'
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                        : 'bg-violet-500/15 border-violet-500/40 text-brand-soft'
                      : 'border-[color:var(--glass-border)] text-ink-soft hover:text-ink'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Título">
            <input
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Corte de agua martes 12:00"
              className="w-full bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </Field>

          <Field label="Mensaje">
            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="Detalles del comunicado..."
              className="w-full bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={pending}
              className="text-sm px-4 py-2 rounded text-ink-soft hover:text-ink"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="bg-brand hover:bg-brand-soft disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded"
            >
              {pending ? 'Publicando…' : 'Publicar'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-ink-soft mb-1">{label}</span>
      {children}
    </label>
  )
}
