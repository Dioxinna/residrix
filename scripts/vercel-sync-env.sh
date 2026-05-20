#!/usr/bin/env bash
# Sincroniza vercel-env/<env>.env con el environment correspondiente de Vercel.
# Uso:   bash scripts/vercel-sync-env.sh {production|preview|development}
#   ó:   pnpm vercel:env:sync production
#
# Requiere `vercel` CLI logueado y `jq`.
# Lee el projectId de .vercel/project.json. Usa la Vercel API directamente
# (upsert=true) porque `vercel env add ... preview --yes` falla en CLI v52.

set -euo pipefail

ENV="${1:-}"
case "$ENV" in
  production|preview|development) ;;
  *)
    echo "Usage: $0 {production|preview|development}" >&2
    exit 1
    ;;
esac

FILE="vercel-env/${ENV}.env"
if [[ ! -f "$FILE" ]]; then
  echo "✗ No existe $FILE — cópialo de ${FILE}.example y rellena los valores" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "✗ jq no está instalado (brew install jq)" >&2
  exit 1
fi

if [[ ! -f .vercel/project.json ]]; then
  echo "✗ .vercel/project.json no existe — ejecuta primero \`vercel link\`" >&2
  exit 1
fi

PROJECT_ID=$(jq -r .projectId .vercel/project.json)

echo "→ Sincronizando $FILE con Vercel ($ENV) del proyecto $PROJECT_ID"
SUCCESS=0
FAIL=0
SKIP=0

while IFS='=' read -r key val; do
  if [[ -z "$key" || "$key" =~ ^# ]]; then continue; fi
  if [[ -z "$val" ]]; then
    SKIP=$((SKIP+1))
    echo "  - $key (vacío, skip)"
    continue
  fi
  # Quitar comillas envolventes si las hay
  val="${val%\"}"
  val="${val#\"}"

  # NEXT_PUBLIC_* va plain; el resto encrypted
  TYPE="encrypted"
  if [[ "$key" == NEXT_PUBLIC_* ]]; then TYPE="plain"; fi

  body=$(jq -nc \
    --arg k "$key" \
    --arg v "$val" \
    --arg t "$TYPE" \
    --arg e "$ENV" \
    '{key: $k, value: $v, type: $t, target: [$e]}')

  if resp=$(printf '%s' "$body" | vercel api "/v10/projects/${PROJECT_ID}/env?upsert=true" -X POST --input /dev/stdin 2>&1); then
    if echo "$resp" | jq -e '.error // empty' >/dev/null 2>&1; then
      FAIL=$((FAIL+1))
      err=$(echo "$resp" | jq -r '.error.message // .error.code // "unknown"')
      echo "  ✗ $key — $err"
    else
      SUCCESS=$((SUCCESS+1))
      echo "  ✓ $key"
    fi
  else
    FAIL=$((FAIL+1))
    echo "  ✗ $key (CLI error)"
  fi
done < "$FILE"

echo ""
echo "Resumen: $SUCCESS subidas, $SKIP vacías, $FAIL fallos"
