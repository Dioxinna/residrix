export interface ExpoPushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: 'default' | null
  badge?: number
  channelId?: string
}

interface ExpoTicket {
  status: 'ok' | 'error'
  id?: string
  message?: string
  details?: { error?: string }
}

interface ExpoPushResponse {
  data?: ExpoTicket[]
  errors?: { code: string; message: string }[]
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

export async function sendExpoPush(
  messages: ExpoPushMessage[],
): Promise<ExpoPushResponse> {
  if (messages.length === 0) return { data: [] }

  const accessToken = process.env.EXPO_ACCESS_TOKEN
  const headers: HeadersInit = {
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate',
    'Content-Type': 'application/json',
  }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(messages.map((m) => ({ sound: 'default', ...m }))),
  })

  if (!res.ok) {
    throw new Error(`Expo push failed: ${res.status} ${res.statusText}`)
  }
  return (await res.json()) as ExpoPushResponse
}

/**
 * Tokens that come back as DeviceNotRegistered should be removed from DB.
 * Caller passes the input tokens in the same order as the tickets to map back.
 */
export function findInvalidTokens(
  inputs: ExpoPushMessage[],
  res: ExpoPushResponse,
): string[] {
  const tickets = res.data ?? []
  const invalid: string[] = []
  for (let i = 0; i < tickets.length; i++) {
    const t = tickets[i]
    if (t.status === 'error' && t.details?.error === 'DeviceNotRegistered') {
      invalid.push(inputs[i].to)
    }
  }
  return invalid
}
