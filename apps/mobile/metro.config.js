const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

const config = getDefaultConfig(__dirname)

// Force all react-native-screens requires to use the single 4.16.0 version
// This prevents pnpm's multiple store copies of @react-navigation/native-stack
// (which reference 4.25.1) from being loaded instead of the correct 4.16.0.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-screens': path.resolve(__dirname, 'node_modules/react-native-screens'),
}

module.exports = withNativeWind(config, { input: './global.css' })
