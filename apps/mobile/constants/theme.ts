// Paleta compartida con la web (tema light glass). Valores raw para
// usar en contextos sin className (tab bar, gradientes, status bar,
// sombras nativas).

export const colors = {
  base: '#eceeff',
  base2: '#f6f7fe',
  surface: '#ffffff',
  brand: '#7c3aed',
  brandSoft: '#6d28d9',
  violet: '#a855f7',
  cyan: '#06b6d4',
  ink: '#15151c',
  inkSoft: '#4b4b57',
  inkFaint: '#8a8a99',
  glassBg: 'rgba(255,255,255,0.62)',
  glassBorder: 'rgba(255,255,255,0.75)',
  glassline: 'rgba(20,20,40,0.08)',
  shadow: '#5046a0',
  // acentos de urgencia/estado (mismos que badges web)
  amber: '#d97706',
  red: '#dc2626',
  orange: '#ea580c',
  emerald: '#059669',
  blue: '#2563eb',
  purple: '#9333ea',
} as const

export const urgencyColor: Record<string, string> = {
  critical: colors.red,
  high: colors.orange,
  medium: colors.amber,
  low: colors.emerald,
}

export const statusColor: Record<string, string> = {
  open: colors.blue,
  in_progress: colors.purple,
  pending_neighbor: colors.amber,
  resolved: colors.emerald,
  closed: colors.inkFaint,
}
