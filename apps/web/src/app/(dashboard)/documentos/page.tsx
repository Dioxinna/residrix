import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { UploadDocumentDialog } from './_components/UploadDocumentDialog'
import { DocumentsList } from './_components/DocumentsList'

const CATEGORIES = ['acta', 'estatutos', 'seguro', 'presupuesto', 'circular', 'other'] as const

interface PageProps {
  searchParams: Promise<{ community?: string; category?: string }>
}

export default async function DocumentosPage({ searchParams }: PageProps) {
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
    .from('documents')
    .select('id, name, description, file_url, file_size, mime_type, category, is_public, created_at, communities(name)')
    .order('created_at', { ascending: false })

  if (filters.community) query = query.eq('community_id', filters.community)
  if (filters.category) query = query.eq('category', filters.category)

  const { data: documents } = await query

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold text-ink">Documentos</h1>
        <UploadDocumentDialog communities={communities ?? []} />
      </div>
      <p className="text-sm text-ink-soft mb-8">
        Sube actas, estatutos, seguros y otros documentos. Los vecinos los verán en su app.
      </p>

      <form className="flex flex-wrap gap-2 mb-4">
        <select
          name="community"
          defaultValue={filters.community ?? ''}
          className="bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-[color:var(--c-violet)]"
        >
          <option value="">Todas las comunidades</option>
          {(communities ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          name="category"
          defaultValue={filters.category ?? ''}
          className="bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-[color:var(--c-violet)]"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] hover:bg-[color:var(--glass-border)] text-ink text-sm px-4 py-2 rounded"
        >
          Filtrar
        </button>
      </form>

      <DocumentsList documents={documents ?? []} />
    </div>
  )
}
