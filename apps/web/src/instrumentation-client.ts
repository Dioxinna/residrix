// Next 16 hook: se ejecuta en el browser antes de hidratar.
// No-op si la DSN pública no está configurada.

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',
  // Replay e instrumentación pesada quedan fuera del MVP (consumen
  // cuota Sentry y peso de bundle).
})

// Captura cambios de ruta del App Router para añadirlos como breadcrumbs.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
