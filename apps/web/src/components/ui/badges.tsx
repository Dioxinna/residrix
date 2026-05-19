import { cn } from '@/lib/utils'
import type { IncidenceStatus, IncidenceUrgency } from '@residrix/types'

const urgencyConfig: Record<IncidenceUrgency, { label: string; className: string }> = {
  critical: { label: 'Crítica',  className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  high:     { label: 'Alta',     className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  medium:   { label: 'Media',    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  low:      { label: 'Baja',     className: 'bg-green-500/20 text-green-400 border-green-500/30' },
}

const statusConfig: Record<IncidenceStatus, { label: string; className: string }> = {
  open:             { label: 'Abierta',          className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  in_progress:      { label: 'En progreso',      className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  pending_neighbor: { label: 'Pdte. vecino',     className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  resolved:         { label: 'Resuelta',         className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  closed:           { label: 'Cerrada',          className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
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
