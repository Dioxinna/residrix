import { Button, Heading, Text } from '@react-email/components'
import { Layout } from './Layout'

export interface StatusChangeEmailProps {
  recipientName: string
  title: string
  oldStatus: string
  newStatus: string
  incidenceUrl: string
}

export function StatusChangeEmail({
  recipientName,
  title,
  oldStatus,
  newStatus,
  incidenceUrl,
}: StatusChangeEmailProps) {
  return (
    <Layout preview={`Tu incidencia "${title}" ahora está: ${newStatus}`}>
      <Heading style={h1}>Cambio de estado</Heading>
      <Text style={p}>Hola {recipientName},</Text>
      <Text style={p}>
        El estado de tu incidencia <strong>{title}</strong> ha cambiado:
      </Text>
      <Text style={transition}>
        {oldStatus} → <strong>{newStatus}</strong>
      </Text>
      <Button href={incidenceUrl} style={button}>
        Ver detalle
      </Button>
    </Layout>
  )
}

const h1 = { fontSize: '20px', fontWeight: '600', color: '#18181b', margin: '0 0 16px' }
const p = { fontSize: '14px', color: '#3f3f46', lineHeight: '22px', margin: '0 0 12px' }
const transition = {
  fontSize: '16px',
  color: '#18181b',
  backgroundColor: '#f4f4f5',
  padding: '16px',
  borderRadius: '6px',
  textAlign: 'center' as const,
  margin: '16px 0',
}
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
