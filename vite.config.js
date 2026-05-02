import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Muwanshots Photography',
        short_name: 'Muwanshots',
        description: 'Professional Photography in Kampala',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',

        start_url: '.',
        scope: '/',

        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    }),
    babel({ presets: [reactCompilerPreset()] })
  ],
})