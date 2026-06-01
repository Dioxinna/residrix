import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock Upstash modules so importing lib/ratelimit doesn't try to talk
// to a real Redis. We just need to confirm the no-op path is taken when
// env vars are missing.
vi.mock('@upstash/redis', () => ({ Redis: vi.fn() }))
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: Object.assign(vi.fn(), { slidingWindow: vi.fn() }),
}))

describe('lib/ratelimit (no-op fallback)', () => {
  const origUrl = process.env.UPSTASH_REDIS_REST_URL
  const origToken = process.env.UPSTASH_REDIS_REST_TOKEN

  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    vi.resetModules()
  })

  afterEach(() => {
    if (origUrl) process.env.UPSTASH_REDIS_REST_URL = origUrl
    else delete process.env.UPSTASH_REDIS_REST_URL
    if (origToken) process.env.UPSTASH_REDIS_REST_TOKEN = origToken
    else delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('checkRateLimit allows everything when env not set', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { checkRateLimit, RATE_LIMITS } = await import('./ratelimit')

    const res = await checkRateLimit(RATE_LIMITS.signupFirm, '1.2.3.4')
    expect(res.success).toBe(true)

    // Multiple calls all pass — no consumption happens in no-op mode.
    for (let i = 0; i < 10; i++) {
      const r = await checkRateLimit(RATE_LIMITS.signupFirm, '1.2.3.4')
      expect(r.success).toBe(true)
    }
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('rate limiting DESACTIVADO'),
    )
    warn.mockRestore()
  })

  it('ipFromRequest reads x-forwarded-for', async () => {
    const { ipFromRequest } = await import('./ratelimit')
    const req = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '203.0.113.5, 198.51.100.1' },
    })
    expect(ipFromRequest(req)).toBe('203.0.113.5')
  })

  it('ipFromRequest falls back to x-real-ip', async () => {
    const { ipFromRequest } = await import('./ratelimit')
    const req = new Request('https://example.com', {
      headers: { 'x-real-ip': '203.0.113.7' },
    })
    expect(ipFromRequest(req)).toBe('203.0.113.7')
  })

  it('ipFromRequest returns unknown sentinel as last resort', async () => {
    const { ipFromRequest } = await import('./ratelimit')
    const req = new Request('https://example.com')
    expect(ipFromRequest(req)).toBe('unknown')
  })

  it('rateLimited builds 429 with standard headers', async () => {
    const { rateLimited } = await import('./ratelimit')
    const res = rateLimited({
      success: false,
      limit: 5,
      remaining: 0,
      reset: Date.now() + 60000,
      retryAfterSeconds: 60,
    })
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('60')
    expect(res.headers.get('X-RateLimit-Limit')).toBe('5')
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0')
  })
})
