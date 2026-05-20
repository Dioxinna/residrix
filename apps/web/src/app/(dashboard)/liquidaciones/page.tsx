import { ComingSoon } from '@/components/feature-gate/ComingSoon'
import { FeatureLock } from '@/components/feature-gate/FeatureLock'
import { firmHasFeature } from '@/lib/auth/feature-gate'

export const metadata = { title: 'Liquidaciones · Residrix' }

export default async function LiquidacionesPage() {
  const allowed = await firmHasFeature('settlements')
  if (!allowed) {
    return (
      <FeatureLock
        feature="settlements"
        description="Cierres periódicos de gastos por comunidad con reparto por coeficiente y exportación PDF/CSV lista para presentar."
      />
    )
  }
  return <ComingSoon feature="settlements" />
}
