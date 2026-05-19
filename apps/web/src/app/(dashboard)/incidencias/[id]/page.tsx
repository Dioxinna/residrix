import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { StatusBadge, UrgencyBadge } from '@/components/ui/badges'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { IncidenceCategory, IncidenceStatus, IncidenceUrgency } from '@residrix/types'
import { MessageThread } from './_components/MessageThread'
import { StatusSelector } from './_components/StatusSelector'

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

  const reporter = inc.profiles as { full_name: string; unit_number: string | null; phone: string | null } | null
  const community = inc.communities as { name: string; address: string } | null

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white">{inc.title}</h1>
            <p className="text-zinc-400 text-sm mt-1">
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
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-white font-semibold text-sm mb-3">Descripción</h2>
            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{inc.description}</p>
            {inc.photo_url && (
              <div className="mt-4">
                <img src={inc.photo_url} alt="Foto de la incidencia" className="rounded-lg max-h-64 object-cover" />
              </div>
            )}
          </section>

          {inc.ai_response && (
            <section className="bg-indigo-950/50 border border-indigo-800/50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-indigo-400 text-xs font-semibold uppercase tracking-wide">✦ Respuesta IA sugerida</span>
              </div>
              {inc.ai_summary && (
                <p className="text-zinc-400 text-xs mb-3 italic">Resumen: {inc.ai_summary}</p>
              )}
              <p className="text-indigo-100 text-sm leading-relaxed">{inc.ai_response}</p>
            </section>
          )}

          <MessageThread incidenceId={id} initialMessages={messages as Parameters<typeof MessageThread>[0]['initialMessages']} aiResponse={inc.ai_response ?? undefined} />
        </div>

        <div className="space-y-4">
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Cambiar estado</h3>
            <StatusSelector incidenceId={id} currentStatus={inc.status as IncidenceStatus} />
          </section>

          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
            <h3 className="text-white font-semibold text-sm">Vecino</h3>
            <div className="text-sm space-y-1">
              <p className="text-zinc-300">{reporter?.full_name ?? '—'}</p>
              {reporter?.unit_number && <p className="text-zinc-500">Piso/puerta: {reporter.unit_number}</p>}
              {reporter?.phone && <p className="text-zinc-500">{reporter.phone}</p>}
            </div>
          </section>

          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
            <h3 className="text-white font-semibold text-sm">Detalles</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Categoría</span>
                <span className="text-zinc-300">{categoryLabels[inc.category as IncidenceCategory]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Comunidad</span>
                <span className="text-zinc-300 text-right">{community?.name}</span>
              </div>
              {inc.resolved_at && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Resuelta</span>
                  <span className="text-zinc-300">{format(new Date(inc.resolved_at), 'd MMM yyyy', { locale: es })}</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
