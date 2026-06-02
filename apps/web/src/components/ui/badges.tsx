import { cn } from '@/lib/utils'
import type { IncidenceStatus, IncidenceUrgency } from '@residrix/types'

// Theme-aware: text shades hit AA on the light base (-700) and on dark (-300).
const urgencyConfig: Record<IncidenceUrgency, { label: string; className: string }> = {
  critical: { label: 'Crítica',  className: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30' },
  high:     { label: 'Alta',     className: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30' },
  medium:   { label: 'Media',    className: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30' },
  low:      { label: 'Baja',     className: 'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30' },
}

const statusConfig: Record<IncidenceStatus, { label: string; className: string }> = {
  open:             { label: 'Abierta',          className: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30' },
  in_progress:      { label: 'En progreso',      className: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30' },
  pending_neighbor: { label: 'Pdte. vecino',     className: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30' },
  resolved:         { label: 'Resuelta',         className: 'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30' },
  closed:           { label: 'Cerrada',          className: 'bg-[color:var(--glass-border)] text-ink-soft border-[color:var(--glass-border)]' },
}

interface BadgeProps {
  className?: string
}

export function UrgencyBadge({ urgency, className }: BadgeProps & { urgency: IncidenceUrgency }) {
  const config = urgencyConfig[urgency]
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border', config.className, className)}>
      {config.label}
    </span>
  )
}

export function StatusBadge({ status, className }: BadgeProps & { status: IncidenceStatus }) {
  const config = statusConfig[status]
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border', config.className, className)}>
      {config.label}
    </span>
  )
}
