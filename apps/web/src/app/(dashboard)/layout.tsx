import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentFirmTier } from '@/lib/auth/feature-gate'
import { DashboardShell } from './_components/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tierState = await getCurrentFirmTier()
  const tier = tierState?.tier ?? 'base'

  return (
    <DashboardShell tier={tier} email={user.email ?? ''}>
      {children}
    </DashboardShell>
  )
}
