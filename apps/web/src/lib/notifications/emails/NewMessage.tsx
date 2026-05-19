import { Button, Heading, Text } from '@react-email/components'
import { Layout } from './Layout'

export interface NewMessageEmailProps {
  recipientName: string
  senderName: string
  incidenceTitle: string
  messagePreview: string
  incidenceUrl: string
}

export function NewMessageEmail({
  recipientName,
  senderName,
  incidenceTitle,
  messagePreview,
  incidenceUrl,
}: NewMessageEmailProps) {
  return (
    <Layout preview={`${senderName} ha respondido a "${incidenceTitle}"`}>
      <Heading style={h1}>Nuevo mensaje</Heading>
      <Text style={p}>Hola {recipientName},</Text>
      <Text style={p}>
        <strong>{senderName}</strong> ha enviado un mensaje en la incidencia{' '}
        <strong>{incidenceTitle}</strong>:
      </Text>
      <Text style={quote}>&ldquo;{messagePreview}&rdquo;</Text>
      <Button href={incidenceUrl} style={button}>
        Responder
      </Button>
    </Layout>
  )
}

const h1 = { fontSize: '20px', fontWeight: '600', color: '#18181b', margin: '0 0 16px' }
const p = { fontSize: '14px', color: '#3f3f46', lineHeight: '22px', margin: '0 0 12px' }
const quote = {
  fontSize: '14px',
  fontStyle: 'italic',
  color: '#3f3f46',
  borderLeft: '3px solid #6366f1',
  paddingLeft: '12px',
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
