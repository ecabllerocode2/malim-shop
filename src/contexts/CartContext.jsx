/* eslint-disable react-refresh/only-export-components */
// Hook personalizado para el carrito de compras
import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('malim-cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('malim-cart', JSON.stringify(cart));
  }, [cart]);

  // Añadir producto al carrito
  const addToCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (i) => i.variantSku === item.variantSku
      );

      if (existingItem) {
        toast.info('Cantidad actualizada en el carrito');
        return prevCart.map((i) =>
          i.variantSku === item.variantSku
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }

      toast.success('Producto añadido al carrito');
      return [...prevCart, item];
    });
    setIsOpen(true);
  };

  // Actualizar cantidad
  const updateQuantity = (variantSku, quantity) => {
    if (quantity <= 0) {
      removeFromCart(variantSku);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.variantSku === variantSku ? { ...item, quantity } : item
      )
    );
  };

  // Eliminar del carrito
  const removeFromCart = (variantSku) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.variantSku !== variantSku)
    );
    toast.info('Producto eliminado del carrito');
  };

  // Vaciar carrito
  const clearCart = (silent = false) => {
    setCart([]);
    localStorage.removeItem('malim-cart');
    if (!silent) {
      toast.info('Carrito vaciado');
    }
  };

  // Calcular totales
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const value = {
    cart,
    isOpen,
    setIsOpen,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalItems,
    getTotalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

CartProvider.propTypes = {
  children: PropTypes.node,
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
