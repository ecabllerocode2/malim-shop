import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto', // Inyecta automáticamente el código de registro del SW
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'], // Incluye todos los archivos necesarios
        clientsClaim: true, // Tomar control inmediatamente
        skipWaiting: true, // Activar nuevo SW sin esperar
      },
      manifest: {
        name: 'Malim Shop',
        short_name: 'Malim',
        description: 'App en la que puedes ver todo lo disponible en malim',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
          {
            src: '/icon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
      output: { // Esta configuración es importante para evitar problemas de caché
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`
      }
    },
  },
  server: {
    watch: {
      usePolling: true,
    },
  },
});