import { render } from '@react-email/render'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@residrix/supabase'
import type { NotificationEvent } from '@residrix/types'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { resend, getFromAddress } from './resend'
import { sendExpoPush, findInvalidTokens, type ExpoPushMessage } from './expo-push'
import { NewIncidenceEmail, type NewIncidenceEmailProps } from './emails/NewIncidence'
import { StatusChangeEmail, type StatusChangeEmailProps } from './emails/StatusChange'
import { NewMessageEmail, type NewMessageEmailProps } from './emails/NewMessage'
import { InviteCodeEmail, type InviteCodeEmailProps } from './emails/InviteCode'

type DispatchInput =
  | { event: 'new_incidence'; recipientUserId: string; payload: NewIncidenceEmailProps & { pushTitle: string; pushBody: string } }
  | { event: 'status_change'; recipientUserId: string; payload: StatusChangeEmailProps & { pushTitle: string; pushBody: string } }
  | { event: 'new_message'; recipientUserId: string; payload: NewMessageEmailProps & { pushTitle: string; pushBody: string } }
  | { event: 'invite_code'; recipientEmail: string; payload: InviteCodeEmailProps }

interface DispatchResult {
  push: { sent: number; failed: number }
  email: { sent: boolean; skipped: boolean; error?: string }
}

const PUSH_PREF_KEY: Record<Exclude<NotificationEvent, 'invite_code'>, keyof PrefsRow> = {
  new_incidence: 'push_new_incidence',
  status_change: 'push_status_change',
  new_message: 'push_new_message',
}

const EMAIL_PREF_KEY: Record<Exclude<NotificationEvent, 'invite_code'>, keyof PrefsRow> = {
  new_incidence: 'email_new_incidence',
  status_change: 'email_status_change',
  new_message: 'email_new_message',
}

type PrefsRow = Database['public']['Tables']['notification_preferences']['Row']

export async function dispatch(input: DispatchInput): Promise<DispatchResult> {
  const supabase = createSupabaseServiceClient()
  const result: DispatchResult = {
    push: { sent: 0, failed: 0 },
    email: { sent: false, skipped: false },
  }

  if (input.event === 'invite_code') {
    await sendEmail(input, input.recipientEmail, result)
    return result
  }

  const prefs = await loadPrefs(supabase, input.recipientUserId)
  const { email } = await loadRecipientContact(supabase, input.recipientUserId)

  if (prefs[PUSH_PREF_KEY[input.event]]) {
    await sendPush(supabase, input, result)
  }

  if (email && prefs[EMAIL_PREF_KEY[input.event]]) {
    await sendEmail(input, email, result)
  } else {
    result.email.skipped = true
  }

  return result
}

async function loadPrefs(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<PrefsRow> {
  const { data } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (data) return data
  console.warn(`notification_preferences row missing for user ${userId}; falling back to defaults`)
  return {
    user_id: userId,
    push_new_incidence: true,
    push_status_change: true,
    push_new_message: true,
    email_new_incidence: true,
    email_status_change: true,
    email_new_message: false,
    email_invite_code: true,
    updated_at: new Date().toISOString(),
  }
}

async function loadRecipientContact(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ email: string | null }> {
  const { data } = await supabase.auth.admin.getUserById(userId)
  return { email: data?.user?.email ?? null }
}

async function sendPush(
  supabase: SupabaseClient<Database>,
  input: Extract<DispatchInput, { recipientUserId: string }>,
  result: DispatchResult,
) {
  const { data: tokens } = await supabase
    .from('device_tokens')
    .select('token')
    .eq('user_id', input.recipientUserId)

  if (!tokens || tokens.length === 0) return

  const messages: ExpoPushMessage[] = tokens.map((t) => ({
    to: t.token,
    title: input.payload.pushTitle,
    body: input.payload.pushBody,
    data: { event: input.event },
  }))

  try {
    const res = await sendExpoPush(messages)
    const invalid = findInvalidTokens(messages, res)
    if (invalid.length > 0) {
      await supabase.from('device_tokens').delete().in('token', invalid)
    }
    result.push.sent = messages.length - invalid.length
    result.push.failed = invalid.length
  } catch (err) {
    result.push.failed = messages.length
    console.error('Push dispatch failed:', err)
  }
}

async function sendEmail(input: DispatchInput, to: string, result: DispatchResult) {
  if (!resend) {
    result.email.skipped = true
    result.email.error = 'RESEND_API_KEY not configured'
    return
  }

  try {
    const { subject, html, text } = await renderEmail(input)

    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject,
      html,
      text,
    })

    if (error) {
      result.email.error = error.message
    } else {
      result.email.sent = true
    }
  } catch (err) {
    result.email.error = err instanceof Error ? err.message : 'unknown'
    console.error('Email dispatch failed:', err)
  }
}

async function renderEmail(
  input: DispatchInput,
): Promise<{ subject: string; html: string; text: string }> {
  switch (input.event) {
    case 'new_incidence': {
      const el = NewIncidenceEmail(input.payload)
      return {
        subject: `Nueva incidencia: ${input.payload.title}`,
        html: await render(el),
        text: await render(el, { plainText: true }),
      }
    }
    case 'status_change': {
      const el = StatusChangeEmail(input.payload)
      return {
        subject: `Cambio de estado: ${input.payload.title}`,
        html: await render(el),
        text: await render(el, { plainText: true }),
      }
    }
    case 'new_message': {
      const el = NewMessageEmail(input.payload)
      return {
        subject: `Nuevo mensaje en "${input.payload.incidenceTitle}"`,
        html: await render(el),
        text: await render(el, { plainText: true }),
      }
    }
    case 'invite_code': {
      const el = InviteCodeEmail(input.payload)
      return {
        subject: `Bienvenido a ${input.payload.communityName}`,
        html: await render(el),
        text: await render(el, { plainText: true }),
      }
    }
  }
}
