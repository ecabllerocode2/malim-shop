// Drawer del carrito de compras
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaTrash, FaWhatsapp } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import Button from '../ui/Button';
import Image from '../ui/Image';
import { formatPrice } from '../../utils/format';
import { cn } from '../../utils/cn';

const CartDrawer = () => {
  const {
    cart,
    isOpen,
    setIsOpen,
    updateQuantity,
    removeFromCart,
    getTotalPrice,
    getTotalItems,
  } = useCart();

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();
  
  // Constantes de envío
  const ENVIO_GRATIS_MINIMO = 999;
  const COSTO_ENVIO = 179;
  
  // Calcular envío
  const esEnvioGratis = totalPrice >= ENVIO_GRATIS_MINIMO;
  const costoEnvio = esEnvioGratis ? 0 : COSTO_ENVIO;
  const totalFinal = totalPrice + costoEnvio;

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm" />
        </Transition.Child>

        {/* Panel */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-white shadow-large">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200">
                      <Dialog.Title className="text-2xl font-playfair font-bold text-gray-900">
                        Carrito ({totalItems})
                      </Dialog.Title>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <FaTimes className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Productos */}
                    <div className="flex-1 overflow-y-auto px-6 py-6">
                      {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className="w-32 h-32 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
                            <FaWhatsapp className="w-16 h-16 text-gray-300" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Tu carrito está vacío
                          </h3>
                          <p className="text-gray-600 mb-6">
                            Explora nuestro catálogo y encuentra lo que buscas
                          </p>
                          <Button
                            as={Link}
                            to="/catalogo"
                            variant="primary"
                            onClick={() => setIsOpen(false)}
                          >
                            Ver Catálogo
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <AnimatePresence mode="popLayout">
                            {cart.map((item) => (
                              <motion.div
                                key={item.variantSku}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex gap-4 bg-neutral-50 rounded-2xl p-4"
                              >
                                {/* Imagen */}
                                <div className="flex-shrink-0">
                                  <Image
                                    src={item.imageUrl}
                                    alt={item.productName}
                                    className="w-24 h-24 rounded-xl"
                                    aspectRatio="square"
                                  />
                                </div>

                                {/* Información */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                                    {item.productName}
                                  </h4>
                                  
                                  <div className="flex items-center gap-2 mb-2">
                                    <div
                                      className="w-4 h-4 rounded-full border border-gray-300"
                                      style={{ backgroundColor: item.hexColor }}
                                      title={item.colorName}
                                    />
                                    <span className="text-xs text-gray-600">
                                      {item.colorName} • {item.size}
                                    </span>
                                  </div>

                                  <p className="text-lg font-bold text-primary-600">
                                    {formatPrice(item.price)}
                                  </p>

                                  {/* Controles de cantidad */}
                                  <div className="flex items-center gap-3 mt-3">
                                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                      <button
                                        onClick={() =>
                                          updateQuantity(item.variantSku, item.quantity - 1)
                                        }
                                        className="px-3 py-1 hover:bg-gray-100 transition-colors"
                                      >
                                        -
                                      </button>
                                      <span className="px-4 py-1 text-sm font-semibold">
                                        {item.quantity}
                                      </span>
                                      <button
                                        onClick={() =>
                                          updateQuantity(item.variantSku, item.quantity + 1)
                                        }
                                        className="px-3 py-1 hover:bg-gray-100 transition-colors"
                                      >
                                        +
                                      </button>
                                    </div>

                                    <button
                                      onClick={() => removeFromCart(item.variantSku)}
                                      className="text-error hover:text-red-700 transition-colors"
                                    >
                                      <FaTrash className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    {/* Footer con total y botón de checkout */}
                    {cart.length > 0 && (
                      <div className="border-t border-gray-200 px-6 py-6 space-y-4">
                        {/* Subtotal */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-semibold text-gray-900">
                            {formatPrice(totalPrice)}
                          </span>
                        </div>

                        {/* Envío */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Envío</span>
                          <span className={cn(
                            "font-semibold",
                            esEnvioGratis ? "text-success" : "text-gray-900"
                          )}>
                            {esEnvioGratis ? '¡Gratis!' : formatPrice(costoEnvio)}
                          </span>
                        </div>

                        {/* Mensaje de envío gratis */}
                        {!esEnvioGratis && (
                          <div className="px-3 py-2 bg-primary-50 rounded-lg">
                            <p className="text-xs text-primary-700">
                              🚚 Agrega {formatPrice(ENVIO_GRATIS_MINIMO - totalPrice)} más para envío gratis
                            </p>
                          </div>
                        )}

                        {/* Total */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <span className="text-lg font-semibold text-gray-900">Total</span>
                          <span className="text-2xl font-bold text-primary-600">
                            {formatPrice(totalFinal)}
                          </span>
                        </div>

                        {/* Botón de checkout */}
                        <Button
                          as={Link}
                          to="/checkout"
                          variant="primary"
                          size="lg"
                          fullWidth
                          onClick={() => setIsOpen(false)}
                        >
                          Proceder al Pago
                        </Button>

                        {esEnvioGratis && (
                          <p className="text-xs text-center text-success flex items-center justify-center gap-1">
                            ✓ Calificado para envío gratis
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CartDrawer;
