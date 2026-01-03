// Formulario para capturar datos adicionales del usuario (nombre y WhatsApp)
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaWhatsapp, FaCheck } from 'react-icons/fa';
import Button from '../ui/Button';

const UserDataForm = ({ onComplete, initialName = '', userEmail = '' }) => {
  const [name, setName] = useState(initialName);
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validar nombre
  const validateName = (name) => {
    return name.trim().length >= 2;
  };

  // Validar WhatsApp (10 dígitos para México)
  const validateWhatsApp = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10;
  };

  // Formatear número de WhatsApp para visualización
  const formatWhatsApp = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
  };

  // Enviar datos
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateName(name)) {
      setError('Por favor ingresa tu nombre completo');
      return;
    }

    if (!validateWhatsApp(whatsapp)) {
      setError('Por favor ingresa un número de WhatsApp válido (10 dígitos)');
      return;
    }

    setLoading(true);

    try {
      // Enviar datos al componente padre
      await onComplete({
        nombre: name.trim(),
        whatsapp: whatsapp.replace(/\D/g, ''),
        email: userEmail
      });
    } catch (err) {
      console.warn('UserDataForm submit error:', err);
      setError('Error al guardar tus datos. Intenta nuevamente.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 shadow-lg">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-4">
          <FaUser className="text-white text-2xl" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Bienvenida a Malim! 💝
        </h3>
        <p className="text-gray-600">
          Para brindarte una mejor experiencia personalizada, necesitamos algunos datos
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre completo *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="María García"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none transition-colors"
            disabled={loading}
            required
            autoFocus
          />
        </div>

        {/* WhatsApp */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaWhatsapp className="inline mr-2 text-green-500" />
            Número de WhatsApp *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              +52
            </span>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
              placeholder="123 456 7890"
              maxLength={12}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none transition-colors"
              disabled={loading}
              required
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Lo usaremos para enviarte ofertas exclusivas y novedades
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading || !validateName(name) || !validateWhatsApp(whatsapp)}
          fullWidth
          variant="primary"
          className="h-12 text-base font-semibold"
        >
          {loading ? (
            'Guardando...'
          ) : (
            <>
              <FaCheck className="mr-2" />
              Continuar
            </>
          )}
        </Button>

        {/* Privacy Note */}
        <p className="text-xs text-gray-500 text-center">
          Al continuar, aceptas que podemos contactarte vía WhatsApp con ofertas y promociones.
          Tus datos están protegidos según nuestra política de privacidad.
        </p>
      </form>
    </div>
  );
};

export default UserDataForm;
