import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { firmHasFeature } from '@/lib/auth/feature-gate'
import { FeatureLock } from '@/components/feature-gate/FeatureLock'
import { LiquidacionPicker } from './_components/LiquidacionPicker'

export const metadata = { title: 'Liquidaciones · Residrix' }

export default async function LiquidacionesPage() {
  const allowed = await firmHasFeature('settlements')
  if (!allowed) {
    return (
      <FeatureLock
        feature="settlements"
        description="Informes de gastos por comunidad y periodo, exportables como PDF (vía impresión del navegador) y CSV listos para enviar a vecinos."
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
        <h1 className="text-2xl font-semibold text-ink mb-2">Liquidaciones</h1>
        <p className="text-ink-soft mb-6">
          Crea al menos una comunidad y registra algún gasto para poder generar liquidaciones.
        </p>
        <Link
          href="/comunidades"
          className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded"
        >
          Ir a Comunidades →
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-ink mb-1">Liquidaciones</h1>
      <p className="text-sm text-ink-soft mb-8">
        Genera el informe de gastos de una comunidad para el periodo que quieras. Guárdalo en PDF o CSV
        y envíaselo a los vecinos.
      </p>

      <LiquidacionPicker communities={communities} />
    </div>
  )
}
