'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Upload } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

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
        className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-soft text-white text-sm font-medium px-4 py-2 rounded"
      >
        <Upload size={14} /> Subir audio
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Subir audio de junta"
        busy={pending}
      >
        <form onSubmit={submit} className="space-y-4">
          <p className="text-xs text-ink-faint">
            Formatos: mp3, m4a, mp4, wav, webm, ogg, flac. Máx 25 MB.
          </p>

          <Field label="Comunidad">
            <select
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
              disabled={pending}
              className="w-full bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-[color:var(--c-violet)]"
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
              className="w-full bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-[color:var(--c-violet)]"
            />
          </Field>

          <Field label="Fecha de la junta">
            <input
              type="date"
              required
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              disabled={pending}
              className="w-full bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-[color:var(--c-violet)]"
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
              className="w-full text-xs text-ink-soft file:mr-3 file:rounded file:border-0 file:bg-brand file:hover:bg-brand-soft file:text-white file:text-xs file:font-medium file:px-3 file:py-1.5 focus-visible:outline-2 focus-visible:outline-[color:var(--c-violet)]"
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
              className="bg-brand hover:bg-brand-soft disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded"
            >
              {pending ? 'Subiendo…' : 'Subir y procesar'}
            </button>
          </div>
        </form>
      </Modal>
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
