# Residrix

SaaS B2B para administradores de fincas en España. Gestión de incidencias en comunidades de propietarios con clasificación automática vía IA, panel web para administradores y app móvil para vecinos.

## Stack

- **Web** — Next.js 16 (App Router) + Tailwind v4 + React 19
- **Mobile** — Expo SDK 54 + React Native 0.81 + Expo Router + NativeWind
- **Backend** — Supabase (Postgres + Auth + Realtime + Storage)
- **IA** — Anthropic Claude (Haiku para clasificación, Sonnet para resúmenes)
- **Infra** — Vercel + pnpm workspaces + Turborepo

## Estructura del monorepo

```
apps/
  web/              # @residrix/web   — panel admin (Next.js)
  mobile/           # @residrix/mobile — app vecinos (Expo)
packages/
  types/            # @residrix/types — interfaces TS compartidas
  supabase/         # @residrix/supabase — cliente + schema.sql
supabase/           # migraciones locales
```

## Requisitos

- Node.js >= 20
- pnpm 9
- Cuenta de Supabase
- API key de Anthropic
- (opcional) Expo Go en el móvil para probar la app

## Setup

```bash
pnpm install
```

Crea los archivos de entorno:

**`apps/web/.env.local`**
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...
```

**`apps/mobile/.env.local`**
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Aplica el schema en Supabase desde `packages/supabase/src/schema.sql`.

## Scripts

```bash
pnpm dev          # arranca web + mobile en paralelo (Turborepo)
pnpm web          # solo Next.js
pnpm mobile       # solo Expo
pnpm build        # build de producción
pnpm type-check   # tsc --noEmit en todo el workspace
```

## Estado

- ✅ Fase 1 — Scaffold del monorepo, schema Supabase, endpoint IA
- ✅ Fase 2 — Panel web: auth, listado de incidencias, detalle con chat en tiempo real
- ✅ Fase 3 — App móvil: auth con código de invitación, feed, nueva incidencia con foto + clasificación IA, detalle con chat realtime

## Licencia

Propietaria. Todos los derechos reservados.
