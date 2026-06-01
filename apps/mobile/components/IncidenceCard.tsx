import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { ChevronRight } from 'lucide-react-native'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { IncidenceUrgency, IncidenceStatus, IncidenceCategory } from '@residrix/types'
import { GlassCard } from '@/components/Glass'
import { colors, urgencyColor } from '@/constants/theme'

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
  const color = urgencyColor[urgency] ?? colors.inkFaint

  return (
    <TouchableOpacity onPress={() => router.push(`/incidencias/${id}`)} activeOpacity={0.8} className="mb-3">
      <GlassCard style={{ padding: 16 }}>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-ink font-semibold text-sm leading-snug" numberOfLines={2}>{title}</Text>
            <Text className="text-ink-faint text-xs mt-1">{categoryLabel[category as IncidenceCategory] ?? category}</Text>
          </View>
          <View style={{ backgroundColor: `${color}22`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{urgencyLabel[urgency as IncidenceUrgency] ?? urgency}</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between mt-3">
          <View style={{ backgroundColor: 'rgba(20,20,40,0.05)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text className="text-ink-soft text-xs">{statusLabel[status as IncidenceStatus] ?? status}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Text className="text-ink-faint text-xs">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: es })}
            </Text>
            <ChevronRight color={colors.inkFaint} size={14} />
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  )
}
