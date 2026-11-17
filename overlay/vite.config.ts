import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { APP_VERSION } from './shared/version.ts'

// Demo build: identical UI, no Pages Functions and no contact with the network.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __BUILD_ID__: JSON.stringify('demo'),
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
})
