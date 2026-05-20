import type { TierKey } from './stripe'

export type FeatureKey =
  | 'incidents'
  | 'documents'
  | 'announcements'
  | 'mobile_app'
  | 'expenses'
  | 'ai_assistant'
  | 'providers'
  | 'settlements'
  | 'meeting_transcripts'
  | 'auto_reports'
  | 'priority_support'

export const FEATURE_MIN_TIER: Record<FeatureKey, TierKey> = {
  incidents: 'base',
  documents: 'base',
  announcements: 'base',
  mobile_app: 'base',
  expenses: 'base',
  ai_assistant: 'pro',
  providers: 'pro',
  settlements: 'pro',
  meeting_transcripts: 'total',
  auto_reports: 'total',
  priority_support: 'total',
}

export const FEATURE_LABEL: Record<FeatureKey, string> = {
  incidents: 'Gestión de incidencias',
  documents: 'Documentación compartida',
  announcements: 'Comunicados',
  mobile_app: 'App para vecinos',
  expenses: 'Gastos básicos',
  ai_assistant: 'Agente IA de incidencias',
  providers: 'Gestión de proveedores',
  settlements: 'Liquidaciones',
  meeting_transcripts: 'Transcripción de juntas',
  auto_reports: 'Informes automáticos',
  priority_support: 'Soporte prioritario',
}

export const TIER_RANK: Record<TierKey, number> = { base: 0, pro: 1, total: 2 }
export const TIER_NAME: Record<TierKey, string> = { base: 'Base', pro: 'Pro', total: 'Total' }

export function tierIncludes(tier: TierKey, feature: FeatureKey): boolean {
  return TIER_RANK[tier] >= TIER_RANK[FEATURE_MIN_TIER[feature]]
}

export function featuresForTier(tier: TierKey): FeatureKey[] {
  return (Object.keys(FEATURE_MIN_TIER) as FeatureKey[]).filter((f) => tierIncludes(tier, f))
}
