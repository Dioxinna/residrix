import { View, type ViewProps } from 'react-native'
import { colors } from '@/constants/theme'

/** Tarjeta glass (translúcida sólida para rendimiento en listas). */
export function GlassCard({ style, children, ...rest }: ViewProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.glassBg,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          shadowColor: colors.shadow,
          shadowOpacity: 0.12,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 3,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  )
}

/** Superficie glass más opaca (headers, botones primarios secundarios). */
export function GlassStrong({ style, children, ...rest }: ViewProps) {
  return (
    <View
      style={[
        {
          backgroundColor: 'rgba(255,255,255,0.78)',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          shadowColor: colors.shadow,
          shadowOpacity: 0.14,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 10 },
          elevation: 4,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  )
}
