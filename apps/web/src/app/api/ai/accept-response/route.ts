import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
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

  let body: { incidenceId?: string }
  try {
    body = (await request.json()) as { incidenceId?: string }
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.incidenceId) {
    return Response.json({ error: 'incidenceId required' }, { status: 400 })
  }

  const service = createSupabaseServiceClient()

  // Verifica que la incidencia pertenece a una comunidad del admin
  const { data: inc, error: incErr } = await service
    .from('incidences')
    .select('id, ai_response, ai_response_accepted_at, communities!inner(firm_id)')
    .eq('id', body.incidenceId)
    .single()
  if (incErr || !inc) return Response.json({ error: 'Not found' }, { status: 404 })

  const incFirmId = (inc.communities as { firm_id: string }).firm_id
  if (incFirmId !== profile.firm_id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!inc.ai_response) {
    return Response.json({ error: 'No AI response to accept' }, { status: 400 })
  }
  if (inc.ai_response_accepted_at) {
    return Response.json({ error: 'Already accepted' }, { status: 409 })
  }

  // Inserta el mensaje al vecino
  const { error: msgErr } = await service.from('incidence_messages').insert({
    incidence_id: body.incidenceId,
    sender_id: user.id,
    content: inc.ai_response,
    is_internal: false,
  })
  if (msgErr) {
    console.error('[accept-response] message insert failed:', msgErr)
    return Response.json({ error: 'Failed to send message' }, { status: 500 })
  }

  await service
    .from('incidences')
    .update({ ai_response_accepted_at: new Date().toISOString() })
    .eq('id', body.incidenceId)

  return Response.json({ ok: true })
}
