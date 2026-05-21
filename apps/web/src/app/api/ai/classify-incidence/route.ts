import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { resolveAIProvider, type AIClassifyOutput } from '@/lib/ai'
import { tierIncludes } from '@/lib/features'
import type { TierKey } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: { incidenceId: string; description: string; photoUrl?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { incidenceId, description } = body
  if (!incidenceId || !description) {
    return Response.json(
      { error: 'incidenceId and description are required' },
      { status: 400 },
    )
  }

  const supabase = createSupabaseServiceClient()

  const { data: incidence, error: incErr } = await supabase
    .from('incidences')
    .select('id, community_id, communities!inner(firm_id)')
    .eq('id', incidenceId)
    .single()
  if (incErr || !incidence) {
    return Response.json({ error: 'Incidence not found' }, { status: 404 })
  }
  const firmId = (incidence.communities as { firm_id: string }).firm_id

  const { data: firm } = await supabase
    .from('firms')
    .select('plan, subscription_status, ai_assistant_enabled')
    .eq('id', firmId)
    .single()

  const status = firm?.subscription_status
  const isActive = status === 'active' || status === 'trialing'
  const tier = (isActive ? (firm?.plan ?? 'base') : 'base') as TierKey
  const aiEnabled = tierIncludes(tier, 'ai_assistant') && firm?.ai_assistant_enabled !== false

  if (!aiEnabled) {
    return Response.json({
      skipped: true,
      reason: tierIncludes(tier, 'ai_assistant') ? 'toggle_off' : 'tier_insufficient',
    })
  }

  const provider = resolveAIProvider()
  if (!provider) {
    console.error('[classify-incidence] no AI provider configured')
    return Response.json({ error: 'No AI provider configured' }, { status: 503 })
  }

  let result: AIClassifyOutput
  try {
    result = await provider.classifyIncidence({ description })
  } catch (err) {
    console.error(`[classify-incidence] ${provider.name} failed:`, err)
    return Response.json({ error: 'AI classification failed' }, { status: 502 })
  }

  const { error: updateError } = await supabase
    .from('incidences')
    .update({
      urgency: result.urgency,
      category: result.category,
      ai_summary: result.summary || null,
      ai_response: result.suggested_response || null,
      ai_group_key: sanitizeSlug(result.group_key),
      ai_suggested_provider: result.suggested_provider ?? null,
      status: result.urgency === 'critical' ? 'in_progress' : 'open',
    })
    .eq('id', incidenceId)

  if (updateError) {
    console.error('[classify-incidence] supabase update failed:', updateError)
    return Response.json({ error: 'Failed to update incidence' }, { status: 500 })
  }

  return Response.json({ ...result, provider: provider.name })
}

function sanitizeSlug(value: string | null | undefined): string | null {
  if (!value) return null
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
  return slug || null
}
