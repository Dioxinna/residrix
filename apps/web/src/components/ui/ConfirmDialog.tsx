'use client'

import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  /** Body text. Newlines are preserved. */
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive,
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} busy={busy} className="max-w-sm">
      <p className="whitespace-pre-line text-sm text-ink-soft">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="min-h-11 rounded-full px-4 text-sm font-medium text-ink-soft hover:text-ink disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[color:var(--c-violet)]"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`min-h-11 rounded-full px-5 text-sm font-medium text-white disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 ${
            destructive
              ? 'bg-red-600 hover:bg-red-700 focus-visible:outline-red-600'
              : 'bg-brand hover:bg-brand-soft focus-visible:outline-[color:var(--c-violet)]'
          }`}
        >
          {busy ? 'Procesando…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
