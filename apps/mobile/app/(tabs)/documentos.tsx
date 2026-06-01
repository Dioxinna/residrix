import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Document {
  id: string
  name: string
  description: string | null
  file_url: string
  category: string
  created_at: string
}

const categoryLabel: Record<string, string> = {
  acta: 'Acta', estatutos: 'Estatutos', seguro: 'Seguro',
  presupuesto: 'Presupuesto', circular: 'Circular', other: 'Otro',
}

const categoryColor: Record<string, string> = {
  acta: '#7c3aed', estatutos: '#0ea5e9', seguro: '#10b981',
  presupuesto: '#f59e0b', circular: '#ec4899', other: '#71717a',
}

export default function DocumentosScreen() {
  const user = useAuthStore((s) => s.user)
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDocs = useCallback(async () => {
    if (!user) return
    const { data: profile } = await supabase
      .from('profiles').select('community_id').eq('id', user.id).single()
    if (!profile?.community_id) { setLoading(false); return }
    const { data } = await supabase
      .from('documents')
      .select('id, name, description, file_url, category, created_at')
      .eq('community_id', profile.community_id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
    setDocs(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  async function handleRefresh() {
    setRefreshing(true)
    await fetchDocs()
    setRefreshing(false)
  }

  async function openDoc(path: string) {
    const { data, error } = await supabase.storage
      .from('community-docs')
      .createSignedUrl(path, 60)
    if (error || !data?.signedUrl) {
      Alert.alert('Error', 'No se pudo abrir el documento')
      return
    }
    await WebBrowser.openBrowserAsync(data.signedUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      toolbarColor: '#09090b',
      controlsColor: '#7c3aed',
    })
  }

  if (loading) {
    return (
      <View className="flex-1 bg-base items-center justify-center">
        <ActivityIndicator color="#7c3aed" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-base">
      <View className="px-5 pt-14 pb-4">
        <Text className="text-ink text-xl font-bold">Documentos</Text>
        <Text className="text-ink-soft text-sm mt-0.5">Documentación de tu comunidad</Text>
      </View>

      <FlatList
        data={docs}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-5 pb-8"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#7c3aed" />}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-4xl mb-4">📁</Text>
            <Text className="text-ink font-semibold text-base">Sin documentos</Text>
            <Text className="text-ink-faint text-sm mt-1">Tu administrador no ha subido documentos aún</Text>
          </View>
        }
        renderItem={({ item }) => {
          const color = categoryColor[item.category] ?? '#71717a'
          return (
            <TouchableOpacity
              onPress={() => openDoc(item.file_url)}
              className="bg-surface border border-glassline rounded-2xl p-4 mb-3 flex-row items-center gap-4"
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${color}22` }}>
                <Text style={{ color, fontSize: 18 }}>📄</Text>
              </View>
              <View className="flex-1">
                <Text className="text-ink font-medium text-sm" numberOfLines={1}>{item.name}</Text>
                <View className="flex-row items-center gap-2 mt-1">
                  <View className="rounded-md px-1.5 py-0.5" style={{ backgroundColor: `${color}22` }}>
                    <Text style={{ color, fontSize: 10, fontWeight: '600' }}>{categoryLabel[item.category] ?? item.category}</Text>
                  </View>
                  <Text className="text-ink-faint text-xs">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: es })}
                  </Text>
                </View>
              </View>
              <Text className="text-ink-faint text-lg">›</Text>
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}
