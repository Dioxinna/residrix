'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Printer, Download, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export function PreviewActions({
  communityId,
  from,
  to,
  communityName,
}: {
  communityId: string
  from: string
  to: string
  communityName: string
}) {
  const [downloading, setDownloading] = useState(false)

  async function downloadCsv() {
    setDownloading(true)
    try {
      const res = await fetch('/api/liquidaciones/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityId, from, to }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? 'No se pudo generar el CSV')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const slug = communityName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      a.href = url
      a.download = `liquidacion-${slug}-${from}_${to}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="no-print mb-6 flex items-center justify-between flex-wrap gap-2">
      <Link
        href="/liquidaciones"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={14} /> Volver
      </Link>
      <div className="flex items-center gap-2">
        <button
          onClick={downloadCsv}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] hover:bg-[color:var(--glass-border)] text-ink text-sm font-medium px-3 py-1.5 rounded disabled:opacity-50"
        >
          <Download size={14} /> {downloading ? 'Generando…' : 'CSV'}
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-soft text-white text-sm font-medium px-3 py-1.5 rounded"
        >
          <Printer size={14} /> Imprimir / Guardar PDF
        </button>
      </div>
    </div>
  )
}
