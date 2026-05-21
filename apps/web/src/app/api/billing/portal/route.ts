import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { requireStripe, getAppOrigin } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST() {
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

  const service = createSupabaseServiceClient()
  const { data: firm } = await service
    .from('firms')
    .select('stripe_customer_id')
    .eq('id', profile.firm_id)
    .single()

  if (!firm?.stripe_customer_id) {
    return Response.json({ error: 'No customer found — checkout first' }, { status: 400 })
  }

  const stripe = requireStripe()

  try {
    const existing = await stripe.customers.retrieve(firm.stripe_customer_id)
    if ((existing as { deleted?: boolean }).deleted) throw { code: 'resource_missing' }
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
        .eq('id', profile.firm_id)
      return Response.json(
        { error: 'Tu customer Stripe ya no existe (cambio de cuenta/modo). Vuelve a /billing y pulsa Suscribirse.' },
        { status: 409 },
      )
    }
    throw err
  }

  const origin = await getAppOrigin()
  const session = await stripe.billingPortal.sessions.create({
    customer: firm.stripe_customer_id,
    return_url: `${origin}/billing`,
  })

  return Response.json({ url: session.url })
}
