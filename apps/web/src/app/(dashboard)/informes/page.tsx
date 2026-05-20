import { ComingSoon } from '@/components/feature-gate/ComingSoon'
import { FeatureLock } from '@/components/feature-gate/FeatureLock'
import { firmHasFeature } from '@/lib/auth/feature-gate'

export const metadata = { title: 'Informes · Residrix' }

export default async function InformesPage() {
  const allowed = await firmHasFeature('auto_reports')
  if (!allowed) {
    return (
      <FeatureLock
        feature="auto_reports"
        description="Informes mensuales automáticos por comunidad: incidencias, gastos, satisfacción y comparativas. PDF listo para enviar."
      />
    )
  }
  return <ComingSoon feature="auto_reports" />
}
