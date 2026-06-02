import Link from 'next/link'
import { Hammer } from 'lucide-react'
import { TierBadge } from './TierBadge'
import { FEATURE_LABEL, FEATURE_MIN_TIER, type FeatureKey } from '@/lib/features'

export function ComingSoon({ feature, description }: { feature: FeatureKey; description?: string }) {
  const minTier = FEATURE_MIN_TIER[feature]
  const label = FEATURE_LABEL[feature]
  return (
    <div className="max-w-2xl mx-auto px-6 py-20 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 mb-5">
        <Hammer className="text-amber-600 dark:text-amber-400" size={26} strokeWidth={1.75} />
      </div>
      <div className="mb-3 flex items-center justify-center gap-2">
        <TierBadge tier={minTier} />
        <span className="text-xs text-amber-700 dark:text-amber-300 font-medium uppercase tracking-wide">Próximamente</span>
      </div>
      <h1 className="text-2xl font-semibold text-ink mb-2">{label}</h1>
      <p className="text-ink-soft mb-8 max-w-md mx-auto">
        {description ??
          'Estamos construyendo esta funcionalidad. Ya está incluida en tu plan: te avisaremos por email cuando esté lista.'}
      </p>
      <Link
        href="/dashboard"
        className="inline-block border border-[color:var(--glass-border)] hover:bg-[color:var(--glass-border)] text-ink-soft hover:text-ink px-6 py-2.5 rounded-full font-medium text-sm"
      >
        Volver al panel
      </Link>
    </div>
  )
}
