import { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, Switch, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { unregisterCurrentDevice } from '@/lib/push'

type PrefKey =
  | 'push_new_incidence'
  | 'push_status_change'
  | 'push_new_message'
  | 'push_new_announcement'
  | 'email_new_incidence'
  | 'email_status_change'
  | 'email_new_message'
  | 'email_new_announcement'

type Prefs = Record<PrefKey, boolean>

const DEFAULTS: Prefs = {
  push_new_incidence: true,
  push_status_change: true,
  push_new_message: true,
  push_new_announcement: true,
  email_new_incidence: true,
  email_status_change: true,
  email_new_message: false,
  email_new_announcement: true,
}

const PUSH_ROWS: { key: PrefKey; label: string }[] = [
  { key: 'push_new_incidence', label: 'Nuevas incidencias' },
  { key: 'push_status_change', label: 'Cambios de estado' },
  { key: 'push_new_message', label: 'Nuevos mensajes' },
  { key: 'push_new_announcement', label: 'Comunicados' },
]

const EMAIL_ROWS: { key: PrefKey; label: string }[] = [
  { key: 'email_new_incidence', label: 'Nuevas incidencias' },
  { key: 'email_status_change', label: 'Cambios de estado' },
  { key: 'email_new_message', label: 'Nuevos mensajes' },
  { key: 'email_new_announcement', label: 'Comunicados' },
]

export default function AjustesScreen() {
  const router = useRouter()
  const userId = useAuthStore((s) => s.user?.id)
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const prefsRef = useRef<Prefs>(DEFAULTS)

  useEffect(() => {
    prefsRef.current = prefs
  }, [prefs])

  useEffect(() => {
    if (!userId) return
    supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPrefs({
            push_new_incidence: data.push_new_incidence,
            push_status_change: data.push_status_change,
            push_new_message: data.push_new_message,
            push_new_announcement: data.push_new_announcement,
            email_new_incidence: data.email_new_incidence,
            email_status_change: data.email_status_change,
            email_new_message: data.email_new_message,
            email_new_announcement: data.email_new_announcement,
          })
        }
        setLoading(false)
      })
  }, [userId])

  const toggle = useCallback(
    async (key: PrefKey) => {
      if (!userId) return
      const previous = prefsRef.current
      const next = { ...previous, [key]: !previous[key] }
      setPrefs(next)
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({ user_id: userId, ...next, updated_at: new Date().toISOString() })
      if (error) {
        setPrefs(previous)
        Alert.alert('Error', 'No se pudo guardar la preferencia')
      }
    },
    [userId],
  )

  const logout = useCallback(async () => {
    await unregisterCurrentDevice().catch(() => {})
    await supabase.auth.signOut()
    router.replace('/(auth)/login')
  }, [router])

  if (loading) {
    return (
      <View className="flex-1 bg-base items-center justify-center">
        <ActivityIndicator color="#7c3aed" />
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-base" contentContainerStyle={{ paddingBottom: 32 }}>
      <View className="pt-16 px-5 pb-4">
        <Text className="text-ink text-3xl font-bold">Ajustes</Text>
      </View>

      <Section title="Notificaciones push">
        {PUSH_ROWS.map((row) => (
          <Row
            key={row.key}
            label={row.label}
            value={prefs[row.key]}
            onChange={() => toggle(row.key)}
          />
        ))}
      </Section>

      <Section title="Correo electrónico">
        {EMAIL_ROWS.map((row) => (
          <Row
            key={row.key}
            label={row.label}
            value={prefs[row.key]}
            onChange={() => toggle(row.key)}
          />
        ))}
      </Section>

      <View className="px-5 pt-8">
        <TouchableOpacity
          className="bg-surface border border-red-500/30 rounded-xl py-4 items-center"
          onPress={logout}
        >
          <Text className="text-red-400 font-semibold">Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="px-5 mt-6">
      <Text className="text-ink-faint text-xs uppercase tracking-wide mb-2 px-1">{title}</Text>
      <View className="bg-surface rounded-xl overflow-hidden">{children}</View>
    </View>
  )
}

function Row({ label, value, onChange }: { label: string; value: boolean; onChange: () => void }) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3 border-b border-glassline last:border-b-0">
      <Text className="text-ink text-base flex-1">{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: '#7c3aed', false: '#3f3f46' }}
        thumbColor="#fff"
      />
    </View>
  )
}
