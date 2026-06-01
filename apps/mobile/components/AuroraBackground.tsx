import { View, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors } from '@/constants/theme'

/** Fondo aurora estático: gradiente base + blobs de color pálidos.
 *  Se coloca detrás del contenido de cada pantalla (absolute fill). */
export function AuroraBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[colors.base2, colors.base]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={{
          position: 'absolute',
          top: -90,
          left: -70,
          width: 320,
          height: 320,
          borderRadius: 160,
          backgroundColor: colors.brand,
          opacity: 0.16,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: -120,
          right: -90,
          width: 340,
          height: 340,
          borderRadius: 170,
          backgroundColor: colors.violet,
          opacity: 0.13,
        }}
      />
    </View>
  )
}
