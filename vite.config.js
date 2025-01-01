import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Actualiza automáticamente el Service Worker
      manifest: {
        name: 'Malim Shop', // Nombre completo de tu aplicación
        short_name: 'Malim', // Nombre corto (usado en el ícono de la app)
        description: 'App en la que puedes ver todo lo disponible en malim',
        start_url: '/', // URL inicial
        display: 'standalone', // Elimina la barra de navegación del navegador
        background_color: '#ffffff', // Color de fondo de la pantalla de carga
        theme_color: '#000000', // Color del tema de la aplicación
        icons: [
          {
            src: '/icon.png', // Ruta del ícono de 192x192
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon.png', // Ruta del ícono de 512x512
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
});