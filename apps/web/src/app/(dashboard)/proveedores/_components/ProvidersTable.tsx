'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Mail, Phone, Trash2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { PROVIDER_LABEL, type ProviderType } from '@/lib/ai/types'
import { ProviderDialog, type ProviderRow } from './ProviderDialog'

function typeLabel(t: string): string {
  return (PROVIDER_LABEL as Record<string, string>)[t] ?? 'Otro'
}

export function ProvidersTable({
  providers,
  firmId,
}: {
  providers: ProviderRow[]
  firmId: string
}) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [deleting, startTransition] = useTransition()
  const [confirmId, setConfirmId] = useState<string | null>(null)

  function remove(id: string) {
    startTransition(async () => {
      const { error } = await supabase.from('providers').delete().eq('id', id)
      if (error) {
        toast.error(`No se pudo borrar: ${error.message}`)
        return
      }
      toast.success('Proveedor borrado')
      setConfirmId(null)
      router.refresh()
    })
  }

  if (providers.length === 0) {
    return (
      <div className="glass rounded-xl px-6 py-16 text-center">
        <p className="text-ink-soft text-sm mb-2">Aún no has añadido ningún proveedor.</p>
        <p className="text-ink-faint text-xs">
          Crea al menos uno por tipo y el Agente IA te lo sugerirá cuando llegue una incidencia que encaje.
        </p>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="glass border-b border-[color:var(--glass-border)]">
          <tr className="text-left text-ink-faint text-xs uppercase tracking-wide">
            <th className="px-6 py-3 font-medium">Nombre</th>
            <th className="px-6 py-3 font-medium">Tipo</th>
            <th className="px-6 py-3 font-medium hidden md:table-cell">Contacto</th>
            <th className="px-6 py-3 font-medium">Acciones</th>
            <th className="px-6 py-3 font-medium text-right">·</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {providers.map((p) => (
            <tr key={p.id} className="hover:glass">
              <td className="px-6 py-3">
                <p className="text-ink font-medium">{p.name}</p>
                {p.contact_name && <p className="text-ink-faint text-xs">{p.contact_name}</p>}
              </td>
              <td className="px-6 py-3">
                <span className="text-[10px] uppercase tracking-wide font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                  {typeLabel(p.provider_type)}
                </span>
              </td>
              <td className="px-6 py-3 hidden md:table-cell text-ink-soft text-xs space-y-0.5">
                {p.phone && <p>{p.phone}</p>}
                {p.email && <p>{p.email}</p>}
              </td>
              <td className="px-6 py-3">
                <div className="flex items-center gap-2">
                  {p.phone && (
                    <a
                      href={`tel:${p.phone}`}
                      className="inline-flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-medium px-2 py-1 rounded border border-emerald-500/30"
                    >
                      <Phone size={12} /> Llamar
                    </a>
                  )}
                  {p.email && (
                    <a
                      href={`mailto:${p.email}`}
                      className="inline-flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-medium px-2 py-1 rounded border border-indigo-500/30"
                    >
                      <Mail size={12} /> Email
                    </a>
                  )}
                </div>
              </td>
              <td className="px-6 py-3 text-right">
                <div className="inline-flex items-center gap-3">
                  <ProviderDialog firmId={firmId} mode="edit" provider={p} trigger="Editar" />
                  {confirmId === p.id ? (
                    <>
                      <button
                        onClick={() => remove(p.id)}
                        disabled={deleting}
                        className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        disabled={deleting}
                        className="text-xs text-ink-faint hover:text-ink-soft"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmId(p.id)}
                      className="text-ink-faint hover:text-red-400 transition-colors"
                      aria-label="Borrar proveedor"
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
