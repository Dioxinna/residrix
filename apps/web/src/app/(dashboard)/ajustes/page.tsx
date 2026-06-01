import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentFirmTier } from '@/lib/auth/feature-gate'
import { tierIncludes } from '@/lib/features'
import { NotificationPreferencesForm } from './_components/NotificationPreferencesForm'
import { AIAssistantToggle } from './_components/AIAssistantToggle'

export default async function AjustesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, firm_id')
    .eq('id', user.id)
    .single()

  const tierState = await getCurrentFirmTier()
  const showAIToggle =
    profile?.role === 'admin' &&
    tierState !== null &&
    tierIncludes(tierState.tier, 'ai_assistant')

  let aiEnabled = true
  if (showAIToggle && profile?.firm_id) {
    const { data: firm } = await supabase
      .from('firms')
      .select('ai_assistant_enabled')
      .eq('id', profile.firm_id)
      .single()
    aiEnabled = firm?.ai_assistant_enabled ?? true
  }

  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const initial = prefs ?? {
    user_id: user.id,
    push_new_incidence: true,
    push_status_change: true,
    push_new_message: true,
    push_new_announcement: true,
    email_new_incidence: true,
    email_status_change: true,
    email_new_message: false,
    email_new_announcement: true,
    email_invite_code: true,
    updated_at: new Date().toISOString(),
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-ink mb-1">Ajustes</h1>
      <p className="text-sm text-ink-soft mb-8">Configura tu cuenta y las notificaciones.</p>
      {showAIToggle && <AIAssistantToggle initialEnabled={aiEnabled} />}
      <NotificationPreferencesForm initial={initial} />
    </div>
  )
}
