import { timingSafeEqual } from 'node:crypto'
import type { Database } from '@residrix/supabase'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { dispatch } from '@/lib/notifications/dispatch'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

type Incidence = Database['public']['Tables']['incidences']['Row']
type IncidenceMessage = Database['public']['Tables']['incidence_messages']['Row']

type WebhookPayload =
  | { type: 'INSERT'; table: 'incidences'; record: Incidence; old_record: null }
  | { type: 'UPDATE'; table: 'incidences'; record: Incidence; old_record: Incidence }
  | { type: 'INSERT'; table: 'incidence_messages'; record: IncidenceMessage; old_record: null }

const STATUS_LABEL: Record<string, string> = {
  open: 'Abierta',
  in_progress: 'En curso',
  pending_neighbor: 'Pendiente del vecino',
  resolved: 'Resuelta',
  closed: 'Cerrada',
}

const CATEGORY_LABEL: Record<string, string> = {
  plumbing: 'Fontanería',
  electricity: 'Electricidad',
  cleaning: 'Limpieza',
  elevator: 'Ascensor',
  structure: 'Estructura',
  access: 'Acceso',
  noise: 'Ruido',
  other: 'Otros',
}

const URGENCY_LABEL: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
}

export async function POST(request: Request) {
  const secret = process.env.SUPABASE_WEBHOOK_SECRET
  if (!secret) {
    return Response.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const auth = request.headers.get('authorization') ?? ''
  const expected = `Bearer ${secret}`
  if (!authHeaderMatches(auth, expected)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: WebhookPayload
  try {
    payload = (await request.json()) as WebhookPayload
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    if (payload.table === 'incidences' && payload.type === 'INSERT') {
      await handleNewIncidence(payload.record)
    } else if (
      payload.table === 'incidences' &&
      payload.type === 'UPDATE' &&
      payload.record.status !== payload.old_record.status
    ) {
      await handleStatusChange(payload.record, payload.old_record.status)
    } else if (payload.table === 'incidence_messages' && payload.type === 'INSERT') {
      await handleNewMessage(payload.record)
    } else {
      console.warn(`webhook: unhandled ${payload.type} on ${payload.table}`)
    }
  } catch (err) {
    console.error('Webhook handling failed:', err)
    return Response.json({ error: 'Handler error' }, { status: 500 })
  }

  return Response.json({ ok: true })
}

function authHeaderMatches(received: string, expected: string): boolean {
  const a = Buffer.from(received)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

async function handleNewIncidence(inc: Incidence) {
  const supabase = createSupabaseServiceClient()

  const { data: community } = await supabase
    .from('communities')
    .select('name, firm_id')
    .eq('id', inc.community_id)
    .single()

  if (!community) return

  const [{ data: reporter }, { data: admins }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', inc.reported_by).single(),
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('firm_id', community.firm_id)
      .eq('role', 'admin'),
  ])

  if (!admins || admins.length === 0) return

  const url = `${APP_URL}/incidencias/${inc.id}`
  const reporterName = reporter?.full_name ?? 'Un vecino'
  const category = CATEGORY_LABEL[inc.category] ?? inc.category
  const urgency = URGENCY_LABEL[inc.urgency] ?? inc.urgency

  await Promise.allSettled(
    admins.map((admin) =>
      dispatch({
        event: 'new_incidence',
        recipientUserId: admin.id,
        payload: {
          recipientName: admin.full_name,
          reporterName,
          communityName: community.name,
          title: inc.title,
          category,
          urgency,
          incidenceUrl: url,
          pushTitle: `Nueva incidencia en ${community.name}`,
          pushBody: `${reporterName}: ${inc.title}`,
        },
      }),
    ),
  )
}

async function handleStatusChange(inc: Incidence, oldStatus: string) {
  const supabase = createSupabaseServiceClient()

  const { data: reporter } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', inc.reported_by)
    .single()

  const url = `${APP_URL}/incidencias/${inc.id}`
  const oldLabel = STATUS_LABEL[oldStatus] ?? oldStatus
  const newLabel = STATUS_LABEL[inc.status] ?? inc.status

  await dispatch({
    event: 'status_change',
    recipientUserId: inc.reported_by,
    payload: {
      recipientName: reporter?.full_name ?? 'vecino',
      title: inc.title,
      oldStatus: oldLabel,
      newStatus: newLabel,
      incidenceUrl: url,
      pushTitle: `Cambio de estado: ${newLabel}`,
      pushBody: inc.title,
    },
  })
}

async function handleNewMessage(msg: IncidenceMessage) {
  if (msg.is_internal) return

  const supabase = createSupabaseServiceClient()

  const { data: inc } = await supabase
    .from('incidences')
    .select('id, title, community_id, reported_by')
    .eq('id', msg.incidence_id)
    .single()

  if (!inc) return

  const { data: community } = await supabase
    .from('communities')
    .select('firm_id')
    .eq('id', inc.community_id)
    .single()

  if (!community) return

  const { data: sender } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', msg.sender_id)
    .single()

  const senderRole = sender?.role
  const recipients = await resolveMessageRecipients(supabase, inc, community.firm_id, msg.sender_id, senderRole)
  if (recipients.length === 0) return

  const url = `${APP_URL}/incidencias/${inc.id}`
  const senderName = sender?.full_name ?? 'Alguien'
  const preview = msg.content.length > 140 ? msg.content.slice(0, 140) + '…' : msg.content

  await Promise.allSettled(
    recipients.map((r) =>
      dispatch({
        event: 'new_message',
        recipientUserId: r.id,
        payload: {
          recipientName: r.full_name,
          senderName,
          incidenceTitle: inc.title,
          messagePreview: preview,
          incidenceUrl: url,
          pushTitle: `${senderName} en "${inc.title}"`,
          pushBody: preview,
        },
      }),
    ),
  )
}

async function resolveMessageRecipients(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  inc: { reported_by: string; community_id: string },
  firmId: string,
  senderId: string,
  senderRole: string | undefined,
): Promise<{ id: string; full_name: string }[]> {
  if (senderRole === 'neighbor' || senderRole === 'tenant' || senderRole === 'president') {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('firm_id', firmId)
      .eq('role', 'admin')
    return data ?? []
  }
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', inc.reported_by)
  return (data ?? []).filter((r) => r.id !== senderId)
}
