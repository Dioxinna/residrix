import { Heading, Text } from '@react-email/components'
import { Layout } from './Layout'

export interface InviteCodeEmailProps {
  recipientName: string
  communityName: string
  unitNumber: string
  code: string
  expiresAt: string
}

export function InviteCodeEmail({
  recipientName,
  communityName,
  unitNumber,
  code,
  expiresAt,
}: InviteCodeEmailProps) {
  return (
    <Layout preview={`Tu código de acceso a ${communityName}`}>
      <Heading style={h1}>Bienvenido a Residrix</Heading>
      <Text style={p}>Hola {recipientName},</Text>
      <Text style={p}>
        Has sido invitado a unirte a la comunidad <strong>{communityName}</strong>
        {' '}(piso {unitNumber}). Descarga la app de Residrix e introduce este código
        durante el registro:
      </Text>
      <Text style={codeBox}>{code}</Text>
      <Text style={p}>
        Este código caduca el {expiresAt}. Si tienes dudas, contacta con el
        administrador de tu comunidad.
      </Text>
    </Layout>
  )
}

const h1 = { fontSize: '20px', fontWeight: '600', color: '#18181b', margin: '0 0 16px' }
const p = { fontSize: '14px', color: '#3f3f46', lineHeight: '22px', margin: '0 0 12px' }
const codeBox = {
  fontSize: '28px',
  fontWeight: '700',
  letterSpacing: '4px',
  textAlign: 'center' as const,
  color: '#18181b',
  backgroundColor: '#f4f4f5',
  padding: '20px',
  borderRadius: '8px',
  margin: '24px 0',
  fontFamily: 'monospace',
}
