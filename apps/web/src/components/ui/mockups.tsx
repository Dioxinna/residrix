import { AlertTriangle, Megaphone, FileText, Wallet } from 'lucide-react'

/* Stylized browser window framing a mini dashboard — built from the same
   design tokens so the preview reads as the real product. */
export function BrowserMockup() {
  return (
    <div className="glass-strong rounded-[var(--radius-glass-lg)] overflow-hidden depth w-full">
      {/* Chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[color:var(--glass-border)]">
        <span className="w-3 h-3 rounded-full bg-red-400/70" />
        <span className="w-3 h-3 rounded-full bg-amber-400/70" />
        <span className="w-3 h-3 rounded-full bg-emerald-400/70" />
        <div className="ml-3 flex-1 max-w-xs glass rounded-full px-3 py-1 text-[11px] text-ink-faint">
          residrix.com/dashboard
        </div>
      </div>
      {/* Body */}
      <div className="flex">
        {/* Mini sidebar */}
        <div className="hidden sm:flex w-36 flex-col gap-1.5 p-3 border-r border-[color:var(--glass-border)]">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg glass">
            <span className="w-4 h-4 rounded bg-brand/70" />
            <span className="h-2 w-14 rounded bg-[color:var(--glass-border)]" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1.5">
              <span className="w-4 h-4 rounded bg-[color:var(--glass-border)]" />
              <span className="h-2 rounded bg-[color:var(--glass-border)]" style={{ width: `${50 + i * 8}%` }} />
            </div>
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: 'Incidencias', value: '12', tone: 'text-brand' },
              { label: 'Gastos mes', value: '1.240 €', tone: 'text-ink' },
              { label: 'Resueltas', value: '83%', tone: 'text-emerald-500' },
            ].map((s) => (
              <div key={s.label} className="glass rounded-xl p-3">
                <p className="text-[9px] uppercase tracking-wide text-ink-faint mb-1">{s.label}</p>
                <p className={`text-lg font-semibold tabular-nums ${s.tone}`}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="glass rounded-xl divide-y divide-[color:var(--glass-border)]">
            {[
              { t: 'Gotera en el 2A', u: 'Media', c: 'text-amber-600 dark:text-amber-300 bg-amber-500/15' },
              { t: 'Inundación del portal', u: 'Alta', c: 'text-orange-600 dark:text-orange-300 bg-orange-500/15' },
              { t: 'Ruido nocturno 4B', u: 'Baja', c: 'text-emerald-600 dark:text-emerald-300 bg-emerald-500/15' },
            ].map((r) => (
              <div key={r.t} className="flex items-center justify-between px-3.5 py-2.5">
                <div>
                  <p className="text-xs font-medium text-ink">{r.t}</p>
                  <p className="text-[10px] text-ink-faint">edificio 3 · hace 2 días</p>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${r.c}`}>{r.u}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* Stylized phone framing the resident app feed. */
export function PhoneMockup() {
  const feed = [
    { icon: Megaphone, title: 'Corte de agua mañana', sub: 'Comunicado · 9:00–13:00', tone: 'text-brand' },
    { icon: AlertTriangle, title: 'Gotera en el 2A', sub: 'En progreso · Fontanería', tone: 'text-amber-500' },
    { icon: FileText, title: 'Acta junta marzo', sub: 'Documento · PDF', tone: 'text-cyan-500' },
    { icon: Wallet, title: 'Liquidación Q1', sub: 'Disponible', tone: 'text-emerald-500' },
  ]
  return (
    <div className="relative mx-auto w-[260px] glass-strong rounded-[2.5rem] p-3 depth">
      {/* Notch */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-5 rounded-full bg-[color:var(--glass-border)] z-10" />
      <div className="rounded-[2rem] overflow-hidden bg-[color:var(--c-base-2)] h-[520px] flex flex-col">
        {/* App header */}
        <div className="px-5 pt-8 pb-4">
          <p className="text-[11px] text-ink-faint">Hola, Juana</p>
          <p className="text-lg font-semibold text-ink">Tu comunidad</p>
        </div>
        {/* Feed */}
        <div className="flex-1 px-4 space-y-2.5 overflow-hidden">
          {feed.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="glass rounded-2xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl glass-strong flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className={f.tone} strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink truncate">{f.title}</p>
                  <p className="text-[11px] text-ink-faint truncate">{f.sub}</p>
                </div>
              </div>
            )
          })}
        </div>
        {/* Tab bar */}
        <div className="flex items-center justify-around px-6 py-4 border-t border-[color:var(--glass-border)]">
          {['Inicio', 'Incidencias', 'Docs', 'Ajustes'].map((t, i) => (
            <div key={t} className="flex flex-col items-center gap-1">
              <span className={`w-5 h-5 rounded-md ${i === 0 ? 'bg-brand' : 'bg-[color:var(--glass-border)]'}`} />
              <span className={`text-[8px] ${i === 0 ? 'text-brand font-medium' : 'text-ink-faint'}`}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
