import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'

export default function OnboardingScreen() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const trimmedCode = code.trim()
  const canSubmit =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    trimmedCode.length === 8

  async function handleJoin() {
    if (!canSubmit) {
      Alert.alert('Datos incompletos', 'Rellena todos los campos. La contraseña debe tener al menos 8 caracteres y el código 8 dígitos.')
      return
    }

    const apiUrl = process.env.EXPO_PUBLIC_API_URL
    if (!apiUrl) {
      Alert.alert('Error de configuración', 'Falta EXPO_PUBLIC_API_URL')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/api/auth/signup-with-invitation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: trimmedCode.toLowerCase(),
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      })

      const payload = await res.json().catch(() => ({}))

      if (!res.ok) {
        Alert.alert('No se pudo completar el registro', payload?.error ?? 'Inténtalo de nuevo')
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (signInError) {
        Alert.alert('Cuenta creada', 'Inicia sesión con tu email y contraseña')
        router.replace('/(auth)/login')
        return
      }

      router.replace('/(tabs)')
    } catch (err) {
      console.error('Signup failed:', err)
      Alert.alert('Error de red', 'No se pudo conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-zinc-950">
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10">
        <TouchableOpacity onPress={() => router.back()} className="mb-8">
          <Text className="text-indigo-400 text-sm">← Volver</Text>
        </TouchableOpacity>

        <Text className="text-white text-2xl font-bold mb-2">Únete a tu comunidad</Text>
        <Text className="text-zinc-400 text-sm mb-8">
          Crea tu cuenta con el código de invitación que te ha enviado tu administrador de fincas
        </Text>

        <View className="mb-4">
          <Text className="text-zinc-300 text-sm font-medium mb-2">Nombre completo</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Ana García"
            placeholderTextColor="#71717a"
            autoCapitalize="words"
            className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3.5 text-white text-sm"
          />
        </View>

        <View className="mb-4">
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

        <View className="mb-4">
          <Text className="text-zinc-300 text-sm font-medium mb-2">Contraseña</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 8 caracteres"
            placeholderTextColor="#71717a"
            secureTextEntry
            className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3.5 text-white text-sm"
          />
        </View>

        <View className="mb-6">
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
          disabled={loading || !canSubmit}
          className="bg-indigo-600 rounded-xl py-4 items-center disabled:opacity-50"
        >
          <Text className="text-white font-semibold text-base">
            {loading ? 'Creando cuenta...' : 'Crear cuenta y unirme'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
