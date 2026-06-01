'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import type { NotificationPreferences } from '@residrix/types'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

type PrefKey = Exclude<keyof NotificationPreferences, 'user_id' | 'updated_at'>

const PUSH_ROWS: { key: PrefKey; label: string; description: string }[] = [
  { key: 'push_new_incidence', label: 'Nuevas incidencias', description: 'Cuando un vecino reporta una incidencia.' },
  { key: 'push_status_change', label: 'Cambios de estado', description: 'Cuando una incidencia cambia de estado.' },
  { key: 'push_new_message', label: 'Nuevos mensajes', description: 'Cuando hay un mensaje nuevo en el chat de una incidencia.' },
  { key: 'push_new_announcement', label: 'Comunicados', description: 'Cuando se publica un comunicado en una de tus comunidades.' },
]

const EMAIL_ROWS: { key: PrefKey; label: string; description: string }[] = [
  { key: 'email_new_incidence', label: 'Nuevas incidencias', description: 'Resumen por email al recibir una incidencia.' },
  { key: 'email_status_change', label: 'Cambios de estado', description: 'Email cuando cambia el estado de una incidencia tuya.' },
  { key: 'email_new_message', label: 'Nuevos mensajes', description: 'Email por cada mensaje nuevo (desactivado por defecto).' },
  { key: 'email_new_announcement', label: 'Comunicados', description: 'Email cuando se publica un comunicado.' },
]

export function NotificationPreferencesForm({ initial }: { initial: NotificationPreferences }) {
  const [prefs, setPrefs] = useState(initial)
  const [, startTransition] = useTransition()
  const supabase = createSupabaseBrowserClient()

  const toggle = (key: PrefKey) => {
    setPrefs((previous) => {
      const next = { ...previous, [key]: !previous[key] }
      startTransition(async () => {
        const { error } = await supabase
          .from('notification_preferences')
          .upsert({
            ...next,
            user_id: initial.user_id,
            updated_at: new Date().toISOString(),
          })
        if (error) {
          setPrefs(previous)
          toast.error('No se pudo guardar')
        }
      })
      return next
    })
  }

  return (
    <div className="space-y-8">
      <Section title="Notificaciones push" subtitle="Recibirás estas notificaciones en la app móvil.">
        {PUSH_ROWS.map((row) => (
          <ToggleRow
            key={row.key}
            label={row.label}
            description={row.description}
            checked={prefs[row.key]}
            onChange={() => toggle(row.key)}
          />
        ))}
      </Section>

      <Section title="Correo electrónico" subtitle="Notificaciones enviadas a tu email.">
        {EMAIL_ROWS.map((row) => (
          <ToggleRow
            key={row.key}
            label={row.label}
            description={row.description}
            checked={prefs[row.key]}
            onChange={() => toggle(row.key)}
          />
        ))}
      </Section>
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-ink mb-1">{title}</h2>
      <p className="text-xs text-ink-faint mb-3">{subtitle}</p>
      <div className="glass rounded-lg divide-y divide-[color:var(--glass-border)]">
        {children}
      </div>
    </section>
  )
}

interface ToggleRowProps {
  label: string
  description: string
  checked: boolean
  onChange: () => void
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <label className="flex items-center justify-between gap-4 px-4 py-3 cursor-pointer">
      <div className="flex-1">
        <p className="text-sm text-ink">{label}</p>
        <p className="text-xs text-ink-faint mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors ${
          checked ? 'bg-indigo-600' : 'bg-zinc-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out my-0.5 ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  )
}
