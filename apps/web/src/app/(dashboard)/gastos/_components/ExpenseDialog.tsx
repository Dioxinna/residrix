'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  EXPENSE_CATEGORY_LABEL,
  EXPENSE_CATEGORY_ORDER,
  parseEurosToCents,
} from '@/lib/expenses'

export interface ExpenseRow {
  id: string
  amount_cents: number
  category: string
  description: string
  expense_date: string
  paid_at: string | null
  vendor_name: string | null
  notes: string | null
}

interface BaseProps {
  communityId: string
  firmId: string
  trigger: string
}

type Props =
  | (BaseProps & { mode: 'create'; expense?: never })
  | (BaseProps & { mode: 'edit'; expense: ExpenseRow })

function todayIso(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}

export function ExpenseDialog(props: Props) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const initial = props.mode === 'edit' ? props.expense : null
  const [description, setDescription] = useState(initial?.description ?? '')
  const [amount, setAmount] = useState(initial ? centsToInput(initial.amount_cents) : '')
  const [category, setCategory] = useState(initial?.category ?? 'suministros')
  const [expenseDate, setExpenseDate] = useState(initial?.expense_date ?? todayIso())
  const [paid, setPaid] = useState(initial ? Boolean(initial.paid_at) : true)
  const [paidAt, setPaidAt] = useState(initial?.paid_at ?? todayIso())
  const [vendor, setVendor] = useState(initial?.vendor_name ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  function reset() {
    if (props.mode === 'create') {
      setDescription('')
      setAmount('')
      setCategory('suministros')
      setExpenseDate(todayIso())
      setPaid(true)
      setPaidAt(todayIso())
      setVendor('')
      setNotes('')
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const cents = parseEurosToCents(amount)
    if (cents === null) {
      toast.error('Importe inválido')
      return
    }
    if (!description.trim()) {
      toast.error('Descripción obligatoria')
      return
    }

    startTransition(async () => {
      const payload = {
        amount_cents: cents,
        category,
        description: description.trim(),
        expense_date: expenseDate,
        paid_at: paid ? paidAt : null,
        vendor_name: vendor.trim() || null,
        notes: notes.trim() || null,
      }

      const { error } =
        props.mode === 'create'
          ? await supabase
              .from('expenses')
              .insert({ ...payload, community_id: props.communityId, firm_id: props.firmId })
          : await supabase.from('expenses').update(payload).eq('id', props.expense.id)

      if (error) {
        toast.error(`No se pudo guardar: ${error.message}`)
        return
      }
      toast.success(props.mode === 'create' ? 'Gasto registrado' : 'Gasto actualizado')
      reset()
      setOpen(false)
      router.refresh()
    })
  }

  const isCreate = props.mode === 'create'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          isCreate
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded'
            : 'text-indigo-400 hover:text-indigo-300 text-sm'
        }
      >
        {props.trigger}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => !pending && setOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="glass rounded-xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-ink text-lg font-semibold">
              {isCreate ? 'Nuevo gasto' : 'Editar gasto'}
            </h2>

            <Field label="Descripción">
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Factura agua marzo"
                className="w-full glass rounded px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Importe (€)">
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="125,40"
                  className="w-full glass rounded px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
                />
              </Field>
              <Field label="Categoría">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full glass rounded px-3 py-2 text-sm text-ink"
                >
                  {EXPENSE_CATEGORY_ORDER.map((c) => (
                    <option key={c} value={c}>{EXPENSE_CATEGORY_LABEL[c]}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Fecha del gasto">
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full glass rounded px-3 py-2 text-sm text-ink"
              />
            </Field>

            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={paid}
                onChange={(e) => setPaid(e.target.checked)}
                className="w-4 h-4 accent-indigo-500"
              />
              Ya pagado
            </label>

            {paid && (
              <Field label="Fecha de pago">
                <input
                  type="date"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  className="w-full glass rounded px-3 py-2 text-sm text-ink"
                />
              </Field>
            )}

            <Field label="Proveedor (opcional)">
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="Aguas de Madrid"
                className="w-full glass rounded px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
              />
            </Field>

            <Field label="Notas (opcional)">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full glass rounded px-3 py-2 text-sm text-ink placeholder:text-ink-faint resize-none"
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="text-sm px-4 py-2 rounded text-ink-soft hover:text-ink"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pending}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded"
              >
                {pending ? 'Guardando…' : isCreate ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-ink-soft mb-1">{label}</span>
      {children}
    </label>
  )
}
