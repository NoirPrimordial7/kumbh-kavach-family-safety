import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['legacy/kumbh-kavach-command-center.html'],
    manifest: {
      name: 'Kumbh Kavach Family Safety',
      short_name: 'Kavach',
      description: 'A private family safety network for crowded places',
      theme_color: '#6c4dff',
      background_color: '#f4f2ed',
      display: 'standalone',
      start_url: '/',
      icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
    },
    workbox: { navigateFallback: '/index.html', globPatterns: ['**/*.{js,css,html,svg,woff2}'] }
  })],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], css: true },
  build: { outDir: 'dist' }
});
