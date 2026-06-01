import Link from 'next/link'
import { TIERS, TIER_ORDER } from '@/lib/stripe'
import { GlassCard, GlassButton, Eyebrow } from '@/components/ui/glass'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

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
    <section className="max-w-5xl mx-auto px-6 pt-24 pb-32 text-center">
      <Eyebrow className="mb-8">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-soft animate-pulse" />
        Software para administradores de fincas
      </Eyebrow>
      <h1 className="font-[family-name:var(--font-display)] text-5xl md:text-7xl font-bold tracking-[-0.03em] leading-[1.02] mb-7 max-w-4xl mx-auto">
        <span className="text-gradient">Toda tu comunidad,</span>
        <br />
        <span className="text-ink">en una sola plataforma</span>
      </h1>
      <p className="text-lg text-ink-soft max-w-2xl mx-auto mb-11 leading-relaxed">
        Incidencias con IA, comunicados, documentación y una app para que los vecinos
        se comuniquen contigo sin saturar el teléfono.
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <GlassButton href="/signup">Empezar gratis →</GlassButton>
        <GlassButton href="#pricing" variant="ghost">Ver precios</GlassButton>
      </div>
      <p className="text-xs text-ink-faint mt-5">
        Sin tarjeta. Primera comunidad gratis para siempre.
      </p>
    </section>
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

function Features() {
  const features = [
    { icon: '⚠️', title: 'Incidencias con IA', body: 'Cada incidencia se clasifica automáticamente por urgencia y categoría. La IA sugiere primeras respuestas.' },
    { icon: '📢', title: 'Comunicados en tiempo real', body: 'Avisa a toda una comunidad con un click. Push + email a todos los vecinos según sus preferencias.' },
    { icon: '📄', title: 'Documentación compartida', body: 'Sube actas, presupuestos y normativa. Los vecinos los ven en su app. Tú controlas qué es público.' },
    { icon: '📱', title: 'App nativa para vecinos', body: 'iOS y Android. Reportan incidencias con foto, ven comunicados, consultan documentos. Sin sobrecarga.' },
    { icon: '🔔', title: 'Notificaciones inteligentes', body: 'Push y email para cada evento clave. Cada usuario decide qué quiere recibir y cómo.' },
    { icon: '🔒', title: 'Multi-comunidad seguro', body: 'Cada comunidad ve solo lo suyo. RLS de Supabase. Cumple con el GDPR de un extremo a otro.' },
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
        {features.map((f) => (
          <GlassCard key={f.title} lift className="p-6 group">
            <div className="w-12 h-12 rounded-2xl glass-strong flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              {f.icon}
            </div>
            <h3 className="text-ink font-semibold mb-2">{f.title}</h3>
            <p className="text-ink-soft text-sm leading-relaxed">{f.body}</p>
          </GlassCard>
        ))}
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
