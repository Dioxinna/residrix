import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })
  it('dedupes conflicting tailwind classes (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })
  it('drops falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b')
  })
  it('handles conditional object syntax', () => {
    expect(cn('base', { active: true, hidden: false })).toBe('base active')
  })
})
