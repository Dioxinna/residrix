import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?:
    | { type: 'link'; href: string; label: string }
    | { type: 'hint'; label: string }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded-xl px-6 py-16 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
        <Icon size={26} strokeWidth={1.5} className="text-brand" />
      </div>
      <h3 className="text-ink font-semibold mb-1">{title}</h3>
      <p className="text-ink-soft text-sm max-w-md mb-5">{description}</p>
      {action?.type === 'link' && (
        <Link
          href={action.href}
          className="bg-brand hover:bg-brand-soft text-white text-sm font-medium px-5 py-2.5 rounded-full"
        >
          {action.label}
        </Link>
      )}
      {action?.type === 'hint' && (
        <p className="text-xs text-ink-faint">{action.label}</p>
      )}
    </div>
  )
}
