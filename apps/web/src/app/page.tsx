import Link from 'next/link'
import {
  AlertTriangle, Megaphone, FileText, Smartphone, Bell, ShieldCheck,
  Sparkles, type LucideIcon,
} from 'lucide-react'
import { TIERS, TIER_ORDER } from '@/lib/stripe'
import { GlassCard, GlassButton, Eyebrow } from '@/components/ui/glass'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { BrowserMockup, PhoneMockup } from '@/components/ui/mockups'

export const metadata = {
  title: 'Residrix — Software para administradores de fincas',
  description:
    'Gestión completa de comunidades: incidencias con IA, comunicados, documentación, app para vecinos. Empieza gratis.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen text-ink">
      <Nav />
      <Hero />
      <MobileShowcase />
      <HowItWorks />
      <Features />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  )
}

function Nav() {
  return (
    <nav className="sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <div className="glass rounded-full px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center depth">
                <span className="text-white font-bold">R</span>
              </div>
              <span className="text-ink font-semibold tracking-tight">Residrix</span>
            </Link>
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-1.5">
            <Link href="/login" className="text-sm text-ink-soft hover:text-ink px-4 py-2 rounded-full transition-colors">
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-brand hover:-translate-y-0.5 text-white px-4 py-2 rounded-full font-medium depth lift hover:glow-brand"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-20 pb-0">
      {/* Floating product fragments — desktop only, decorative */}
      <FloatingFragments />

      <div className="relative max-w-4xl mx-auto text-center">
        <div className="rise" style={{ animationDelay: '0ms' }}>
          <Eyebrow className="mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-soft animate-pulse" />
            Software para administradores de fincas
          </Eyebrow>
        </div>
        <h1 className="rise font-[family-name:var(--font-display)] text-[clamp(2.75rem,8vw,5.5rem)] font-bold tracking-[-0.04em] leading-[0.98] mb-7" style={{ animationDelay: '80ms' }}>
          <span className="text-gradient">Toda tu comunidad,</span>
          <br />
          <span className="text-ink">en una plataforma</span>
        </h1>
        <p className="rise text-lg text-ink-soft max-w-xl mx-auto mb-10 leading-relaxed" style={{ animationDelay: '160ms' }}>
          Incidencias con IA, comunicados, documentación y una app para que los vecinos
          se comuniquen contigo sin saturar el teléfono.
        </p>
        <div className="rise flex items-center justify-center gap-3 flex-wrap" style={{ animationDelay: '240ms' }}>
          <GlassButton href="/signup">Empezar gratis →</GlassButton>
          <GlassButton href="#pricing" variant="ghost">Ver precios</GlassButton>
        </div>
        <p className="rise text-xs text-ink-faint mt-5" style={{ animationDelay: '320ms' }}>
          Sin tarjeta. Primera comunidad gratis para siempre.
        </p>
      </div>

      {/* Perspective product peek bleeding into the page */}
      <div className="relative max-w-5xl mx-auto mt-16 px-4" style={{ perspective: '2000px' }}>
        <div
          className="rise origin-top"
          style={{ animationDelay: '420ms', transform: 'rotateX(32deg) scale(0.96)' }}
        >
          <BrowserMockup />
        </div>
        {/* Fade mask so it dissolves into the section below */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-48"
          style={{ background: 'linear-gradient(to bottom, transparent, var(--canvas))' }}
          aria-hidden
        />
      </div>
    </section>
  )
}

function FloatingFragments() {
  return (
    <div className="hidden lg:block absolute inset-0 max-w-6xl mx-auto pointer-events-none" aria-hidden>
      {/* Incidencia card — top left */}
      <div className="float absolute top-10 left-0 w-56 glass rounded-2xl p-3.5 depth">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wide font-bold text-brand-soft bg-brand/10 px-1.5 py-0.5 rounded">Incidencia</span>
          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-300">Media</span>
        </div>
        <p className="text-xs font-medium text-ink">Gotera en el 2A</p>
        <p className="text-[10px] text-ink-faint mt-0.5">Clasificada por IA · Fontanería</p>
      </div>

      {/* Notification toast — top right */}
      <div className="float-delay absolute top-16 right-0 w-52 glass rounded-2xl p-3.5 depth">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand/15 flex items-center justify-center">
            <Bell size={15} className="text-brand" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-ink truncate">Nuevo comunicado</p>
            <p className="text-[10px] text-ink-faint">Enviado a 48 vecinos</p>
          </div>
        </div>
      </div>

      {/* AI suggestion — bottom left */}
      <div className="float-slow absolute top-[58%] left-6 w-48 glass rounded-2xl p-3 depth">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles size={13} className="text-brand" />
          <span className="text-[10px] uppercase tracking-wide font-bold text-brand-soft">Respuesta IA</span>
        </div>
        <p className="text-[11px] text-ink-soft leading-snug">"Hemos avisado al fontanero, pasará mañana…"</p>
      </div>

      {/* Stat chip — bottom right */}
      <div className="float absolute top-[60%] right-8 glass rounded-2xl px-4 py-3 depth">
        <p className="text-[10px] uppercase tracking-wide text-ink-faint">Resueltas este mes</p>
        <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-emerald-500">83%</p>
      </div>
    </div>
  )
}

function HowItWorks() {
  const steps = [
    { n: '01', title: 'Registra tu despacho', body: 'Crea tu cuenta en menos de un minuto. Sin instalaciones ni configuración.' },
    { n: '02', title: 'Añade tus comunidades', body: 'Crea tantas comunidades como gestiones y envía códigos de invitación a los vecinos.' },
    { n: '03', title: 'Los vecinos reportan, tú gestionas', body: 'Las incidencias llegan organizadas por urgencia y clasificadas con IA. Respondes desde web o móvil.' },
  ]
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold text-center mb-12 tracking-tight">
          Cómo funciona
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {steps.map((s) => (
            <GlassCard key={s.n} lift className="p-7">
              <div className="font-[family-name:var(--font-display)] text-4xl font-bold text-brand-soft/40 mb-4">
                {s.n}
              </div>
              <h3 className="text-ink font-semibold mb-2 text-lg">{s.title}</h3>
              <p className="text-ink-soft text-sm leading-relaxed">{s.body}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  )
}

function MobileShowcase() {
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <Eyebrow className="mb-5">
            <Smartphone size={13} /> App para vecinos
          </Eyebrow>
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Tus vecinos, en su bolsillo
          </h2>
          <p className="text-ink-soft leading-relaxed mb-6">
            App nativa iOS y Android. Los vecinos reportan incidencias con foto, reciben comunicados
            al instante, consultan actas y documentos. Tú dejas de recibir llamadas a deshoras.
          </p>
          <ul className="space-y-3">
            {[
              'Reportar incidencias con foto en segundos',
              'Notificaciones push de cada novedad',
              'Documentos y actas siempre a mano',
            ].map((t) => (
              <li key={t} className="flex items-center gap-3 text-sm text-ink">
                <span className="w-5 h-5 rounded-full bg-brand/15 text-brand flex items-center justify-center text-[11px] flex-shrink-0">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-center">
          <PhoneMockup />
        </div>
      </div>
    </section>
  )
}

function Features() {
  const features: { icon: LucideIcon; title: string; body: string }[] = [
    { icon: Sparkles, title: 'Incidencias con IA', body: 'Cada incidencia se clasifica automáticamente por urgencia y categoría. La IA sugiere primeras respuestas.' },
    { icon: Megaphone, title: 'Comunicados en tiempo real', body: 'Avisa a toda una comunidad con un click. Push + email a todos los vecinos según sus preferencias.' },
    { icon: FileText, title: 'Documentación compartida', body: 'Sube actas, presupuestos y normativa. Los vecinos los ven en su app. Tú controlas qué es público.' },
    { icon: AlertTriangle, title: 'Incidencias con foto', body: 'Los vecinos reportan con imagen desde la app. Llegan organizadas por urgencia a tu panel.' },
    { icon: Bell, title: 'Notificaciones inteligentes', body: 'Push y email para cada evento clave. Cada usuario decide qué quiere recibir y cómo.' },
    { icon: ShieldCheck, title: 'Multi-comunidad seguro', body: 'Cada comunidad ve solo lo suyo. RLS de Supabase. Cumple con el GDPR de un extremo a otro.' },
  ]
  return (
    <section className="max-w-6xl mx-auto px-6 py-24">
      <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold text-center mb-3 tracking-tight">
        Todo lo que necesita tu despacho
      </h2>
      <p className="text-ink-soft text-center mb-14 max-w-2xl mx-auto">
        Reemplaza el WhatsApp, los emails sueltos y los Excel. Una sola herramienta para todo.
      </p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f) => {
          const Icon = f.icon
          return (
            <GlassCard key={f.title} lift className="p-6 group">
              <div className="w-12 h-12 rounded-2xl glass-strong flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon size={20} className="text-brand" strokeWidth={1.75} />
              </div>
              <h3 className="text-ink font-semibold mb-2">{f.title}</h3>
              <p className="text-ink-soft text-sm leading-relaxed">{f.body}</p>
            </GlassCard>
          )
        })}
      </div>
    </section>
  )
}

function Pricing() {
  const tiers = TIER_ORDER.map((k) => TIERS[k])
  return (
    <section id="pricing" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold text-center mb-3 tracking-tight">
          Precios
        </h2>
        <p className="text-ink-soft text-center mb-2 max-w-2xl mx-auto">
          Por comunidad, por mes. Tu primera comunidad es gratis para siempre.
        </p>
        <p className="text-ink-faint text-sm text-center mb-14">
          Sin permanencia · IVA no incluido · Cambia o cancela cuando quieras
        </p>
        <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto items-start">
          {tiers.map((tier) => {
            const isPro = tier.key === 'pro'
            return (
              <GlassCard
                key={tier.key}
                strong={isPro}
                glow={isPro}
                lift
                className={`relative p-7 flex flex-col ${isPro ? 'md:-translate-y-3 md:scale-[1.03]' : ''}`}
              >
                {isPro && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full depth">
                    Más popular
                  </span>
                )}
                <h3 className="text-ink text-lg font-semibold mb-1">{tier.name}</h3>
                <p className="text-ink-faint text-xs mb-5">{tier.tagline}</p>
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="font-[family-name:var(--font-display)] text-4xl font-bold text-ink">{tier.pricePerCommunity} €</span>
                  <span className="text-sm text-ink-faint">/comunidad/mes</span>
                </div>
                <ul className="space-y-2.5 mb-7 text-sm text-ink-soft flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span className="mt-0.5 w-4 h-4 rounded-full bg-brand/20 text-brand-soft flex items-center justify-center text-[10px] flex-shrink-0">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`w-full text-center text-sm font-medium px-4 py-2.5 rounded-full lift hover:-translate-y-0.5 ${
                    isPro
                      ? 'bg-brand text-white depth hover:glow-brand'
                      : 'glass text-ink hover:glass-strong'
                  }`}
                >
                  Empezar
                </Link>
              </GlassCard>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-24">
      <GlassCard strong glow className="px-8 py-16 text-center overflow-hidden relative">
        <div className="absolute inset-0 -z-10 opacity-60" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.25), transparent 60%)' }} aria-hidden />
        <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-bold mb-4 tracking-tight text-gradient">
          Empieza a ahorrar horas cada semana
        </h2>
        <p className="text-ink-soft text-lg mb-9 max-w-xl mx-auto">
          Sin tarjeta. Primera comunidad gratis. Configura tu despacho en 5 minutos.
        </p>
        <GlassButton href="/signup" className="text-base px-8">Crear cuenta gratis →</GlassButton>
      </GlassCard>
    </section>
  )
}

function Footer() {
  return (
    <footer className="py-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="hairline mb-8" />
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand flex items-center justify-center">
              <span className="text-white font-bold text-xs">R</span>
            </div>
            <span className="text-ink-faint text-sm">© {new Date().getFullYear()} Residrix</span>
          </div>
          <div className="flex items-center gap-5 text-sm text-ink-faint">
            <Link href="/login" className="hover:text-ink transition-colors">Iniciar sesión</Link>
            <Link href="/signup" className="hover:text-ink transition-colors">Empezar</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
