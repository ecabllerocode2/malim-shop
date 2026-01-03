// Header principal con navegación
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, 
  FaBars, 
  FaTimes,
  FaUser,
  FaSignOutAlt
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import UserAuth from '../auth/UserAuth';
import UserDataForm from '../auth/UserDataForm';
import { saveUserData, getUserData } from '../../services/authService';
import { cn } from '../../utils/cn';
import Button from '../ui/Button';
import logo from '../../logo.png';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showUserDataForm, setShowUserDataForm] = useState(false);
  const [userData, setUserData] = useState(null);
  
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  // Detectar scroll para cambiar estilo del header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [navigate]);

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

  // Manejar cierre de sesión
  const handleLogout = async () => {
    try {
      await logout();
      setUserData(null);
      setShowAccountMenu(false);
      setShowAuth(false);
      setShowUserDataForm(false);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      alert('Error al cerrar sesión. Por favor intenta de nuevo.');
    }
  };

  // Manejar apertura del panel de autenticación
  const handleOpenAuth = () => {
    setShowAccountMenu(false);
    setShowAuth(true);
  };

  // Manejar éxito de autenticación
  const handleAuthSuccess = async (newUser, newToken) => {
    updateUser(newUser, newToken);
    setShowAuth(false);
    
    // Si es nuevo usuario o no tiene datos completos, mostrar formulario
    const result = await getUserData(newUser.uid);
    if (!result.success || !result.data || !result.data.whatsapp) {
      setShowUserDataForm(true);
    } else {
      setUserData(result.data);
    }
  };

  // Manejar datos adicionales del usuario
  const handleUserDataComplete = async (data) => {
    if (!user) return;
    
    // Guardar datos en Firestore
    const result = await saveUserData(user.uid, data);
    
    if (result.success) {
      setUserData(data);
      setShowUserDataForm(false);
    } else {
      throw new Error('Error al guardar datos');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalogo?busqueda=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navigation = [
    { name: 'Inicio', href: '/' },
    { name: 'Catálogo', href: '/catalogo' },
    { name: 'Nuevos', href: '/catalogo?filter=nuevos' },
    { name: 'Ofertas', href: '/catalogo?ofertas=true' },
  ];

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-soft'
            : 'bg-transparent'
        )}
      >
        <div className="container mx-auto px-4 max-w-full">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center"
              >
                <img 
                  src={logo} 
                  alt="Malim" 
                  className="h-12 w-auto"
                />
              </motion.div>
            </Link>

            {/* Navegación Desktop */}
            <nav className="hidden md:flex items-center gap-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors relative group"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* Acciones Desktop */}
            <div className="hidden md:flex items-center gap-4">
              {/* Búsqueda */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsSearchOpen(true)}
                className="text-gray-700 hover:text-primary-600 transition-colors"
              >
                <FaSearch className="w-5 h-5" />
              </motion.button>

              {/* Cuenta */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="text-gray-700 hover:text-primary-600 transition-colors"
                  title={user ? 'Cuenta' : 'Iniciar sesión'}
                >
                  <FaUser className="w-5 h-5" />
                </motion.button>
                
                {/* Menú de cuenta */}
                <AnimatePresence>
                  {showAccountMenu && (
                    <>
                      {/* Overlay invisible para cerrar al hacer clic fuera */}
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setShowAccountMenu(false)}
                      />
                      
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-large overflow-hidden z-40"
                      >
                        {user ? (
                          // Usuario autenticado
                          <div>
                            <div className="px-4 py-4 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-pink-100">
                              <p className="text-xs text-gray-500 mb-1">Conectado como:</p>
                              <p className="text-sm font-semibold text-gray-800 truncate">
                                {userData?.nombre || user.displayName || user.email}
                              </p>
                              {user.email && (
                                <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
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
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Botones Mobile */}
            <div className="flex md:hidden items-center gap-3">
              {/* Búsqueda Mobile */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsSearchOpen(true)}
                className="text-gray-700"
              >
                <FaSearch className="w-5 h-5" />
              </motion.button>

              {/* Cuenta Mobile */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => user ? setShowAccountMenu(!showAccountMenu) : handleOpenAuth()}
                className="text-gray-700"
              >
                <FaUser className="w-5 h-5" />
              </motion.button>

              {/* Menú Hamburguesa */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-700"
              >
                {isMobileMenuOpen ? (
                  <FaTimes className="w-6 h-6" />
                ) : (
                  <FaBars className="w-6 h-6" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Menú Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-white shadow-large z-50 md:hidden"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-xl font-playfair font-bold text-gray-900">
                    Menú
                  </h2>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes className="w-6 h-6" />
                  </button>
                </div>

                {/* Navegación */}
                <nav className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-1">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="block px-4 py-3 text-base font-medium text-gray-900 hover:bg-primary-50 hover:text-primary-600 rounded-xl transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </nav>

                {/* Footer del menú */}
                <div className="p-6 border-t space-y-3">
                  {user ? (
                    // Usuario autenticado
                    <>
                      <div className="px-3 py-2 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
                        <p className="text-xs text-gray-500 mb-1">Conectado como:</p>
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {userData?.nombre || user.displayName || user.email}
                        </p>
                        {user.email && (
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        fullWidth
                        size="md"
                        onClick={handleLogout}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <FaSignOutAlt className="w-4 h-4 mr-2" />
                        Cerrar sesión
                      </Button>
                    </>
                  ) : (
                    // Usuario no autenticado
                    <Button
                      variant="primary"
                      fullWidth
                      size="md"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleOpenAuth();
                      }}
                    >
                      <FaUser className="w-4 h-4 mr-2" />
                      Iniciar sesión
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Menú de Cuenta Mobile (cuando está autenticado) */}
      <AnimatePresence>
        {showAccountMenu && user && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAccountMenu(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            />

            {/* Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-large z-50 md:hidden"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Mi Cuenta</h3>
                  <button
                    onClick={() => setShowAccountMenu(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>

                {/* Info del usuario */}
                <div className="px-4 py-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl mb-4">
                  <p className="text-xs text-gray-500 mb-1">Conectado como:</p>
                  <p className="text-base font-semibold text-gray-800 truncate">
                    {userData?.nombre || user.displayName || user.email}
                  </p>
                  {user.email && (
                    <p className="text-sm text-gray-500 truncate mt-0.5">{user.email}</p>
                  )}
                </div>

                {/* Botón de cerrar sesión */}
                <Button
                  variant="outline"
                  fullWidth
                  size="lg"
                  onClick={() => {
                    setShowAccountMenu(false);
                    handleLogout();
                  }}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <FaSignOutAlt className="w-4 h-4 mr-2" />
                  Cerrar sesión
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de Búsqueda */}
      <AnimatePresence>
        {isSearchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50"
            >
              <div className="bg-white rounded-3xl shadow-large p-6">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar productos..."
                      autoFocus
                      className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                </form>
                <p className="mt-4 text-sm text-gray-500 text-center">
                  Presiona Enter para buscar
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer para compensar el header fijo */}
      <div className="h-20" />

      {/* Modal de Autenticación */}
      <AnimatePresence>
        {showAuth && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuth(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4 z-50"
            >
              <div className="bg-white rounded-3xl shadow-large p-6 relative">
                <button
                  onClick={() => setShowAuth(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
                <UserAuth
                  onSuccess={handleAuthSuccess}
                  onCancel={() => setShowAuth(false)}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de Datos Adicionales */}
      <AnimatePresence>
        {showUserDataForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4 z-50"
            >
              <div className="bg-white rounded-3xl shadow-large p-6">
                <UserDataForm
                  onComplete={handleUserDataComplete}
                  initialName={user?.displayName || ''}
                  userEmail={user?.email || ''}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
