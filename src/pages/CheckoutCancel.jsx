// Página cuando se cancela el checkout de Stripe
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaTimesCircle, FaArrowRight, FaShoppingBag, FaWhatsapp } from 'react-icons/fa';
import Button from '../components/ui/Button';

const CheckoutCancel = () => {
  const navigate = useNavigate();

  const handleWhatsAppContact = () => {
    const phoneNumber = '525545559091';
    const message = encodeURIComponent(
      '¡Hola! Tuve un problema durante el proceso de pago y me gustaría recibir ayuda.'
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
        {/* Card de cancelación */}
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          {/* Icono de cancelación */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-6"
          >
            <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mx-auto">
              <FaTimesCircle className="w-12 h-12 text-yellow-600" />
            </div>
          </motion.div>

          {/* Título */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-playfair text-3xl font-bold text-gray-900 mb-3"
          >
            Pago Cancelado
          </motion.h1>

          {/* Descripción */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mb-6"
          >
            No te preocupes, tu pedido no se ha procesado y no se realizó ningún cargo.
          </motion.p>

          {/* Información de ayuda */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-yellow-50 rounded-xl p-4 mb-6 text-left"
          >
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">
              ¿Qué puedes hacer?
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                <span>Intenta nuevamente el proceso de pago</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                <span>Verifica tu información de pago</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                <span>Contáctanos por WhatsApp si necesitas ayuda</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                <span>Revisa tu carrito antes de continuar</span>
              </li>
            </ul>
          </motion.div>

          {/* Botones de acción */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <Button
              variant="primary"
              fullWidth
              icon={<FaShoppingBag />}
              iconPosition="left"
              onClick={() => navigate('/carrito')}
            >
              Ver Mi Carrito
            </Button>

            <Button
              variant="outline"
              fullWidth
              icon={<FaWhatsapp />}
              iconPosition="left"
              onClick={handleWhatsAppContact}
            >
              Contactar Soporte
            </Button>

            <Button
              variant="ghost"
              fullWidth
              icon={<FaArrowRight />}
              iconPosition="right"
              onClick={() => navigate('/')}
            >
              Volver al Inicio
            </Button>
          </motion.div>

          {/* Nota de seguridad */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-xs text-gray-500 mt-6"
          >
            Tus datos están seguros. No se guardó ninguna información de pago.
          </motion.p>
        </div>

        {/* Link al catálogo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
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

export default CheckoutCancel;
