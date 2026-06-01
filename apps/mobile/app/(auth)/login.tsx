import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { AuroraBackground } from '@/components/AuroraBackground'
import { colors } from '@/constants/theme'

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
    <View className="flex-1">
      <AuroraBackground />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow justify-center px-6">
          <View className="items-center mb-10">
            <Image
              source={require('../../assets/brand/logo.png')}
              style={{ width: 150, height: 150, resizeMode: 'contain', marginBottom: 8 }}
            />
            <Text className="text-ink-soft text-sm">Tu comunidad, siempre conectada</Text>
          </View>

          <View style={{ gap: 16 }}>
            <View>
              <Text className="text-ink-soft text-sm font-medium mb-2">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="vecino@comunidad.es"
                placeholderTextColor={colors.inkFaint}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="rounded-xl px-4 py-3.5 text-ink text-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: colors.glassBorder }}
              />
            </View>
            <View>
              <Text className="text-ink-soft text-sm font-medium mb-2">Contraseña</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.inkFaint}
                secureTextEntry
                className="rounded-xl px-4 py-3.5 text-ink text-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: colors.glassBorder }}
              />
            </View>
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
              className="bg-brand rounded-xl py-4 items-center mt-2"
              style={{
                opacity: loading ? 0.5 : 1,
                shadowColor: colors.brand, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 4,
              }}
            >
              <Text className="text-white font-semibold text-base">
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(auth)/onboarding')} className="items-center mt-2">
              <Text className="text-ink-faint text-sm">
                ¿Tienes un código de invitación? <Text className="text-brand font-medium">Únete aquí</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
