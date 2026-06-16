import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.randohost.app',
  appName: 'RandoHost',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
