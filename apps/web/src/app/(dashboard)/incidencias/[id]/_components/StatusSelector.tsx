'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { IncidenceStatus } from '@residrix/types'

const statusOptions: { value: IncidenceStatus; label: string }[] = [
  { value: 'open',             label: 'Abierta' },
  { value: 'in_progress',      label: 'En progreso' },
  { value: 'pending_neighbor', label: 'Pendiente vecino' },
  { value: 'resolved',         label: 'Resuelta' },
  { value: 'closed',           label: 'Cerrada' },
]

interface Props {
  incidenceId: string
  currentStatus: IncidenceStatus
}

export function StatusSelector({ incidenceId, currentStatus }: Props) {
  const [status, setStatus] = useState<IncidenceStatus>(currentStatus)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleChange(newStatus: IncidenceStatus) {
    setStatus(newStatus)
    setSaving(true)
    const supabase = createSupabaseBrowserClient()
    const update: { status: IncidenceStatus; resolved_at?: string } = { status: newStatus }
    if (newStatus === 'resolved') update.resolved_at = new Date().toISOString()
    const { error } = await supabase.from('incidences').update(update).eq('id', incidenceId)
    setSaving(false)
    if (error) { toast.error('Error al actualizar el estado'); return }
    toast.success('Estado actualizado')
    router.refresh()
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value as IncidenceStatus)}
      disabled={saving}
      className="w-full glass-strong border border-[color:var(--glass-border)] text-ink-soft text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
    >
      {statusOptions.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
