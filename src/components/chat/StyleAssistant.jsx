// Asistente de estilo Mia - Sistema Híbrido LLM + Algoritmo
// Backend: LLM para conversación + Algoritmo para selección de productos
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, 
  FaPaperPlane, 
  FaSpinner,
  FaSignOutAlt,
  FaUser,
  FaRedo
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import UserAuth from '../auth/UserAuth';
import UserDataForm from '../auth/UserDataForm';
import MessageWithProducts from './MessageWithProducts';
import { BACKEND_API_URL } from '../../credenciales';
import { saveUserData, getUserData } from '../../services/authService';

// URL del endpoint
const API_ENDPOINT = `${BACKEND_API_URL}/api/asesor-estilo`;

const StyleAssistant = ({ isOpen, onClose }) => {
  const { user, idToken, updateUser, refreshToken, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showUserDataForm, setShowUserDataForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [userData, setUserData] = useState(null);
  const [pendingMessage, setPendingMessage] = useState(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  
  // Conversación actual: restaurar de localStorage si existe
  const [currentConversation, setCurrentConversation] = useState(() => {
    const saved = localStorage.getItem('mia_current_conversation');
    return saved ? JSON.parse(saved) : [];
  });
  
  // 🆕 NUEVO: Estado para modo y datos extraídos
  const [currentMode, setCurrentMode] = useState('discovery');
  const [datosExtraidos, setDatosExtraidos] = useState({});
  const [datosFaltantes, setDatosFaltantes] = useState([]);
  
  const messagesEndRef = useRef(null);
  // const fileInputRef = useRef(null); // Eliminado: ya no se usa carga de imágenes

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mensaje de bienvenida
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: '¡Hola! 💝 Soy Mia, tu asesora de estilo personal de Malim. Estoy aquí para ayudarte a encontrar el outfit perfecto. ¿Para qué ocasión buscas ropa hoy?',
        timestamp: new Date()
      }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Persistir conversación en localStorage
  useEffect(() => {
    localStorage.setItem('mia_current_conversation', JSON.stringify(currentConversation));
  }, [currentConversation]);

  // Ya no limpiar conversación al montar: solo limpiar al logout o nueva conversación

  // Restaurar mensaje pendiente del localStorage al cargar
  useEffect(() => {
    if (isOpen && !pendingMessage) {
      const savedPendingMessage = localStorage.getItem('mia_pending_message');
      if (savedPendingMessage) {
        try {
          const parsed = JSON.parse(savedPendingMessage);
          setPendingMessage(parsed);
          console.log('📦 Mensaje pendiente restaurado del localStorage');
        } catch (e) {
          console.error('Error al parsear mensaje pendiente:', e);
          localStorage.removeItem('mia_pending_message');
        }
      }
    }
  }, [isOpen, pendingMessage]);

  // Limpiar al cerrar
  useEffect(() => {
    if (!isOpen) {
      setShowAuth(false);
      setShowUserDataForm(false);
      setSelectedImage(null);
      setImagePreview(null);
      setPendingMessage(null);
      setShowAccountMenu(false);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /**
   * Manejar cierre de sesión
   */
  const handleLogout = async () => {
    try {
      await logout();
      setUserData(null);
      setShowAccountMenu(false);
      setShowAuth(false);
      setShowUserDataForm(false);
      setPendingMessage(null);
      
      // 🆕 NUEVO: Limpiar conversación actual y todos los flags
      setCurrentConversation([]);
      localStorage.removeItem('mia_current_conversation');
      localStorage.removeItem('mia_pending_message');
      setPendingMessage(null);
      setCurrentMode('discovery');
      setDatosExtraidos({});
      setDatosFaltantes([]);
      
      // Limpiar mensajes y reiniciar conversación
      setMessages([{
        role: 'assistant',
        content: '¡Hola! 💝 Soy Mia, tu asesora de estilo personal de Malim. Estoy aquí para ayudarte a encontrar el outfit perfecto. ¿Para qué ocasión buscas ropa hoy?',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      alert('Error al cerrar sesión. Por favor intenta de nuevo.');
    }
  };

  /**
   * Manejar apertura del panel de autenticación
   */
  const handleOpenAuth = () => {
    setShowAccountMenu(false);
    setShowAuth(true);
  };

  /**
   * 🆕 NUEVO: Iniciar nueva conversación y limpiar TODOS los flags
   */
  const handleNewConversation = () => {
    const confirmar = window.confirm('¿Iniciar una nueva búsqueda? Se perderá la conversación actual.');
    
    if (confirmar) {
      // Limpiar todo el estado de conversación
      setCurrentConversation([]);
      localStorage.removeItem('mia_current_conversation');
      localStorage.removeItem('mia_pending_message');
      setPendingMessage(null);
      setCurrentMode('discovery');
      setDatosExtraidos({});
      setDatosFaltantes([]);
      
      console.log('🔄 Nueva conversación iniciada. Todos los flags limpiados.');
      
      // Reiniciar mensajes con mensaje de bienvenida
      setMessages([{
        role: 'assistant',
        content: '¡Hola! 💝 Soy Mia, tu asesora de estilo personal de Malim. Estoy aquí para ayudarte a encontrar el outfit perfecto. ¿Para qué ocasión buscas ropa hoy?',
        timestamp: new Date()
      }]);
    }
  };

  /**
   * Enviar mensaje al backend
   * Sistema híbrido: LLM conversa + Algoritmo selecciona productos
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

    try {
      const requestBody = {
        mensaje: messageText.trim() || 'Analiza esta imagen',
        imagen: imageBase64 || undefined,
        // 🆕 NUEVO: Enviar conversación actual al backend
        currentConversation: currentConversation
      };

      // Enviar idToken y userData si el usuario está autenticado
      if (idToken) {
        requestBody.idToken = idToken;
        // Incluir userData para que el backend lo guarde/actualice
        if (userData) {
          requestBody.userData = {
            nombre: userData.nombre,
            whatsapp: userData.whatsapp,
            email: user?.email || userData.email
          };
        }
      }

      // 🆕 NUEVO: Logs detallados para debugging
      console.log('📤 Enviando a Mia:', {
        endpoint: API_ENDPOINT,
        mensajeLength: messageText.length,
        tieneImagen: !!imageBase64,
        conversacionActual: currentConversation.length,
        autenticado: !!idToken,
        userData: userData ? 'Sí' : 'No'
      });

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
      
      // 🆕 NUEVO: Logs detallados de respuesta
      console.log('📥 Respuesta de Mia:', {
        success: data.success,
        modo: data.mode,
        datosCompletos: data.datosCompletos,
        datosFaltantes: data.datosFaltantes,
        datosExtraidos: data.datosExtraidos,
        requiresAuth: data.requiresAuth || data.mode === 'auth_required'
      });

      if (!data.success) {
        // Si el token expiró, intentar refrescar
        if (data.error && data.error.includes('Token') && refreshToken) {
          console.log('🔄 Token expirado, refrescando...');
          const newToken = await refreshToken();
          if (newToken) {
            // Reintentar con token nuevo
            return sendMessage(messageText, imageBase64);
          }
        }
        throw new Error(data.error || 'Error al procesar el mensaje');
      }

      // Caso 1: Requiere autenticación (mode: 'auth_required')
      // ⚠️ EVITAR DOBLE LOGIN: Solo mostrar modal si no se ha pedido antes
      if ((data.requiresAuth || data.mode === 'auth_required') && !sessionStorage.getItem('mia_auth_requested')) {
        // Marcar que ya se pidió autenticación para esta conversación
        sessionStorage.setItem('mia_auth_requested', 'true');
        
        // ⚠️ CRÍTICO: Guardar mensaje pendiente en localStorage para reenviar después del login
        const pendingData = { text: messageText, image: imageBase64 };
        setPendingMessage(pendingData);
        localStorage.setItem('mia_pending_message', JSON.stringify(pendingData));
        
        console.log('⚠️ Autenticación requerida (primera vez). Mensaje guardado:', messageText.substring(0, 50));
        
        // Mostrar mensaje del backend pidiendo autenticación
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message || data.respuesta || '¡Perfecto! 💝 Para mostrarte nuestros productos necesito que inicies sesión. Es rápido y seguro.',
          requiresAuth: true,
          mode: data.mode,
          timestamp: new Date()
        }]);
        
        setShowAuth(true);
        return;
      }

      // Caso 2: Respuesta normal (discovery o recommendation)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.respuesta,
        mode: data.mode,
        isAuthenticated: data.isAuthenticated,
        datosExtraidos: data.datosExtraidos,
        datosCompletos: data.datosCompletos,
        datosFaltantes: data.datosFaltantes,
        timestamp: new Date()
      }]);
      
      // 🆕 NUEVO: Actualizar conversación actual
      const newConversation = [
        ...currentConversation,
        messageText.trim() || 'Analiza esta imagen',  // Mensaje del usuario
        data.respuesta                                  // Respuesta de Mia
      ];
      setCurrentConversation(newConversation);
      
      // 🆕 NUEVO: Actualizar estado de modo y datos
      if (data.mode) {
        setCurrentMode(data.mode);
      }
      if (data.datosExtraidos) {
        setDatosExtraidos(data.datosExtraidos);
      }
      if (data.datosFaltantes) {
        setDatosFaltantes(data.datosFaltantes);
      }
      
      // Limpiar mensaje pendiente después de respuesta exitosa
      localStorage.removeItem('mia_pending_message');

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


  /**
   * ⚠️ CRÍTICO: Manejar éxito de autenticación y reenviar mensaje UNA SOLA VEZ con conversación completa
   */
  const handleAuthSuccess = async (newUser, newToken) => {
    console.log('✅ Login exitoso. Token recibido.');
    updateUser(newUser, newToken);
    setShowAuth(false);
    
    // Limpiar flag de auth antes de reenviar para evitar bloqueos
    sessionStorage.removeItem('mia_auth_requested');
    
    // Si es nuevo usuario o no tiene datos completos, mostrar formulario
    const result = await getUserData(newUser.uid);
    if (!result.success || !result.data || !result.data.whatsapp) {
      setShowUserDataForm(true);
    } else {
      setUserData(result.data);
      
      // ⚠️ CRÍTICO: Reenviar mensaje pendiente UNA SOLA VEZ con token y conversación completa
      const savedPendingMessage = localStorage.getItem('mia_pending_message');
      const messageToResend = pendingMessage || (savedPendingMessage ? JSON.parse(savedPendingMessage) : null);
      
      if (messageToResend && messageToResend.text) {
        console.log('🔄 Reenviando mensaje UNA VEZ con autenticación:', {
          mensaje: messageToResend.text.substring(0, 50),
          conversacionActual: currentConversation.length,
          tieneImagen: !!messageToResend.image
        });
        
        // Limpiar inmediatamente para evitar reenvíos duplicados
        setPendingMessage(null);
        localStorage.removeItem('mia_pending_message');
        
        setTimeout(() => {
          sendMessage(messageToResend.text, messageToResend.image);
        }, 500);
      } else {
        console.warn('⚠️ No hay mensaje pendiente para reenviar después del login');
      }
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
      
      // Limpiar flag de auth
      sessionStorage.removeItem('mia_auth_requested');
      
      // ⚠️ CRÍTICO: Reenviar mensaje pendiente UNA SOLA VEZ con datos completos
      const savedPendingMessage = localStorage.getItem('mia_pending_message');
      const messageToResend = pendingMessage || (savedPendingMessage ? JSON.parse(savedPendingMessage) : null);
      
      if (messageToResend && messageToResend.text) {
        console.log('🔄 Reenviando mensaje UNA VEZ después de completar datos del usuario');
        
        // Limpiar inmediatamente para evitar reenvíos duplicados
        setPendingMessage(null);
        localStorage.removeItem('mia_pending_message');
        
        setTimeout(() => {
          sendMessage(messageToResend.text, messageToResend.image);
        }, 500);
      }
    } else {
      throw new Error('Error al guardar datos');
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
            <div className="flex items-center gap-2">
              {/* Botón Nueva Conversación */}
              {currentConversation.length > 0 && (
                <button
                  onClick={handleNewConversation}
                  className="text-white/90 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                  title="Nueva búsqueda"
                >
                  <FaRedo className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
              
              {/* Botón de cuenta/logout */}
              <div className="relative">
                <button
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="text-white/90 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                  title={user ? 'Cuenta' : 'Iniciar sesión'}
                >
                  <FaUser className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                
                {/* Menú de cuenta */}
                <AnimatePresence>
                  {showAccountMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      {user ? (
                        // Usuario autenticado
                        <div>
                          <div className="px-4 py-3 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-pink-100">
                            <p className="text-xs text-gray-500 mb-1">Conectado como:</p>
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {userData?.nombre || user.displayName || user.email}
                            </p>
                            {user.email && (
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            )}
                          </div>
                          <button
                            onClick={handleLogout}
                            className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                          >
                            <FaSignOutAlt className="w-4 h-4" />
                            Cerrar sesión
                          </button>
                        </div>
                      ) : (
                        // Usuario no autenticado
                        <button
                          onClick={handleOpenAuth}
                          className="w-full px-4 py-3 text-left text-sm text-pink-600 hover:bg-pink-50 transition-colors flex items-center gap-2"
                        >
                          <FaUser className="w-4 h-4" />
                          Iniciar sesión
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <button
                onClick={onClose}
                className="text-white/90 hover:text-white transition-colors p-2"
              >
                <FaTimes className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Indicador de Progreso - Mostrar en modo discovery cuando hay datos faltantes */}
          {currentMode === 'discovery' && datosFaltantes.length > 0 && (
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-b border-pink-100 px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {/* Datos extraídos */}
                {datosExtraidos.prendas && datosExtraidos.prendas.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    ✅ {datosExtraidos.prendas[0]}
                  </span>
                )}
                {datosExtraidos.tallas && datosExtraidos.tallas.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    ✅ Talla: {datosExtraidos.tallas.join(', ')}
                  </span>
                )}
                {datosExtraidos.colores && datosExtraidos.colores.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    ✅ Color: {datosExtraidos.colores.join(', ')}
                  </span>
                )}
                
                {/* Datos faltantes */}
                {datosFaltantes.includes('categoria') && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    ⏳ Prenda
                  </span>
                )}
                {datosFaltantes.includes('talla') && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    ⏳ Talla
                  </span>
                )}
              </div>
            </div>
          )}

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
                      <MessageWithProducts content={msg.content} mode={msg.mode} onProductClick={onClose} />
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
