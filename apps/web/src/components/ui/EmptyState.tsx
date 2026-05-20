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
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-16 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 flex items-center justify-center mb-4">
        <Icon size={26} strokeWidth={1.5} className="text-zinc-500" />
      </div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-zinc-500 text-sm max-w-md mb-5">{description}</p>
      {action?.type === 'link' && (
        <Link
          href={action.href}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded"
        >
          {action.label}
        </Link>
      )}
      {action?.type === 'hint' && (
        <p className="text-xs text-zinc-600">{action.label}</p>
      )}
    </div>
  )
}
