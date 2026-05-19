'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Community {
  id: string
  name: string
}

export function InviteForm({ communities }: { communities: Community[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [unitNumber, setUnitNumber] = useState('')
  const [communityId, setCommunityId] = useState(communities[0]?.id ?? '')
  const [role, setRole] = useState<'neighbor' | 'tenant' | 'president'>('neighbor')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!communityId || !email || !unitNumber) return

    startTransition(async () => {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          community_id: communityId,
          email,
          full_name: fullName || undefined,
          unit_number: unitNumber,
          role,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body.error ?? 'No se pudo crear la invitación')
        return
      }
      if (body.warning) {
        toast.warning(body.warning)
      } else {
        toast.success(`Invitación enviada a ${email}`)
      }
      setEmail('')
      setFullName('')
      setUnitNumber('')
      router.refresh()
    })
  }

  if (communities.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-400">
        Crea primero una comunidad para poder invitar vecinos.
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
      <Field label="Comunidad" className="md:col-span-2">
        <select
          value={communityId}
          onChange={(e) => setCommunityId(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white"
        >
          {communities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Email del vecino" className="md:col-span-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vecino@ejemplo.com"
          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600"
        />
      </Field>

      <Field label="Nombre (opcional)" className="md:col-span-2">
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="María García"
          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600"
        />
      </Field>

      <Field label="Piso/puerta">
        <input
          type="text"
          required
          value={unitNumber}
          onChange={(e) => setUnitNumber(e.target.value)}
          placeholder="3ºB"
          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600"
        />
      </Field>

      <Field label="Rol" className="md:col-span-1">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as 'neighbor' | 'tenant' | 'president')}
          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white"
        >
          <option value="neighbor">Vecino</option>
          <option value="tenant">Inquilino</option>
          <option value="president">Presidente</option>
        </select>
      </Field>

      <div className="md:col-span-4 flex items-end">
        <button
          type="submit"
          disabled={pending}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded"
        >
          {pending ? 'Enviando…' : 'Enviar invitación'}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className="block text-xs text-zinc-400 mb-1">{label}</span>
      {children}
    </label>
  )
}
