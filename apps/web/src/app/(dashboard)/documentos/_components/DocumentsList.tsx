'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { FileText } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface Document {
  id: string
  name: string
  description: string | null
  file_url: string
  file_size: number
  mime_type: string
  category: string
  is_public: boolean
  created_at: string | null
  communities: { name: string } | { name: string }[] | null
}

const CATEGORY_LABEL: Record<string, string> = {
  acta: 'Acta',
  estatutos: 'Estatutos',
  seguro: 'Seguro',
  presupuesto: 'Presupuesto',
  circular: 'Circular',
  other: 'Otros',
}

function communityName(c: Document['communities']): string {
  if (!c) return '—'
  return Array.isArray(c) ? c[0]?.name ?? '—' : c.name
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function DocumentsList({ documents }: { documents: Document[] }) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [pending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [target, setTarget] = useState<Document | null>(null)

  async function download(doc: Document) {
    setPendingId(doc.id)
    const { data, error } = await supabase.storage
      .from('community-docs')
      .createSignedUrl(doc.file_url, 60)
    setPendingId(null)
    if (error || !data) {
      toast.error('No se pudo generar el enlace de descarga')
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  function handleConfirmedDelete() {
    const doc = target
    if (!doc) return
    setPendingId(doc.id)
    startTransition(async () => {
      const [{ error: rowError }, { error: fileError }] = await Promise.all([
        supabase.from('documents').delete().eq('id', doc.id),
        supabase.storage.from('community-docs').remove([doc.file_url]),
      ])
      setPendingId(null)
      if (rowError) {
        toast.error(`No se pudo borrar: ${rowError.message}`)
        return
      }
      if (fileError) {
        toast.warning(`Registro borrado, pero el archivo quedó en storage: ${fileError.message}`)
      } else {
        toast.success('Documento borrado')
      }
      setTarget(null)
      router.refresh()
    })
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No hay documentos todavía"
        description="Sube actas, estatutos, seguros y otros documentos para que tus vecinos los vean desde su app."
        action={{ type: 'hint', label: 'Pulsa "Subir documento" arriba para empezar' }}
      />
    )
  }

  return (
    <>
    <div className="bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-[color:var(--c-surface)] text-ink-faint text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Nombre</th>
            <th className="text-left px-4 py-3 font-medium">Comunidad</th>
            <th className="text-left px-4 py-3 font-medium">Categoría</th>
            <th className="text-left px-4 py-3 font-medium">Tamaño</th>
            <th className="text-left px-4 py-3 font-medium">Visibilidad</th>
            <th className="text-left px-4 py-3 font-medium">Subido</th>
            <th className="text-right px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:var(--glass-border)]">
          {documents.map((doc) => {
            const isPending = pendingId === doc.id || pending
            return (
              <tr key={doc.id} className="text-ink-soft">
                <td className="px-4 py-3">
                  <div className="text-ink">{doc.name}</div>
                  {doc.description && (
                    <div className="text-ink-faint text-xs mt-0.5">{doc.description}</div>
                  )}
                </td>
                <td className="px-4 py-3">{communityName(doc.communities)}</td>
                <td className="px-4 py-3">{CATEGORY_LABEL[doc.category] ?? doc.category}</td>
                <td className="px-4 py-3 text-ink-faint text-xs">{formatSize(doc.file_size)}</td>
                <td className="px-4 py-3 text-xs">
                  {doc.is_public ? (
                    <span className="text-emerald-700 dark:text-emerald-300">Vecinos</span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-300">Privado</span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-faint text-xs">
                  {doc.created_at
                    ? formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: es })
                    : '—'}
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => download(doc)}
                    className="inline-flex items-center min-h-9 px-2 text-brand hover:text-brand-soft disabled:opacity-50"
                  >
                    Ver
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setTarget(doc)}
                    className="inline-flex items-center min-h-9 px-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50"
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
    <ConfirmDialog
      open={!!target}
      title="Borrar documento"
      message={`¿Borrar "${target?.name}"? Esta acción no se puede deshacer.`}
      confirmLabel="Borrar"
      destructive
      busy={pending}
      onConfirm={handleConfirmedDelete}
      onCancel={() => setTarget(null)}
    />
    </>
  )
}
