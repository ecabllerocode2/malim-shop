// Hook para verificar actualizaciones periódicamente
import { useEffect } from 'react';

export const usePeriodicUpdateCheck = (intervalMinutes = 30) => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Verificar actualizaciones al cargar
      navigator.serviceWorker.ready.then((registration) => {
        registration.update();
      });

      // Verificar periódicamente
      const interval = setInterval(() => {
        navigator.serviceWorker.ready.then((registration) => {
          registration.update();
        });
      }, intervalMinutes * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [intervalMinutes]);
};
