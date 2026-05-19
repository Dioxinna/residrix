import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { IncidenceUrgency, IncidenceStatus, IncidenceCategory } from '@residrix/types'

const urgencyColor: Record<IncidenceUrgency, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#22c55e',
}

const urgencyLabel: Record<IncidenceUrgency, string> = {
  critical: 'Crítica', high: 'Alta', medium: 'Media', low: 'Baja',
}

const statusLabel: Record<IncidenceStatus, string> = {
  open:             'Abierta',
  in_progress:      'En progreso',
  pending_neighbor: 'Pdte. vecino',
  resolved:         'Resuelta',
  closed:           'Cerrada',
}

const categoryLabel: Record<IncidenceCategory, string> = {
  plumbing: 'Fontanería', electricity: 'Electricidad', cleaning: 'Limpieza',
  elevator: 'Ascensor', structure: 'Estructura', access: 'Acceso',
  noise: 'Ruido', other: 'Otros',
}

interface Props {
  id: string
  title: string
  category: string
  urgency: string
  status: string
  createdAt: string
}

export function IncidenceCard({ id, title, category, urgency, status, createdAt }: Props) {
  const router = useRouter()
  const color = urgencyColor[urgency as IncidenceUrgency] ?? '#71717a'

  return (
    <TouchableOpacity
      onPress={() => router.push(`/incidencias/${id}`)}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-3"
      activeOpacity={0.7}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-white font-semibold text-sm leading-snug" numberOfLines={2}>{title}</Text>
          <Text className="text-zinc-500 text-xs mt-1">{categoryLabel[category as IncidenceCategory] ?? category}</Text>
        </View>
        <View className="items-center" style={{ backgroundColor: `${color}22`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
          <Text style={{ color, fontSize: 11, fontWeight: '600' }}>{urgencyLabel[urgency as IncidenceUrgency] ?? urgency}</Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-3">
        <View className="bg-zinc-800 rounded-lg px-2 py-1">
          <Text className="text-zinc-400 text-xs">{statusLabel[status as IncidenceStatus] ?? status}</Text>
        </View>
        <Text className="text-zinc-600 text-xs">
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: es })}
        </Text>
      </View>
    </TouchableOpacity>
  )
}
