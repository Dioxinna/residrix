import { describe, expect, it } from 'vitest'
import {
  FEATURE_MIN_TIER,
  FEATURE_LABEL,
  featuresForTier,
  tierIncludes,
  type FeatureKey,
} from './features'

const ALL_FEATURES = Object.keys(FEATURE_MIN_TIER) as FeatureKey[]

describe('tierIncludes', () => {
  it('base tier only sees base features', () => {
    for (const f of ALL_FEATURES) {
      const expected = FEATURE_MIN_TIER[f] === 'base'
      expect(tierIncludes('base', f)).toBe(expected)
    }
  })
  it('pro tier sees base + pro', () => {
    for (const f of ALL_FEATURES) {
      const expected = FEATURE_MIN_TIER[f] === 'base' || FEATURE_MIN_TIER[f] === 'pro'
      expect(tierIncludes('pro', f)).toBe(expected)
    }
  })
  it('total tier sees everything', () => {
    for (const f of ALL_FEATURES) {
      expect(tierIncludes('total', f)).toBe(true)
    }
  })
  it('matches landing pricing claims', () => {
    // Pro promises that landing makes explicit
    expect(tierIncludes('pro', 'ai_assistant')).toBe(true)
    expect(tierIncludes('pro', 'providers')).toBe(true)
    expect(tierIncludes('pro', 'settlements')).toBe(true)
    // Total promises
    expect(tierIncludes('total', 'meeting_transcripts')).toBe(true)
    expect(tierIncludes('total', 'auto_reports')).toBe(true)
    // Base does NOT include Pro features
    expect(tierIncludes('base', 'ai_assistant')).toBe(false)
    expect(tierIncludes('base', 'providers')).toBe(false)
  })
})

describe('featuresForTier', () => {
  it('base gets all base-tier features', () => {
    const f = featuresForTier('base')
    expect(f).toContain('incidents')
    expect(f).toContain('expenses')
    expect(f).not.toContain('ai_assistant')
    expect(f).not.toContain('meeting_transcripts')
  })
  it('total gets everything', () => {
    expect(featuresForTier('total').length).toBe(ALL_FEATURES.length)
  })
  it('pro is superset of base', () => {
    const base = new Set(featuresForTier('base'))
    const pro = new Set(featuresForTier('pro'))
    for (const f of base) expect(pro.has(f)).toBe(true)
  })
})

describe('FEATURE_LABEL', () => {
  it('covers every feature key', () => {
    for (const f of ALL_FEATURES) {
      expect(FEATURE_LABEL[f]).toBeTruthy()
      expect(typeof FEATURE_LABEL[f]).toBe('string')
    }
  })
})
