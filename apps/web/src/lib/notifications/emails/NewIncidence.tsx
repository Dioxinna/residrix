import { Button, Heading, Text } from '@react-email/components'
import { Layout } from './Layout'

export interface NewIncidenceEmailProps {
  recipientName: string
  reporterName: string
  communityName: string
  title: string
  category: string
  urgency: string
  incidenceUrl: string
}

export function NewIncidenceEmail({
  recipientName,
  reporterName,
  communityName,
  title,
  category,
  urgency,
  incidenceUrl,
}: NewIncidenceEmailProps) {
  return (
    <Layout preview={`Nueva incidencia en ${communityName}: ${title}`}>
      <Heading style={h1}>Nueva incidencia</Heading>
      <Text style={p}>Hola {recipientName},</Text>
      <Text style={p}>
        <strong>{reporterName}</strong> ha reportado una nueva incidencia en{' '}
        <strong>{communityName}</strong>.
      </Text>
      <Text style={card}>
        <strong>{title}</strong>
        <br />
        <span style={meta}>
          Categoría: {category} · Urgencia: {urgency}
        </span>
      </Text>
      <Button href={incidenceUrl} style={button}>
        Ver incidencia
      </Button>
    </Layout>
  )
}

const h1 = { fontSize: '20px', fontWeight: '600', color: '#18181b', margin: '0 0 16px' }
const p = { fontSize: '14px', color: '#3f3f46', lineHeight: '22px', margin: '0 0 12px' }
const card = {
  fontSize: '14px',
  color: '#18181b',
  backgroundColor: '#f4f4f5',
  padding: '16px',
  borderRadius: '6px',
  margin: '16px 0',
  display: 'block',
}
const meta = { fontSize: '12px', color: '#71717a' }
const button = {
  backgroundColor: '#6366f1',
  color: '#ffffff',
  padding: '10px 20px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
}
