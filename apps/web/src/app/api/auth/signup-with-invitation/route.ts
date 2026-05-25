import type { Database } from '@residrix/supabase'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, ipFromRequest, rateLimited, RATE_LIMITS } from '@/lib/ratelimit'

function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: Request) {
  // Rate limit por IP: 5 intentos / 15 min. Esto cubre tanto spam de
  // signup como brute-force del código de invitación de 8 chars (480
  // intentos/día por IP → 8M+ días para barrer las 4B combinaciones
  // desde una sola IP).
  const ip = ipFromRequest(request)
  const rl = await checkRateLimit(RATE_LIMITS.signupInvitation, ip)
  if (!rl.success) {
    return rateLimited(rl, 'Demasiados intentos. Espera unos minutos.')
  }

  let body: { code?: string; full_name?: string; email?: string; password?: string }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const code = body.code?.trim().toLowerCase()
  const full_name = body.full_name?.trim()
  const email = body.email?.trim().toLowerCase()
  const password = body.password

  if (!code || code.length !== 8) {
    return Response.json({ error: 'Código de invitación inválido' }, { status: 400 })
  }
  if (!full_name) {
    return Response.json({ error: 'Nombre requerido' }, { status: 400 })
  }
  if (!email) {
    return Response.json({ error: 'Email requerido' }, { status: 400 })
  }
  if (!password || password.length < 8) {
    return Response.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: invitation, error: invitationError } = await supabase
    .from('invitations')
    .select('id, community_id, unit_number, role, used_by, expires_at')
    .eq('code', code)
    .maybeSingle()

  if (invitationError) {
    console.error('Invitation lookup failed:', invitationError)
    return Response.json({ error: 'Error al validar la invitación' }, { status: 500 })
  }
  if (!invitation) {
    return Response.json({ error: 'Código de invitación no encontrado' }, { status: 404 })
  }
  if (invitation.used_by) {
    return Response.json({ error: 'Este código ya ha sido utilizado' }, { status: 409 })
  }
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return Response.json({ error: 'Este código ha caducado' }, { status: 410 })
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role: invitation.role },
  })

  if (createError || !created.user) {
    const message =
      createError?.message.toLowerCase().includes('already')
        ? 'Ya existe una cuenta con este email'
        : createError?.message ?? 'No se pudo crear la cuenta'
    const status = createError?.status ?? 500
    return Response.json({ error: message }, { status })
  }

  const userId = created.user.id

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      community_id: invitation.community_id,
      unit_number: invitation.unit_number,
      role: invitation.role,
      full_name,
    })
    .eq('id', userId)

  if (profileError) {
    console.error('Profile update failed:', profileError)
    await supabase.auth.admin.deleteUser(userId)
    return Response.json({ error: 'No se pudo completar el registro' }, { status: 500 })
  }

  const { error: invitationUpdateError } = await supabase
    .from('invitations')
    .update({ used_by: userId, used_at: new Date().toISOString() })
    .eq('id', invitation.id)
    .is('used_by', null)

  if (invitationUpdateError) {
    console.error('Invitation update failed:', invitationUpdateError)
    await supabase.auth.admin.deleteUser(userId)
    return Response.json({ error: 'No se pudo marcar la invitación como usada' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
