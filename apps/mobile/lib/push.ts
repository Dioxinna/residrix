import { Platform } from 'react-native'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase'

const CURRENT_TOKEN_KEY = 'residrix.push.currentToken'

let handlerConfigured = false

function configureHandler() {
  if (handlerConfigured) return
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  })
  handlerConfigured = true
}

export async function registerPushToken(userId: string): Promise<string | null> {
  if (!Device.isDevice) return null
  configureHandler()

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#6366f1',
    })
  }

  const existing = await Notifications.getPermissionsAsync()
  let status = existing.status
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync()
    status = req.status
  }
  if (status !== 'granted') return null

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId

  if (!projectId) {
    // Sin projectId no se puede obtener un Expo push token. En Expo Go (dev)
    // esto es normal hasta configurar EAS. En producción debe estar siempre.
    return null
  }

  let token: string
  try {
    const result = await Notifications.getExpoPushTokenAsync({ projectId })
    token = result.data
  } catch (err) {
    console.warn('Push token request failed:', err)
    return null
  }

  const platform: 'ios' | 'android' | 'web' =
    Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web'

  const { error } = await supabase.from('device_tokens').upsert(
    {
      user_id: userId,
      token,
      platform,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'token' },
  )
  if (error) {
    console.warn('Push token upsert failed:', error.message)
    return null
  }

  await AsyncStorage.setItem(CURRENT_TOKEN_KEY, token)
  return token
}

export async function unregisterCurrentDevice(): Promise<void> {
  const token = await AsyncStorage.getItem(CURRENT_TOKEN_KEY)
  if (!token) return
  await supabase.from('device_tokens').delete().eq('token', token)
  await AsyncStorage.removeItem(CURRENT_TOKEN_KEY)
}
