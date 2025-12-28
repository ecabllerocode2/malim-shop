// Componente de autenticación con múltiples métodos
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGoogle, FaEnvelope, FaTimes, FaLock } from 'react-icons/fa';
import { 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail 
} from '../../services/authService';
import Button from '../ui/Button';

const UserAuth = ({ onSuccess, onCancel }) => {
  const [mode, setMode] = useState('select'); // 'select', 'email-signin', 'email-signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Autenticación con Google
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    
    const result = await signInWithGoogle();
    setLoading(false);
    
    if (result.success) {
      onSuccess(result.user, result.idToken, result.isNewUser);
    } else {
      setError(result.error || 'Error al iniciar sesión con Google');
    }
  };

  // Iniciar sesión con email
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await signInWithEmail(email, password);
    setLoading(false);
    
    if (result.success) {
      onSuccess(result.user, result.idToken, result.isNewUser);
    } else {
      setError(result.error);
    }
  };

  // Registrar con email
  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    const result = await signUpWithEmail(email, password, name);
    setLoading(false);
    
    if (result.success) {
      onSuccess(result.user, result.idToken, result.isNewUser);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {mode === 'select' ? 'Iniciar sesión' : 
             mode === 'email-signup' ? 'Crear cuenta' : 'Iniciar sesión'}
          </h3>
          <p className="text-sm text-gray-600">
            {mode === 'select' ? 'Elige cómo quieres continuar' : 'Ingresa tus datos'}
          </p>
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

      <AnimatePresence mode="wait">
        {/* Selector de método */}
        {mode === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            {/* Google Sign In */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              fullWidth
              variant="outline"
              className="h-12 text-base font-semibold border-2"
            >
              <FaGoogle className="mr-3 text-red-500" />
              Continuar con Google
            </Button>

            {/* Email Sign In */}
            <Button
              onClick={() => setMode('email-signin')}
              disabled={loading}
              fullWidth
              variant="outline"
              className="h-12 text-base font-semibold border-2"
            >
              <FaEnvelope className="mr-3 text-blue-500" />
              Continuar con Email
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                ¿No tienes cuenta?{' '}
                <button
                  onClick={() => setMode('email-signup')}
                  className="text-pink-600 font-semibold hover:text-pink-700"
                >
                  Regístrate
                </button>
              </p>
            </div>
          </motion.div>
        )}

        {/* Inicio de sesión con email */}
        {mode === 'email-signin' && (
          <motion.form
            key="signin"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onSubmit={handleEmailSignIn}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none transition-colors"
                disabled={loading}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none transition-colors"
                disabled={loading}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              fullWidth
              variant="primary"
              className="h-12 text-base font-semibold"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('select')}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                ← Volver
              </button>
            </div>
          </motion.form>
        )}

        {/* Registro con email */}
        {mode === 'email-signup' && (
          <motion.form
            key="signup"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onSubmit={handleEmailSignUp}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre completo
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none transition-colors"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none transition-colors"
                disabled={loading}
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              fullWidth
              variant="primary"
              className="h-12 text-base font-semibold"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('select')}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                ← Volver
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserAuth;
