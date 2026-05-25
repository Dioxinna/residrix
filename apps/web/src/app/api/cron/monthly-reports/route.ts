// Cron mensual: el día 1 a las 8 UTC envía a cada admin de cada firma
// con plan Total activo el informe del mes anterior por cada comunidad
// que tuvo actividad (incidencias o gastos).
//
// Auth: Vercel Cron añade `Authorization: Bearer ${CRON_SECRET}` si la
// env var existe. Validamos esa cabecera en cualquier modo (también si
// alguien lo llama manualmente desde curl) — sin secret, 401.

import { render } from '@react-email/render'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { resend, getFromAddress } from '@/lib/notifications/resend'
import { MonthlyReportEmail } from '@/lib/notifications/emails/MonthlyReport'
import { fetchMonthlyReport, formatResolutionDuration } from '@/lib/reports/data'
import { formatEuros, previousMonthIso, currentMonthIso } from '@/lib/expenses'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function originFromHeaders(headers: Headers): string {
  const proto = headers.get('x-forwarded-proto') ?? 'https'
  const host = headers.get('x-forwarded-host') ?? headers.get('host')
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://residrix.com'
}

interface SendSummary {
  firmsConsidered: number
  communitiesProcessed: number
  communitiesSkippedEmpty: number
  emailsSent: number
  emailsFailed: number
  errors: Array<{ context: string; error: string }>
}

export async function GET(request: Request) {
  // Auth: CRON_SECRET debe estar configurado. Si no, no aceptamos.
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return Response.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Permite override del mes por query (?month=YYYY-MM) para reenvíos
  // manuales. Default: mes anterior al actual.
  const url = new URL(request.url)
  const monthParam = url.searchParams.get('month')
  const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam)
    ? monthParam
    : previousMonthIso(currentMonthIso())

  if (!resend) {
    return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  const origin = originFromHeaders(request.headers)
  const supabase = createSupabaseServiceClient()

  const summary: SendSummary = {
    firmsConsidered: 0,
    communitiesProcessed: 0,
    communitiesSkippedEmpty: 0,
    emailsSent: 0,
    emailsFailed: 0,
    errors: [],
  }

  // 1. Firms elegibles: tier total + sub activa o en prueba.
  const { data: firms, error: firmsErr } = await supabase
    .from('firms')
    .select('id, name, subscription_status, plan')
    .eq('plan', 'total')
    .in('subscription_status', ['active', 'trialing'])

  if (firmsErr) {
    return Response.json({ error: `firms query: ${firmsErr.message}` }, { status: 500 })
  }

  summary.firmsConsidered = firms?.length ?? 0

  for (const firm of firms ?? []) {
    const [{ data: communities }, { data: admins }] = await Promise.all([
      supabase.from('communities').select('id').eq('firm_id', firm.id),
      supabase
        .from('profiles')
        .select('id, full_name')
        .eq('firm_id', firm.id)
        .eq('role', 'admin'),
    ])

    if (!communities || communities.length === 0) continue
    if (!admins || admins.length === 0) continue

    // Resolve admin emails desde auth.users (profiles no guarda email).
    const adminIds = admins.map((a) => a.id)
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({ perPage: 200 })
    const emailById = new Map<string, string>()
    for (const u of authUsers) {
      if (u.email && adminIds.includes(u.id)) emailById.set(u.id, u.email)
    }

    for (const c of communities) {
      const report = await fetchMonthlyReport(supabase, c.id, month).catch((err) => {
        summary.errors.push({ context: `community ${c.id}`, error: String(err) })
        return null
      })
      if (!report) continue

      // Skip si no hay actividad en el mes.
      if (report.kpis.incidentsTotal === 0 && report.kpis.expensesTotal === 0) {
        summary.communitiesSkippedEmpty += 1
        continue
      }
      summary.communitiesProcessed += 1

      const reportUrl = `${origin}/informes/preview?community=${c.id}&month=${month}`
      const kpis = {
        incidentsTotal: report.kpis.incidentsTotal,
        incidentsResolved: report.kpis.incidentsResolved,
        incidentsDelta: report.kpis.incidentsDelta,
        expensesTotal: formatEuros(report.kpis.expensesTotal),
        expensesUnpaid: formatEuros(report.kpis.expensesUnpaid),
        expensesDelta: report.kpis.expensesDelta,
        avgResolutionLabel: report.kpis.avgResolutionMs === null
          ? '—'
          : formatResolutionDuration(report.kpis.avgResolutionMs),
      }

      for (const admin of admins) {
        const email = emailById.get(admin.id)
        if (!email) continue

        const html = await render(
          MonthlyReportEmail({
            recipientName: admin.full_name,
            firmName: firm.name,
            communityName: report.community.name,
            monthLabel: report.monthLabel,
            prevMonthLabel: report.prevMonthLabel,
            reportUrl,
            kpis,
            topIncidents: report.topIncidents.map((t) => ({ title: t.title, urgency: t.urgency })),
          }),
        )

        const subject = `Informe ${capitalize(report.monthLabel)} · ${report.community.name}`

        const { error: sendErr } = await resend.emails.send({
          from: getFromAddress(),
          to: email,
          subject,
          html,
        })

        if (sendErr) {
          summary.emailsFailed += 1
          summary.errors.push({
            context: `email to ${email} (community ${c.id})`,
            error: sendErr.message,
          })
        } else {
          summary.emailsSent += 1
        }
      }
    }
  }

  return Response.json({ ok: true, month, summary })
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
