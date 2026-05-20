import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { TIERS, TIER_ORDER, type TierKey } from '@/lib/stripe'
import { TierCards } from './_components/TierCards'
import { PortalButton } from './_components/PortalButton'

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  active: { label: 'Activa', tone: 'text-emerald-400 bg-emerald-500/10' },
  trialing: { label: 'En prueba', tone: 'text-indigo-400 bg-indigo-500/10' },
  past_due: { label: 'Pago pendiente', tone: 'text-amber-400 bg-amber-500/10' },
  canceled: { label: 'Cancelada', tone: 'text-zinc-500 bg-zinc-500/10' },
  incomplete: { label: 'Incompleta', tone: 'text-amber-400 bg-amber-500/10' },
  incomplete_expired: { label: 'Expirada', tone: 'text-zinc-500 bg-zinc-500/10' },
  unpaid: { label: 'Impagada', tone: 'text-red-400 bg-red-500/10' },
  paused: { label: 'Pausada', tone: 'text-zinc-500 bg-zinc-500/10' },
}

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function BillingPage({ searchParams }: PageProps) {
  const params = await searchParams
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

  const { data: firm } = await supabase
    .from('firms')
    .select('plan, subscription_status, subscription_quantity, current_period_end, stripe_customer_id')
    .eq('id', profile.firm_id)
    .single()

  const { count: communityCount } = await supabase
    .from('communities')
    .select('id', { count: 'exact', head: true })
    .eq('firm_id', profile.firm_id)

  const status = firm?.subscription_status ?? null
  const isActive = status === 'active' || status === 'trialing'
  const currentTier = (firm?.plan ?? 'base') as TierKey
  const quantity = isActive ? firm?.subscription_quantity ?? 0 : 1
  const used = communityCount ?? 0
  const remaining = Math.max(0, quantity - used)
  const periodEnd = firm?.current_period_end
    ? new Date(firm.current_period_end).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const statusBadge = status ? STATUS_LABEL[status] : null
  const suggestedQuantity = Math.max(1, used + (isActive ? 0 : 1))

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-white mb-1">Facturación</h1>
      <p className="text-sm text-zinc-400 mb-8">
        Tu primera comunidad es gratis. Elige plan cuando quieras añadir más.
      </p>

      {params.status === 'success' && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 mb-6 text-sm text-emerald-300">
          Pago completado. Si los datos no aparecen aún, recarga en unos segundos.
        </div>
      )}
      {params.status === 'cancel' && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 mb-6 text-sm text-zinc-400">
          Has cancelado el pago. Puedes retomarlo cuando quieras.
        </div>
      )}

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Estado actual</p>
            <div className="flex items-center gap-3">
              {statusBadge ? (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${statusBadge.tone}`}>
                  {statusBadge.label}
                </span>
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 rounded text-zinc-400 bg-zinc-800">
                  Sin suscripción
                </span>
              )}
              {isActive && (
                <span className="text-sm text-white font-medium">
                  Plan {TIERS[currentTier].name}
                </span>
              )}
              {periodEnd && isActive && (
                <span className="text-xs text-zinc-500">· Próxima factura {periodEnd}</span>
              )}
            </div>
          </div>
          {firm?.stripe_customer_id && <PortalButton />}
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
          <Stat label="Comunidades en plan" value={isActive ? `${quantity}` : 'Gratis (1)'} />
          <Stat label="Usadas" value={`${used}`} />
          <Stat
            label="Disponibles"
            value={`${remaining}`}
            tone={remaining === 0 ? 'text-amber-400' : undefined}
          />
        </div>
      </section>

      <h2 className="text-white font-semibold text-lg mb-1">
        {isActive ? 'Cambia de plan' : 'Elige un plan'}
      </h2>
      <p className="text-sm text-zinc-500 mb-4">
        El precio es por comunidad/mes. Tu primera comunidad sigue siendo gratis hasta que te suscribas.
      </p>

      <TierCards
        tiers={TIER_ORDER.map((k) => TIERS[k])}
        currentTier={isActive ? currentTier : null}
        suggestedQuantity={suggestedQuantity}
      />

      <p className="mt-8 text-xs text-zinc-500">
        Pagos seguros con Stripe. Puedes cancelar o cambiar de plan en cualquier momento desde el portal de cliente.
      </p>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={`text-lg font-semibold ${tone ?? 'text-white'}`}>{value}</p>
    </div>
  )
}
