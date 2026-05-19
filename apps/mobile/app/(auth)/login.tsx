import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'

export default function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor introduce email y contraseña')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      Alert.alert('Error al iniciar sesión', error.message)
      return
    }
    router.replace('/(tabs)')
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-zinc-950">
      <ScrollView contentContainerClassName="flex-grow justify-center px-6">
        <View className="items-center mb-10">
          <View className="w-14 h-14 rounded-2xl bg-indigo-600 items-center justify-center mb-4">
            <Text className="text-white font-bold text-2xl">R</Text>
          </View>
          <Text className="text-white text-2xl font-bold">Residrix</Text>
          <Text className="text-zinc-400 text-sm mt-1">Tu comunidad, siempre conectada</Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-zinc-300 text-sm font-medium mb-2">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="vecino@comunidad.es"
              placeholderTextColor="#71717a"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3.5 text-white text-sm"
            />
          </View>
          <View>
            <Text className="text-zinc-300 text-sm font-medium mb-2">Contraseña</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#71717a"
              secureTextEntry
              className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3.5 text-white text-sm"
            />
          </View>
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="bg-indigo-600 rounded-xl py-4 items-center mt-2 disabled:opacity-50"
          >
            <Text className="text-white font-semibold text-base">
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/onboarding')} className="items-center mt-2">
            <Text className="text-zinc-500 text-sm">
              ¿Tienes un código de invitación? <Text className="text-indigo-400">Únete aquí</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
