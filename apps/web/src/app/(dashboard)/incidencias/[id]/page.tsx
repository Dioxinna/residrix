import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { StatusBadge, UrgencyBadge } from '@/components/ui/badges'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { IncidenceCategory, IncidenceStatus, IncidenceUrgency } from '@residrix/types'
import { MessageThread } from './_components/MessageThread'
import { StatusSelector } from './_components/StatusSelector'
import { AcceptAIResponseButton } from './_components/AcceptAIResponseButton'
import { PROVIDER_LABEL, type ProviderType } from '@/lib/ai/types'

const categoryLabels: Record<IncidenceCategory, string> = {
  plumbing: 'Fontanería', electricity: 'Electricidad', cleaning: 'Limpieza',
  elevator: 'Ascensor', structure: 'Estructura', access: 'Acceso',
  noise: 'Ruido', other: 'Otros',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function IncidenciaDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const [incResult, messagesResult] = await Promise.all([
    supabase
      .from('incidences')
      .select('*, communities(name, address), profiles!reported_by(full_name, unit_number, phone)')
      .eq('id', id)
      .single(),
    supabase
      .from('incidence_messages')
      .select('*, profiles!sender_id(full_name, role)')
      .eq('incidence_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (incResult.error || !incResult.data) notFound()
  const inc = incResult.data
  const messages = messagesResult.data ?? []

  // Proveedores sugeridos: si la IA propuso un tipo, buscamos los de la firma
  // de ese tipo (RLS filtra por firma del usuario actual).
  let suggestedProviders: Array<{ id: string; name: string; contact_name: string | null; phone: string | null; email: string | null }> = []
  if (inc.ai_suggested_provider) {
    const { data } = await supabase
      .from('providers')
      .select('id, name, contact_name, phone, email')
      .eq('provider_type', inc.ai_suggested_provider)
      .order('name')
    suggestedProviders = data ?? []
  }

  const reporter = inc.profiles as { full_name: string; unit_number: string | null; phone: string | null } | null
  const community = inc.communities as { name: string; address: string } | null

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-ink">{inc.title}</h1>
            <p className="text-ink-soft text-sm mt-1">
              {community?.name} · {format(new Date(inc.created_at ?? Date.now()), "d MMM yyyy 'a las' HH:mm", { locale: es })}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <UrgencyBadge urgency={inc.urgency as IncidenceUrgency} />
            <StatusBadge status={inc.status as IncidenceStatus} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="glass rounded-xl p-6">
            <h2 className="text-ink font-semibold text-sm mb-3">Descripción</h2>
            <p className="text-ink-soft text-sm leading-relaxed whitespace-pre-wrap">{inc.description}</p>
            {inc.photo_url && (
              <div className="mt-4">
                <img src={inc.photo_url} alt="Foto de la incidencia" className="rounded-lg max-h-64 object-cover" />
              </div>
            )}
          </section>

          {inc.ai_response && (
            <section className="bg-indigo-950/50 border border-indigo-800/50 rounded-xl p-6">
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <span className="text-indigo-400 text-xs font-semibold uppercase tracking-wide">✦ Respuesta IA sugerida</span>
                {inc.ai_suggested_provider && inc.ai_suggested_provider in PROVIDER_LABEL && (
                  <span className="text-[10px] uppercase tracking-wide font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                    Llamar: {PROVIDER_LABEL[inc.ai_suggested_provider as ProviderType]}
                  </span>
                )}
              </div>
              {inc.ai_summary && (
                <p className="text-ink-soft text-xs mb-3 italic">Resumen: {inc.ai_summary}</p>
              )}
              <p className="text-indigo-100 text-sm leading-relaxed whitespace-pre-wrap">{inc.ai_response}</p>
              <div className="flex justify-end mt-4">
                <AcceptAIResponseButton incidenceId={id} alreadyAccepted={!!inc.ai_response_accepted_at} />
              </div>
            </section>
          )}

          {inc.ai_suggested_provider && inc.ai_suggested_provider in PROVIDER_LABEL && (
            <section className="glass rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-amber-400 text-xs font-semibold uppercase tracking-wide">
                  Proveedor sugerido: {PROVIDER_LABEL[inc.ai_suggested_provider as ProviderType]}
                </span>
              </div>
              {suggestedProviders.length === 0 ? (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-ink-soft text-sm">
                    Aún no tienes proveedores de este tipo. Añade uno para verlo aquí.
                  </p>
                  <a
                    href="/proveedores"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded"
                  >
                    Ir a Proveedores →
                  </a>
                </div>
              ) : (
                <ul className="divide-y divide-zinc-800 -mx-6">
                  {suggestedProviders.map((p) => (
                    <li key={p.id} className="px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="text-ink text-sm font-medium">{p.name}</p>
                        {p.contact_name && <p className="text-ink-faint text-xs">{p.contact_name}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {p.phone && (
                          <a
                            href={`tel:${p.phone}`}
                            className="inline-flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-medium px-2 py-1 rounded border border-emerald-500/30"
                          >
                            ☎ {p.phone}
                          </a>
                        )}
                        {p.email && (
                          <a
                            href={`mailto:${p.email}?subject=Incidencia: ${encodeURIComponent(inc.title)}`}
                            className="inline-flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-medium px-2 py-1 rounded border border-indigo-500/30"
                          >
                            ✉ Email
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <MessageThread incidenceId={id} initialMessages={messages as Parameters<typeof MessageThread>[0]['initialMessages']} aiResponse={inc.ai_response ?? undefined} />
        </div>

        <div className="space-y-4">
          <section className="glass rounded-xl p-5">
            <h3 className="text-ink font-semibold text-sm mb-3">Cambiar estado</h3>
            <StatusSelector incidenceId={id} currentStatus={inc.status as IncidenceStatus} />
          </section>

          <section className="glass rounded-xl p-5 space-y-3">
            <h3 className="text-ink font-semibold text-sm">Vecino</h3>
            <div className="text-sm space-y-1">
              <p className="text-ink-soft">{reporter?.full_name ?? '—'}</p>
              {reporter?.unit_number && <p className="text-ink-faint">Piso/puerta: {reporter.unit_number}</p>}
              {reporter?.phone && <p className="text-ink-faint">{reporter.phone}</p>}
            </div>
          </section>

          <section className="glass rounded-xl p-5 space-y-2">
            <h3 className="text-ink font-semibold text-sm">Detalles</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-ink-faint">Categoría</span>
                <span className="text-ink-soft">{categoryLabels[inc.category as IncidenceCategory]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-faint">Comunidad</span>
                <span className="text-ink-soft text-right">{community?.name}</span>
              </div>
              {inc.resolved_at && (
                <div className="flex justify-between">
                  <span className="text-ink-faint">Resuelta</span>
                  <span className="text-ink-soft">{format(new Date(inc.resolved_at), 'd MMM yyyy', { locale: es })}</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
