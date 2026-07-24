import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// Dev proxies /api to the backend so the SPA is same-origin in every mode.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Plex Remote',
        short_name: 'Remote',
        description: 'Command-based remote for your Plex players',
        theme_color: '#0b0b0f',
        background_color: '#0b0b0f',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: { navigateFallbackDenylist: [/^\/api/] },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  server: {
    host: true,
    // Dev API target: the local container by default; point API_PROXY at
    // another instance (e.g. http://plexremote.local:31400 on media01) if the
    // local one isn't running.
    proxy: {
      '/api': { target: process.env.API_PROXY ?? 'http://127.0.0.1:31400', ws: true },
    },
  },
  build: { outDir: 'dist' },
});
