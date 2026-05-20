import { createSupabaseServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

interface Body {
  firm_name?: string
  firm_phone?: string
  full_name?: string
  email?: string
  password?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const firm_name = body.firm_name?.trim()
  const firm_phone = body.firm_phone?.trim() || null
  const full_name = body.full_name?.trim()
  const email = body.email?.trim().toLowerCase()
  const password = body.password

  if (!firm_name) return Response.json({ error: 'Nombre del despacho requerido' }, { status: 400 })
  if (!full_name) return Response.json({ error: 'Tu nombre es requerido' }, { status: 400 })
  if (!email || !EMAIL_RE.test(email)) return Response.json({ error: 'Email inválido' }, { status: 400 })
  if (!password || password.length < 8) {
    return Response.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }

  const supabase = createSupabaseServiceClient()

  const { data: existingFirm } = await supabase
    .from('firms')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  if (existingFirm) {
    return Response.json({ error: 'Ya existe un despacho con este email' }, { status: 409 })
  }

  const { data: firmInsert, error: firmError } = await supabase
    .from('firms')
    .insert({ name: firm_name, email, phone: firm_phone })
    .select('id')
    .single()
  if (firmError || !firmInsert) {
    return Response.json({ error: firmError?.message ?? 'No se pudo crear el despacho' }, { status: 500 })
  }
  const firmId = firmInsert.id

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role: 'admin' },
  })
  if (createError || !created.user) {
    await supabase.from('firms').delete().eq('id', firmId)
    const message = createError?.message.toLowerCase().includes('already')
      ? 'Ya existe una cuenta con este email'
      : createError?.message ?? 'No se pudo crear la cuenta'
    return Response.json({ error: message }, { status: createError?.status ?? 500 })
  }

  const userId = created.user.id

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'admin', firm_id: firmId, full_name })
    .eq('id', userId)

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId)
    await supabase.from('firms').delete().eq('id', firmId)
    return Response.json({ error: 'No se pudo completar el registro' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
