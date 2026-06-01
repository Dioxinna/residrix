import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Plus, CheckCircle2 } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { IncidenceCard } from '@/components/IncidenceCard'
import { AnnouncementCard, type Announcement } from '@/components/AnnouncementCard'
import { AuroraBackground } from '@/components/AuroraBackground'
import { colors } from '@/constants/theme'

interface Incidence {
  id: string
  title: string
  category: string
  urgency: string
  status: string
  created_at: string
}

type FeedItem =
  | { kind: 'header'; id: string; title: string }
  | { kind: 'announcement'; id: string; data: Announcement }
  | { kind: 'incidence'; id: string; data: Incidence }
  | { kind: 'empty-incidences'; id: string }

export default function HomeScreen() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [incidences, setIncidences] = useState<Incidence[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('community_id')
      .eq('id', user.id)
      .single()

    if (!profile?.community_id) {
      setLoading(false)
      return
    }

    const [incRes, annRes] = await Promise.all([
      supabase
        .from('incidences')
        .select('id, title, category, urgency, status, created_at')
        .eq('community_id', profile.community_id)
        .order('created_at', { ascending: false }),
      supabase
        .from('announcements')
        .select('id, title, body, severity, created_at')
        .eq('community_id', profile.community_id)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    setIncidences(incRes.data ?? [])
    setAnnouncements((annRes.data as Announcement[] | null) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleRefresh() {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <AuroraBackground />
        <ActivityIndicator color={colors.brand} />
      </View>
    )
  }

  const items: FeedItem[] = []
  if (announcements.length > 0) {
    items.push({ kind: 'header', id: 'h-ann', title: 'Comunicados' })
    for (const a of announcements) items.push({ kind: 'announcement', id: a.id, data: a })
  }
  items.push({ kind: 'header', id: 'h-inc', title: 'Incidencias' })
  if (incidences.length === 0) {
    items.push({ kind: 'empty-incidences', id: 'empty' })
  } else {
    for (const i of incidences) items.push({ kind: 'incidence', id: i.id, data: i })
  }

  return (
    <View className="flex-1">
      <AuroraBackground />
      <View className="px-5 pt-16 pb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-ink text-2xl font-bold">Comunidad</Text>
          <Text className="text-ink-soft text-sm mt-0.5">Actividad de tu comunidad</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/incidencias/nueva')}
          className="bg-brand rounded-2xl w-11 h-11 items-center justify-center"
          style={{ shadowColor: colors.brand, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 }}
          activeOpacity={0.85}
        >
          <Plus color="#fff" size={22} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.brand} />}
        renderItem={({ item }) => {
          if (item.kind === 'header') {
            return (
              <Text className="text-ink-faint text-xs uppercase tracking-wide font-semibold mt-3 mb-2 px-1">
                {item.title}
              </Text>
            )
          }
          if (item.kind === 'announcement') {
            return <AnnouncementCard announcement={item.data} />
          }
          if (item.kind === 'empty-incidences') {
            return (
              <View className="items-center justify-center py-12">
                <CheckCircle2 color={colors.emerald} size={40} strokeWidth={1.5} />
                <Text className="text-ink font-semibold text-base mt-3">Todo en orden</Text>
                <Text className="text-ink-faint text-sm mt-1 text-center">No hay incidencias activas</Text>
              </View>
            )
          }
          return (
            <IncidenceCard
              id={item.data.id}
              title={item.data.title}
              category={item.data.category}
              urgency={item.data.urgency}
              status={item.data.status}
              createdAt={item.data.created_at}
            />
          )
        }}
      />
    </View>
  )
}
