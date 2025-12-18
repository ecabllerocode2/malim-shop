// Header principal con navegación
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, 
  FaShoppingBag, 
  FaBars, 
  FaTimes,
  FaHeart,
  FaUser 
} from 'react-icons/fa';
import { useCart } from '../../contexts/CartContext';
import { cn } from '../../utils/cn';
import Button from '../ui/Button';
import logo from '../../logo.png';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { getTotalItems, setIsOpen: setCartOpen } = useCart();
  const navigate = useNavigate();

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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalogo?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const totalItems = getTotalItems();

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

              {/* Carrito */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCartOpen(true)}
                className="relative text-gray-700 hover:text-primary-600 transition-colors"
              >
                <FaShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-primary-600 text-white text-xs font-bold rounded-full flex items-center justify-center"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </motion.button>
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

              {/* Carrito Mobile */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setCartOpen(true)}
                className="relative text-gray-700"
              >
                <FaShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
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
                  <Button variant="primary" fullWidth size="md">
                    Contactar
                  </Button>
                </div>
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
    </>
  );
};

export default Header;
