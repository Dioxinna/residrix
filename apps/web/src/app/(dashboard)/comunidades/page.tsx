import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { CommunityDialog } from './_components/CommunityDialog'
import { CommunitiesTable } from './_components/CommunitiesTable'

export default async function ComunidadesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, firm_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin' || !profile.firm_id) {
    return (
      <div className="px-6 py-10">
        <p className="text-zinc-400 text-sm">Esta página es solo para administradores.</p>
      </div>
    )
  }

  const [{ data: communities }, { data: firm }] = await Promise.all([
    supabase
      .from('communities')
      .select('id, name, address, city, postal_code, units_count, created_at')
      .eq('firm_id', profile.firm_id)
      .order('name'),
    supabase
      .from('firms')
      .select('subscription_status, subscription_quantity')
      .eq('id', profile.firm_id)
      .single(),
  ])

  const subActive = firm?.subscription_status === 'active' || firm?.subscription_status === 'trialing'
  const allowed = subActive ? firm?.subscription_quantity ?? 1 : 1
  const used = communities?.length ?? 0
  const atLimit = used >= allowed

  const ids = (communities ?? []).map((c) => c.id)
  const [incRes, vecRes] = await Promise.all([
    ids.length
      ? supabase
          .from('incidences')
          .select('community_id, status')
          .in('community_id', ids)
      : Promise.resolve({ data: [] as { community_id: string; status: string }[] }),
    ids.length
      ? supabase
          .from('profiles')
          .select('community_id')
          .in('community_id', ids)
      : Promise.resolve({ data: [] as { community_id: string | null }[] }),
  ])

  const incidencesByCommunity = new Map<string, { total: number; open: number }>()
  for (const inc of incRes.data ?? []) {
    const current = incidencesByCommunity.get(inc.community_id) ?? { total: 0, open: 0 }
    current.total += 1
    if (inc.status !== 'closed' && inc.status !== 'resolved') current.open += 1
    incidencesByCommunity.set(inc.community_id, current)
  }

  const vecinosByCommunity = new Map<string, number>()
  for (const v of vecRes.data ?? []) {
    if (!v.community_id) continue
    vecinosByCommunity.set(v.community_id, (vecinosByCommunity.get(v.community_id) ?? 0) + 1)
  }

  const enriched = (communities ?? []).map((c) => ({
    ...c,
    stats: {
      incidencesTotal: incidencesByCommunity.get(c.id)?.total ?? 0,
      incidencesOpen: incidencesByCommunity.get(c.id)?.open ?? 0,
      vecinos: vecinosByCommunity.get(c.id) ?? 0,
    },
  }))

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {atLimit && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
          <div className="text-sm text-amber-200">
            Has alcanzado el límite de {allowed} comunidad{allowed === 1 ? '' : 'es'} de tu plan.{' '}
            {subActive ? 'Aumenta la cantidad para añadir más.' : 'Suscríbete para añadir más.'}
          </div>
          <Link
            href="/billing"
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-sm font-medium px-3 py-1.5 rounded"
          >
            Ir a facturación →
          </Link>
        </div>
      )}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold text-white">Comunidades</h1>
        <CommunityDialog firmId={profile.firm_id} mode="create" trigger="Nueva comunidad" />
      </div>
      <p className="text-sm text-zinc-400 mb-8">
        Gestiona las comunidades de tu despacho. Cada comunidad tiene sus propias incidencias, comunicados y documentos.
      </p>

      <CommunitiesTable communities={enriched} firmId={profile.firm_id} />
    </div>
  )
}
