import { Button, Column, Heading, Row, Section, Text } from '@react-email/components'
import { Layout } from './Layout'

export interface MonthlyReportEmailProps {
  recipientName: string
  firmName: string
  communityName: string
  monthLabel: string
  prevMonthLabel: string
  reportUrl: string
  kpis: {
    incidentsTotal: number
    incidentsResolved: number
    incidentsDelta: number | null
    expensesTotal: string  // already formatted EUR
    expensesUnpaid: string
    expensesDelta: number | null
    avgResolutionLabel: string
  }
  topIncidents: Array<{ title: string; urgency: string }>
}

const URGENCY_LABEL: Record<string, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

function deltaText(delta: number | null): string {
  if (delta === null) return 'Sin precedente'
  const sign = delta >= 0 ? '+' : ''
  return `${sign}${delta.toFixed(0)}%`
}

function deltaColor(delta: number | null, lessIsBetter: boolean): string {
  if (delta === null) return '#71717a'
  const good = lessIsBetter ? delta < 0 : delta > 0
  return good ? '#10b981' : '#ef4444'
}

export function MonthlyReportEmail({
  recipientName,
  firmName,
  communityName,
  monthLabel,
  prevMonthLabel,
  reportUrl,
  kpis,
  topIncidents,
}: MonthlyReportEmailProps) {
  const preview = `Informe ${monthLabel}: ${communityName} — ${kpis.incidentsTotal} incidencias, ${kpis.expensesTotal} en gastos`
  const resolvedPct = kpis.incidentsTotal === 0
    ? '—'
    : `${Math.round((kpis.incidentsResolved / kpis.incidentsTotal) * 100)}%`

  return (
    <Layout preview={preview}>
      <Text style={tag}>Informe mensual · {firmName}</Text>
      <Heading style={h1}>{communityName}</Heading>
      <Text style={subtitle}>{capitalize(monthLabel)}</Text>

      <Text style={p}>Hola {recipientName},</Text>
      <Text style={p}>
        Este es el resumen del mes para <strong>{communityName}</strong>. Tienes el informe completo en la
        plataforma; el enlace está abajo del todo.
      </Text>

      {/* KPIs */}
      <Section style={kpiGrid}>
        <Row>
          <Column style={kpiCell}>
            <Text style={kpiLabel}>Incidencias</Text>
            <Text style={kpiValue}>{kpis.incidentsTotal}</Text>
            <Text style={{ ...kpiSub, color: deltaColor(kpis.incidentsDelta, true) }}>
              {deltaText(kpis.incidentsDelta)} vs {prevMonthLabel.split(' ')[0]}
            </Text>
          </Column>
          <Column style={kpiCell}>
            <Text style={kpiLabel}>Resueltas</Text>
            <Text style={kpiValue}>{resolvedPct}</Text>
            <Text style={kpiSub}>{kpis.incidentsResolved} de {kpis.incidentsTotal}</Text>
          </Column>
        </Row>
        <Row>
          <Column style={kpiCell}>
            <Text style={kpiLabel}>Tiempo medio resolución</Text>
            <Text style={kpiValue}>{kpis.avgResolutionLabel}</Text>
            <Text style={kpiSub}>&nbsp;</Text>
          </Column>
          <Column style={kpiCell}>
            <Text style={kpiLabel}>Gastos</Text>
            <Text style={kpiValue}>{kpis.expensesTotal}</Text>
            <Text style={{ ...kpiSub, color: deltaColor(kpis.expensesDelta, true) }}>
              {deltaText(kpis.expensesDelta)} vs {prevMonthLabel.split(' ')[0]}
            </Text>
          </Column>
        </Row>
      </Section>

      {kpis.expensesUnpaid !== '0,00 €' && (
        <Text style={alert}>⚠ Pendiente de pago: <strong>{kpis.expensesUnpaid}</strong></Text>
      )}

      {topIncidents.length > 0 && (
        <>
          <Heading style={h2}>Incidencias destacadas</Heading>
          <ul style={list}>
            {topIncidents.map((t, idx) => (
              <li key={idx} style={listItem}>
                <strong>{URGENCY_LABEL[t.urgency] ?? t.urgency}</strong> · {t.title}
              </li>
            ))}
          </ul>
        </>
      )}

      <Section style={{ textAlign: 'center', margin: '32px 0 8px' }}>
        <Button href={reportUrl} style={button}>
          Abrir informe completo
        </Button>
      </Section>
    </Layout>
  )
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const tag = {
  fontSize: '11px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.6px',
  color: '#6366f1',
  margin: '0 0 8px',
}
const h1 = { fontSize: '22px', fontWeight: '600', color: '#18181b', margin: '0 0 4px' }
const h2 = { fontSize: '16px', fontWeight: '600', color: '#18181b', margin: '24px 0 12px' }
const subtitle = { fontSize: '13px', color: '#71717a', margin: '0 0 20px', textTransform: 'capitalize' as const }
const p = { fontSize: '14px', color: '#3f3f46', lineHeight: '22px', margin: '0 0 12px' }

const kpiGrid = { margin: '8px 0 12px' }
const kpiCell = {
  padding: '12px',
  border: '1px solid #e4e4e7',
  borderRadius: '6px',
  width: '50%',
  verticalAlign: 'top' as const,
}
const kpiLabel = {
  fontSize: '10px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  color: '#71717a',
  margin: '0 0 4px',
  fontWeight: '600',
}
const kpiValue = { fontSize: '20px', fontWeight: '700', color: '#18181b', margin: '0 0 2px' }
const kpiSub = { fontSize: '11px', color: '#71717a', margin: '0' }

const alert = {
  fontSize: '13px',
  color: '#92400e',
  backgroundColor: '#fef3c7',
  padding: '10px 12px',
  borderRadius: '6px',
  margin: '12px 0 0',
}

const list = { paddingLeft: '20px', margin: '0 0 8px' }
const listItem = { fontSize: '13px', color: '#3f3f46', lineHeight: '20px', margin: '0 0 6px' }

const button = {
  backgroundColor: '#6366f1',
  color: '#ffffff',
  padding: '11px 22px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
}
