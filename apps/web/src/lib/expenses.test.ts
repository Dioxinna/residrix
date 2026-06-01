import { describe, expect, it } from 'vitest'
import {
  formatEuros,
  parseEurosToCents,
  currentMonthIso,
  previousMonthIso,
  monthRange,
  yearRange,
  monthLabel,
  periodForPreset,
  formatDateEs,
  inclusiveEndLabel,
} from './expenses'

describe('parseEurosToCents', () => {
  it('parses ES locale with comma decimal', () => {
    expect(parseEurosToCents('125,40')).toBe(12540)
    expect(parseEurosToCents('0,01')).toBe(1)
    expect(parseEurosToCents('1.234,56')).toBe(123456) // thousands sep
  })
  it('parses bare numbers', () => {
    expect(parseEurosToCents('100')).toBe(10000)
    expect(parseEurosToCents('0')).toBe(0)
  })
  it('rejects invalid', () => {
    expect(parseEurosToCents('abc')).toBeNull()
    expect(parseEurosToCents('-5')).toBeNull()
    // Empty string parses to 0 via Number(''). Documenting current
    // behavior — if we ever tighten this, update the test.
    expect(parseEurosToCents('')).toBe(0)
  })
  it('rounds two-decimal inputs deterministically', () => {
    expect(parseEurosToCents('1,00')).toBe(100)
    expect(parseEurosToCents('1,01')).toBe(101)
    expect(parseEurosToCents('1,99')).toBe(199)
  })
})

describe('formatEuros', () => {
  it('formats cents to ES euros with comma decimal', () => {
    expect(formatEuros(12540)).toMatch(/125,40\s*€/)
    expect(formatEuros(0)).toMatch(/0,00\s*€/)
    // Thousands separator may be '.', ' ', U+00A0 or absent depending
    // on ICU version. Accept any non-digit between the 1 and 0,00.
    expect(formatEuros(100000)).toMatch(/1\D?000,00\s*€/)
  })
})

describe('currentMonthIso / previousMonthIso', () => {
  it('current returns YYYY-MM', () => {
    expect(currentMonthIso()).toMatch(/^\d{4}-\d{2}$/)
  })
  it('previous handles year rollover', () => {
    expect(previousMonthIso('2026-01')).toBe('2025-12')
    expect(previousMonthIso('2026-03')).toBe('2026-02')
    expect(previousMonthIso('2026-12')).toBe('2026-11')
  })
})

describe('monthRange', () => {
  it('inclusive from + exclusive to', () => {
    expect(monthRange('2026-03')).toEqual({
      from: '2026-03-01',
      toExclusive: '2026-04-01',
    })
  })
  it('handles december rollover', () => {
    expect(monthRange('2026-12')).toEqual({
      from: '2026-12-01',
      toExclusive: '2027-01-01',
    })
  })
})

describe('yearRange', () => {
  it('full calendar year', () => {
    expect(yearRange('2026-07')).toEqual({
      from: '2026-01-01',
      toExclusive: '2027-01-01',
    })
  })
})

describe('monthLabel', () => {
  it('Spanish month names', () => {
    expect(monthLabel('2026-03')).toMatch(/marzo.*2026/)
    expect(monthLabel('2026-12')).toMatch(/diciembre.*2026/)
  })
})

describe('periodForPreset', () => {
  it('q1', () => {
    expect(periodForPreset('q1', 2026)).toEqual({
      from: '2026-01-01',
      toExclusive: '2026-04-01',
      label: '1er trimestre 2026',
    })
  })
  it('q4 rolls to next year', () => {
    const r = periodForPreset('q4', 2026)
    expect(r?.from).toBe('2026-10-01')
    expect(r?.toExclusive).toBe('2027-01-01')
  })
  it('last_year', () => {
    const r = periodForPreset('last_year', 2026)
    expect(r?.from).toBe('2025-01-01')
    expect(r?.toExclusive).toBe('2026-01-01')
  })
  it('custom returns null', () => {
    expect(periodForPreset('custom')).toBeNull()
  })
})

describe('formatDateEs', () => {
  it('formats DD/MM/YYYY', () => {
    expect(formatDateEs('2026-03-05')).toBe('05/03/2026')
    expect(formatDateEs('2026-12-31')).toBe('31/12/2026')
  })
})

describe('inclusiveEndLabel', () => {
  it('subtracts one day from exclusive bound', () => {
    expect(inclusiveEndLabel('2026-04-01')).toBe('31/03/2026')
    expect(inclusiveEndLabel('2027-01-01')).toBe('31/12/2026')
  })
})
