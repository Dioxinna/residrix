import { View, Text } from 'react-native'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { GlassCard } from '@/components/Glass'

export interface Announcement {
  id: string
  title: string
  body: string
  severity: string
  created_at: string
}

const SEVERITY: Record<string, { label: string; color: string; bg: string }> = {
  info:    { label: 'Información', color: '#6366f1', bg: '#6366f11f' },
  warning: { label: 'Aviso',       color: '#d97706', bg: '#d977061f' },
  urgent:  { label: 'Urgente',     color: '#dc2626', bg: '#dc26261f' },
}

export function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const s = SEVERITY[announcement.severity] ?? SEVERITY.info
  return (
    <GlassCard style={{ marginBottom: 12, overflow: 'hidden' }}>
      <View style={{ height: 3, backgroundColor: s.color }} />
      <View className="p-4">
        <View className="flex-row items-center mb-2">
          <View className="rounded-md px-2 py-0.5 mr-2" style={{ backgroundColor: s.bg }}>
            <Text style={{ color: s.color, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {s.label}
            </Text>
          </View>
          <Text className="text-ink-faint text-xs">
            {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true, locale: es })}
          </Text>
        </View>
        <Text className="text-ink font-semibold text-base mb-1">{announcement.title}</Text>
        <Text className="text-ink-soft text-sm leading-5">{announcement.body}</Text>
      </View>
    </GlassCard>
  )
}
