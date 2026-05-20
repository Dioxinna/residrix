import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { requireStripe, TIERS, type TierKey } from '@/lib/stripe'

export const runtime = 'nodejs'

interface Body {
  tier?: TierKey
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, firm_id')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin' || !profile.firm_id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const tierKey = body.tier
  if (!tierKey || !TIERS[tierKey]) {
    return Response.json({ error: 'Tier desconocido' }, { status: 400 })
  }
  const tier = TIERS[tierKey]
  if (!tier.priceId) {
    return Response.json(
      { error: `STRIPE_PRICE_ID_${tierKey.toUpperCase()} no configurado` },
      { status: 500 },
    )
  }

  const service = createSupabaseServiceClient()
  const { data: firm } = await service
    .from('firms')
    .select('stripe_subscription_id')
    .eq('id', profile.firm_id)
    .single()

  if (!firm?.stripe_subscription_id) {
    return Response.json({ error: 'Sin suscripción activa; usa checkout primero' }, { status: 400 })
  }

  const stripe = requireStripe()
  const subscription = await stripe.subscriptions.retrieve(firm.stripe_subscription_id)
  const currentItem = subscription.items.data[0]
  if (!currentItem) {
    return Response.json({ error: 'Suscripción sin items' }, { status: 500 })
  }

  if (currentItem.price.id === tier.priceId) {
    return Response.json({ ok: true, unchanged: true })
  }

  await stripe.subscriptions.update(subscription.id, {
    items: [{ id: currentItem.id, price: tier.priceId }],
    proration_behavior: 'always_invoice',
    metadata: { ...subscription.metadata, tier: tierKey },
  })

  // El webhook customer.subscription.updated sincronizará firms.plan,
  // pero adelantamos el cambio para feedback inmediato en la UI.
  await service.from('firms').update({ plan: tierKey }).eq('id', profile.firm_id)

  return Response.json({ ok: true })
}
