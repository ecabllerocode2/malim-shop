// Hook para limpiar caché y probar la conexión
import { useEffect } from 'react';

export const useClearCache = () => {
  useEffect(() => {
    // Limpiar caché de productos antiguos
    const clearOldCache = () => {
      try {
        const keys = ['malim_products_v1', 'cart', 'malim-cart'];
        keys.forEach(key => {
          const item = localStorage.getItem(key);
          if (item) {
            console.log(`Caché encontrado para ${key}:`, item.substring(0, 100));
          }
        });
      } catch (e) {
        console.error('Error checking cache:', e);
      }
    };

    clearOldCache();
  }, []);
};

// Función para forzar limpieza (puedes llamarla desde la consola)
window.clearMalimCache = () => {
  localStorage.removeItem('malim_products_v1');
  console.log('✅ Caché limpiado. Recarga la página.');
};

console.log('💡 Ejecuta window.clearMalimCache() para limpiar el caché');
