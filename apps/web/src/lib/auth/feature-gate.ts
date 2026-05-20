import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { tierIncludes, type FeatureKey } from '@/lib/features'
import type { TierKey } from '@/lib/stripe'

export interface FirmTierState {
  tier: TierKey
  rawPlan: TierKey
  isActive: boolean
  firmId: string
}

export async function getCurrentFirmTier(): Promise<FirmTierState | null> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('firm_id')
    .eq('id', user.id)
    .single()
  if (!profile?.firm_id) return null

  const { data: firm } = await supabase
    .from('firms')
    .select('plan, subscription_status')
    .eq('id', profile.firm_id)
    .single()

  const rawPlan = (firm?.plan ?? 'base') as TierKey
  const status = firm?.subscription_status ?? null
  const isActive = status === 'active' || status === 'trialing'
  const tier: TierKey = isActive ? rawPlan : 'base'

  return { tier, rawPlan, isActive, firmId: profile.firm_id }
}

export async function firmHasFeature(feature: FeatureKey): Promise<boolean> {
  const state = await getCurrentFirmTier()
  if (!state) return false
  return tierIncludes(state.tier, feature)
}

export async function requireFeature(feature: FeatureKey): Promise<FirmTierState> {
  const state = await getCurrentFirmTier()
  if (!state) redirect('/login')
  if (!tierIncludes(state.tier, feature)) {
    redirect(`/billing?upgrade=${feature}`)
  }
  return state
}
