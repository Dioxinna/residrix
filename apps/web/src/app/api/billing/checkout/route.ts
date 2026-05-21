import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { requireStripe, TIERS, getAppOrigin, type TierKey } from '@/lib/stripe'

export const runtime = 'nodejs'

interface Body {
  tier?: TierKey
  quantity?: number
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, firm_id')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin' || !profile.firm_id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Body = {}
  try {
    body = (await request.json()) as Body
  } catch {}

  const tierKey = body.tier ?? 'base'
  const tier = TIERS[tierKey]
  if (!tier) return Response.json({ error: 'Tier desconocido' }, { status: 400 })
  if (!tier.priceId) {
    return Response.json(
      { error: `STRIPE_PRICE_ID_${tierKey.toUpperCase()} no configurado` },
      { status: 500 },
    )
  }

  const service = createSupabaseServiceClient()
  const { data: firm } = await service
    .from('firms')
    .select('id, name, stripe_customer_id')
    .eq('id', profile.firm_id)
    .single()
  if (!firm) return Response.json({ error: 'Firm not found' }, { status: 404 })

  const { count: communityCount } = await service
    .from('communities')
    .select('id', { count: 'exact', head: true })
    .eq('firm_id', firm.id)

  const requestedQty = Math.max(1, body.quantity ?? (communityCount ?? 0) + 1)

  const stripe = requireStripe()

  let customerId = firm.stripe_customer_id

  // Verifica que el customer todavía existe en la cuenta Stripe configurada
  // (se puede haber borrado, o cambiado de cuenta/modo test↔live).
  if (customerId) {
    try {
      const existing = await stripe.customers.retrieve(customerId)
      if ((existing as { deleted?: boolean }).deleted) customerId = null
    } catch (err) {
      if ((err as { code?: string })?.code === 'resource_missing') {
        await service
          .from('firms')
          .update({
            stripe_customer_id: null,
            stripe_subscription_id: null,
            subscription_status: null,
            subscription_quantity: null,
            current_period_end: null,
          })
          .eq('id', firm.id)
        customerId = null
      } else {
        throw err
      }
    }
  }

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: firm.name,
      metadata: { firm_id: firm.id },
    })
    customerId = customer.id
    await service.from('firms').update({ stripe_customer_id: customerId }).eq('id', firm.id)
  }

  const origin = await getAppOrigin()
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: tier.priceId, quantity: requestedQty }],
    success_url: `${origin}/billing?status=success`,
    cancel_url: `${origin}/billing?status=cancel`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { firm_id: firm.id, tier: tierKey },
    },
    metadata: { firm_id: firm.id, tier: tierKey },
  })

  if (!session.url) {
    return Response.json({ error: 'No se pudo crear la sesión de checkout' }, { status: 500 })
  }

  return Response.json({ url: session.url })
}
