// Asistente de estilo Mia - Componente principal
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, 
  FaPaperPlane, 
  FaImage, 
  FaSpinner,
  FaUser
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import UserAuth from '../auth/UserAuth';
import UserDataForm from '../auth/UserDataForm';
import MessageWithProducts from './MessageWithProducts';
import Button from '../ui/Button';
import { BACKEND_API_URL } from '../../credenciales';
import { saveUserData, getUserData } from '../../services/authService';

// URL del endpoint
const API_ENDPOINT = `${BACKEND_API_URL}/api/asesor-estilo`;

const StyleAssistant = ({ isOpen, onClose }) => {
  const { user, idToken, updateUser, refreshToken } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showUserDataForm, setShowUserDataForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [userData, setUserData] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mensaje de bienvenida
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: '¡Hola! 💝 Soy Mia, tu asesora de estilo personal de Malim. Estoy aquí para ayudarte a encontrar el outfit perfecto. ¿En qué puedo ayudarte hoy?',
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  // Limpiar al cerrar
  useEffect(() => {
    if (!isOpen) {
      setShowAuth(false);
      setShowUserDataForm(false);
      setSelectedImage(null);
      setImagePreview(null);
      setUserMessageCount(0);
    }
  }, [isOpen]);

  // Cargar datos del usuario al autenticarse
  useEffect(() => {
    const loadUserData = async () => {
      if (user && !userData) {
        const result = await getUserData(user.uid);
        if (result.success && result.data) {
          setUserData(result.data);
        }
      }
    };
    loadUserData();
  }, [user]);

  /**
   * Enviar mensaje al backend
   */
  const sendMessage = async (messageText, imageBase64 = null) => {
    if (!messageText.trim() && !imageBase64) return;

    const messageContent = messageText.trim() || '📷 Imagen adjunta';

    // Agregar mensaje del usuario al chat
    const userMessage = { 
      role: 'user', 
      content: messageContent,
      hasImage: !!imageBase64,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setSelectedImage(null);
    setImagePreview(null);
    setLoading(true);

    // Incrementar contador de mensajes del usuario
    const currentMessageCount = userMessageCount + 1;
    setUserMessageCount(currentMessageCount);

    try {
      const requestBody = {
        mensaje: messageText.trim() || 'Analiza esta imagen',
        imagen: imageBase64,
        idToken: null,
        userData: null
      };

      // Enviar idToken solo desde el segundo mensaje en adelante y si el usuario está autenticado
      if (currentMessageCount >= 2 && idToken) {
        requestBody.idToken = idToken;
        
        // Enviar userData si existe para que el backend lo guarde
        if (user && userData) {
          requestBody.userData = {
            nombre: userData.nombre,
            whatsapp: userData.whatsapp,
            email: user.email
          };
        }
      }

      console.log('🚀 Enviando mensaje al endpoint:', API_ENDPOINT);
      console.log('📊 Mensaje #:', currentMessageCount);
      console.log('🔐 Envía token:', !!requestBody.idToken);
      console.log('👤 Envía userData:', !!requestBody.userData);
      console.log('📦 Body:', { ...requestBody, imagen: imageBase64 ? '(imagen presente)' : null, userData: requestBody.userData ? '(presente)' : null });
      console.log('🌐 Origin actual:', window.location.origin);

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
        mode: 'cors',
        credentials: 'omit'
      });

      console.log('📡 Respuesta status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Data recibida:', data);

      if (!data.success) {
        // Si el token expiró, intentar refrescar
        if (data.error && data.error.includes('Token')) {
          console.log('🔄 Token expirado, refrescando...');
          const newToken = await refreshToken();
          if (newToken) {
            // Reintentar con token nuevo
            return sendMessage(messageText, imageBase64);
          }
        }
        throw new Error(data.error || 'Error al procesar el mensaje');
      }

      // Caso 1: Requiere autenticación
      if (data.requiresAuth) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message,
          requiresAuth: true,
          timestamp: new Date()
        }]);
        setShowAuth(true);
        return;
      }

      // Caso 2: Respuesta normal (discovery o recommendation)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        mode: data.mode,
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error('❌ Error completo:', error);
      console.error('Error mensaje:', error.message);
      console.error('Error stack:', error.stack);
      setMessages(prev => [...prev, {
        role: 'system',
        content: `⚠️ Ocurrió un error: ${error.message}. Por favor intenta de nuevo.`,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() && !selectedImage) return;
    sendMessage(inputMessage, selectedImage);
  };

  /**
   * Manejar selección de imagen
   */
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (máximo 4MB)
    if (file.size > 4 * 1024 * 1024) {
      alert('La imagen es muy pesada. Máximo 4MB.');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target.result);
      setImagePreview(URL.createObjectURL(file));
    };
    reader.readAsDataURL(file);
  };

  /**
   * Manejar éxito de autenticación
   */
  const handleAuthSuccess = async (newUser, newToken, isNewUser) => {
    updateUser(newUser, newToken);
    setShowAuth(false);
    
    // Si es nuevo usuario o no tiene datos completos, mostrar formulario
    const result = await getUserData(newUser.uid);
    if (!result.success || !result.data || !result.data.whatsapp) {
      setShowUserDataForm(true);
    } else {
      setUserData(result.data);
      // Reenviar el último mensaje del usuario ahora con autenticación
      resendLastUserMessage();
    }
  };

  /**
   * Manejar datos adicionales del usuario
   */
  const handleUserDataComplete = async (data) => {
    if (!user) return;
    
    // Guardar datos en Firestore
    const result = await saveUserData(user.uid, data);
    
    if (result.success) {
      setUserData(data);
      setShowUserDataForm(false);
      
      // Reenviar el último mensaje del usuario ahora con datos completos
      resendLastUserMessage();
    } else {
      throw new Error('Error al guardar datos');
    }
  };

  /**
   * Reenviar el último mensaje del usuario
   */
  const resendLastUserMessage = () => {
    const lastUserMessage = messages
      .filter(m => m.role === 'user')
      .pop();
    
    if (lastUserMessage) {
      setTimeout(() => {
        sendMessage(lastUserMessage.content);
      }, 500);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full sm:max-w-2xl h-[100dvh] sm:h-[90vh] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-4 sm:px-6 py-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <span className="text-2xl sm:text-3xl">💝</span>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Mia
                </h2>
                <p className="text-xs sm:text-sm text-white/90">
                  {user && userData ? `✓ ${userData.nombre}` : user ? `✓ ${user.email || user.displayName}` : 'Tu asesora de estilo'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/90 hover:text-white transition-colors p-2"
            >
              <FaTimes className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gradient-to-b from-gray-50 to-white">
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' ? (
                    // Mensaje del asistente con detección de productos
                    <div className="max-w-[95%] sm:max-w-[85%] bg-white border-2 border-pink-200 text-gray-800 rounded-2xl px-4 py-3">
                      <MessageWithProducts content={msg.content} mode={msg.mode} />
                    </div>
                  ) : (
                    // Mensaje del usuario o sistema
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                        msg.role === 'system'
                          ? 'bg-yellow-50 border-2 border-yellow-200 text-yellow-800'
                          : 'bg-gradient-to-br from-pink-500 to-purple-600 text-white'
                      }`}
                    >
                      <div className="text-sm sm:text-base whitespace-pre-wrap break-words">
                        {msg.content}
                      </div>
                      {msg.hasImage && (
                        <div className="mt-2 text-xs opacity-75">
                          📷 Imagen adjunta
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
              
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white border-2 border-pink-200 rounded-2xl px-4 py-3 flex items-center gap-2">
                    <FaSpinner className="animate-spin text-pink-500" />
                    <span className="text-sm text-gray-600">Mia está pensando...</span>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Auth Panel */}
          <AnimatePresence>
            {showAuth && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t overflow-hidden"
              >
                <div className="p-4 sm:p-6">
                  <UserAuth
                    onSuccess={handleAuthSuccess}
                    onCancel={() => setShowAuth(false)}
                  />
                </div>
              </motion.div>
            )}
            
            {showUserDataForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t overflow-hidden"
              >
                <div className="p-4 sm:p-6">
                  <UserDataForm
                    onComplete={handleUserDataComplete}
                    initialName={user?.displayName || ''}
                    userEmail={user?.email || ''}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Area */}
          {!showAuth && !showUserDataForm && (
            <div className="border-t bg-white p-3 sm:p-4">
              {/* Image Preview */}
              <AnimatePresence>
                {imagePreview && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3"
                  >
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-24 sm:max-h-32 rounded-xl border-2 border-pink-200"
                      />
                      <button
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                {/* Image Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaImage className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {/* Text Input */}
                <div className="flex-1 relative">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    placeholder="Escribe tu mensaje..."
                    disabled={loading}
                    rows={1}
                    className="w-full px-4 py-3 pr-12 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={loading || (!inputMessage.trim() && !selectedImage)}
                  className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-xl flex items-center justify-center hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <FaSpinner className="animate-spin w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <FaPaperPlane className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </form>

              <p className="mt-2 text-xs text-gray-500 text-center">
                Presiona Enter para enviar • Shift + Enter para nueva línea
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StyleAssistant;
