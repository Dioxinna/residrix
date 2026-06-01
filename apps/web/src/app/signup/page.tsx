'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [firmName, setFirmName] = useState('')
  const [firmPhone, setFirmPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }

    startTransition(async () => {
      const res = await fetch('/api/auth/signup-firm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firm_name: firmName,
          firm_phone: firmPhone || undefined,
          full_name: fullName,
          email,
          password,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body.error ?? 'No se pudo completar el registro')
        return
      }

      const supabase = createSupabaseBrowserClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        toast.success('Cuenta creada. Inicia sesión con tu email y contraseña.')
        router.replace('/login')
        return
      }
      toast.success('¡Bienvenido a Residrix!')
      router.replace('/')
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/brand/logo.png" alt="Residrix" width={220} height={220} priority className="mx-auto h-28 w-auto object-contain mb-2" />
          <p className="text-ink-soft text-sm">Crea tu cuenta de despacho</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass rounded-2xl p-6 border border-[color:var(--glass-border)] space-y-4"
        >
          <Section title="Tu despacho">
            <Field label="Nombre del despacho">
              <input
                type="text"
                required
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                placeholder="Administraciones García"
                className="w-full glass-strong border border-[color:var(--glass-border)] rounded-lg px-3 py-2.5 text-ink placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </Field>
            <Field label="Teléfono (opcional)">
              <input
                type="tel"
                value={firmPhone}
                onChange={(e) => setFirmPhone(e.target.value)}
                placeholder="+34 600 000 000"
                className="w-full glass-strong border border-[color:var(--glass-border)] rounded-lg px-3 py-2.5 text-ink placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </Field>
          </Section>

          <Section title="Tu cuenta de administrador">
            <Field label="Tu nombre">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ana García"
                className="w-full glass-strong border border-[color:var(--glass-border)] rounded-lg px-3 py-2.5 text-ink placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@despacho.es"
                className="w-full glass-strong border border-[color:var(--glass-border)] rounded-lg px-3 py-2.5 text-ink placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </Field>
            <Field label="Contraseña (mínimo 8 caracteres)">
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full glass-strong border border-[color:var(--glass-border)] rounded-lg px-3 py-2.5 text-ink placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </Field>
          </Section>

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
          >
            {pending ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>

          <p className="text-center text-xs text-ink-faint">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs text-ink-faint uppercase tracking-wide font-medium">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink-soft mb-1.5">{label}</span>
      {children}
    </label>
  )
}
