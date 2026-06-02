'use client'

import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
  /** When true, Escape / backdrop / close-button are ignored (mutation in flight). */
  busy?: boolean
}

/**
 * Accessible modal built on the native <dialog> element.
 * showModal() gives us a focus trap, Escape-to-close, focus return to the
 * trigger, and an inert background for free — no manual focus management.
 */
export function Modal({ open, onClose, title, children, className, busy }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    if (open && !dlg.open) dlg.showModal()
    if (!open && dlg.open) dlg.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        // Escape key
        e.preventDefault()
        if (!busy) onClose()
      }}
      onClick={(e) => {
        // Clicks that land on the dialog itself (the backdrop area) close it.
        if (e.target === ref.current && !busy) onClose()
      }}
      className={cn(
        'glass-strong m-auto w-[calc(100%-2rem)] max-w-md rounded-[var(--radius-glass)] p-0 text-ink',
        'max-h-[85vh] overflow-y-auto',
        'backdrop:bg-black/50 backdrop:backdrop-blur-sm',
        className,
      )}
    >
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => !busy && onClose()}
            aria-label="Cerrar"
            className="-mr-1 -mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-ink-faint hover:text-ink focus-visible:outline-2 focus-visible:outline-[color:var(--c-violet)]"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
