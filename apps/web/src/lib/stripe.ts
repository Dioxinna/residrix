import Stripe from 'stripe'
import { headers } from 'next/headers'

const apiKey = process.env.STRIPE_SECRET_KEY

export const stripe = apiKey
  ? new Stripe(apiKey, { typescript: true })
  : null

export function requireStripe(): Stripe {
  if (!stripe) throw new Error('STRIPE_SECRET_KEY not configured')
  return stripe
}

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? ''

/**
 * Origen al que volvemos tras un redirect de Stripe. Lo derivamos del request
 * para que funcione en local, ngrok y prod sin necesitar NEXT_PUBLIC_APP_URL.
 */
export async function getAppOrigin(): Promise<string> {
  try {
    const h = await headers()
    const host = h.get('x-forwarded-host') ?? h.get('host')
    if (host) {
      const proto =
        h.get('x-forwarded-proto') ??
        (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https')
      return `${proto}://${host}`
    }
  } catch {}
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}

export type TierKey = 'base' | 'pro' | 'total'

export interface Tier {
  key: TierKey
  name: string
  pricePerCommunity: number  // €/comunidad/mes
  priceId: string
  tagline: string
  features: string[]
}

export const TIER_ORDER: TierKey[] = ['base', 'pro', 'total']

import { FEATURE_LABEL, FEATURE_MIN_TIER, TIER_NAME, type FeatureKey } from './features'

function featuresUpTo(tier: TierKey): string[] {
  const previousIndex = TIER_ORDER.indexOf(tier) - 1
  const previous = previousIndex >= 0 ? TIER_ORDER[previousIndex] : null
  const ownKeys = (Object.keys(FEATURE_MIN_TIER) as FeatureKey[]).filter(
    (k) => FEATURE_MIN_TIER[k] === tier,
  )
  const ownLabels = ownKeys.map((k) => FEATURE_LABEL[k])
  return previous ? [`Todo lo de ${TIER_NAME[previous]}`, ...ownLabels] : ownLabels
}

export const TIERS: Record<TierKey, Tier> = {
  base: {
    key: 'base',
    name: TIER_NAME.base,
    pricePerCommunity: 12,
    priceId: process.env.STRIPE_PRICE_ID_BASE ?? '',
    tagline: 'Para despachos que empiezan',
    features: featuresUpTo('base'),
  },
  pro: {
    key: 'pro',
    name: TIER_NAME.pro,
    pricePerCommunity: 25,
    priceId: process.env.STRIPE_PRICE_ID_PRO ?? '',
    tagline: 'La mayoría del mercado',
    features: featuresUpTo('pro'),
  },
  total: {
    key: 'total',
    name: TIER_NAME.total,
    pricePerCommunity: 40,
    priceId: process.env.STRIPE_PRICE_ID_TOTAL ?? '',
    tagline: 'Despachos grandes y exigentes',
    features: featuresUpTo('total'),
  },
}

export function tierForPriceId(priceId: string | null | undefined): TierKey | null {
  if (!priceId) return null
  for (const tier of Object.values(TIERS)) {
    if (tier.priceId && tier.priceId === priceId) return tier.key
  }
  return null
}
