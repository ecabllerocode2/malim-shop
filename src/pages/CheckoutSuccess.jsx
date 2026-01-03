// Página de éxito después del pago con Stripe
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaWhatsapp, FaArrowRight } from 'react-icons/fa';
import { useCart } from '../contexts/CartContext';
import Button from '../components/ui/Button';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Limpiar el carrito después de un pago exitoso (silenciosamente)
    if (sessionId) {
      clearCart(true); // true = no mostrar toast
    }
  }, [sessionId, clearCart]);

  const handleWhatsAppContact = () => {
    const phoneNumber = '525545559091';
    const message = encodeURIComponent(
      `¡Hola! Acabo de completar mi compra (ID: ${sessionId}). Me gustaría recibir detalles sobre el envío y seguimiento de mi pedido.`
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        {/* Card de éxito */}
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          {/* Icono de éxito */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-6"
          >
            <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <FaCheckCircle className="w-12 h-12 text-success" />
            </div>
          </motion.div>

          {/* Título */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-playfair text-3xl font-bold text-gray-900 mb-3"
          >
            ¡Pago Exitoso!
          </motion.h1>

          {/* Descripción */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mb-2"
          >
            Tu pedido ha sido confirmado y está en proceso.
          </motion.p>

          {sessionId && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-gray-500 mb-6"
            >
              Número de referencia: <span className="font-mono">{sessionId.slice(0, 16)}...</span>
            </motion.p>
          )}

          {/* Información adicional */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-primary-50 rounded-xl p-4 mb-6 text-left"
          >
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">
              ¿Qué sigue?
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">✓</span>
                <span>Recibirás un correo de confirmación con los detalles de tu pedido</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">✓</span>
                <span>Procesaremos tu pedido en las próximas 24-48 horas</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">✓</span>
                <span>Te contactaremos por WhatsApp para coordinar el envío</span>
              </li>
            </ul>
          </motion.div>

          {/* Botones de acción */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-3"
          >
            <Button
              variant="primary"
              fullWidth
              icon={<FaWhatsapp />}
              iconPosition="left"
              onClick={handleWhatsAppContact}
            >
              Contactar por WhatsApp
            </Button>

            <Button
              variant="outline"
              fullWidth
              icon={<FaArrowRight />}
              iconPosition="right"
              onClick={() => navigate('/')}
            >
              Volver al Inicio
            </Button>
          </motion.div>

          {/* Footer de seguridad */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-xs text-gray-500 mt-6"
          >
            Transacción procesada de forma segura por Stripe
          </motion.p>
        </div>

        {/* Link al catálogo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center mt-6"
        >
          <button
            onClick={() => navigate('/catalogo')}
            className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
          >
            Continuar comprando →
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CheckoutSuccess;
