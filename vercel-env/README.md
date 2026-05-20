# vercel-env/

Un archivo `.env` por cada Vercel environment. El script `pnpm vercel:env:sync <env>`
sube el contenido del archivo al environment correspondiente del proyecto enlazado
(`.vercel/project.json`).

## Archivos

| Archivo | Para qué sirve | Cuándo se usa |
|---|---|---|
| `production.env` | Producción real (residrix.com) | Branch `main` y producción manual (`vercel --prod`) |
| `preview.env` | Deploys de previews | Cualquier branch ≠ main al pushear |
| `development.env` | `vercel dev` local | Solo si usas el CLI `vercel dev` (no afecta `pnpm dev`) |

Los archivos con valores reales están en `.gitignore`. Los `.env.example` son
plantillas que sí se commitean.

## Uso

```bash
# Copia la plantilla, rellena los valores
cp vercel-env/production.env.example vercel-env/production.env

# Sube todo a Vercel (upsert: actualiza si existe, crea si no)
pnpm vercel:env:sync production

# Idem para los otros environments
pnpm vercel:env:sync preview
pnpm vercel:env:sync development
```

## Cómo descargar lo que ya hay en Vercel

```bash
vercel env pull vercel-env/production.env --environment=production --yes
vercel env pull vercel-env/preview.env --environment=preview --yes
vercel env pull vercel-env/development.env --environment=development --yes
```

Útil cuando alguien añade vars desde el dashboard de Vercel y quieres sincronizar
local antes de tocar nada.

## Notas

- El script usa `vercel api` directamente (POST `/v10/projects/{id}/env?upsert=true`)
  porque el CLI v52 tiene un bug con `vercel env add NAME preview --yes` que rechaza
  "all preview branches".
- `NEXT_PUBLIC_*` se sube como `plain` (visible al cliente); el resto como `encrypted`.
- Líneas vacías y comentarios (`#`) se ignoran. Variables con valor vacío se saltan
  con un mensaje.

## El `apps/web/.env.local` local sigue siendo distinto

- `apps/web/.env.local` → lo que usa `pnpm dev` localmente. Next.js lo lee automático.
- `vercel-env/*.env` → solo se usa para subir a Vercel.

Puedes mantenerlos sincronizados a mano o copiar uno desde otro cuando convenga.
