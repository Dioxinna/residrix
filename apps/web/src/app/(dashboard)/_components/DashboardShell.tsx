'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import type { TierKey } from '@/lib/stripe'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LogoutButton } from './LogoutButton'
import { Sidebar } from './Sidebar'

function AsideContent({ tier, email }: { tier: TierKey; email: string }) {
  return (
    <>
      <div className="px-5 py-5 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/brand/icon.png" alt="Residrix" width={28} height={28} priority className="w-7 h-7 object-contain" />
          <span className="text-ink font-semibold text-base">Residrix</span>
        </Link>
        <ThemeToggle className="w-9 h-9" />
      </div>

      <div className="hairline mx-4" />

      <Sidebar tier={tier} />

      <div className="px-3 py-4">
        <div className="hairline mb-3" />
        <div className="px-3 py-1.5 mb-1">
          <p className="text-xs text-ink-faint truncate">{email}</p>
        </div>
        <LogoutButton />
      </div>
    </>
  )
}

export function DashboardShell({
  tier,
  email,
  children,
}: {
  tier: TierKey
  email: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <div className="flex h-screen overflow-hidden p-2.5 gap-2.5">
      {/* Desktop sidebar */}
      <aside className="glass-strong w-60 flex-shrink-0 flex-col rounded-[var(--radius-glass)] overflow-hidden hidden lg:flex">
        <AsideContent tier={tier} email={email} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto glass-strong">
            <AsideContent tier={tier} email={email} />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2.5 min-w-0">
        {/* Mobile top bar */}
        <div className="glass-strong flex items-center justify-between rounded-[var(--radius-glass)] px-4 py-2.5 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={open}
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-[color:var(--c-violet)]"
          >
            <Menu size={20} />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/brand/icon.png" alt="Residrix" width={24} height={24} className="w-6 h-6 object-contain" />
            <span className="text-ink font-semibold text-sm">Residrix</span>
          </Link>
          <ThemeToggle className="w-11 h-11" />
        </div>

        <main className="glass flex-1 overflow-y-auto rounded-[var(--radius-glass)]">
          {children}
        </main>
      </div>
    </div>
  )
}
