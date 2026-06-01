'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export interface CommunityRow {
  id: string
  name: string
  address: string
  city: string
  postal_code: string
  units_count: number
}

interface BaseProps {
  firmId: string
  trigger: string
}

type Props =
  | (BaseProps & { mode: 'create'; community?: never })
  | (BaseProps & { mode: 'edit'; community: CommunityRow })

export function CommunityDialog(props: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(props.mode === 'edit' ? props.community.name : '')
  const [address, setAddress] = useState(props.mode === 'edit' ? props.community.address : '')
  const [city, setCity] = useState(props.mode === 'edit' ? props.community.city : '')
  const [postal, setPostal] = useState(props.mode === 'edit' ? props.community.postal_code : '')
  const [units, setUnits] = useState(props.mode === 'edit' ? String(props.community.units_count) : '0')

  const supabase = createSupabaseBrowserClient()

  function reset() {
    if (props.mode === 'create') {
      setName(''); setAddress(''); setCity(''); setPostal(''); setUnits('0')
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const unitsNum = parseInt(units, 10)
    if (!name.trim() || !address.trim() || !city.trim() || !postal.trim()) {
      toast.error('Faltan campos obligatorios')
      return
    }
    if (isNaN(unitsNum) || unitsNum < 0) {
      toast.error('Número de unidades inválido')
      return
    }

    startTransition(async () => {
      const payload = {
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        postal_code: postal.trim(),
        units_count: unitsNum,
      }

      const { error } =
        props.mode === 'create'
          ? await supabase.from('communities').insert({ ...payload, firm_id: props.firmId })
          : await supabase.from('communities').update(payload).eq('id', props.community.id)

      if (error) {
        toast.error(`No se pudo guardar: ${error.message}`)
        return
      }
      toast.success(props.mode === 'create' ? 'Comunidad creada' : 'Comunidad actualizada')
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
            : 'text-indigo-400 hover:text-brand-soft text-sm'
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
            className="glass rounded-xl p-6 w-full max-w-md space-y-4"
          >
            <h2 className="text-ink text-lg font-semibold">
              {isCreate ? 'Nueva comunidad' : 'Editar comunidad'}
            </h2>

            <Field label="Nombre">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Edificio Mar Azul"
                className="w-full glass rounded px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
              />
            </Field>

            <Field label="Dirección">
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle Mayor 123"
                className="w-full glass rounded px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Ciudad">
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Madrid"
                  className="w-full glass rounded px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
                />
              </Field>

              <Field label="Código postal">
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  maxLength={5}
                  value={postal}
                  onChange={(e) => setPostal(e.target.value)}
                  placeholder="28001"
                  className="w-full glass rounded px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
                />
              </Field>
            </div>

            <Field label="Número de unidades">
              <input
                type="number"
                min={0}
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                className="w-full glass rounded px-3 py-2 text-sm text-ink"
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
