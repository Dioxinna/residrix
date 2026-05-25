import { after } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { firmHasFeature } from '@/lib/auth/feature-gate'
import { processMeeting } from '@/lib/meetings/process'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 600

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  if (!(await firmHasFeature('meeting_transcripts'))) {
    return Response.json({ error: 'Feature no disponible en tu plan' }, { status: 403 })
  }

  const { id } = await context.params

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, firm_id')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin' || !profile.firm_id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = createSupabaseServiceClient()
  const { data: meeting } = await service
    .from('meetings')
    .select('id, firm_id, status')
    .eq('id', id)
    .single()

  if (!meeting || meeting.firm_id !== profile.firm_id) {
    return Response.json({ error: 'Junta no encontrada' }, { status: 404 })
  }
  if (meeting.status === 'completed') {
    return Response.json({ ok: true, unchanged: true })
  }

  // Limpia el error y vuelve a pending; processMeeting es idempotente y
  // reutilizará transcript/summary parciales si están ya guardados.
  await service
    .from('meetings')
    .update({ status: 'pending', error_message: null })
    .eq('id', id)

  after(() => processMeeting(id))

  return Response.json({ ok: true })
}
