import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

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
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-sm text-zinc-500 text-center">
        Aún no has enviado ninguna invitación.
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-zinc-950 text-zinc-500 text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Email</th>
            <th className="text-left px-4 py-3 font-medium">Comunidad · Piso</th>
            <th className="text-left px-4 py-3 font-medium">Código</th>
            <th className="text-left px-4 py-3 font-medium">Estado</th>
            <th className="text-left px-4 py-3 font-medium">Enviada</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {invitations.map((inv) => {
            const used = !!inv.used_at
            const expired = !used && inv.expires_at && new Date(inv.expires_at) < new Date()
            const statusLabel = used ? 'Usada' : expired ? 'Caducada' : 'Pendiente'
            const statusColor = used
              ? 'text-emerald-400 bg-emerald-500/10'
              : expired
              ? 'text-zinc-500 bg-zinc-500/10'
              : 'text-amber-400 bg-amber-500/10'
            return (
              <tr key={inv.id} className="text-zinc-300">
                <td className="px-4 py-3">{inv.email ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="text-white">{communityName(inv.communities)}</span>
                  <span className="text-zinc-500"> · {inv.unit_number}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{inv.code}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>{statusLabel}</span>
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">
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
