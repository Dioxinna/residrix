import { ComingSoon } from '@/components/feature-gate/ComingSoon'
import { FeatureLock } from '@/components/feature-gate/FeatureLock'
import { firmHasFeature } from '@/lib/auth/feature-gate'

export const metadata = { title: 'Asistente IA · Residrix' }

export default async function AsistenteIaPage() {
  const allowed = await firmHasFeature('ai_assistant')
  if (!allowed) {
    return (
      <FeatureLock
        feature="ai_assistant"
        description="Agente IA que sugiere respuestas a incidencias, las agrupa por patrones y propone escalado a proveedores."
      />
    )
  }
  return <ComingSoon feature="ai_assistant" />
}
