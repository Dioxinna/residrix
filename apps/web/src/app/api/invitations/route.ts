import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { dispatch } from '@/lib/notifications/dispatch'
import { checkRateLimit, rateLimited, RATE_LIMITS } from '@/lib/ratelimit'

export const runtime = 'nodejs'

interface Body {
  community_id: string
  unit_number: string
  email: string
  full_name?: string
  role?: 'neighbor' | 'tenant' | 'president'
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, firm_id, full_name')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin' || !profile.firm_id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Rate limit por user: 30 invitaciones/hora. Si una cuenta admin
  // queda comprometida, esto acota el daño (no se pueden mandar miles
  // de invitaciones spam con su SMTP).
  const rl = await checkRateLimit(RATE_LIMITS.createInvitation, user.id)
  if (!rl.success) {
    return rateLimited(
      rl,
      'Has creado demasiadas invitaciones en poco tiempo. Espera un rato antes de mandar más.',
    )
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const community_id = body.community_id?.trim()
  const unit_number = body.unit_number?.trim()
  const email = body.email?.trim().toLowerCase()
  const full_name = body.full_name?.trim() || undefined
  const role = body.role ?? 'neighbor'

  if (!community_id || !unit_number || !email) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: 'Invalid email format' }, { status: 400 })
  }

  const service = createSupabaseServiceClient()
  const { data: community } = await service
    .from('communities')
    .select('name, firm_id')
    .eq('id', community_id)
    .single()
  if (!community || community.firm_id !== profile.firm_id) {
    return Response.json({ error: 'Community not in your firm' }, { status: 403 })
  }

  const { data: invitation, error } = await service
    .from('invitations')
    .insert({ community_id, unit_number, email, role })
    .select('id, code, expires_at')
    .single()
  if (error || !invitation) {
    return Response.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })
  }

  const expiresAt = invitation.expires_at
    ? new Date(invitation.expires_at).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'en 30 días'

  const dispatchResult = await dispatch({
    event: 'invite_code',
    recipientEmail: email,
    payload: {
      recipientName: full_name ?? 'vecino',
      communityName: community.name,
      unitNumber: unit_number,
      code: invitation.code,
      expiresAt,
    },
  })

  if (dispatchResult.email.error) {
    return Response.json(
      {
        id: invitation.id,
        code: invitation.code,
        warning: `Invitación creada, pero el envío del email falló: ${dispatchResult.email.error}`,
      },
      { status: 207 },
    )
  }

  return Response.json({ id: invitation.id, code: invitation.code })
}
