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
    workbox: {
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      navigateFallback: '/index.html',
      navigateFallbackDenylist: [/^\/maps\//, /^\/legacy\//],
      globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      runtimeCaching: [{
        urlPattern: ({ url }) => url.pathname.endsWith('.pmtiles'),
        handler: 'NetworkOnly',
      }],
    }
  })],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], css: true, exclude: ['tests/e2e/**', 'tests/firebase/**', 'node_modules/**', 'dist/**'] },
  build: { outDir: 'dist' }
});
