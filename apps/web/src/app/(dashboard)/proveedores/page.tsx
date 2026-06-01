import { redirect } from 'next/navigation'
import { firmHasFeature } from '@/lib/auth/feature-gate'
import { FeatureLock } from '@/components/feature-gate/FeatureLock'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ProviderDialog } from './_components/ProviderDialog'
import { ProvidersTable } from './_components/ProvidersTable'

export const metadata = { title: 'Proveedores · Residrix' }

export default async function ProveedoresPage() {
  const allowed = await firmHasFeature('providers')
  if (!allowed) {
    return (
      <FeatureLock
        feature="providers"
        description="Directorio de proveedores con histórico de intervenciones, asignación automática por categoría de incidencia y CTAs directos para llamar o enviar email."
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

  const { data: providers } = await supabase
    .from('providers')
    .select('id, name, provider_type, contact_name, phone, email, notes, created_at')
    .eq('firm_id', profile.firm_id)
    .order('name')

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold text-ink">Proveedores</h1>
        <ProviderDialog firmId={profile.firm_id} mode="create" trigger="Nuevo proveedor" />
      </div>
      <p className="text-sm text-ink-soft mb-8">
        Contactos por tipo de servicio. El Agente IA sugerirá automáticamente cuál llamar cuando llegue una incidencia.
      </p>

      <ProvidersTable providers={providers ?? []} firmId={profile.firm_id} />
    </div>
  )
}
