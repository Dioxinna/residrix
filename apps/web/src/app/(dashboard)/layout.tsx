import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { LogoutButton } from './_components/LogoutButton'
import { Sidebar } from './_components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <aside className="w-60 flex-shrink-0 flex flex-col bg-zinc-900 border-r border-zinc-800">
        <div className="px-5 py-5 border-b border-zinc-800">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="text-white font-semibold text-sm">Residrix</span>
          </Link>
        </div>

        <Sidebar />

        <div className="px-3 py-4 border-t border-zinc-800">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs text-zinc-500 truncate">{user.email}</p>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-zinc-950">
        {children}
      </main>
    </div>
  )
}
