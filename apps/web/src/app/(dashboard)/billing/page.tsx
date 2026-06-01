import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { TIERS, TIER_ORDER, type TierKey } from '@/lib/stripe'
import { FEATURE_LABEL, FEATURE_MIN_TIER, TIER_NAME, type FeatureKey } from '@/lib/features'
import { TierCards } from './_components/TierCards'
import { PortalButton } from './_components/PortalButton'

function isFeatureKey(value: string | undefined): value is FeatureKey {
  return !!value && value in FEATURE_LABEL
}

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  active: { label: 'Activa', tone: 'text-emerald-400 bg-emerald-500/10' },
  trialing: { label: 'En prueba', tone: 'text-violet-400 bg-violet-500/10' },
  past_due: { label: 'Pago pendiente', tone: 'text-amber-400 bg-amber-500/10' },
  canceled: { label: 'Cancelada', tone: 'text-ink-faint bg-zinc-500/10' },
  incomplete: { label: 'Incompleta', tone: 'text-amber-400 bg-amber-500/10' },
  incomplete_expired: { label: 'Expirada', tone: 'text-ink-faint bg-zinc-500/10' },
  unpaid: { label: 'Impagada', tone: 'text-red-400 bg-red-500/10' },
  paused: { label: 'Pausada', tone: 'text-ink-faint bg-zinc-500/10' },
}

interface PageProps {
  searchParams: Promise<{ status?: string; upgrade?: string }>
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
        <p className="text-ink-soft text-sm">Esta página es solo para administradores.</p>
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
  const upgradeFeature = isFeatureKey(params.upgrade) ? params.upgrade : null

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-ink mb-1">Facturación</h1>
      <p className="text-sm text-ink-soft mb-8">
        Tu primera comunidad es gratis. Elige plan cuando quieras añadir más.
      </p>

      {upgradeFeature && (
        <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg px-4 py-3 mb-6 text-sm text-brand-soft">
          <strong className="text-ink">{FEATURE_LABEL[upgradeFeature]}</strong> está incluida en el plan{' '}
          <strong className="text-ink">{TIER_NAME[FEATURE_MIN_TIER[upgradeFeature]]}</strong>. Súbete para usarla.
        </div>
      )}
      {params.status === 'success' && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 mb-6 text-sm text-emerald-700 dark:text-emerald-300">
          Pago completado. Si los datos no aparecen aún, recarga en unos segundos.
        </div>
      )}
      {params.status === 'cancel' && (
        <div className="glass-strong border border-[color:var(--glass-border)] rounded-lg px-4 py-3 mb-6 text-sm text-ink-soft">
          Has cancelado el pago. Puedes retomarlo cuando quieras.
        </div>
      )}

      <section className="glass rounded-xl p-6 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-ink-faint uppercase tracking-wide mb-1">Estado actual</p>
            <div className="flex items-center gap-3">
              {statusBadge ? (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${statusBadge.tone}`}>
                  {statusBadge.label}
                </span>
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 rounded text-ink-soft glass-strong">
                  Sin suscripción
                </span>
              )}
              {isActive && (
                <span className="text-sm text-ink font-medium">
                  Plan {TIERS[currentTier].name}
                </span>
              )}
              {periodEnd && isActive && (
                <span className="text-xs text-ink-faint">· Próxima factura {periodEnd}</span>
              )}
            </div>
          </div>
          {firm?.stripe_customer_id && <PortalButton />}
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[color:var(--glass-border)]">
          <Stat label="Comunidades en plan" value={isActive ? `${quantity}` : 'Gratis (1)'} />
          <Stat label="Usadas" value={`${used}`} />
          <Stat
            label="Disponibles"
            value={`${remaining}`}
            tone={remaining === 0 ? 'text-amber-400' : undefined}
          />
        </div>
      </section>

      <h2 className="text-ink font-semibold text-lg mb-1">
        {isActive ? 'Cambia de plan' : 'Elige un plan'}
      </h2>
      <p className="text-sm text-ink-faint mb-4">
        El precio es por comunidad/mes. Tu primera comunidad sigue siendo gratis hasta que te suscribas.
      </p>

      <TierCards
        tiers={TIER_ORDER.map((k) => TIERS[k])}
        currentTier={isActive ? currentTier : null}
        suggestedQuantity={suggestedQuantity}
      />

      <p className="mt-8 text-xs text-ink-faint">
        Pagos seguros con Stripe. Puedes cancelar o cambiar de plan en cualquier momento desde el portal de cliente.
      </p>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <p className="text-xs text-ink-faint mb-1">{label}</p>
      <p className={`text-lg font-semibold ${tone ?? 'text-ink'}`}>{value}</p>
    </div>
  )
}
