import Link from 'next/link'
import { TIERS, TIER_ORDER } from '@/lib/stripe'

export const metadata = {
  title: 'Residrix — Software para administradores de fincas',
  description:
    'Gestión completa de comunidades: incidencias con IA, comunicados, documentación, app para vecinos. Empieza gratis.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
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
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-[#0a0a0a]/80 border-b border-zinc-900">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold">R</span>
          </div>
          <span className="text-white font-semibold">Residrix</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className="text-sm text-zinc-400 hover:text-white px-3 py-1.5">
            Iniciar sesión
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg font-medium"
          >
            Empezar gratis
          </Link>
        </div>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-6 pt-24 pb-32 text-center">
      <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6">
        Software para administradores de fincas
      </div>
      <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 max-w-3xl mx-auto">
        Toda tu comunidad,
        <br />
        <span className="text-indigo-400">en una sola plataforma</span>
      </h1>
      <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10">
        Incidencias con IA, comunicados, documentación y una app para que los vecinos
        se comuniquen contigo sin saturar el teléfono.
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Link
          href="/signup"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium"
        >
          Empezar gratis →
        </Link>
        <a
          href="#pricing"
          className="text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 px-6 py-3 rounded-lg font-medium"
        >
          Ver precios
        </a>
      </div>
      <p className="text-xs text-zinc-600 mt-4">
        Sin tarjeta. Primera comunidad gratis para siempre.
      </p>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { n: 1, title: 'Registra tu despacho', body: 'Crea tu cuenta en menos de un minuto. Sin instalaciones ni configuración.' },
    { n: 2, title: 'Añade tus comunidades', body: 'Crea tantas comunidades como gestiones y envía códigos de invitación a los vecinos.' },
    { n: 3, title: 'Los vecinos reportan, tú gestionas', body: 'Las incidencias llegan organizadas por urgencia y clasificadas con IA. Respondes desde web o móvil.' },
  ]
  return (
    <section className="border-y border-zinc-900 bg-zinc-950/40 py-20">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-12">Cómo funciona</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold mb-4">
                {s.n}
              </div>
              <h3 className="text-white font-semibold mb-2">{s.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Features() {
  const features = [
    {
      icon: '⚠️',
      title: 'Incidencias con IA',
      body: 'Cada incidencia se clasifica automáticamente por urgencia y categoría. La IA sugiere primeras respuestas.',
    },
    {
      icon: '📢',
      title: 'Comunicados en tiempo real',
      body: 'Avisa a toda una comunidad con un click. Push + email a todos los vecinos según sus preferencias.',
    },
    {
      icon: '📄',
      title: 'Documentación compartida',
      body: 'Sube actas, presupuestos y normativa. Los vecinos los ven en su app. Tú controlas qué es público.',
    },
    {
      icon: '📱',
      title: 'App nativa para vecinos',
      body: 'iOS y Android. Reportan incidencias con foto, ven comunicados, consultan documentos. Sin sobrecarga.',
    },
    {
      icon: '🔔',
      title: 'Notificaciones inteligentes',
      body: 'Push y email para cada evento clave. Cada usuario decide qué quiere recibir y cómo.',
    },
    {
      icon: '🔒',
      title: 'Multi-comunidad seguro',
      body: 'Cada comunidad ve solo lo suyo. RLS de Supabase. Cumple con el GDPR de un extremo a otro.',
    },
  ]
  return (
    <section className="max-w-6xl mx-auto px-6 py-24">
      <h2 className="text-3xl font-bold text-center mb-3">Todo lo que necesita tu despacho</h2>
      <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
        Reemplaza el WhatsApp, los emails sueltos y los Excel. Una sola herramienta para todo.
      </p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f) => (
          <div key={f.title} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="text-white font-semibold mb-2">{f.title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Pricing() {
  const tiers = TIER_ORDER.map((k) => TIERS[k])
  return (
    <section id="pricing" className="border-y border-zinc-900 bg-zinc-950/40 py-24">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-3">Precios</h2>
        <p className="text-zinc-400 text-center mb-2 max-w-2xl mx-auto">
          Por comunidad, por mes. Tu primera comunidad es gratis para siempre.
        </p>
        <p className="text-zinc-500 text-sm text-center mb-12">
          Sin permanencia · IVA no incluido · Cambia o cancela cuando quieras
        </p>
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {tiers.map((tier) => {
            const isPro = tier.key === 'pro'
            return (
              <div
                key={tier.key}
                className={`relative rounded-xl border p-6 flex flex-col ${
                  isPro
                    ? 'bg-indigo-500/5 border-indigo-500/40 md:scale-105'
                    : 'bg-zinc-900 border-zinc-800'
                }`}
              >
                {isPro && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded">
                    Más popular
                  </span>
                )}
                <h3 className="text-white text-lg font-semibold mb-1">{tier.name}</h3>
                <p className="text-zinc-500 text-xs mb-4">{tier.tagline}</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-white">{tier.pricePerCommunity} €</span>
                  <span className="text-sm text-zinc-500"> /comunidad/mes</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm text-zinc-300 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-indigo-400 mt-0.5">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`w-full text-center text-sm font-medium px-4 py-2 rounded ${
                    isPro
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      : 'border border-zinc-700 hover:border-zinc-600 text-zinc-200'
                  }`}
                >
                  Empezar
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-24 text-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-4">
        Empieza a ahorrar horas cada semana
      </h2>
      <p className="text-zinc-400 text-lg mb-8">
        Sin tarjeta. Primera comunidad gratis. Configura tu despacho en 5 minutos.
      </p>
      <Link
        href="/signup"
        className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-medium text-lg"
      >
        Crear cuenta gratis →
      </Link>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-zinc-900 py-10">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">R</span>
          </div>
          <span className="text-zinc-500 text-sm">© {new Date().getFullYear()} Residrix</span>
        </div>
        <div className="flex items-center gap-5 text-sm text-zinc-500">
          <Link href="/login" className="hover:text-zinc-300">Iniciar sesión</Link>
          <Link href="/signup" className="hover:text-zinc-300">Empezar</Link>
        </div>
      </div>
    </footer>
  )
}
