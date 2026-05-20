import { ComingSoon } from '@/components/feature-gate/ComingSoon'
import { FeatureLock } from '@/components/feature-gate/FeatureLock'
import { firmHasFeature } from '@/lib/auth/feature-gate'

export const metadata = { title: 'Juntas · Residrix' }

export default async function JuntasPage() {
  const allowed = await firmHasFeature('meeting_transcripts')
  if (!allowed) {
    return (
      <FeatureLock
        feature="meeting_transcripts"
        description="Sube el audio de la junta y obtén la transcripción completa, el acta resumida y los acuerdos en minutos."
      />
    )
  }
  return <ComingSoon feature="meeting_transcripts" />
}
