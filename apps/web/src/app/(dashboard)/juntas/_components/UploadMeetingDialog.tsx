'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Upload } from 'lucide-react'

const MAX_BYTES = 25 * 1024 * 1024

function todayIso(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

export function UploadMeetingDialog({
  communities,
}: {
  communities: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [communityId, setCommunityId] = useState(communities[0].id)
  const [title, setTitle] = useState('')
  const [meetingDate, setMeetingDate] = useState(todayIso())
  const fileInput = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<number | null>(null)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (!f) {
      setFileName(null)
      setFileSize(null)
      return
    }
    if (f.size > MAX_BYTES) {
      toast.error(`Archivo demasiado grande (máx 25 MB; el tuyo ${(f.size / 1024 / 1024).toFixed(1)} MB)`)
      e.target.value = ''
      return
    }
    setFileName(f.name)
    setFileSize(f.size)
  }

  function reset() {
    setTitle('')
    setMeetingDate(todayIso())
    setFileName(null)
    setFileSize(null)
    if (fileInput.current) fileInput.current.value = ''
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const file = fileInput.current?.files?.[0]
    if (!file) {
      toast.error('Selecciona un archivo de audio')
      return
    }
    if (!title.trim()) {
      toast.error('Título obligatorio')
      return
    }

    const form = new FormData()
    form.append('file', file)
    form.append('communityId', communityId)
    form.append('title', title.trim())
    form.append('meetingDate', meetingDate)

    startTransition(async () => {
      const res = await fetch('/api/meetings/upload', {
        method: 'POST',
        body: form,
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.id) {
        toast.error(body.error ?? 'No se pudo subir la junta')
        return
      }
      toast.success('Audio subido. La IA empieza a procesarlo.')
      reset()
      setOpen(false)
      router.push(`/juntas/${body.id}`)
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded"
      >
        <Upload size={14} /> Subir audio
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
            <h2 className="text-ink text-lg font-semibold">Subir audio de junta</h2>
            <p className="text-xs text-ink-faint -mt-2">
              Formatos: mp3, m4a, mp4, wav, webm, ogg, flac. Máx 25 MB.
            </p>

            <Field label="Comunidad">
              <select
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                disabled={pending}
                className="w-full glass rounded px-3 py-2 text-sm text-ink"
              >
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Título">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Junta extraordinaria marzo 2026"
                disabled={pending}
                className="w-full glass rounded px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
              />
            </Field>

            <Field label="Fecha de la junta">
              <input
                type="date"
                required
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                disabled={pending}
                className="w-full glass rounded px-3 py-2 text-sm text-ink"
              />
            </Field>

            <Field label="Archivo">
              <input
                ref={fileInput}
                type="file"
                required
                accept="audio/*,.mp3,.m4a,.mp4,.wav,.webm,.ogg,.flac"
                onChange={onFileChange}
                disabled={pending}
                className="w-full text-xs text-white-soft file:mr-3 file:rounded file:border-0 file:bg-indigo-600 file:hover:bg-indigo-500 file:text-white file:text-xs file:font-medium file:px-3 file:py-1.5"
              />
              {fileName && fileSize !== null && (
                <p className="text-xs text-ink-faint mt-1.5">
                  {fileName} · {(fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
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
                {pending ? 'Subiendo…' : 'Subir y procesar'}
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
