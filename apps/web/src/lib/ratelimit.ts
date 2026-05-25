// Rate limiting con Upstash Redis. Si las env vars no están
// configuradas, devuelve un noop (siempre allow) y loggea una vez al
// arrancar el módulo. Esto permite desplegar la feature antes de
// provisionar Upstash y activarla solo subiendo las dos env vars.
//
// Provisión: https://upstash.com (free tier 500K cmds/mes). Tras crear
// la DB Redis, copia REST URL y REST TOKEN a:
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
// y sincroniza con `pnpm vercel:env:sync production`.

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

let redis: Redis | null = null
let warned = false

function getRedis(): Redis | null {
  if (redis) return redis
  if (!url || !token) {
    if (!warned) {
      warned = true
      console.warn(
        '[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN no configuradas — rate limiting DESACTIVADO. Provisiona Upstash para activarlo.',
      )
    }
    return null
  }
  redis = new Redis({ url, token })
  return redis
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number          // unix ms cuando el bucket se rellena
  retryAfterSeconds: number
}

const ALLOWED: RateLimitResult = {
  success: true,
  limit: 0,
  remaining: 0,
  reset: 0,
  retryAfterSeconds: 0,
}

interface LimiterSpec {
  // requests permitidos
  requests: number
  // ventana sliding: '15 m', '1 h', '24 h', etc.
  window: `${number} ${'s' | 'm' | 'h' | 'd'}`
  // prefijo para las keys en Redis (debe ser único por limiter)
  prefix: string
}

const limiterCache = new Map<string, Ratelimit>()

function getLimiter(spec: LimiterSpec): Ratelimit | null {
  const r = getRedis()
  if (!r) return null
  const cacheKey = `${spec.prefix}:${spec.requests}:${spec.window}`
  const existing = limiterCache.get(cacheKey)
  if (existing) return existing
  const limiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(spec.requests, spec.window),
    analytics: true,
    prefix: `rl:${spec.prefix}`,
  })
  limiterCache.set(cacheKey, limiter)
  return limiter
}

export async function checkRateLimit(
  spec: LimiterSpec,
  identifier: string,
): Promise<RateLimitResult> {
  const limiter = getLimiter(spec)
  if (!limiter) return ALLOWED
  const res = await limiter.limit(identifier)
  return {
    success: res.success,
    limit: res.limit,
    remaining: res.remaining,
    reset: res.reset,
    retryAfterSeconds: Math.max(0, Math.ceil((res.reset - Date.now()) / 1000)),
  }
}

/**
 * Extrae el identificador IP del request. Vercel pone la IP real en
 * `x-forwarded-for` (primer valor del header, separados por coma).
 * Fallback a un sentinel para evitar coalescer todos los anónimos en
 * la misma key.
 */
export function ipFromRequest(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const real = request.headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}

/**
 * Construye una respuesta 429 estándar con headers RateLimit-*.
 */
export function rateLimited(result: RateLimitResult, message?: string): Response {
  return Response.json(
    {
      error: message ?? 'Demasiadas solicitudes. Inténtalo más tarde.',
      retryAfterSeconds: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSeconds),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.floor(result.reset / 1000)),
      },
    },
  )
}

// Specs predefinidos para los endpoints que protegemos.
export const RATE_LIMITS = {
  signupFirm: { requests: 5, window: '15 m', prefix: 'signup-firm' } satisfies LimiterSpec,
  signupInvitation: { requests: 5, window: '15 m', prefix: 'signup-inv' } satisfies LimiterSpec,
  createInvitation: { requests: 30, window: '1 h', prefix: 'create-inv' } satisfies LimiterSpec,
} as const
