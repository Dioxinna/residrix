import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { IncidenceCard } from '@/components/IncidenceCard'
import { AnnouncementCard, type Announcement } from '@/components/AnnouncementCard'

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
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <ActivityIndicator color="#6366f1" />
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
    <View className="flex-1 bg-zinc-950">
      <View className="px-5 pt-14 pb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-white text-xl font-bold">Comunidad</Text>
          <Text className="text-zinc-400 text-sm mt-0.5">Actividad de tu comunidad</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/incidencias/nueva')}
          className="bg-indigo-600 rounded-xl w-10 h-10 items-center justify-center"
        >
          <Text className="text-white text-xl font-light">+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        contentContainerClassName="px-5 pb-8"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />}
        renderItem={({ item }) => {
          if (item.kind === 'header') {
            return (
              <Text className="text-zinc-500 text-xs uppercase tracking-wide font-medium mt-2 mb-2 px-1">
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
                <Text className="text-4xl mb-3">✓</Text>
                <Text className="text-white font-semibold text-base">Todo en orden</Text>
                <Text className="text-zinc-500 text-sm mt-1 text-center">No hay incidencias activas</Text>
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
