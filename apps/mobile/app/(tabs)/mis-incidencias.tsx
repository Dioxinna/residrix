import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, RefreshControl, ActivityIndicator } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { IncidenceCard } from '@/components/IncidenceCard'

interface Incidence {
  id: string
  title: string
  category: string
  urgency: string
  status: string
  created_at: string
}

export default function MisIncidenciasScreen() {
  const user = useAuthStore((s) => s.user)
  const [incidences, setIncidences] = useState<Incidence[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetch = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('incidences')
      .select('id, title, category, urgency, status, created_at')
      .eq('reported_by', user.id)
      .order('created_at', { ascending: false })
    setIncidences(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  async function handleRefresh() {
    setRefreshing(true)
    await fetch()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <ActivityIndicator color="#6366f1" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-zinc-950">
      <View className="px-5 pt-14 pb-4">
        <Text className="text-white text-xl font-bold">Mis incidencias</Text>
        <Text className="text-zinc-400 text-sm mt-0.5">{incidences.length} reportada{incidences.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={incidences}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-5 pb-8"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-4xl mb-4">📋</Text>
            <Text className="text-white font-semibold text-base">Sin incidencias</Text>
            <Text className="text-zinc-500 text-sm mt-1">Aún no has reportado ninguna incidencia</Text>
          </View>
        }
        renderItem={({ item }) => (
          <IncidenceCard
            id={item.id} title={item.title} category={item.category}
            urgency={item.urgency} status={item.status} createdAt={item.created_at}
          />
        )}
      />
    </View>
  )
}
