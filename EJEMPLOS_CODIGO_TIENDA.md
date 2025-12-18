# 🛍️ Ejemplos de Código - Tienda Online Malim

## 📋 Índice de Ejemplos

1. [Componente de Catálogo](#componente-de-catálogo)
2. [Componente de Detalle de Producto](#componente-de-detalle-de-producto)
3. [Lógica de Carrito](#lógica-de-carrito)
4. [Integración Completa con Stripe](#integración-completa-con-stripe)
5. [Backend API Completo](#backend-api-completo)
6. [Reglas de Seguridad Firebase](#reglas-de-seguridad-firebase)

---

## 🏪 Componente de Catálogo

### `ProductCatalog.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from './firebase-config';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  category: string;
  publicPrice: number;
  offerPercentage: number;
  variants: {
    id: number;
    colorName: string;
    hexColor: string;
    imageUrls: string[];
  }[];
  publishOnline: boolean;
}

const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, [category]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // Consulta base: solo productos publicados
      let q = query(
        collection(db, 'productos'),
        where('publishOnline', '==', true), // ⭐ CRÍTICO
        orderBy('dateAdded', 'desc')
      );
      
      // Si hay categoría específica, agregar filtro
      if (category !== 'all') {
        q = query(
          collection(db, 'productos'),
          where('publishOnline', '==', true),
          where('category', '==', category),
          orderBy('dateAdded', 'desc')
        );
      }
      
      const snapshot = await getDocs(q);
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      setProducts(productsData);
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateFinalPrice = (publicPrice: number, offerPercentage: number) => {
    if (offerPercentage > 0) {
      return publicPrice - (publicPrice * offerPercentage / 100);
    }
    return publicPrice;
  };

  const getMainImage = (product: Product) => {
    return product.variants[0]?.imageUrls[0] || '/placeholder.jpg';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Tienda Malim</h1>
        
        {/* Filtros de Categoría */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setCategory('all')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              category === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setCategory('vestidos')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              category === 'vestidos'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Vestidos
          </button>
          <button
            onClick={() => setCategory('blusas')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              category === 'blusas'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Blusas
          </button>
          <button
            onClick={() => setCategory('pantalones')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              category === 'pantalones'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pantalones
          </button>
        </div>
      </div>

      {/* Grid de Productos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => {
          const finalPrice = calculateFinalPrice(product.publicPrice, product.offerPercentage);
          const hasDiscount = product.offerPercentage > 0;
          
          return (
            <div
              key={product.id}
              onClick={() => navigate(`/producto/${product.id}`)}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
            >
              {/* Imagen */}
              <div className="relative aspect-square">
                <img
                  src={getMainImage(product)}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Badge de Descuento */}
                {hasDiscount && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    -{product.offerPercentage}%
                  </div>
                )}
                
                {/* Colores Disponibles */}
                <div className="absolute bottom-2 left-2 flex gap-1">
                  {product.variants.slice(0, 3).map((variant) => (
                    <div
                      key={variant.id}
                      className="w-6 h-6 rounded-full border-2 border-white shadow"
                      style={{ backgroundColor: variant.hexColor }}
                      title={variant.colorName}
                    />
                  ))}
                  {product.variants.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white shadow flex items-center justify-center text-xs">
                      +{product.variants.length - 3}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Información */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {product.name}
                </h3>
                
                {/* Precios */}
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-blue-600">
                    ${finalPrice.toLocaleString('es-MX')}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-gray-500 line-through">
                      ${product.publicPrice.toLocaleString('es-MX')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sin Resultados */}
      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No se encontraron productos en esta categoría</p>
        </div>
      )}
    </div>
  );
};

export default ProductCatalog;
```

---

## 📦 Componente de Detalle de Producto

### `ProductDetail.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase-config';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import WhatsAppButton from './WhatsAppButton';

interface Size {
  size: string;
  variantSku: string;
  stock: number;
  isInStock: boolean;
}

interface Variant {
  id: number;
  colorName: string;
  hexColor: string;
  imageUrls: string[];
  sizes: Size[];
}

interface Product {
  id: string;
  name: string;
  category: string;
  publicPrice: number;
  offerPercentage: number;
  shortDetails: string;
  longDescription?: string;
  variants: Variant[];
  publishOnline: boolean;
}

const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    if (!productId) return;
    
    try {
      const docRef = doc(db, 'productos', productId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Product;
        
        // Verificar que el producto esté publicado
        if (!data.publishOnline) {
          navigate('/404');
          return;
        }
        
        setProduct(data);
        setSelectedVariant(data.variants[0]);
      } else {
        navigate('/404');
      }
    } catch (error) {
      console.error('Error cargando producto:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateFinalPrice = () => {
    if (!product) return 0;
    const discount = (product.publicPrice * product.offerPercentage) / 100;
    return product.publicPrice - discount;
  };

  const handleAddToCart = () => {
    if (!selectedSize || !selectedVariant || !product) return;
    
    if (selectedSize.stock === 0) {
      alert('Este producto está bajo pedido. Por favor, contacta por WhatsApp.');
      return;
    }
    
    const cartItem = {
      productId: product.id,
      productName: product.name,
      variantId: selectedVariant.id,
      colorName: selectedVariant.colorName,
      hexColor: selectedVariant.hexColor,
      size: selectedSize.size,
      variantSku: selectedSize.variantSku,
      quantity: quantity,
      price: calculateFinalPrice(),
      imageUrl: selectedVariant.imageUrls[0]
    };
    
    // Guardar en localStorage o contexto
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push(cartItem);
    localStorage.setItem('cart', JSON.stringify(cart));
    
    alert('Producto añadido al carrito');
    navigate('/carrito');
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: 'Bajo Pedido', color: 'text-gray-600 bg-gray-100' };
    if (stock <= 3) return { text: `¡Solo ${stock} disponibles!`, color: 'text-yellow-600 bg-yellow-100' };
    return { text: 'En Stock', color: 'text-green-600 bg-green-100' };
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
  }

  if (!product || !selectedVariant) {
    return <div>Producto no encontrado</div>;
  }

  const finalPrice = calculateFinalPrice();
  const hasDiscount = product.offerPercentage > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Galería de Imágenes */}
        <div>
          {/* Imagen Principal */}
          <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={selectedVariant.imageUrls[selectedImageIndex] || '/placeholder.jpg'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Miniaturas */}
          <div className="grid grid-cols-4 gap-2">
            {selectedVariant.imageUrls.map((url, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`aspect-square rounded-lg overflow-hidden border-2 ${
                  selectedImageIndex === index ? 'border-blue-600' : 'border-gray-200'
                }`}
              >
                <img src={url} alt={`Vista ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Información del Producto */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
          
          {/* Precios */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl font-bold text-blue-600">
              ${finalPrice.toLocaleString('es-MX')}
            </span>
            {hasDiscount && (
              <>
                <span className="text-xl text-gray-500 line-through">
                  ${product.publicPrice.toLocaleString('es-MX')}
                </span>
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  -{product.offerPercentage}%
                </span>
              </>
            )}
          </div>
          
          {/* Descripción Corta */}
          <p className="text-gray-700 mb-6">{product.shortDetails}</p>
          
          {/* Selector de Color */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color: <span className="font-semibold">{selectedVariant.colorName}</span>
            </label>
            <div className="flex gap-2">
              {product.variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => {
                    setSelectedVariant(variant);
                    setSelectedSize(null);
                    setSelectedImageIndex(0);
                  }}
                  className={`w-12 h-12 rounded-full border-2 ${
                    selectedVariant.id === variant.id
                      ? 'border-blue-600 ring-2 ring-blue-200'
                      : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: variant.hexColor }}
                  title={variant.colorName}
                />
              ))}
            </div>
          </div>
          
          {/* Selector de Talla */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Talla
            </label>
            <div className="grid grid-cols-4 gap-2">
              {selectedVariant.sizes.map((size) => {
                const status = getStockStatus(size.stock);
                return (
                  <button
                    key={size.size}
                    onClick={() => setSelectedSize(size)}
                    disabled={size.stock === 0}
                    className={`py-3 px-4 rounded-lg border-2 font-semibold ${
                      selectedSize?.size === size.size
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : size.stock > 0
                        ? 'border-gray-300 hover:border-gray-400'
                        : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {size.size}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Stock Status */}
          {selectedSize && (
            <div className="mb-6">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                getStockStatus(selectedSize.stock).color
              }`}>
                {getStockStatus(selectedSize.stock).text}
              </span>
            </div>
          )}
          
          {/* Cantidad */}
          {selectedSize && selectedSize.stock > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-100"
                >
                  -
                </button>
                <span className="text-xl font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(selectedSize.stock, quantity + 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>
          )}
          
          {/* Botones de Acción */}
          <div className="space-y-3">
            {selectedSize && selectedSize.stock > 0 ? (
              <button
                onClick={handleAddToCart}
                disabled={!selectedSize}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingCartIcon className="w-5 h-5" />
                Añadir al Carrito
              </button>
            ) : (
              <WhatsAppButton
                product={product}
                selectedVariant={selectedVariant}
                selectedSize={selectedSize}
                quantity={quantity}
              />
            )}
          </div>
          
          {/* Descripción Larga */}
          {product.longDescription && (
            <div className="mt-8 pt-8 border-t">
              <h2 className="text-xl font-bold mb-4">Descripción</h2>
              <div
                className="prose prose-sm"
                dangerouslySetInnerHTML={{ __html: product.longDescription }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
```

---

## 🛒 Lógica de Carrito

### `CartContext.tsx`

```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
  productId: string;
  productName: string;
  variantId: number;
  colorName: string;
  hexColor: string;
  size: string;
  variantSku: string;
  quantity: number;
  price: number;
  imageUrl: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (variantSku: string) => void;
  updateQuantity: (variantSku: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Cargar carrito desde localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(i => i.variantSku === item.variantSku);
      
      if (existingItem) {
        return prevCart.map(i =>
          i.variantSku === item.variantSku
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      
      return [...prevCart, item];
    });
  };

  const removeFromCart = (variantSku: string) => {
    setCart((prevCart) => prevCart.filter(item => item.variantSku !== variantSku));
  };

  const updateQuantity = (variantSku: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantSku);
      return;
    }
    
    setCart((prevCart) =>
      prevCart.map(item =>
        item.variantSku === variantSku ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
```

---

## 💳 Integración Completa con Stripe

### `Checkout.tsx`

```tsx
import React, { useState } from 'react';
import { useCart } from './CartContext';
import { useNavigate } from 'react-router-dom';

const Checkout: React.FC = () => {
  const { cart, getTotalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (!email) {
      alert('Por favor ingresa tu email');
      return;
    }

    setLoading(true);

    try {
      // 1. Validar stock en backend
      const stockValidation = await fetch('https://tu-backend.com/api/validate-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart })
      });

      const stockResult = await stockValidation.json();

      if (!stockResult.valid) {
        alert(`Stock insuficiente: ${stockResult.errors.join(', ')}`);
        setLoading(false);
        return;
      }

      // 2. Crear sesión de Stripe
      const response = await fetch('https://tu-backend.com/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          customerEmail: email
        })
      });

      const { url } = await response.json();

      // 3. Redirigir a Stripe Checkout
      window.location.href = url;
      
    } catch (error) {
      console.error('Error en checkout:', error);
      alert('Error al procesar el pago. Por favor intenta nuevamente.');
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      {/* Resumen del Pedido */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Resumen del Pedido</h2>
        
        {cart.map((item) => (
          <div key={item.variantSku} className="flex gap-4 mb-4 pb-4 border-b">
            <img
              src={item.imageUrl}
              alt={item.productName}
              className="w-20 h-20 object-cover rounded"
            />
            <div className="flex-1">
              <h3 className="font-semibold">{item.productName}</h3>
              <p className="text-sm text-gray-600">
                Color: {item.colorName} | Talla: {item.size}
              </p>
              <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">
                ${(item.price * item.quantity).toLocaleString('es-MX')}
              </p>
            </div>
          </div>
        ))}

        <div className="pt-4 border-t">
          <div className="flex justify-between text-xl font-bold">
            <span>Total:</span>
            <span>${getTotalPrice().toLocaleString('es-MX')} MXN</span>
          </div>
        </div>
      </div>

      {/* Formulario de Email */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Información de Contacto</h2>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="tu@email.com"
          required
        />
      </div>

      {/* Botón de Pago */}
      <button
        onClick={handleCheckout}
        disabled={loading || cart.length === 0}
        className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Procesando...' : `Pagar $${getTotalPrice().toLocaleString('es-MX')} MXN`}
      </button>

      <p className="text-center text-sm text-gray-600 mt-4">
        Pago seguro procesado por Stripe
      </p>
    </div>
  );
};

export default Checkout;
```

---

## 🖥️ Backend API Completo

### `server.ts` (Node.js + Express)

```typescript
import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Configuración
const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
});

// Inicializar Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(express.json());

// ==========================================
// ENDPOINT: Validar Stock
// ==========================================
app.post('/api/validate-stock', async (req, res) => {
  try {
    const { items } = req.body;
    const errors: string[] = [];

    for (const item of items) {
      const productRef = db.collection('productos').doc(item.productId);
      const productDoc = await productRef.get();

      if (!productDoc.exists) {
        errors.push(`Producto ${item.productName} no encontrado`);
        continue;
      }

      const product = productDoc.data()!;
      const variant = product.variants.find((v: any) => v.id === item.variantId);

      if (!variant) {
        errors.push(`Color ${item.colorName} no disponible`);
        continue;
      }

      const size = variant.sizes.find((s: any) => s.size === item.size);

      if (!size || size.stock < item.quantity) {
        errors.push(
          `Stock insuficiente para ${item.productName} - ${item.colorName} - ${item.size}. ` +
          `Solicitado: ${item.quantity}, Disponible: ${size?.stock || 0}`
        );
        continue;
      }
    }

    res.json({
      valid: errors.length === 0,
      errors
    });
  } catch (error: any) {
    console.error('Error validando stock:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ENDPOINT: Crear Sesión de Checkout
// ==========================================
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { items, customerEmail } = req.body;

    // Validar stock antes de crear sesión
    const errors: string[] = [];
    for (const item of items) {
      const productRef = db.collection('productos').doc(item.productId);
      const productDoc = await productRef.get();

      if (!productDoc.exists) {
        errors.push(`Producto no encontrado`);
        continue;
      }

      const product = productDoc.data()!;
      const variant = product.variants.find((v: any) => v.id === item.variantId);
      const size = variant?.sizes.find((s: any) => s.size === item.size);

      if (!size || size.stock < item.quantity) {
        errors.push(`Stock insuficiente`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') });
    }

    // Crear line items para Stripe
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'mxn',
        product_data: {
          name: item.productName,
          description: `${item.colorName} - Talla ${item.size}`,
          images: [item.imageUrl],
          metadata: {
            productId: item.productId,
            variantSku: item.variantSku
          }
        },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: item.quantity
    }));

    // Crear sesión de Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
      customer_email: customerEmail,
      metadata: {
        orderItems: JSON.stringify(items.map((i: any) => ({
          productId: i.productId,
          productName: i.productName,
          variantSku: i.variantSku,
          colorName: i.colorName,
          size: i.size,
          quantity: i.quantity,
          price: i.price
        })))
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Error creando sesión:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// WEBHOOK: Stripe
// ==========================================
app.post('/api/stripe-webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature']!;

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderItems = JSON.parse(session.metadata!.orderItems);

        // Usar transacción de Firestore para atomicidad
        await db.runTransaction(async (transaction) => {
          // 1. Crear orden
          const ordenRef = db.collection('ordenes').doc();
          transaction.set(ordenRef, {
            clienteEmail: session.customer_email,
            clienteNombre: session.customer_details?.name || '',
            total: session.amount_total! / 100,
            subtotal: session.amount_subtotal! / 100,
            estado: 'pagado',
            estadoEnvio: 'pendiente',
            metodoPago: 'stripe',
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent,
            items: orderItems,
            fechaCreacion: FieldValue.serverTimestamp(),
            timestamp: Date.now()
          });

          // 2. Descontar stock y registrar movimientos
          for (const item of orderItems) {
            const productRef = db.collection('productos').doc(item.productId);
            const productDoc = await transaction.get(productRef);

            if (!productDoc.exists) continue;

            const product = productDoc.data()!;
            
            // Actualizar stock
            const updatedVariants = product.variants.map((variant: any) => {
              const updatedSizes = variant.sizes.map((size: any) => {
                if (size.variantSku === item.variantSku) {
                  const newStock = Math.max(0, size.stock - item.quantity);
                  return {
                    ...size,
                    stock: newStock,
                    isInStock: newStock > 0
                  };
                }
                return size;
              });
              return { ...variant, sizes: updatedSizes };
            });

            transaction.update(productRef, { variants: updatedVariants });

            // Registrar movimiento de inventario
            const movementRef = db.collection('inventory_movements').doc();
            transaction.set(movementRef, {
              tipo: 'salida',
              motivo: 'venta_online',
              productoId: item.productId,
              productoNombre: item.productName,
              variantSku: item.variantSku,
              colorName: item.colorName,
              size: item.size,
              cantidad: item.quantity,
              precio: item.price,
              ordenId: ordenRef.id,
              timestamp: FieldValue.serverTimestamp()
            });
          }
        });

        console.log(`✅ Orden creada y stock actualizado para sesión ${session.id}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Error en webhook:', error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }
);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
```

---

## 🔒 Reglas de Seguridad Firebase

### `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Productos: Solo lectura pública para productos publicados
    match /productos/{productId} {
      // Lectura: Cualquiera puede leer productos publicados
      allow read: if resource.data.publishOnline == true;
      
      // Escritura: Solo admin (requiere autenticación)
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Ordenes: Solo el propietario o admin puede leer
    match /ordenes/{orderId} {
      // Lectura: Solo el cliente que hizo el pedido o admin
      allow read: if request.auth != null && 
                     (request.auth.token.email == resource.data.clienteEmail ||
                      request.auth.token.admin == true);
      
      // Escritura: Solo el backend (service account) o admin
      allow create: if request.auth != null && request.auth.token.admin == true;
      allow update: if request.auth != null && request.auth.token.admin == true;
      allow delete: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Movimientos de inventario: Solo admin
    match /inventory_movements/{movementId} {
      allow read: if request.auth != null && request.auth.token.admin == true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Clientes: Solo admin
    match /clientes/{clienteId} {
      allow read: if request.auth != null && request.auth.token.admin == true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

---

## 🚀 Variables de Entorno

### `.env` (Backend)

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend URL
FRONTEND_URL=https://tu-tienda.com

# Firebase Admin SDK
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json

# Server
PORT=3000
NODE_ENV=production
```

### `.env` (Frontend)

```bash
# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# API Backend
VITE_API_URL=https://tu-backend.com

# Firebase
VITE_FIREBASE_API_KEY=AIzaSyAcPmOLCEeL5sRenwhtTWCIBawWNcnD4Ls
VITE_FIREBASE_AUTH_DOMAIN=malim-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=malim-app
```

---

## ✅ Checklist de Implementación

### Frontend
- [ ] Instalar dependencias: `npm install @stripe/stripe-js react-router-dom`
- [ ] Configurar Firebase SDK
- [ ] Implementar `ProductCatalog.tsx`
- [ ] Implementar `ProductDetail.tsx`
- [ ] Implementar `CartContext.tsx`
- [ ] Implementar `Checkout.tsx`
- [ ] Implementar `WhatsAppButton.tsx`
- [ ] Configurar rutas en React Router
- [ ] Agregar variables de entorno

### Backend
- [ ] Instalar dependencias: `npm install express stripe firebase-admin cors dotenv`
- [ ] Configurar Firebase Admin SDK
- [ ] Implementar endpoints de API
- [ ] Configurar webhook de Stripe
- [ ] Agregar variables de entorno
- [ ] Implementar logging
- [ ] Desplegar en servidor (Vercel, Railway, etc.)

### Firebase
- [ ] Configurar reglas de seguridad
- [ ] Crear índices compuestos
- [ ] Configurar límites de cuota
- [ ] Habilitar facturación (si es necesario)

### Stripe
- [ ] Crear cuenta de Stripe
- [ ] Obtener API keys
- [ ] Configurar webhook endpoint
- [ ] Probar en modo test
- [ ] Activar modo producción

---

**¡Listo para lanzar tu tienda en línea!** 🎉
