import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Mail } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

interface Invitation {
  id: string
  email: string | null
  unit_number: string
  code: string
  used_at: string | null
  expires_at: string | null
  created_at: string | null
  communities: { name: string } | { name: string }[] | null
}

function communityName(c: Invitation['communities']): string {
  if (!c) return '—'
  return Array.isArray(c) ? c[0]?.name ?? '—' : c.name
}

export function InvitationsTable({ invitations }: { invitations: Invitation[] }) {
  if (invitations.length === 0) {
    return (
      <EmptyState
        icon={Mail}
        title="Sin invitaciones enviadas"
        description="Cuando envíes códigos a los vecinos aparecerán aquí con su estado (pendiente, usada, caducada)."
      />
    )
  }

  return (
    <div className="bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-[color:var(--c-surface)] text-ink-faint text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Email</th>
            <th className="text-left px-4 py-3 font-medium">Comunidad · Piso</th>
            <th className="text-left px-4 py-3 font-medium">Código</th>
            <th className="text-left px-4 py-3 font-medium">Estado</th>
            <th className="text-left px-4 py-3 font-medium">Enviada</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:var(--glass-border)]">
          {invitations.map((inv) => {
            const used = !!inv.used_at
            const expired = !used && inv.expires_at && new Date(inv.expires_at) < new Date()
            const statusLabel = used ? 'Usada' : expired ? 'Caducada' : 'Pendiente'
            const statusColor = used
              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10'
              : expired
              ? 'text-ink-faint bg-[color:var(--glass-border)]'
              : 'text-amber-700 dark:text-amber-300 bg-amber-500/10'
            return (
              <tr key={inv.id} className="text-ink-soft">
                <td className="px-4 py-3">{inv.email ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="text-ink">{communityName(inv.communities)}</span>
                  <span className="text-ink-faint"> · {inv.unit_number}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{inv.code}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>{statusLabel}</span>
                </td>
                <td className="px-4 py-3 text-ink-faint text-xs">
                  {inv.created_at
                    ? formatDistanceToNow(new Date(inv.created_at), { addSuffix: true, locale: es })
                    : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
