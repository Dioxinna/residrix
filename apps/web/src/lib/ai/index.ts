import type { AIProvider, AIProviderName } from './types'
import { anthropicProvider } from './anthropic'
import { groqProvider } from './groq'

export * from './types'

/**
 * Resuelve qué proveedor de IA usar.
 *
 * Prioridad:
 *   1. AI_PROVIDER env (si está definido y tiene su key correspondiente)
 *   2. Fallback al otro provider si su key existe
 *   3. null si ninguno está configurado
 */
export function resolveAIProvider(): AIProvider | null {
  const requested = (process.env.AI_PROVIDER ?? '').toLowerCase() as AIProviderName | ''
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY
  const hasGroq = !!process.env.GROQ_API_KEY

  if (requested === 'anthropic' && hasAnthropic) return anthropicProvider
  if (requested === 'groq' && hasGroq) return groqProvider
  if (hasAnthropic) return anthropicProvider
  if (hasGroq) return groqProvider
  return null
}
