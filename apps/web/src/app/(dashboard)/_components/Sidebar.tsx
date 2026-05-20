'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  AlertTriangle,
  Megaphone,
  Building2,
  Users,
  FileText,
  CreditCard,
  Settings,
  type LucideIcon,
} from 'lucide-react'

const navLinks: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/incidencias', label: 'Incidencias',  icon: AlertTriangle },
  { href: '/comunicados', label: 'Comunicados',  icon: Megaphone },
  { href: '/comunidades', label: 'Comunidades',  icon: Building2 },
  { href: '/vecinos',     label: 'Vecinos',      icon: Users },
  { href: '/documentos',  label: 'Documentos',   icon: FileText },
  { href: '/billing',     label: 'Facturación',  icon: CreditCard },
  { href: '/ajustes',     label: 'Ajustes',      icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {navLinks.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              active
                ? 'bg-indigo-500/10 text-white border-l-2 border-indigo-500 -ml-px'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Icon size={16} strokeWidth={1.75} className={active ? 'text-indigo-400' : ''} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
