import { describe, expect, it } from 'vitest'
import { formatResolutionDuration } from './data'

describe('formatResolutionDuration', () => {
  it('hours when < 24h', () => {
    expect(formatResolutionDuration(3600 * 1000)).toBe('1.0 h')
    expect(formatResolutionDuration(3600 * 1000 * 5.5)).toBe('5.5 h')
    expect(formatResolutionDuration(3600 * 1000 * 23.9)).toMatch(/^23\.9 h$/)
  })
  it('days when 24h ≤ x < 14d', () => {
    expect(formatResolutionDuration(86400 * 1000)).toBe('1.0 días')
    expect(formatResolutionDuration(86400 * 1000 * 7)).toBe('7.0 días')
    expect(formatResolutionDuration(86400 * 1000 * 13)).toBe('13.0 días')
  })
  it('weeks when ≥ 14d', () => {
    expect(formatResolutionDuration(86400 * 1000 * 14)).toBe('2.0 sem')
    expect(formatResolutionDuration(86400 * 1000 * 30)).toMatch(/sem$/)
  })
})
