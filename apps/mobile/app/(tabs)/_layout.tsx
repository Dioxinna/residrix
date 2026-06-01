import { Tabs } from 'expo-router'
import { StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import { House, TriangleAlert, FileText, Settings } from 'lucide-react-native'
import { colors } from '@/constants/theme'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.glassline,
          backgroundColor: 'transparent',
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <House color={color} size={size} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="mis-incidencias"
        options={{
          title: 'Incidencias',
          tabBarIcon: ({ color, size }) => <TriangleAlert color={color} size={size} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="documentos"
        options={{
          title: 'Documentos',
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} strokeWidth={1.75} />,
        }}
      />
    </Tabs>
  )
}
