'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { PROVIDER_LABEL, type ProviderType } from '@/lib/ai/types'

export interface ProviderRow {
  id: string
  name: string
  provider_type: string
  contact_name: string | null
  phone: string | null
  email: string | null
  notes: string | null
}

interface BaseProps {
  firmId: string
  trigger: string
}

type Props =
  | (BaseProps & { mode: 'create'; provider?: never })
  | (BaseProps & { mode: 'edit'; provider: ProviderRow })

const TYPE_OPTIONS: { value: ProviderType | 'other'; label: string }[] = [
  ...(Object.entries(PROVIDER_LABEL) as [ProviderType, string][]).map(
    ([value, label]) => ({ value, label }),
  ),
  { value: 'other', label: 'Otro' },
]

export function ProviderDialog(props: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(props.mode === 'edit' ? props.provider.name : '')
  const [type, setType] = useState(
    props.mode === 'edit' ? props.provider.provider_type : 'plumber',
  )
  const [contactName, setContactName] = useState(
    props.mode === 'edit' ? (props.provider.contact_name ?? '') : '',
  )
  const [phone, setPhone] = useState(props.mode === 'edit' ? (props.provider.phone ?? '') : '')
  const [email, setEmail] = useState(props.mode === 'edit' ? (props.provider.email ?? '') : '')
  const [notes, setNotes] = useState(props.mode === 'edit' ? (props.provider.notes ?? '') : '')

  const supabase = createSupabaseBrowserClient()

  function reset() {
    if (props.mode === 'create') {
      setName(''); setType('plumber'); setContactName(''); setPhone(''); setEmail(''); setNotes('')
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    if (!phone.trim() && !email.trim()) {
      toast.error('Necesitas teléfono o email')
      return
    }

    startTransition(async () => {
      const payload = {
        name: name.trim(),
        provider_type: type,
        contact_name: contactName.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        notes: notes.trim() || null,
      }

      const { error } =
        props.mode === 'create'
          ? await supabase.from('providers').insert({ ...payload, firm_id: props.firmId })
          : await supabase.from('providers').update(payload).eq('id', props.provider.id)

      if (error) {
        toast.error(`No se pudo guardar: ${error.message}`)
        return
      }
      toast.success(props.mode === 'create' ? 'Proveedor creado' : 'Proveedor actualizado')
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
            ? 'bg-brand hover:bg-brand-soft text-white text-sm font-medium px-4 py-2 rounded'
            : 'inline-flex items-center min-h-9 px-2 text-brand hover:text-brand-soft text-sm'
        }
      >
        {props.trigger}
      </button>

      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title={isCreate ? 'Nuevo proveedor' : 'Editar proveedor'}
        busy={pending}
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nombre o empresa">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Fontanería García SL"
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Tipo de servicio">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={INPUT_CLASS}
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Persona de contacto">
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Juan García"
              className={INPUT_CLASS}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Teléfono">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="600 000 000"
                className={INPUT_CLASS}
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@empresa.com"
                className={INPUT_CLASS}
              />
            </Field>
          </div>

          <Field label="Notas (opcional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tarifas, horarios, observaciones"
              rows={2}
              className={`${INPUT_CLASS} resize-none`}
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
              className="bg-brand hover:bg-brand-soft disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded"
            >
              {pending ? 'Guardando…' : isCreate ? 'Crear' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}

const INPUT_CLASS =
  'w-full bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-[color:var(--c-violet)]'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-ink-soft mb-1">{label}</span>
      {children}
    </label>
  )
}
