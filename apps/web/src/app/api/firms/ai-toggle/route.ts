import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { tierIncludes } from '@/lib/features'
import type { TierKey } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, firm_id')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin' || !profile.firm_id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { enabled?: boolean }
  try {
    body = (await request.json()) as { enabled?: boolean }
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (typeof body.enabled !== 'boolean') {
    return Response.json({ error: 'enabled boolean required' }, { status: 400 })
  }

  const service = createSupabaseServiceClient()
  const { data: firm } = await service
    .from('firms')
    .select('plan, subscription_status')
    .eq('id', profile.firm_id)
    .single()

  const isActive = firm?.subscription_status === 'active' || firm?.subscription_status === 'trialing'
  const tier = (isActive ? (firm?.plan ?? 'base') : 'base') as TierKey
  if (!tierIncludes(tier, 'ai_assistant')) {
    return Response.json({ error: 'AI assistant requires Pro tier' }, { status: 402 })
  }

  const { error } = await service
    .from('firms')
    .update({ ai_assistant_enabled: body.enabled })
    .eq('id', profile.firm_id)
  if (error) {
    console.error('[ai-toggle] update failed:', error)
    return Response.json({ error: 'Update failed' }, { status: 500 })
  }
  return Response.json({ ok: true, enabled: body.enabled })
}
