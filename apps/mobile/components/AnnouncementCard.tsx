import { View, Text } from 'react-native'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export interface Announcement {
  id: string
  title: string
  body: string
  severity: string
  created_at: string
}

const SEVERITY: Record<string, { label: string; color: string; bg: string }> = {
  info:    { label: 'Información', color: '#6366f1', bg: '#6366f122' },
  warning: { label: 'Aviso',       color: '#f59e0b', bg: '#f59e0b22' },
  urgent:  { label: 'Urgente',     color: '#ef4444', bg: '#ef444422' },
}

export function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const s = SEVERITY[announcement.severity] ?? SEVERITY.info
  return (
    <View className="bg-zinc-900 border border-zinc-800 rounded-2xl mb-3 overflow-hidden">
      <View style={{ height: 3, backgroundColor: s.color }} />
      <View className="p-4">
        <View className="flex-row items-center mb-2">
          <View
            className="rounded-md px-2 py-0.5 mr-2"
            style={{ backgroundColor: s.bg }}
          >
            <Text style={{ color: s.color, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {s.label}
            </Text>
          </View>
          <Text className="text-zinc-500 text-xs">
            {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true, locale: es })}
          </Text>
        </View>
        <Text className="text-white font-semibold text-base mb-1">{announcement.title}</Text>
        <Text className="text-zinc-300 text-sm leading-5">{announcement.body}</Text>
      </View>
    </View>
  )
}
