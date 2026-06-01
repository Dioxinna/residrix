import { useEffect, useState, useRef, useCallback } from 'react'
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Incidence {
  id: string
  title: string
  description: string
  category: string
  urgency: string
  status: string
  ai_response: string | null
  ai_summary: string | null
  created_at: string
}

interface Message {
  id: string
  content: string
  is_internal: boolean
  created_at: string
  profiles: { full_name: string } | null
}

const urgencyLabel: Record<string, string> = { critical: 'Crítica', high: 'Alta', medium: 'Media', low: 'Baja' }
const urgencyColor: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' }
const statusLabel: Record<string, string> = {
  open: 'Abierta', in_progress: 'En progreso', pending_neighbor: 'Pdte. vecino',
  resolved: 'Resuelta', closed: 'Cerrada',
}

export default function IncidenciaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const [incidence, setIncidence] = useState<Incidence | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const fetchData = useCallback(async () => {
    const [incResult, msgsResult] = await Promise.all([
      supabase.from('incidences').select('id,title,description,category,urgency,status,ai_response,ai_summary,created_at').eq('id', id).single(),
      supabase.from('incidence_messages').select('id,content,is_internal,created_at,profiles!sender_id(full_name)').eq('incidence_id', id).eq('is_internal', false).order('created_at', { ascending: true }),
    ])
    if (incResult.data) setIncidence(incResult.data)
    setMessages((msgsResult.data ?? []) as unknown as Message[])
    setLoading(false)
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const channel = supabase
      .channel(`mobile-messages-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'incidence_messages', filter: `incidence_id=eq.${id}` },
        async (payload: { new: Record<string, unknown> }) => {
          if (payload.new.is_internal) return
          const { data } = await supabase
            .from('incidence_messages').select('id,content,is_internal,created_at,profiles!sender_id(full_name)').eq('id', payload.new.id).single()
          if (data) {
            setMessages((prev) => [...prev, data as unknown as Message])
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
          }
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  async function sendMessage() {
    if (!messageText.trim() || !user) return
    setSending(true)
    const { error } = await supabase.from('incidence_messages').insert({
      incidence_id: id, sender_id: user.id, content: messageText.trim(), is_internal: false,
    })
    setSending(false)
    if (error) { Alert.alert('Error', 'No se pudo enviar el mensaje'); return }
    setMessageText('')
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
  }

  if (loading) {
    return <View className="flex-1 bg-base items-center justify-center"><ActivityIndicator color="#7c3aed" /></View>
  }
  if (!incidence) {
    return <View className="flex-1 bg-base items-center justify-center"><Text className="text-ink-soft">Incidencia no encontrada</Text></View>
  }

  const urgColor = urgencyColor[incidence.urgency] ?? '#71717a'

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-base">
      <ScrollView ref={scrollRef} className="flex-1" contentContainerClassName="pb-4">
        <View className="px-5 py-5 border-b border-glassline">
          <View className="flex-row items-center gap-2 mb-3 flex-wrap">
            <View className="rounded-lg px-2.5 py-1" style={{ backgroundColor: `${urgColor}22` }}>
              <Text style={{ color: urgColor, fontSize: 12, fontWeight: '600' }}>{urgencyLabel[incidence.urgency]}</Text>
            </View>
            <View className="bg-base2 rounded-lg px-2.5 py-1">
              <Text className="text-ink-soft text-xs">{statusLabel[incidence.status]}</Text>
            </View>
          </View>
          <Text className="text-ink text-lg font-bold leading-snug">{incidence.title}</Text>
          <Text className="text-ink-faint text-xs mt-1">
            {format(new Date(incidence.created_at), "d 'de' MMMM yyyy", { locale: es })}
          </Text>
        </View>

        <View className="px-5 py-5 border-b border-glassline">
          <Text className="text-ink-soft text-xs uppercase tracking-wide mb-2">Descripción</Text>
          <Text className="text-ink-soft text-sm leading-relaxed">{incidence.description}</Text>
        </View>

        {incidence.ai_response && (
          <View className="mx-5 my-4 bg-violet-950/50 border border-violet-800/40 rounded-2xl p-4">
            <Text className="text-violet-400 text-xs font-semibold uppercase tracking-wide mb-2">✦ Respuesta automática</Text>
            {incidence.ai_summary && (
              <Text className="text-ink-soft text-xs italic mb-2">{incidence.ai_summary}</Text>
            )}
            <Text className="text-violet-100 text-sm leading-relaxed">{incidence.ai_response}</Text>
            {!messageText && (
              <TouchableOpacity onPress={() => setMessageText(incidence.ai_response!)} className="mt-3">
                <Text className="text-violet-400 text-xs">Usar como respuesta →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View className="px-5 pt-4">
          <Text className="text-ink-soft text-xs uppercase tracking-wide mb-3">Mensajes ({messages.length})</Text>
          {messages.length === 0 && (
            <Text className="text-ink-faint text-sm text-center py-6">No hay mensajes aún</Text>
          )}
          {messages.map((msg) => {
            const isOwn = msg.profiles?.full_name === user?.email
            return (
              <View key={msg.id} className={`mb-4 max-w-[85%] ${isOwn ? 'self-end' : 'self-start'}`}>
                <View className={`rounded-2xl px-4 py-3 ${isOwn ? 'bg-violet-600' : 'bg-base2'}`}>
                  <Text className={`text-sm leading-relaxed ${isOwn ? 'text-ink' : 'text-ink'}`}>{msg.content}</Text>
                </View>
                <Text className="text-ink-faint text-xs mt-1 px-1">
                  {msg.profiles?.full_name ?? '—'} · {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: es })}
                </Text>
              </View>
            )
          })}
        </View>
      </ScrollView>

      <View className="px-5 py-3 border-t border-glassline flex-row items-end gap-3">
        <TextInput
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#52525b"
          multiline
          className="flex-1 bg-surface border border-glassline rounded-2xl px-4 py-3 text-ink text-sm"
          style={{ maxHeight: 100 }}
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={sending || !messageText.trim()}
          className="bg-violet-600 rounded-2xl w-11 h-11 items-center justify-center disabled:opacity-50"
        >
          {sending ? <ActivityIndicator color="white" size="small" /> : <Text className="text-ink text-lg">↑</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}
