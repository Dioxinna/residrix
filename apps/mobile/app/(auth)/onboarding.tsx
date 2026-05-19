import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'

export default function OnboardingScreen() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleJoin() {
    const trimmed = code.trim().toLowerCase()
    if (trimmed.length !== 8) {
      Alert.alert('Código inválido', 'El código de invitación tiene 8 caracteres')
      return
    }
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión primero')
      return
    }
    setLoading(true)

    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('id, community_id, role, used_by, expires_at')
      .eq('code', trimmed)
      .single()

    if (error || !invitation) {
      setLoading(false)
      Alert.alert('Código no encontrado', 'Comprueba el código e inténtalo de nuevo')
      return
    }
    if (invitation.used_by) {
      setLoading(false)
      Alert.alert('Código ya usado', 'Este código de invitación ya ha sido utilizado')
      return
    }
    if (new Date(invitation.expires_at) < new Date()) {
      setLoading(false)
      Alert.alert('Código expirado', 'Este código de invitación ha caducado')
      return
    }

    const [profileUpdate, invitationUpdate] = await Promise.all([
      supabase.from('profiles').update({ community_id: invitation.community_id, role: invitation.role }).eq('id', user.id),
      supabase.from('invitations').update({ used_by: user.id, used_at: new Date().toISOString() }).eq('id', invitation.id),
    ])

    setLoading(false)

    if (profileUpdate.error || invitationUpdate.error) {
      Alert.alert('Error', 'No se pudo procesar la invitación. Inténtalo de nuevo.')
      return
    }

    router.replace('/(tabs)')
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-zinc-950">
      <View className="flex-1 justify-center px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-8">
          <Text className="text-indigo-400 text-sm">← Volver</Text>
        </TouchableOpacity>

        <Text className="text-white text-2xl font-bold mb-2">Unirte a tu comunidad</Text>
        <Text className="text-zinc-400 text-sm mb-8">Introduce el código de invitación que te ha enviado tu administrador de fincas</Text>

        <View className="mb-4">
          <Text className="text-zinc-300 text-sm font-medium mb-2">Código de invitación</Text>
          <TextInput
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            placeholder="AB12CD34"
            placeholderTextColor="#71717a"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
            className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-4 text-white text-lg font-mono tracking-widest text-center"
          />
        </View>

        <TouchableOpacity
          onPress={handleJoin}
          disabled={loading || code.trim().length !== 8}
          className="bg-indigo-600 rounded-xl py-4 items-center disabled:opacity-50"
        >
          <Text className="text-white font-semibold text-base">
            {loading ? 'Verificando...' : 'Unirme a mi comunidad'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}
