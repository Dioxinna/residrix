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
  Wallet,
  Sparkles,
  Truck,
  Receipt,
  Mic,
  BarChart3,
  CreditCard,
  Settings,
  Lock,
  type LucideIcon,
} from 'lucide-react'
import type { TierKey } from '@/lib/stripe'
import { tierIncludes, FEATURE_MIN_TIER, TIER_NAME, type FeatureKey } from '@/lib/features'

interface NavLink {
  href: string
  label: string
  icon: LucideIcon
  feature?: FeatureKey
}

const navLinks: NavLink[] = [
  { href: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/incidencias',   label: 'Incidencias',  icon: AlertTriangle, feature: 'incidents' },
  { href: '/asistente-ia',  label: 'Asistente IA', icon: Sparkles,      feature: 'ai_assistant' },
  { href: '/comunicados',   label: 'Comunicados',  icon: Megaphone,     feature: 'announcements' },
  { href: '/comunidades',   label: 'Comunidades',  icon: Building2 },
  { href: '/vecinos',       label: 'Vecinos',      icon: Users },
  { href: '/documentos',    label: 'Documentos',   icon: FileText,      feature: 'documents' },
  { href: '/gastos',        label: 'Gastos',       icon: Wallet,        feature: 'expenses' },
  { href: '/proveedores',   label: 'Proveedores',  icon: Truck,         feature: 'providers' },
  { href: '/liquidaciones', label: 'Liquidaciones', icon: Receipt,      feature: 'settlements' },
  { href: '/juntas',        label: 'Juntas',       icon: Mic,           feature: 'meeting_transcripts' },
  { href: '/informes',      label: 'Informes',     icon: BarChart3,     feature: 'auto_reports' },
  { href: '/billing',       label: 'Facturación',  icon: CreditCard },
  { href: '/ajustes',       label: 'Ajustes',      icon: Settings },
]

export function Sidebar({ tier }: { tier: TierKey }) {
  const pathname = usePathname()
  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {navLinks.map(({ href, label, icon: Icon, feature }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        const locked = feature ? !tierIncludes(tier, feature) : false
        const minTier = feature ? FEATURE_MIN_TIER[feature] : null
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              active
                ? 'bg-indigo-500/10 text-white border-l-2 border-indigo-500 -ml-px'
                : locked
                  ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title={locked && minTier ? `Disponible en plan ${TIER_NAME[minTier]}` : undefined}
          >
            <Icon size={16} strokeWidth={1.75} className={active ? 'text-indigo-400' : ''} />
            <span className="flex-1">{label}</span>
            {locked && minTier && (
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-zinc-500">
                <Lock size={10} strokeWidth={2.5} />
                {TIER_NAME[minTier]}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
