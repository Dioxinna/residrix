import { ComingSoon } from '@/components/feature-gate/ComingSoon'
import { FeatureLock } from '@/components/feature-gate/FeatureLock'
import { firmHasFeature } from '@/lib/auth/feature-gate'

export const metadata = { title: 'Proveedores · Residrix' }

export default async function ProveedoresPage() {
  const allowed = await firmHasFeature('providers')
  if (!allowed) {
    return (
      <FeatureLock
        feature="providers"
        description="Directorio de proveedores con histórico de intervenciones, tarifas y asignación automática por categoría de incidencia."
      />
    )
  }
  return <ComingSoon feature="providers" />
}
