import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BarChart3 } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { firmHasFeature } from '@/lib/auth/feature-gate'
import { FeatureLock } from '@/components/feature-gate/FeatureLock'
import { InformePicker } from './_components/InformePicker'

export const metadata = { title: 'Informes · Residrix' }

export default async function InformesPage() {
  const allowed = await firmHasFeature('auto_reports')
  if (!allowed) {
    return (
      <FeatureLock
        feature="auto_reports"
        description="Informes mensuales completos por comunidad: incidencias, gastos, satisfacción y comparativas. PDF listo para enviar."
      />
    )
  }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, firm_id')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin' || !profile.firm_id) {
    return (
      <div className="px-6 py-10">
        <p className="text-ink-soft text-sm">Esta página es solo para administradores.</p>
      </div>
    )
  }

  const { data: communities } = await supabase
    .from('communities')
    .select('id, name')
    .eq('firm_id', profile.firm_id)
    .order('name')

  if (!communities || communities.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-ink mb-2">Informes</h1>
        <p className="text-ink-soft mb-6">
          Necesitas al menos una comunidad para generar informes.
        </p>
        <Link
          href="/comunidades"
          className="inline-block bg-brand hover:bg-brand-soft text-white text-sm font-medium px-4 py-2 rounded"
        >
          Ir a Comunidades →
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
          <BarChart3 size={18} className="text-amber-600 dark:text-amber-400" strokeWidth={1.75} />
        </div>
        <h1 className="text-2xl font-semibold text-ink">Informes mensuales</h1>
      </div>
      <p className="text-sm text-ink-soft mb-8">
        Resumen ejecutivo del mes por comunidad: incidencias, gastos, comparativas vs mes anterior. Guarda como
        PDF y envíalo al presidente.
      </p>

      <InformePicker communities={communities} />

      <p className="text-xs text-ink-faint mt-6">
        El envío automático mensual por email llegará en una próxima versión. Por ahora generas el informe
        cuando lo necesites.
      </p>
    </div>
  )
}
