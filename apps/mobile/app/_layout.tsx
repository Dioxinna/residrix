import '../global.css'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { registerPushToken } from '@/lib/push'

export default function RootLayout() {
  const setSession = useAuthStore((s) => s.setSession)
  const userId = useAuthStore((s) => s.user?.id)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session as Session | null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: unknown, session: Session | null) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [setSession])

  useEffect(() => {
    if (!userId) return
    registerPushToken(userId).catch((err) => {
      console.warn('Push token registration failed:', err)
    })
  }, [userId])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="incidencias/nueva" options={{ headerShown: true, title: 'Nueva incidencia', headerBackTitle: 'Atrás' }} />
      <Stack.Screen name="incidencias/[id]" options={{ headerShown: true, title: 'Incidencia', headerBackTitle: 'Atrás' }} />
    </Stack>
  )
}
