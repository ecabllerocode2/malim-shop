// Página de Checkout con Stripe
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaLock, FaCreditCard, FaShieldAlt } from 'react-icons/fa';
import { useCart } from '../contexts/CartContext';
import Button from '../components/ui/Button';
import Image from '../components/ui/Image';
import { formatPrice } from '../utils/format';
import { toast } from 'react-toastify';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, getTotalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  
  // Constantes de envío
  const ENVIO_GRATIS_MINIMO = 999;
  const COSTO_ENVIO = 179;
  
  const subtotal = getTotalPrice();
  const esEnvioGratis = subtotal >= ENVIO_GRATIS_MINIMO;
  const costoEnvio = esEnvioGratis ? 0 : COSTO_ENVIO;
  const total = subtotal + costoEnvio;

  const [formData, setFormData] = useState({
    // Información personal
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    
    // Dirección de envío
    calle: '',
    numeroExterior: '',
    numeroInterior: '',
    colonia: '',
    ciudad: '',
    estado: '',
    codigoPostal: '',
    referencias: '',
  });

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/catalogo');
    }
  }, [cart, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar campos requeridos
      const requiredFields = ['nombre', 'apellido', 'email', 'telefono', 'calle', 'numeroExterior', 'colonia', 'ciudad', 'estado', 'codigoPostal'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        toast.error('Por favor completa todos los campos requeridos');
        setLoading(false);
        return;
      }

      // Preparar datos para el backend
      const checkoutData = {
        cliente: {
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          telefono: formData.telefono,
        },
        direccion: {
          calle: formData.calle,
          numeroExterior: formData.numeroExterior,
          numeroInterior: formData.numeroInterior,
          colonia: formData.colonia,
          ciudad: formData.ciudad,
          estado: formData.estado,
          codigoPostal: formData.codigoPostal,
          referencias: formData.referencias,
        },
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          variantId: item.variantId,
          colorName: item.colorName,
          size: item.size,
          variantSku: item.variantSku,
          quantity: item.quantity,
          price: item.price,
          imageUrl: item.imageUrl,
        })),
        subtotal,
        costoEnvio,
        total,
        metadata: {
          envioGratis: esEnvioGratis,
        }
      };

      // Llamar al backend para crear sesión de Stripe
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://malim-backend.vercel.app';
      console.log('🔄 Enviando petición a:', `${backendUrl}/api/create-checkout-session`);
      console.log('📦 Datos:', checkoutData);
      
      const response = await fetch(`${backendUrl}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(checkoutData),
      });

      console.log('📡 Respuesta status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'Error al procesar el pago';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
          console.error('❌ Error del servidor:', error);
        } catch (e) {
          console.error('❌ Error al parsear respuesta:', e);
          errorMessage = `Error del servidor: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('✅ Respuesta exitosa:', responseData);
      
      if (!responseData.url) {
        throw new Error('No se recibió URL de Stripe');
      }
      
      // Redirigir a Stripe Checkout
      console.log('🔗 Redirigiendo a Stripe:', responseData.url);
      window.location.href = responseData.url;
      
    } catch (error) {
      console.error('Error en checkout:', error);
      toast.error(error.message || 'Error al procesar el pago. Intenta nuevamente.');
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 pt-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            Checkout
          </h1>
          <p className="text-gray-600">Completa tu información para finalizar la compra</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulario */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información Personal */}
              <div className="bg-white rounded-2xl shadow-soft p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Información Personal
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                      placeholder="Juan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      name="apellido"
                      value={formData.apellido}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                      placeholder="Pérez"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                      placeholder="5512345678"
                    />
                  </div>
                </div>
              </div>

              {/* Dirección de Envío */}
              <div className="bg-white rounded-2xl shadow-soft p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Dirección de Envío
                </h2>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Calle *
                      </label>
                      <input
                        type="text"
                        name="calle"
                        value={formData.calle}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                        placeholder="Av. Insurgentes"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        No. Exterior *
                      </label>
                      <input
                        type="text"
                        name="numeroExterior"
                        value={formData.numeroExterior}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                        placeholder="123"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        No. Interior
                      </label>
                      <input
                        type="text"
                        name="numeroInterior"
                        value={formData.numeroInterior}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                        placeholder="Depto 4B (opcional)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Colonia *
                      </label>
                      <input
                        type="text"
                        name="colonia"
                        value={formData.colonia}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                        placeholder="Roma Norte"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ciudad *
                      </label>
                      <input
                        type="text"
                        name="ciudad"
                        value={formData.ciudad}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                        placeholder="CDMX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado *
                      </label>
                      <input
                        type="text"
                        name="estado"
                        value={formData.estado}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                        placeholder="Ciudad de México"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        C.P. *
                      </label>
                      <input
                        type="text"
                        name="codigoPostal"
                        value={formData.codigoPostal}
                        onChange={handleInputChange}
                        required
                        maxLength="5"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                        placeholder="06700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Referencias / Indicaciones
                    </label>
                    <textarea
                      name="referencias"
                      value={formData.referencias}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
                      placeholder="Casa blanca, portón negro (opcional)"
                    />
                  </div>
                </div>
              </div>

              {/* Botón de pago - Solo en mobile */}
              <div className="lg:hidden">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  icon={<FaCreditCard />}
                  iconPosition="left"
                >
                  Proceder al Pago
                </Button>
              </div>
            </form>
          </motion.div>

          {/* Resumen del pedido */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-24 space-y-6">
              {/* Productos */}
              <div className="bg-white rounded-2xl shadow-soft p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Tu Pedido ({cart.length} {cart.length === 1 ? 'artículo' : 'artículos'})
                </h2>
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.variantSku} className="flex gap-3">
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-16 h-16 rounded-lg flex-shrink-0"
                        aspectRatio="square"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {item.productName}
                        </p>
                        <p className="text-xs text-gray-600">
                          {item.colorName} • {item.size} • x{item.quantity}
                        </p>
                        <p className="text-sm font-semibold text-primary-600 mt-1">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen de costos */}
              <div className="bg-white rounded-2xl shadow-soft p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Envío</span>
                  <span className={esEnvioGratis ? "text-success font-semibold" : "font-semibold text-gray-900"}>
                    {esEnvioGratis ? '¡Gratis!' : formatPrice(costoEnvio)}
                  </span>
                </div>

                {esEnvioGratis && (
                  <div className="px-3 py-2 bg-success/10 rounded-lg">
                    <p className="text-xs text-success">
                      ✓ Calificaste para envío gratis
                    </p>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-primary-600">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Botón de pago - Desktop */}
                <div className="hidden lg:block pt-3">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={loading}
                    icon={<FaCreditCard />}
                    iconPosition="left"
                    onClick={handleSubmit}
                  >
                    Proceder al Pago
                  </Button>
                </div>

                {/* Badges de seguridad */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <FaLock className="text-success" />
                    <span>Pago seguro</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <FaShieldAlt className="text-success" />
                    <span>SSL 256-bit</span>
                  </div>
                </div>

                <p className="text-xs text-center text-gray-500 pt-2">
                  Procesado de forma segura por Stripe
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
