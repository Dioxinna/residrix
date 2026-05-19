import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY
const fromAddress = process.env.RESEND_FROM ?? 'Residrix <notifications@residrix.app>'

export const resend = apiKey ? new Resend(apiKey) : null

export function getFromAddress(): string {
  return fromAddress
}
