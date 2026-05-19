'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface Community {
  id: string
  name: string
}

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'acta', label: 'Acta' },
  { value: 'estatutos', label: 'Estatutos' },
  { value: 'seguro', label: 'Seguro' },
  { value: 'presupuesto', label: 'Presupuesto' },
  { value: 'circular', label: 'Circular' },
  { value: 'other', label: 'Otros' },
]

const MAX_BYTES = 20 * 1024 * 1024 // 20 MB

export function UploadDocumentDialog({ communities }: { communities: Community[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [communityId, setCommunityId] = useState(communities[0]?.id ?? '')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('other')
  const [isPublic, setIsPublic] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  const supabase = createSupabaseBrowserClient()

  function reset() {
    setName('')
    setDescription('')
    setCategory('other')
    setIsPublic(true)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!communityId || !name.trim() || !file) {
      toast.error('Faltan campos obligatorios')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('El archivo supera el límite de 20 MB')
      return
    }

    startTransition(async () => {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${communityId}/${crypto.randomUUID()}-${safeName}`

      const { error: uploadError } = await supabase.storage
        .from('community-docs')
        .upload(path, file, { contentType: file.type, upsert: false })
      if (uploadError) {
        toast.error(`Error al subir el archivo: ${uploadError.message}`)
        return
      }

      const { error: insertError } = await supabase.from('documents').insert({
        community_id: communityId,
        name: name.trim(),
        description: description.trim() || null,
        file_url: path,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
        category,
        is_public: isPublic,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id ?? '',
      })

      if (insertError) {
        await supabase.storage.from('community-docs').remove([path])
        toast.error(`Error al guardar: ${insertError.message}`)
        return
      }

      toast.success('Documento subido')
      reset()
      setOpen(false)
      router.refresh()
    })
  }

  if (communities.length === 0) {
    return (
      <button
        disabled
        className="bg-zinc-800 text-zinc-500 text-sm px-4 py-2 rounded cursor-not-allowed"
        title="Crea primero una comunidad"
      >
        Subir documento
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded"
      >
        Subir documento
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => !pending && setOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md space-y-4"
          >
            <h2 className="text-white text-lg font-semibold">Subir documento</h2>

            <Field label="Comunidad">
              <select
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white"
              >
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Nombre">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acta junta marzo 2026"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600"
              />
            </Field>

            <Field label="Descripción (opcional)">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Categoría">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Visibilidad">
                <select
                  value={isPublic ? '1' : '0'}
                  onChange={(e) => setIsPublic(e.target.value === '1')}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white"
                >
                  <option value="1">Todos los vecinos</option>
                  <option value="0">Solo admin/presidente</option>
                </select>
              </Field>
            </div>

            <Field label="Archivo (máx 20 MB)">
              <input
                ref={fileRef}
                type="file"
                required
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
                className="w-full text-sm text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-zinc-800 file:text-white file:text-xs"
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="text-sm px-4 py-2 rounded text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pending}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded"
              >
                {pending ? 'Subiendo…' : 'Subir'}
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
      <span className="block text-xs text-zinc-400 mb-1">{label}</span>
      {children}
    </label>
  )
}
