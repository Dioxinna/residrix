import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

/* GlassCard — frosted surface. `strong` = more opaque/blurred,
   `glow` adds a brand halo, `lift` enables hover elevation. */
export function GlassCard({
  children,
  className,
  strong,
  glow,
  lift,
  ...rest
}: {
  children: ReactNode
  className?: string
  strong?: boolean
  glow?: boolean
  lift?: boolean
} & ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        strong ? 'glass-strong' : 'glass',
        'rounded-[var(--radius-glass)]',
        glow && 'glow-soft',
        lift && 'lift hover:-translate-y-1 hover:glow-brand',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

type GlassButtonProps = {
  children: ReactNode
  className?: string
  variant?: 'primary' | 'ghost'
  href?: string
} & ComponentProps<'button'>

/* GlassButton — primary = solid brand with depth/glow; ghost = glass. */
export function GlassButton({
  children,
  className,
  variant = 'primary',
  href,
  ...rest
}: GlassButtonProps) {
  const base = cn(
    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium lift',
    variant === 'primary'
      ? 'bg-brand text-white depth hover:-translate-y-0.5 hover:glow-brand'
      : 'glass text-white/90 hover:glass-strong hover:-translate-y-0.5',
    className,
  )
  if (href) {
    return (
      <Link href={href} className={base}>
        {children}
      </Link>
    )
  }
  return (
    <button className={base} {...rest}>
      {children}
    </button>
  )
}

/* Small pill / eyebrow label */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-brand-soft',
        className,
      )}
    >
      {children}
    </span>
  )
}
