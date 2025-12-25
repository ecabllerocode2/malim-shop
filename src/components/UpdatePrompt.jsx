// Componente para detectar y aplicar actualizaciones automáticamente
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSync } from 'react-icons/fa';
import Button from './ui/Button';
import { usePeriodicUpdateCheck } from '../hooks/usePeriodicUpdateCheck';

const UpdatePrompt = () => {
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  // Verificar actualizaciones cada 30 minutos
  usePeriodicUpdateCheck(30);

  useEffect(() => {
    // Solo funciona en producción (cuando hay service worker)
    if ('serviceWorker' in navigator) {
      // Escuchar actualizaciones del service worker
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Hay una nueva versión disponible
              setWaitingWorker(newWorker);
              setShowPrompt(true);
            }
          });
        });
      });

      // Escuchar cuando el service worker toma control (después de actualizar)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      // Verificar si ya hay un service worker esperando
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowPrompt(true);
        }
      });
    }
  }, []);

  const updateApp = () => {
    if (waitingWorker) {
      // Enviar mensaje para que el nuevo service worker tome control
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowPrompt(false);
    }
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4"
        >
          <div className="bg-white rounded-2xl shadow-large p-5 border-2 border-primary-500">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FaSync className="w-6 h-6 text-primary-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1">
                  ¡Nueva versión disponible!
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Hay mejoras y correcciones esperándote. Actualiza para disfrutar de la última versión.
                </p>
                
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={updateApp}
                    icon={<FaSync />}
                    iconPosition="left"
                  >
                    Actualizar ahora
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPrompt(false)}
                  >
                    Más tarde
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdatePrompt;
