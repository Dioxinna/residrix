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

export const TIERS: Record<TierKey, Tier> = {
  base: {
    key: 'base',
    name: 'Base',
    pricePerCommunity: 12,
    priceId: process.env.STRIPE_PRICE_ID_BASE ?? '',
    tagline: 'Para despachos que empiezan',
    features: [
      'Gestión de incidencias',
      'Documentación compartida',
      'App para vecinos',
      'Gastos básicos',
    ],
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    pricePerCommunity: 25,
    priceId: process.env.STRIPE_PRICE_ID_PRO ?? '',
    tagline: 'La mayoría del mercado',
    features: [
      'Todo lo de Base',
      'Agente IA de incidencias',
      'Gestión de proveedores',
      'Liquidaciones',
    ],
  },
  total: {
    key: 'total',
    name: 'Total',
    pricePerCommunity: 40,
    priceId: process.env.STRIPE_PRICE_ID_TOTAL ?? '',
    tagline: 'Despachos grandes y exigentes',
    features: [
      'Todo lo de Pro',
      'Transcripción de juntas',
      'Informes automáticos',
      'Soporte prioritario',
    ],
  },
}

export const TIER_ORDER: TierKey[] = ['base', 'pro', 'total']

export function tierForPriceId(priceId: string | null | undefined): TierKey | null {
  if (!priceId) return null
  for (const tier of Object.values(TIERS)) {
    if (tier.priceId && tier.priceId === priceId) return tier.key
  }
  return null
}
