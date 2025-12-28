// Componente de autenticación por teléfono
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPhone, FaLock, FaTimes } from 'react-icons/fa';
import { sendVerificationCode, verifyCode } from '../../services/authService';
import Button from '../ui/Button';

const PhoneAuth = ({ onSuccess, onCancel }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validar número de teléfono (México)
  const validatePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10;
  };

  // Formatear número de teléfono para visualización
  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
  };

  // Enviar código SMS
  const handleSendCode = async () => {
    setError('');
    
    if (!validatePhone(phoneNumber)) {
      setError('Por favor ingresa un número válido de 10 dígitos');
      return;
    }

    setLoading(true);
    const result = await sendVerificationCode(phoneNumber);
    setLoading(false);

    if (result.success) {
      setCodeSent(true);
    } else {
      setError(result.error || 'Error al enviar el código. Intenta nuevamente.');
    }
  };

  // Verificar código
  const handleVerifyCode = async () => {
    setError('');
    
    if (verificationCodeInput.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setLoading(true);
    const result = await verifyCode(verificationCodeInput);
    setLoading(false);

    if (result.success) {
      onSuccess(result.user, result.idToken);
    } else {
      setError(result.error || 'Código incorrecto. Verifica e intenta nuevamente.');
    }
  };

  // Reintentar (volver a enviar código)
  const handleResend = () => {
    setCodeSent(false);
    setVerificationCodeInput('');
    setError('');
  };

  return (
    <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
            {codeSent ? (
              <FaLock className="text-white text-xl" />
            ) : (
              <FaPhone className="text-white text-xl" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {codeSent ? 'Verificar código' : 'Iniciar sesión'}
            </h3>
            <p className="text-sm text-gray-600">
              {codeSent ? 'Ingresa el código de 6 dígitos' : 'Ingresa tu número de teléfono'}
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        )}
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

      {!codeSent ? (
        /* Fase 1: Ingresar teléfono */
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de teléfono
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                +52
              </span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                placeholder="123 456 7890"
                maxLength={12}
                className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none transition-colors"
                disabled={loading}
                autoFocus
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Recibirás un código de verificación por SMS
            </p>
          </div>

          <Button
            onClick={handleSendCode}
            disabled={loading || !validatePhone(phoneNumber)}
            fullWidth
            variant="primary"
            className="h-12 text-base font-semibold"
          >
            {loading ? 'Enviando...' : 'Enviar código'}
          </Button>
        </div>
      ) : (
        /* Fase 2: Verificar código */
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de verificación
            </label>
            <input
              type="text"
              value={verificationCodeInput}
              onChange={(e) => setVerificationCodeInput(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              maxLength={6}
              className="w-full px-4 py-3 text-center text-2xl tracking-widest font-bold border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none transition-colors"
              disabled={loading}
              autoFocus
            />
            <p className="mt-2 text-xs text-gray-500 text-center">
              Código enviado a +52 {phoneNumber}
            </p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleVerifyCode}
              disabled={loading || verificationCodeInput.length !== 6}
              fullWidth
              variant="primary"
              className="h-12 text-base font-semibold"
            >
              {loading ? 'Verificando...' : 'Verificar'}
            </Button>

            <button
              onClick={handleResend}
              disabled={loading}
              className="w-full py-2 text-sm text-pink-600 hover:text-pink-700 font-medium transition-colors"
            >
              ¿No recibiste el código? Reenviar
            </button>
          </div>
        </div>
      )}

      {/* reCAPTCHA container (invisible) */}
      <div id="recaptcha-container" className="mt-4"></div>
    </div>
  );
};

export default PhoneAuth;
