import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NotificationPreferencesForm } from './_components/NotificationPreferencesForm'

export default async function AjustesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
      <h1 className="text-2xl font-semibold text-white mb-1">Ajustes</h1>
      <p className="text-sm text-zinc-400 mb-8">Gestiona qué notificaciones quieres recibir.</p>
      <NotificationPreferencesForm initial={initial} />
    </div>
  )
}
