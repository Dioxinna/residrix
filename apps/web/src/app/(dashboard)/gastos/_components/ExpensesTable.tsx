'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  EXPENSE_CATEGORY_LABEL,
  categoryTone,
  formatEuros,
  type ExpenseCategory,
} from '@/lib/expenses'
import { ExpenseDialog, type ExpenseRow } from './ExpenseDialog'

function categoryLabel(c: string): string {
  return EXPENSE_CATEGORY_LABEL[c as ExpenseCategory] ?? 'Otros'
}

function dateLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

export function ExpensesTable({
  expenses,
  communityId,
  firmId,
}: {
  expenses: ExpenseRow[]
  communityId: string
  firmId: string
}) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [deleting, startTransition] = useTransition()
  const [confirmId, setConfirmId] = useState<string | null>(null)

  function remove(id: string) {
    startTransition(async () => {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) {
        toast.error(`No se pudo borrar: ${error.message}`)
        return
      }
      toast.success('Gasto borrado')
      setConfirmId(null)
      router.refresh()
    })
  }

  if (expenses.length === 0) {
    return (
      <div className="glass rounded-xl px-6 py-16 text-center">
        <p className="text-ink-soft text-sm mb-2">No hay gastos registrados este mes.</p>
        <p className="text-ink-faint text-xs">Pulsa "Nuevo gasto" para empezar.</p>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="glass border-b border-[color:var(--glass-border)]">
          <tr className="text-left text-ink-faint text-xs uppercase tracking-wide">
            <th className="px-6 py-3 font-medium">Fecha</th>
            <th className="px-6 py-3 font-medium">Descripción</th>
            <th className="px-6 py-3 font-medium hidden md:table-cell">Categoría</th>
            <th className="px-6 py-3 font-medium hidden lg:table-cell">Proveedor</th>
            <th className="px-6 py-3 font-medium text-right">Importe</th>
            <th className="px-6 py-3 font-medium">Estado</th>
            <th className="px-6 py-3 font-medium text-right">·</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:var(--glass-border)]">
          {expenses.map((e) => (
            <tr key={e.id} className="hover:glass">
              <td className="px-6 py-3 text-ink-soft text-xs whitespace-nowrap">{dateLabel(e.expense_date)}</td>
              <td className="px-6 py-3">
                <p className="text-ink">{e.description}</p>
                {e.notes && <p className="text-ink-faint text-xs mt-0.5 line-clamp-1">{e.notes}</p>}
              </td>
              <td className="px-6 py-3 hidden md:table-cell">
                <span className={`text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded border ${categoryTone(e.category)}`}>
                  {categoryLabel(e.category)}
                </span>
              </td>
              <td className="px-6 py-3 hidden lg:table-cell text-ink-soft text-xs">
                {e.vendor_name ?? '—'}
              </td>
              <td className="px-6 py-3 text-right text-ink font-medium tabular-nums whitespace-nowrap">
                {formatEuros(e.amount_cents)}
              </td>
              <td className="px-6 py-3">
                {e.paid_at ? (
                  <span className="text-[10px] uppercase tracking-wide font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                    Pagado
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wide font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                    Pendiente
                  </span>
                )}
              </td>
              <td className="px-6 py-3 text-right">
                <div className="inline-flex items-center gap-3">
                  <ExpenseDialog
                    mode="edit"
                    communityId={communityId}
                    firmId={firmId}
                    expense={e}
                    trigger="Editar"
                  />
                  {confirmId === e.id ? (
                    <>
                      <button
                        onClick={() => remove(e.id)}
                        disabled={deleting}
                        className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        disabled={deleting}
                        className="text-xs text-ink-faint hover:text-ink-soft"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmId(e.id)}
                      className="text-ink-faint hover:text-red-400 transition-colors"
                      aria-label="Borrar gasto"
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
