import Link from 'next/link'
import { Lock } from 'lucide-react'
import { TierBadge } from './TierBadge'
import { FEATURE_LABEL, FEATURE_MIN_TIER, TIER_NAME, type FeatureKey } from '@/lib/features'

export function FeatureLock({ feature, description }: { feature: FeatureKey; description?: string }) {
  const minTier = FEATURE_MIN_TIER[feature]
  const label = FEATURE_LABEL[feature]
  return (
    <div className="max-w-2xl mx-auto px-6 py-20 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/30 mb-5">
        <Lock className="text-violet-400" size={26} strokeWidth={1.75} />
      </div>
      <div className="mb-3 flex items-center justify-center gap-2">
        <TierBadge tier={minTier} />
        <span className="text-xs text-zinc-500">o superior</span>
      </div>
      <h1 className="text-2xl font-semibold text-white mb-2">{label}</h1>
      <p className="text-zinc-400 mb-8 max-w-md mx-auto">
        {description ?? `Esta funcionalidad está incluida en el plan ${TIER_NAME[minTier]}. Súbete cuando quieras.`}
      </p>
      <Link
        href={`/billing?upgrade=${feature}`}
        className="inline-block bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-lg font-medium text-sm"
      >
        Ver planes →
      </Link>
    </div>
  )
}
