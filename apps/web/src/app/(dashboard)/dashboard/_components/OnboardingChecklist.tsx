'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Circle, X, type LucideIcon, Building2, Mail, Megaphone } from 'lucide-react'

interface Step {
  id: string
  label: string
  description: string
  done: boolean
  href: string
  cta: string
  icon: LucideIcon
}

interface Props {
  hasCommunity: boolean
  hasInvitation: boolean
  hasAnnouncement: boolean
}

const STORAGE_KEY = 'residrix.onboarding.dismissed'

export function OnboardingChecklist({ hasCommunity, hasInvitation, hasAnnouncement }: Props) {
  const [dismissed, setDismissed] = useState<boolean | null>(null)

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === '1')
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setDismissed(true)
  }

  const steps: Step[] = [
    {
      id: 'community',
      label: 'Crea tu primera comunidad',
      description: 'Define el edificio o conjunto que vas a gestionar (nombre, dirección, unidades).',
      done: hasCommunity,
      href: '/comunidades',
      cta: 'Crear comunidad',
      icon: Building2,
    },
    {
      id: 'invitation',
      label: 'Invita a tu primer vecino',
      description: 'Le llegará un email con un código para registrarse en la app móvil.',
      done: hasInvitation,
      href: '/vecinos',
      cta: 'Enviar invitación',
      icon: Mail,
    },
    {
      id: 'announcement',
      label: 'Publica un comunicado',
      description: 'Un aviso de bienvenida, una junta o cualquier información para la comunidad.',
      done: hasAnnouncement,
      href: '/comunicados',
      cta: 'Nuevo comunicado',
      icon: Megaphone,
    },
  ]

  const allDone = steps.every((s) => s.done)
  if (allDone || dismissed === null || dismissed) return null

  const completed = steps.filter((s) => s.done).length
  const next = steps.find((s) => !s.done)

  return (
    <section className="mb-8 glass rounded-[var(--radius-glass)] p-6 relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10 opacity-70"
        style={{ background: 'radial-gradient(120% 100% at 0% 0%, rgba(99,102,241,0.14), transparent 55%)' }}
        aria-hidden
      />
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-ink font-semibold text-lg mb-1">Configura tu despacho</h2>
          <p className="text-ink-soft text-sm">
            {completed} de {steps.length} completados · te lleva ~5 minutos
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar"
          className="text-ink-faint hover:text-ink-soft -mt-1 -mr-1 p-1"
        >
          <X size={16} />
        </button>
      </div>

      <div className="h-1.5 rounded-full overflow-hidden mb-5 bg-[color:var(--glass-border)]">
        <div
          className="h-full bg-brand transition-all rounded-full"
          style={{ width: `${(completed / steps.length) * 100}%` }}
        />
      </div>

      <ul className="space-y-2">
        {steps.map((step) => {
          const Icon = step.icon
          const isNext = !step.done && step.id === next?.id
          return (
            <li
              key={step.id}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors ${
                step.done
                  ? 'border-transparent bg-[color:var(--glass-border)] opacity-70'
                  : isNext
                    ? 'border-brand/30 bg-brand/8'
                    : 'border-[color:var(--glass-border)] bg-transparent'
              }`}
            >
              <div className="flex-shrink-0">
                {step.done ? (
                  <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center">
                    <Check size={14} strokeWidth={3} className="text-white" />
                  </div>
                ) : (
                  <Circle size={24} strokeWidth={1.5} className="text-ink-faint" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm ${step.done ? 'text-ink-soft line-through' : 'text-ink'}`}>
                  {step.label}
                </div>
                <div className="text-xs text-ink-faint mt-0.5">{step.description}</div>
              </div>
              {!step.done && (
                <Link
                  href={step.href}
                  className={`flex-shrink-0 text-sm font-medium px-3 py-1.5 rounded flex items-center gap-1.5 ${
                    isNext
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      : 'text-ink-soft hover:text-ink border border-[color:var(--glass-border)] hover:border-[color:var(--glass-border)]'
                  }`}
                >
                  <Icon size={14} />
                  {step.cta}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
