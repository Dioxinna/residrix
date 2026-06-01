'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    router.replace('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/brand/logo.png" alt="Residrix" width={220} height={220} priority className="mx-auto h-28 w-auto object-contain mb-2" />
          <p className="text-ink-soft text-sm">Panel de administración</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 border border-[color:var(--glass-border)] space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@despacho.es"
              className="w-full glass-strong border border-[color:var(--glass-border)] rounded-lg px-3 py-2.5 text-ink placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1.5">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full glass-strong border border-[color:var(--glass-border)] rounded-lg px-3 py-2.5 text-ink placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>

          <p className="text-center text-xs text-ink-faint">
            ¿Aún no tienes cuenta?{' '}
            <Link href="/signup" className="text-violet-400 hover:text-violet-300">
              Regístrate
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
