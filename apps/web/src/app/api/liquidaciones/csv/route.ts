import { createSupabaseServerClient } from '@/lib/supabase/server'
import { firmHasFeature } from '@/lib/auth/feature-gate'
import {
  EXPENSE_CATEGORY_LABEL,
  formatDateEs,
  type ExpenseCategory,
} from '@/lib/expenses'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

interface Body {
  communityId?: string
  from?: string
  to?: string
}

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes(';')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function eurosCsv(cents: number): string {
  // Formato europeo (coma decimal) sin separador de miles, sin símbolo €.
  // Excel español lo abre como número directamente.
  return (cents / 100).toFixed(2).replace('.', ',')
}

export async function POST(request: Request) {
  if (!(await firmHasFeature('settlements'))) {
    return Response.json({ error: 'Feature no disponible en tu plan' }, { status: 403 })
  }

  let body: Body = {}
  try {
    body = (await request.json()) as Body
  } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (!body.communityId || !body.from || !body.to) {
    return Response.json({ error: 'Faltan parámetros' }, { status: 400 })
  }
  if (!ISO_DATE.test(body.from) || !ISO_DATE.test(body.to)) {
    return Response.json({ error: 'Fechas inválidas' }, { status: 400 })
  }

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

  // Verifica que la comunidad pertenece a la firma (RLS también lo hace,
  // pero un 403 explícito es mejor mensaje que un CSV vacío).
  const { data: community } = await supabase
    .from('communities')
    .select('id, name, firm_id')
    .eq('id', body.communityId)
    .single()
  if (!community || community.firm_id !== profile.firm_id) {
    return Response.json({ error: 'Comunidad no encontrada' }, { status: 404 })
  }

  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('amount_cents, category, description, expense_date, paid_at, vendor_name, notes')
    .eq('community_id', community.id)
    .gte('expense_date', body.from)
    .lt('expense_date', body.to)
    .order('expense_date', { ascending: true })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const rows = expenses ?? []
  const headers = [
    'Fecha',
    'Descripción',
    'Categoría',
    'Proveedor',
    'Estado',
    'Fecha de pago',
    'Importe (€)',
    'Notas',
  ]

  const lines = [headers.join(';')]
  for (const e of rows) {
    const cat = EXPENSE_CATEGORY_LABEL[e.category as ExpenseCategory] ?? 'Otros'
    lines.push(
      [
        escapeCsv(formatDateEs(e.expense_date)),
        escapeCsv(e.description),
        escapeCsv(cat),
        escapeCsv(e.vendor_name),
        escapeCsv(e.paid_at ? 'Pagado' : 'Pendiente'),
        escapeCsv(e.paid_at ? formatDateEs(e.paid_at) : ''),
        escapeCsv(eurosCsv(e.amount_cents)),
        escapeCsv(e.notes),
      ].join(';'),
    )
  }

  const totalCents = rows.reduce((s, e) => s + e.amount_cents, 0)
  lines.push('')
  lines.push(['', '', '', '', '', 'TOTAL', escapeCsv(eurosCsv(totalCents)), ''].join(';'))

  // BOM para que Excel en Windows abra UTF-8 con tildes correctas.
  const csv = '﻿' + lines.join('\n')

  const slug = community.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const filename = `liquidacion-${slug}-${body.from}_${body.to}.csv`

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
