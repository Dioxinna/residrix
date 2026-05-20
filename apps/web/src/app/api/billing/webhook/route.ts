import type Stripe from 'stripe'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { requireStripe, STRIPE_WEBHOOK_SECRET, tierForPriceId } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: 'STRIPE_WEBHOOK_SECRET not configured' }, { status: 500 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) return Response.json({ error: 'Missing stripe-signature' }, { status: 400 })

  const stripe = requireStripe()
  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'invalid signature'
    return Response.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncFromEvent(event)
        break
      default:
        // No-op for events we don't care about
        break
    }
  } catch (err) {
    console.error('[stripe webhook] handling failed:', err)
    return Response.json({ error: 'Handler error' }, { status: 500 })
  }

  return Response.json({ received: true })
}

async function syncFromEvent(event: Stripe.Event) {
  const stripe = requireStripe()
  const supabase = createSupabaseServiceClient()

  let subscription: Stripe.Subscription | null = null
  let firmIdFromMetadata: string | undefined

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    firmIdFromMetadata = session.metadata?.firm_id ?? undefined
    if (session.subscription) {
      subscription = await stripe.subscriptions.retrieve(
        typeof session.subscription === 'string' ? session.subscription : session.subscription.id,
      )
    }
  } else {
    subscription = event.data.object as Stripe.Subscription
    firmIdFromMetadata = subscription.metadata?.firm_id ?? undefined
  }

  if (!subscription) return

  // Resolve firm: prefer metadata, fall back to customer lookup
  let firmId = firmIdFromMetadata
  if (!firmId) {
    const customerId =
      typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
    const { data: firm } = await supabase
      .from('firms')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()
    firmId = firm?.id
  }
  if (!firmId) {
    console.warn('[stripe webhook] subscription without firm_id, skipping:', subscription.id)
    return
  }

  const item = subscription.items.data[0]
  const quantity = item?.quantity ?? 1
  const priceId = item?.price?.id ?? null
  const tier =
    tierForPriceId(priceId) ??
    (subscription.metadata?.tier as 'base' | 'pro' | 'total' | undefined) ??
    null

  // Stripe.Subscription types differ across SDK versions; access defensively
  const periodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end

  await supabase
    .from('firms')
    .update({
      stripe_customer_id:
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      subscription_quantity: quantity,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      ...(tier ? { plan: tier } : {}),
    })
    .eq('id', firmId)
}
