import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentFirmTier } from '@/lib/auth/feature-gate'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LogoutButton } from './_components/LogoutButton'
import { Sidebar } from './_components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tierState = await getCurrentFirmTier()
  const tier = tierState?.tier ?? 'base'

  return (
    <div className="flex h-screen overflow-hidden p-2.5 gap-2.5">
      <aside className="glass-strong w-60 flex-shrink-0 flex flex-col rounded-[var(--radius-glass)] overflow-hidden">
        <div className="px-5 py-5 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center depth">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="text-ink font-semibold text-sm">Residrix</span>
          </Link>
          <ThemeToggle className="w-7 h-7" />
        </div>

        <div className="hairline mx-4" />

        <Sidebar tier={tier} />

        <div className="px-3 py-4">
          <div className="hairline mb-3" />
          <div className="px-3 py-1.5 mb-1">
            <p className="text-xs text-ink-faint truncate">{user.email}</p>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <main className="glass flex-1 overflow-y-auto rounded-[var(--radius-glass)]">
        {children}
      </main>
    </div>
  )
}
