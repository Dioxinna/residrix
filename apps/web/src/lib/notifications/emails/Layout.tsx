import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { ReactNode } from 'react'

interface LayoutProps {
  preview: string
  children: ReactNode
}

export function Layout({ preview, children }: LayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brand}>Residrix</Text>
          </Section>
          <Section>{children}</Section>
          <Hr style={hr} />
          <Section>
            <Text style={footer}>
              Has recibido este correo porque tienes una cuenta activa en Residrix.
              Puedes ajustar tus preferencias de notificación desde la app.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const body = {
  backgroundColor: '#f4f4f5',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
}

const container = {
  margin: '0 auto',
  padding: '24px 16px',
  maxWidth: '560px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
}

const header = {
  paddingBottom: '16px',
  borderBottom: '1px solid #e4e4e7',
  marginBottom: '24px',
}

const brand = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#6366f1',
  margin: '0',
}

const hr = {
  borderColor: '#e4e4e7',
  margin: '32px 0 16px',
}

const footer = {
  fontSize: '12px',
  color: '#71717a',
  lineHeight: '18px',
  margin: '0',
}
