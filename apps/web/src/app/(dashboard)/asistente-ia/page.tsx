import { redirect } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { firmHasFeature } from '@/lib/auth/feature-gate'
import { FeatureLock } from '@/components/feature-gate/FeatureLock'
import { PROVIDER_LABEL } from '@/lib/ai/types'
import { GroupCard, type GroupedIncidence } from './_components/GroupCard'

export const metadata = { title: 'Asistente IA · Residrix' }

export default async function AsistenteIaPage() {
  const allowed = await firmHasFeature('ai_assistant')
  if (!allowed) {
    return (
      <FeatureLock
        feature="ai_assistant"
        description="Agente IA que sugiere respuestas a incidencias, las agrupa por patrón y propone qué tipo de proveedor llamar."
      />
    )
  }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, firm_id')
    .eq('id', user.id)
    .single()
  if (!profile?.firm_id || profile.role !== 'admin') {
    return (
      <div className="px-6 py-10">
        <p className="text-ink-soft text-sm">Solo administradores pueden ver esta página.</p>
      </div>
    )
  }

  const { data: incidences } = await supabase
    .from('incidences')
    .select(
      'id, title, description, category, urgency, status, ai_summary, ai_response, ai_response_accepted_at, ai_group_key, ai_suggested_provider, created_at, communities!inner(id, name, firm_id), profiles!reported_by(full_name, unit_number)',
    )
    .eq('communities.firm_id', profile.firm_id)
    .in('status', ['open', 'in_progress'])
    .order('created_at', { ascending: false })

  const rows = (incidences ?? []) as GroupedIncidence[]
  const groups = groupByKey(rows)
  const pendingCount = rows.filter((r) => r.ai_response && !r.ai_response_accepted_at).length

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
          <Sparkles size={18} className="text-indigo-400" strokeWidth={1.75} />
        </div>
        <h1 className="text-2xl font-semibold text-ink">Asistente IA</h1>
      </div>
      <p className="text-sm text-ink-soft mb-8">
        Incidencias abiertas con sugerencias automáticas. Agrupadas por patrón para que respondas a varias a la vez.
        {pendingCount > 0 && (
          <span className="text-indigo-300"> · {pendingCount} respuesta{pendingCount === 1 ? '' : 's'} pendiente{pendingCount === 1 ? '' : 's'} de enviar</span>
        )}
      </p>

      {groups.length === 0 && (
        <div className="glass rounded-xl px-6 py-16 text-center">
          <p className="text-ink-soft text-sm">No hay incidencias abiertas que revisar.</p>
        </div>
      )}

      <div className="space-y-4">
        {groups.map((group) => (
          <GroupCard
            key={group.key ?? 'no-group'}
            groupKey={group.key}
            incidences={group.items}
          />
        ))}
      </div>

      <p className="text-xs text-ink-faint mt-10">
        Tipos de proveedor sugeridos: {Object.values(PROVIDER_LABEL).join(', ')}.
      </p>
    </div>
  )
}

interface Group {
  key: string | null
  items: GroupedIncidence[]
}

function groupByKey(rows: GroupedIncidence[]): Group[] {
  const map = new Map<string, GroupedIncidence[]>()
  const NO_GROUP = '__nogroup__'
  for (const row of rows) {
    const k = row.ai_group_key ?? NO_GROUP
    const arr = map.get(k) ?? []
    arr.push(row)
    map.set(k, arr)
  }
  const urgencyRank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  const groups: Group[] = []
  for (const [k, items] of map.entries()) {
    items.sort((a, b) => (urgencyRank[a.urgency] ?? 9) - (urgencyRank[b.urgency] ?? 9))
    groups.push({ key: k === NO_GROUP ? null : k, items })
  }
  groups.sort((a, b) => {
    if (a.key === null) return 1
    if (b.key === null) return -1
    const ua = urgencyRank[a.items[0]?.urgency ?? 'low'] ?? 9
    const ub = urgencyRank[b.items[0]?.urgency ?? 'low'] ?? 9
    if (ua !== ub) return ua - ub
    return b.items.length - a.items.length
  })
  return groups
}
