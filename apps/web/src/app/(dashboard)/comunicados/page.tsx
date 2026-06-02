import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { CreateAnnouncementDialog } from './_components/CreateAnnouncementDialog'
import { AnnouncementsList } from './_components/AnnouncementsList'

interface PageProps {
  searchParams: Promise<{ community?: string }>
}

export default async function ComunicadosPage({ searchParams }: PageProps) {
  const filters = await searchParams
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, firm_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin' || !profile.firm_id) {
    return (
      <div className="px-6 py-10">
        <p className="text-ink-soft text-sm">Esta página es solo para administradores.</p>
      </div>
    )
  }

  const { data: communities } = await supabase
    .from('communities')
    .select('id, name')
    .eq('firm_id', profile.firm_id)
    .order('name')

  let query = supabase
    .from('announcements')
    .select('id, title, body, severity, created_at, community_id, communities(name), profiles!author_id(full_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (filters.community) query = query.eq('community_id', filters.community)

  const { data: announcements } = await query

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold text-ink">Comunicados</h1>
        <CreateAnnouncementDialog communities={communities ?? []} authorId={user.id} />
      </div>
      <p className="text-sm text-ink-soft mb-8">
        Avisos para toda la comunidad. Aparecen en la home del móvil y disparan notificación a los vecinos.
      </p>

      <form className="flex flex-wrap gap-2 mb-4">
        <select
          name="community"
          defaultValue={filters.community ?? ''}
          className="bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Todas las comunidades</option>
          {(communities ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] hover:bg-[color:var(--glass-border)] text-ink text-sm px-4 py-2 rounded"
        >
          Filtrar
        </button>
      </form>

      <AnnouncementsList announcements={announcements ?? []} />
    </div>
  )
}
