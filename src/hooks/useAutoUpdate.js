// Hook para actualización automática silenciosa
import { useEffect, useRef } from 'react';

const CHECK_INTERVAL = 5 * 60 * 1000; // Verificar cada 5 minutos
const VERSION_KEY = 'app_version';

export const useAutoUpdate = () => {
  const checkingRef = useRef(false);

  useEffect(() => {
    // Verificar versión del servidor vs local
    const checkVersion = async () => {
      if (checkingRef.current) return;
      checkingRef.current = true;

      try {
        // Obtener versión del servidor con cache-busting
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        if (!response.ok) {
          checkingRef.current = false;
          return;
        }

        const serverVersion = await response.json();
        const localVersion = localStorage.getItem(VERSION_KEY);

        // Si no hay versión local, guardarla (primera visita)
        if (!localVersion) {
          localStorage.setItem(VERSION_KEY, JSON.stringify(serverVersion));
          checkingRef.current = false;
          return;
        }

        // Comparar versiones
        const local = JSON.parse(localVersion);
        
        // Si el timestamp del servidor es más nuevo, hay actualización
        if (serverVersion.timestamp > local.timestamp) {
          console.log('🔄 Nueva versión detectada. Actualizando...');
          
          // Limpiar cachés
          await clearAllCaches();
          
          // Guardar nueva versión
          localStorage.setItem(VERSION_KEY, JSON.stringify(serverVersion));
          
          // Recargar la página para obtener la nueva versión
          window.location.reload(true);
        }
      } catch (error) {
        console.warn('Error checking version:', error);
      } finally {
        checkingRef.current = false;
      }
    };

    // Limpiar todos los cachés
    const clearAllCaches = async () => {
      try {
        // Limpiar service worker cache
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
          console.log('✅ Cachés del Service Worker limpiados');
        }

        // Limpiar localStorage de productos/cart viejos (excepto versión y auth)
        const keysToKeep = [VERSION_KEY, 'authToken', 'user', 'userId'];
        Object.keys(localStorage).forEach(key => {
          if (!keysToKeep.includes(key)) {
            localStorage.removeItem(key);
          }
        });

        // Si hay service worker, desregistrarlo para forzar actualización
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(reg => reg.unregister()));
          console.log('✅ Service Workers desregistrados');
        }
      } catch (error) {
        console.warn('Error clearing caches:', error);
      }
    };

    // Verificar inmediatamente al cargar
    checkVersion();

    // Verificar periódicamente
    const interval = setInterval(checkVersion, CHECK_INTERVAL);

    // Verificar cuando la ventana recupera el foco
    const handleFocus = () => {
      setTimeout(checkVersion, 1000); // Pequeño delay para evitar checks múltiples
    };
    window.addEventListener('focus', handleFocus);

    // Verificar cuando vuelve la conexión
    const handleOnline = () => {
      setTimeout(checkVersion, 2000);
    };
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, []);
};
