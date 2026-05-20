import { ComingSoon } from '@/components/feature-gate/ComingSoon'
import { FeatureLock } from '@/components/feature-gate/FeatureLock'
import { firmHasFeature } from '@/lib/auth/feature-gate'

export const metadata = { title: 'Gastos · Residrix' }

export default async function GastosPage() {
  const allowed = await firmHasFeature('expenses')
  if (!allowed) return <FeatureLock feature="expenses" />
  return (
    <ComingSoon
      feature="expenses"
      description="Registro de gastos por comunidad con totales mensuales y categorías. Disponible muy pronto en tu plan."
    />
  )
}
