import { Button, Heading, Text } from '@react-email/components'
import { Layout } from './Layout'

export interface NewAnnouncementEmailProps {
  recipientName: string
  communityName: string
  title: string
  body: string
  severity: 'info' | 'warning' | 'urgent'
  announcementUrl: string
}

const SEVERITY_LABEL: Record<NewAnnouncementEmailProps['severity'], string> = {
  info: 'Información',
  warning: 'Aviso',
  urgent: 'Urgente',
}

const SEVERITY_COLOR: Record<NewAnnouncementEmailProps['severity'], string> = {
  info: '#6366f1',
  warning: '#f59e0b',
  urgent: '#ef4444',
}

export function NewAnnouncementEmail({
  recipientName,
  communityName,
  title,
  body,
  severity,
  announcementUrl,
}: NewAnnouncementEmailProps) {
  return (
    <Layout preview={`${SEVERITY_LABEL[severity]} en ${communityName}: ${title}`}>
      <Text style={{ ...severityTag, backgroundColor: `${SEVERITY_COLOR[severity]}22`, color: SEVERITY_COLOR[severity] }}>
        {SEVERITY_LABEL[severity]}
      </Text>
      <Heading style={h1}>{title}</Heading>
      <Text style={p}>Hola {recipientName},</Text>
      <Text style={p}>
        Tu administrador ha publicado un comunicado en <strong>{communityName}</strong>:
      </Text>
      <Text style={bodyStyle}>{body}</Text>
      <Button href={announcementUrl} style={button}>
        Ver en la app
      </Button>
    </Layout>
  )
}

const severityTag = {
  display: 'inline-block',
  padding: '4px 10px',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 12px',
}
const h1 = { fontSize: '22px', fontWeight: '600', color: '#18181b', margin: '0 0 16px' }
const p = { fontSize: '14px', color: '#3f3f46', lineHeight: '22px', margin: '0 0 12px' }
const bodyStyle = {
  fontSize: '14px',
  color: '#18181b',
  backgroundColor: '#f4f4f5',
  padding: '16px',
  borderRadius: '6px',
  margin: '16px 0',
  whiteSpace: 'pre-wrap' as const,
  lineHeight: '22px',
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
