import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  /* config options here */
}

// withSentryConfig añade la integración Sentry al build. Sin
// SENTRY_AUTH_TOKEN no se suben source maps (build sigue funcionando,
// solo los stack traces salen minificados). El runtime SDK depende de
// SENTRY_DSN, definido en instrumentation*.ts — si no está, no-op.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  // Reroutea peticiones del SDK Sentry vía /monitoring/* para evitar
  // adblockers que filtran *.sentry.io.
  tunnelRoute: '/monitoring',
  // En Sentry 10 estas opciones se anidan bajo `webpack`. Si más
  // adelante migramos a Turbopack para build, hay que rehacerlas.
  webpack: {
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: true,
  },
})
