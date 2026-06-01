import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { AuroraBackground } from '@/components/AuroraBackground'

const CATEGORIES = [
  { value: 'plumbing',     label: 'Fontanería' },
  { value: 'electricity',  label: 'Electricidad' },
  { value: 'cleaning',     label: 'Limpieza' },
  { value: 'elevator',     label: 'Ascensor' },
  { value: 'structure',    label: 'Estructura' },
  { value: 'access',       label: 'Acceso' },
  { value: 'noise',        label: 'Ruido' },
  { value: 'other',        label: 'Otros' },
] as const

type Category = typeof CATEGORIES[number]['value']

export default function NuevaIncidenciaScreen() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('other')
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería para adjuntar una foto')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    })
    if (!result.canceled) setPhotoUri(result.assets[0].uri)
  }

  async function handleSubmit() {
    if (!title.trim()) { Alert.alert('Error', 'El título es obligatorio'); return }
    if (description.trim().length < 20) { Alert.alert('Error', 'La descripción debe tener al menos 20 caracteres'); return }
    if (!user) return

    setSubmitting(true)

    const { data: profile } = await supabase
      .from('profiles').select('community_id').eq('id', user.id).single()

    if (!profile?.community_id) {
      setSubmitting(false)
      Alert.alert('Sin comunidad', 'No estás asociado a ninguna comunidad. Usa un código de invitación.')
      return
    }

    let photoUrl: string | undefined

    if (photoUri) {
      const ext = photoUri.split('.').pop() ?? 'jpg'
      const fileName = `${user.id}/${Date.now()}.${ext}`
      const formData = new FormData()
      formData.append('file', { uri: photoUri, type: `image/${ext}`, name: fileName } as unknown as Blob)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('incidence-photos')
        .upload(fileName, formData, { contentType: `image/${ext}` })
      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = supabase.storage.from('incidence-photos').getPublicUrl(uploadData.path)
        photoUrl = publicUrl
      }
    }

    const { data: incidence, error } = await supabase
      .from('incidences')
      .insert({
        community_id: profile.community_id,
        reported_by: user.id,
        title: title.trim(),
        description: description.trim(),
        category,
        photo_url: photoUrl,
      })
      .select('id')
      .single()

    if (error || !incidence) {
      setSubmitting(false)
      Alert.alert('Error', 'No se pudo crear la incidencia. Inténtalo de nuevo.')
      return
    }

    // Clasificación IA en background (no bloqueamos al usuario)
    const apiUrl = process.env.EXPO_PUBLIC_API_URL
    if (apiUrl) {
      fetch(`${apiUrl}/api/ai/classify-incidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidenceId: incidence.id, description: description.trim() }),
      }).catch(() => null)
    }

    setSubmitting(false)
    Alert.alert('¡Enviada!', 'Tu incidencia ha sido registrada. El administrador la revisará pronto.', [
      { text: 'Ver incidencia', onPress: () => router.replace(`/incidencias/${incidence.id}`) },
      { text: 'Volver', onPress: () => router.back() },
    ])
  }

  return (
    <View className="flex-1">
      <AuroraBackground />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <ScrollView contentContainerClassName="px-5 py-6" keyboardShouldPersistTaps="handled">
        <View className="mb-5">
          <Text className="text-ink-soft text-sm font-medium mb-2">Título *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Gotera en el techo del portal"
            placeholderTextColor="#52525b"
            className="bg-surface border border-glassline rounded-xl px-4 py-3.5 text-ink text-sm"
          />
        </View>

        <View className="mb-5">
          <Text className="text-ink-soft text-sm font-medium mb-2">Descripción * <Text className="text-ink-faint font-normal">(mín. 20 caracteres)</Text></Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe la incidencia con el mayor detalle posible..."
            placeholderTextColor="#52525b"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            className="bg-surface border border-glassline rounded-xl px-4 py-3.5 text-ink text-sm"
            style={{ minHeight: 120 }}
          />
          <Text className={`text-xs mt-1 text-right ${description.length >= 20 ? 'text-green-500' : 'text-ink-faint'}`}>
            {description.length} caracteres
          </Text>
        </View>

        <View className="mb-5">
          <Text className="text-ink-soft text-sm font-medium mb-2">Categoría</Text>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORIES.map(({ value, label }) => (
              <TouchableOpacity
                key={value}
                onPress={() => setCategory(value)}
                className={`px-3 py-2 rounded-xl border ${category === value ? 'bg-violet-600 border-violet-500' : 'bg-surface border-glassline'}`}
              >
                <Text className={`text-sm font-medium ${category === value ? 'text-ink' : 'text-ink-soft'}`}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-8">
          <Text className="text-ink-soft text-sm font-medium mb-2">Foto <Text className="text-ink-faint font-normal">(opcional)</Text></Text>
          {photoUri ? (
            <View className="relative">
              <Image source={{ uri: photoUri }} className="w-full h-48 rounded-xl" resizeMode="cover" />
              <TouchableOpacity
                onPress={() => setPhotoUri(null)}
                className="absolute top-2 right-2 bg-base/60 rounded-full w-8 h-8 items-center justify-center"
              >
                <Text className="text-ink text-sm">✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={pickPhoto}
              className="bg-surface border border-dashed border-glassline rounded-xl h-32 items-center justify-center gap-2"
            >
              <Text className="text-3xl">📷</Text>
              <Text className="text-ink-faint text-sm">Adjuntar foto</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          className="bg-violet-600 rounded-xl py-4 items-center disabled:opacity-50"
        >
          {submitting
            ? <ActivityIndicator color="white" />
            : <Text className="text-white font-semibold text-base">Enviar incidencia</Text>
          }
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
