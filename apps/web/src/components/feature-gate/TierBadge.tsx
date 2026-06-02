import type { TierKey } from '@/lib/stripe'
import { TIER_NAME } from '@/lib/features'

const STYLES: Record<TierKey, string> = {
  base: 'bg-[color:var(--glass-border)] text-ink-soft',
  pro: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/40',
  total: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40',
}

export function TierBadge({ tier, className = '' }: { tier: TierKey; className?: string }) {
  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${STYLES[tier]} ${className}`}
    >
      {TIER_NAME[tier]}
    </span>
  )
}
