import { describe, expect, it } from 'vitest'
import { TIERS, TIER_ORDER, tierForPriceId } from './stripe'

describe('TIERS', () => {
  it('three tiers in pricing order', () => {
    expect(TIER_ORDER).toEqual(['base', 'pro', 'total'])
  })

  it('prices match landing claims', () => {
    expect(TIERS.base.pricePerCommunity).toBe(12)
    expect(TIERS.pro.pricePerCommunity).toBe(25)
    expect(TIERS.total.pricePerCommunity).toBe(40)
  })

  it('feature lists are derived (pro contains "Todo lo de Base")', () => {
    expect(TIERS.pro.features[0]).toMatch(/Todo lo de Base/)
    expect(TIERS.total.features[0]).toMatch(/Todo lo de Pro/)
  })

  it('feature lists are non-empty and contain expected features', () => {
    expect(TIERS.base.features).toContain('Gestión de incidencias')
    expect(TIERS.pro.features).toContain('Agente IA de incidencias')
    expect(TIERS.total.features).toContain('Transcripción de juntas')
  })
})

describe('tierForPriceId', () => {
  it('null on null/undefined/empty', () => {
    expect(tierForPriceId(null)).toBeNull()
    expect(tierForPriceId(undefined)).toBeNull()
    expect(tierForPriceId('')).toBeNull()
  })

  it('null on unknown price', () => {
    expect(tierForPriceId('price_fake_999')).toBeNull()
  })

  it('matches configured price ids (when set)', () => {
    // No test sin env: en CI las STRIPE_PRICE_ID_* están vacías y los
    // tier ids son strings vacíos, así que `price_*` no encaja con `''`.
    // Skipear assertion positiva si todas las price IDs están vacías.
    const allEmpty = TIER_ORDER.every((k) => !TIERS[k].priceId)
    if (allEmpty) return
    for (const k of TIER_ORDER) {
      if (TIERS[k].priceId) {
        expect(tierForPriceId(TIERS[k].priceId)).toBe(k)
      }
    }
  })
})
