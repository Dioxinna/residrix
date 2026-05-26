// Next 16 hook: corre una vez al boot del server (nodejs runtime).
// Sentry init es no-op si SENTRY_DSN no está configurado, así que el
// código puede vivir en main sin necesidad de provisionar Sentry todavía.

import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      enabled: !!process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      environment: process.env.VERCEL_ENV ?? 'development',
      // Quita ruido: errores propios de Next o de browsers viejos.
      ignoreErrors: ['NEXT_NOT_FOUND', 'NEXT_REDIRECT'],
    })
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      enabled: !!process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      environment: process.env.VERCEL_ENV ?? 'development',
    })
  }
}

// Next 16 invoca onRequestError cuando un route handler / server
// component lanza una excepción. Sentry expone un helper que la captura
// con todo el contexto del request.
export const onRequestError = Sentry.captureRequestError
