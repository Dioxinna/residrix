import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { InviteForm } from './_components/InviteForm'
import { InvitationsTable } from './_components/InvitationsTable'

export default async function VecinosPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('firm_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin' || !profile.firm_id) {
    return (
      <div className="px-6 py-10">
        <p className="text-zinc-400 text-sm">Esta página es solo para administradores.</p>
      </div>
    )
  }

  const { data: communities } = await supabase
    .from('communities')
    .select('id, name')
    .eq('firm_id', profile.firm_id)
    .order('name')

  const { data: invitations } = await supabase
    .from('invitations')
    .select('id, email, unit_number, code, used_at, expires_at, created_at, communities(name)')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-white mb-1">Vecinos</h1>
      <p className="text-sm text-zinc-400 mb-8">Envía códigos de invitación para que los vecinos se registren.</p>

      <section className="mb-10">
        <h2 className="text-sm font-semibold text-white mb-3">Nueva invitación</h2>
        <InviteForm communities={communities ?? []} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-white mb-3">Invitaciones recientes</h2>
        <InvitationsTable invitations={invitations ?? []} />
      </section>
    </div>
  )
}
