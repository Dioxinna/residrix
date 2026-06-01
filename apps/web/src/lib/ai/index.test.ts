import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resolveAIProvider } from './index'

const ENV_KEYS = ['AI_PROVIDER', 'ANTHROPIC_API_KEY', 'GROQ_API_KEY'] as const

describe('resolveAIProvider', () => {
  const saved: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k]
      delete process.env[k]
    }
  })
  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    }
  })

  it('returns null when no key configured', () => {
    expect(resolveAIProvider()).toBeNull()
  })

  it('honors AI_PROVIDER=anthropic when its key exists', () => {
    process.env.AI_PROVIDER = 'anthropic'
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test'
    expect(resolveAIProvider()?.name).toBe('anthropic')
  })

  it('honors AI_PROVIDER=groq when its key exists', () => {
    process.env.AI_PROVIDER = 'groq'
    process.env.GROQ_API_KEY = 'gsk-test'
    expect(resolveAIProvider()?.name).toBe('groq')
  })

  it('falls back to the available key when AI_PROVIDER unset', () => {
    process.env.GROQ_API_KEY = 'gsk-test'
    expect(resolveAIProvider()?.name).toBe('groq')
  })

  it('falls back to the other provider when requested one lacks a key', () => {
    process.env.AI_PROVIDER = 'anthropic' // requested but no anthropic key
    process.env.GROQ_API_KEY = 'gsk-test'
    expect(resolveAIProvider()?.name).toBe('groq')
  })

  it('prefers anthropic when both keys present and no explicit selector', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test'
    process.env.GROQ_API_KEY = 'gsk-test'
    expect(resolveAIProvider()?.name).toBe('anthropic')
  })
})
