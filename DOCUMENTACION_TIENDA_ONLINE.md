# 🛍️ Documentación Técnica - Integración Tienda en Línea

## 📋 Índice

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Estructura de Datos](#estructura-de-datos)
3. [Colección `productos` - Firebase](#colección-productos)
4. [Sistema de Stock e Inventario](#sistema-de-stock-e-inventario)
5. [Lógica de Negocio](#lógica-de-negocio)
6. [Integración con Stripe](#integración-con-stripe)
7. [Integración con WhatsApp](#integración-con-whatsapp)
8. [API Endpoints Requeridos](#api-endpoints-requeridos)
9. [Flujo de Compra](#flujo-de-compra)
10. [Casos de Uso](#casos-de-uso)

---

## 🏗️ Arquitectura del Sistema

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────┐
│                    TIENDA EN LÍNEA                          │
│                   (Frontend Web/Mobile)                     │
└──────────────┬──────────────────────────────────────────────┘
               │
               │ API REST / Firebase SDK
               │
┌──────────────▼──────────────────────────────────────────────┐
│                    FIREBASE FIRESTORE                       │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  productos   │  │  ordenes     │  │ inventory_   │    │
│  │              │  │              │  │ movements    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
               │
               │ Webhooks / Integraciones
               │
┌──────────────▼─────────────┬────────────────────────────────┐
│         STRIPE             │        WHATSAPP               │
│    (Pagos en línea)        │   (Pedidos bajo pedido)       │
└────────────────────────────┴────────────────────────────────┘
```

---

## 📊 Estructura de Datos

### Colección: `productos`

**Ubicación:** Firestore Database → `productos`

#### Estructura de Documento

```typescript
interface Product {
  // --- IDENTIFICACIÓN ---
  id: string;                    // ID del documento (auto-generado por Firestore)
  productSku: string;            // SKU único del producto (ej: "MAL-2024-001")
  name: string;                  // Nombre del producto (ej: "Vestido Floral Primavera")
  
  // --- CATEGORIZACIÓN ---
  category: string;              // Categoría del producto (ej: "vestidos/largos")
  
  // --- PRECIOS ---
  cost: number;                  // Costo de producción/compra (uso interno)
  publicPrice: number;           // Precio público sin descuento
  offerPercentage: number;       // Porcentaje de descuento (0-100)
  
  // --- PROVEEDOR ---
  supplier: string;              // Nombre del proveedor
  
  // --- PUBLICACIÓN ---
  publishOnline: boolean;        // ⭐ CRÍTICO: Define si aparece en tienda
                                 // true = Visible en tienda online
                                 // false = Solo visible en intranet (borrador)
  
  // --- DESCRIPCIONES ---
  shortDetails: string;          // Descripción corta (1-2 líneas)
  longDescription?: string;      // Descripción detallada (HTML/Markdown permitido)
  
  // --- METADATA ---
  creationDate?: string;         // Fecha de creación (YYYY-MM-DD)
  dateAdded: number;             // Timestamp de creación (milisegundos)
  
  // --- VARIANTES (COLORES Y TALLAS) ---
  variants: Variant[];           // Array de variantes del producto
  
  // --- CAMPOS DE MIGRACIÓN (Opcional) ---
  _migratedFrom?: string;
  _migrationDate?: string;
  _originalDocId?: string;
}
```

#### Estructura de Variante

```typescript
interface Variant {
  // --- IDENTIFICACIÓN ---
  id: number;                    // ID único de la variante (1, 2, 3...)
  
  // --- COLOR ---
  colorName: string;             // Nombre del color (ej: "Rojo Pasión")
  hexColor: string;              // Color en hexadecimal (ej: "#FF5733")
  
  // --- IMÁGENES ---
  imageIds: string[];            // IDs de las imágenes en el servidor
  imageUrls: string[];           // URLs completas de las imágenes
                                 // Primera imagen = imagen principal
  
  // --- TALLAS Y STOCK ---
  sizes: Size[];                 // Array de tallas con su stock
}
```

#### Estructura de Talla

```typescript
interface Size {
  // --- IDENTIFICACIÓN ---
  size: string;                  // Talla (ej: "CH", "M", "G", "XL")
  variantSku: string;            // SKU único de esta variante-talla
                                 // Formato: {productSku}-{colorId}-{size}
                                 // Ejemplo: "MAL-2024-001-1-M"
  
  // --- STOCK ---
  stock: number;                 // ⭐ CRÍTICO: Cantidad en inventario físico
                                 // >= 1 = Compra con stock disponible
                                 // 0 = Compra bajo pedido (WhatsApp)
  
  isInStock: boolean;            // true si stock > 0, false si stock === 0
}
```

---

## 🔍 Colección `productos` - Detalles

### Configuración de Firebase

```typescript
// src/credenciales.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAcPmOLCEeL5sRenwhtTWCIBawWNcnD4Ls",
  authDomain: "malim-app.firebaseapp.com",
  projectId: "malim-app",
  storageBucket: "malim-app.firebasestorage.app",
  messagingSenderId: "953747301080",
  appId: "1:953747301080:web:d3cfd18e9be012bb822dad",
  measurementId: "G-9DD5YEX28R"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

### Consultas Básicas

#### Obtener Productos Publicados

```typescript
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from './credenciales';

// Obtener solo productos visibles en tienda
async function getPublishedProducts() {
  const q = query(
    collection(db, 'productos'),
    where('publishOnline', '==', true),
    orderBy('dateAdded', 'desc')
  );
  
  const snapshot = await getDocs(q);
  const products = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  return products;
}
```

#### Obtener Producto por ID

```typescript
import { doc, getDoc } from 'firebase/firestore';

async function getProductById(productId: string) {
  const docRef = doc(db, 'productos', productId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  }
  return null;
}
```

#### Filtrar por Categoría

```typescript
async function getProductsByCategory(category: string) {
  const q = query(
    collection(db, 'productos'),
    where('publishOnline', '==', true),
    where('category', '==', category),
    orderBy('dateAdded', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}
```

---

## 📦 Sistema de Stock e Inventario

### Estados de Stock

```typescript
enum StockStatus {
  IN_STOCK = 'in_stock',        // stock > 0: Compra inmediata con Stripe
  OUT_OF_STOCK = 'out_of_stock', // stock === 0: Bajo pedido con WhatsApp
  LOW_STOCK = 'low_stock'        // stock > 0 && stock <= 3: Alerta de stock bajo
}
```

### Función para Calcular Estado de Stock

```typescript
function getStockStatus(stock: number): StockStatus {
  if (stock === 0) return StockStatus.OUT_OF_STOCK;
  if (stock <= 3) return StockStatus.LOW_STOCK;
  return StockStatus.IN_STOCK;
}
```

### Función para Verificar Disponibilidad

```typescript
interface VariantAvailability {
  variantId: number;
  colorName: string;
  availableSizes: {
    size: string;
    variantSku: string;
    stock: number;
    status: StockStatus;
  }[];
  hasStock: boolean; // true si al menos una talla tiene stock > 0
}

function getVariantAvailability(variant: Variant): VariantAvailability {
  const availableSizes = variant.sizes.map(size => ({
    size: size.size,
    variantSku: size.variantSku,
    stock: size.stock,
    status: getStockStatus(size.stock)
  }));
  
  const hasStock = availableSizes.some(s => s.stock > 0);
  
  return {
    variantId: variant.id,
    colorName: variant.colorName,
    availableSizes,
    hasStock
  };
}
```

---

## 💼 Lógica de Negocio

### Reglas de Visualización en Tienda

#### ✅ Productos que SE MUESTRAN en Tienda

1. `publishOnline === true`
2. Al menos una variante con imágenes (`imageUrls.length > 0`)
3. Precio público > 0

```typescript
function shouldShowInStore(product: Product): boolean {
  if (!product.publishOnline) return false;
  if (product.publicPrice <= 0) return false;
  
  // Verificar que al menos una variante tenga imágenes
  const hasImages = product.variants.some(v => v.imageUrls.length > 0);
  if (!hasImages) return false;
  
  return true;
}
```

#### ❌ Productos que NO SE MUESTRAN

1. `publishOnline === false` (borradores)
2. Sin variantes o sin imágenes
3. Precio = 0

---

### Cálculo de Precio Final

```typescript
function calculateFinalPrice(publicPrice: number, offerPercentage: number): number {
  if (offerPercentage <= 0) return publicPrice;
  
  const discount = (publicPrice * offerPercentage) / 100;
  const finalPrice = publicPrice - discount;
  
  return Math.round(finalPrice);
}

// Ejemplo:
// Precio público: $800
// Descuento: 20%
// Precio final: $640
```

### Mostrar Indicadores de Stock

```typescript
interface StockBadge {
  text: string;
  color: 'green' | 'yellow' | 'red' | 'gray';
  showStock: boolean;
}

function getStockBadge(stock: number): StockBadge {
  if (stock === 0) {
    return {
      text: 'Bajo Pedido',
      color: 'gray',
      showStock: false
    };
  }
  
  if (stock <= 3) {
    return {
      text: `¡Solo ${stock} disponibles!`,
      color: 'yellow',
      showStock: true
    };
  }
  
  return {
    text: 'En Stock',
    color: 'green',
    showStock: false
  };
}
```

---

## 💳 Integración con Stripe

### Flujo con Stock Disponible (stock > 0)

#### 1. Cliente Selecciona Producto

```typescript
interface CartItem {
  productId: string;
  productName: string;
  variantId: number;
  colorName: string;
  hexColor: string;
  size: string;
  variantSku: string;
  quantity: number;
  price: number;          // Precio final (con descuento aplicado)
  imageUrl: string;
}
```

#### 2. Validar Stock Antes de Checkout

```typescript
import { doc, getDoc } from 'firebase/firestore';

async function validateStock(items: CartItem[]): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  
  for (const item of items) {
    const productDoc = await getDoc(doc(db, 'productos', item.productId));
    
    if (!productDoc.exists()) {
      errors.push(`Producto ${item.productName} no encontrado`);
      continue;
    }
    
    const product = productDoc.data();
    const variant = product.variants.find((v: Variant) => v.id === item.variantId);
    
    if (!variant) {
      errors.push(`Color ${item.colorName} no disponible`);
      continue;
    }
    
    const size = variant.sizes.find((s: Size) => s.size === item.size);
    
    if (!size || size.stock < item.quantity) {
      errors.push(`Stock insuficiente para ${item.productName} - ${item.colorName} - ${item.size}`);
      continue;
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

#### 3. Crear Sesión de Stripe

```typescript
// Backend API Endpoint
// POST /api/create-checkout-session

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
});

interface CheckoutItem {
  productId: string;
  productName: string;
  variantSku: string;
  quantity: number;
  price: number;
  imageUrl: string;
}

async function createCheckoutSession(items: CheckoutItem[], customerEmail?: string) {
  const lineItems = items.map(item => ({
    price_data: {
      currency: 'mxn',
      product_data: {
        name: item.productName,
        images: [item.imageUrl],
        metadata: {
          productId: item.productId,
          variantSku: item.variantSku
        }
      },
      unit_amount: Math.round(item.price * 100) // Convertir a centavos
    },
    quantity: item.quantity
  }));
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
    customer_email: customerEmail,
    metadata: {
      orderItems: JSON.stringify(items.map(i => ({
        productId: i.productId,
        variantSku: i.variantSku,
        quantity: i.quantity
      })))
    }
  });
  
  return session;
}
```

#### 4. Webhook de Stripe (Confirmación de Pago)

```typescript
// POST /api/stripe-webhook

import { runTransaction, doc, collection, addDoc, Timestamp } from 'firebase/firestore';

async function handleStripeWebhook(event: Stripe.Event) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Obtener items del pedido desde metadata
    const orderItems = JSON.parse(session.metadata!.orderItems);
    
    // ⭐ TRANSACCIÓN ATÓMICA: Crear orden y actualizar stock
    await runTransaction(db, async (transaction) => {
      // 1. Crear orden
      const ordenRef = doc(collection(db, 'ordenes'));
      transaction.set(ordenRef, {
        clienteEmail: session.customer_email,
        total: session.amount_total! / 100,
        estado: 'pagado',
        metodoPago: 'stripe',
        stripeSessionId: session.id,
        items: orderItems,
        fechaCreacion: Timestamp.now(),
        timestamp: Date.now()
      });
      
      // 2. Descontar stock de cada producto
      for (const item of orderItems) {
        const productRef = doc(db, 'productos', item.productId);
        const productDoc = await transaction.get(productRef);
        
        if (!productDoc.exists()) continue;
        
        const product = productDoc.data();
        const updatedVariants = product.variants.map((variant: Variant) => {
          const updatedSizes = variant.sizes.map((size: Size) => {
            if (size.variantSku === item.variantSku) {
              return {
                ...size,
                stock: Math.max(0, size.stock - item.quantity),
                isInStock: (size.stock - item.quantity) > 0
              };
            }
            return size;
          });
          
          return { ...variant, sizes: updatedSizes };
        });
        
        transaction.update(productRef, { variants: updatedVariants });
        
        // 3. Registrar movimiento de inventario
        const movementRef = doc(collection(db, 'inventory_movements'));
        transaction.set(movementRef, {
          tipo: 'salida',
          motivo: 'venta_online',
          productoId: item.productId,
          variantSku: item.variantSku,
          cantidad: item.quantity,
          ordenId: ordenRef.id,
          timestamp: Timestamp.now()
        });
      }
    });
    
    // 4. Enviar email de confirmación (opcional)
    // await sendOrderConfirmation(session.customer_email, ordenRef.id);
    
    return { success: true };
  }
}
```

---

## 📱 Integración con WhatsApp

### Flujo Bajo Pedido (stock === 0)

#### 1. Botón de WhatsApp

```typescript
interface WhatsAppOrderData {
  productName: string;
  colorName: string;
  size: string;
  quantity: number;
  price: number;
  imageUrl: string;
}

function generateWhatsAppLink(order: WhatsAppOrderData): string {
  const phoneNumber = '5215512345678'; // Número de WhatsApp del negocio
  
  const message = `¡Hola! Me interesa el siguiente producto:

📦 *${order.productName}*
🎨 Color: ${order.colorName}
📏 Talla: ${order.size}
🔢 Cantidad: ${order.quantity}
💰 Precio: $${order.price.toLocaleString('es-MX')}

¿Está disponible bajo pedido?`;
  
  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
}
```

#### 2. Componente React

```tsx
interface WhatsAppButtonProps {
  product: Product;
  selectedVariant: Variant;
  selectedSize: Size;
  quantity: number;
}

function WhatsAppButton({ product, selectedVariant, selectedSize, quantity }: WhatsAppButtonProps) {
  const handleWhatsAppOrder = () => {
    const orderData: WhatsAppOrderData = {
      productName: product.name,
      colorName: selectedVariant.colorName,
      size: selectedSize.size,
      quantity,
      price: calculateFinalPrice(product.publicPrice, product.offerPercentage),
      imageUrl: selectedVariant.imageUrls[0]
    };
    
    const whatsappUrl = generateWhatsAppLink(orderData);
    window.open(whatsappUrl, '_blank');
  };
  
  return (
    <button
      onClick={handleWhatsAppOrder}
      className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 flex items-center justify-center gap-2"
    >
      <WhatsAppIcon />
      Consultar Disponibilidad
    </button>
  );
}
```

---

## 🔌 API Endpoints Requeridos

### Backend (Node.js / Express)

```typescript
// server.ts
import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

app.use(cors());
app.use(express.json());

// 1. Crear sesión de checkout
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { items, customerEmail } = req.body;
    const session = await createCheckoutSession(items, customerEmail);
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Webhook de Stripe
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
      
      await handleStripeWebhook(event);
      res.json({ received: true });
    } catch (error) {
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }
);

// 3. Verificar stock
app.post('/api/validate-stock', async (req, res) => {
  try {
    const { items } = req.body;
    const result = await validateStock(items);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

---

## 🛒 Flujo de Compra Completo

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────┐
│  1. CLIENTE NAVEGA TIENDA                                   │
│     - Solo productos con publishOnline = true               │
│     - Filtrar por categoría, precio, etc.                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  2. SELECCIONA PRODUCTO                                     │
│     - Ver imágenes de variantes (colores)                   │
│     - Ver tallas disponibles                                │
│     - Ver precio (con descuento si aplica)                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  3. VERIFICAR STOCK                                         │
│     - Si stock > 0 → Flujo con Stripe                       │
│     - Si stock === 0 → Flujo con WhatsApp                   │
└───┬──────────────────────────────┬──────────────────────────┘
    │                              │
    │ stock > 0                    │ stock === 0
    ▼                              ▼
┌───────────────────┐         ┌────────────────────────┐
│  4A. STRIPE       │         │  4B. WHATSAPP          │
│  - Añadir carrito │         │  - Generar mensaje     │
│  - Checkout       │         │  - Abrir WhatsApp      │
│  - Pagar          │         │  - Negociación manual  │
└─────┬─────────────┘         └────────────────────────┘
      │
      ▼
┌───────────────────────────────────┐
│  5. WEBHOOK STRIPE                │
│  - Confirmar pago                 │
│  - Crear orden en Firestore       │
│  - Descontar stock (TRANSACCIÓN)  │
│  - Registrar movimiento inventario│
└─────┬─────────────────────────────┘
      │
      ▼
┌───────────────────────────────────┐
│  6. CONFIRMACIÓN                  │
│  - Email al cliente               │
│  - Actualización estado pedido    │
│  - Preparar para envío            │
└───────────────────────────────────┘
```

---

## 📝 Casos de Uso

### Caso 1: Compra con Stock Disponible

**Escenario:**
- Producto: Vestido Floral
- Color: Rojo
- Talla: M
- Stock actual: 5 unidades
- Precio: $800 (20% descuento = $640)

**Flujo:**

1. Cliente añade al carrito
2. Validar stock en tiempo real (5 >= 1 ✅)
3. Procesar pago con Stripe
4. Webhook recibe confirmación
5. **TRANSACCIÓN ATÓMICA:**
   - Crear orden en `ordenes`
   - Actualizar stock: 5 → 4
   - Registrar movimiento en `inventory_movements`:
     ```json
     {
       "tipo": "salida",
       "motivo": "venta_online",
       "variantSku": "MAL-2024-001-1-M",
       "cantidad": 1,
       "stockAnterior": 5,
       "stockNuevo": 4
     }
     ```

### Caso 2: Compra Bajo Pedido (Sin Stock)

**Escenario:**
- Producto: Blusa Elegante
- Color: Azul
- Talla: L
- Stock actual: 0 unidades
- Precio: $600

**Flujo:**

1. Cliente selecciona producto
2. Sistema detecta stock === 0
3. **Mostrar botón WhatsApp** (NO Stripe)
4. Generar mensaje automático:
   ```
   ¡Hola! Me interesa:
   📦 Blusa Elegante
   🎨 Color: Azul
   📏 Talla: L
   💰 Precio: $600
   
   ¿Está disponible bajo pedido?
   ```
5. Cliente negocia directamente
6. Vendedor confirma manualmente en intranet

### Caso 3: Stock Bajo (Alerta)

**Escenario:**
- Producto: Pantalón Casual
- Stock: 2 unidades
- Múltiples clientes viendo el producto

**Flujo:**

1. Mostrar badge: "¡Solo 2 disponibles!"
2. Cliente 1 añade al carrito (NO descuenta aún)
3. Cliente 2 añade al carrito (NO descuenta aún)
4. Cliente 1 procede a pagar **PRIMERO**
5. **Validación antes de checkout:**
   - Stock actual: 2
   - Cantidad solicitada: 1
   - Validación: ✅ OK
6. Pago exitoso → Stock: 2 → 1
7. Cliente 2 intenta pagar:
   - Stock actual: 1
   - Cantidad solicitada: 1
   - Validación: ✅ OK
8. Pago exitoso → Stock: 1 → 0

**Si Cliente 2 hubiera solicitado 2 unidades:**
- Validación: ❌ ERROR
- Mensaje: "Stock insuficiente. Solo 1 disponible"
- Opción: Ajustar cantidad o contactar por WhatsApp

---

## 🔒 Seguridad y Validaciones

### Validaciones Críticas

#### 1. Stock en Tiempo Real

```typescript
// ❌ MAL: Confiar en datos del frontend
async function checkout(cartItems: CartItem[]) {
  // NO hacer esto - el stock puede haber cambiado
  await createStripeSession(cartItems);
}

// ✅ BIEN: Validar en el backend justo antes de crear la sesión
async function checkout(cartItems: CartItem[]) {
  const validation = await validateStock(cartItems); // Consulta a Firestore
  
  if (!validation.valid) {
    throw new Error(`Stock insuficiente: ${validation.errors.join(', ')}`);
  }
  
  await createStripeSession(cartItems);
}
```

#### 2. Transacciones Atómicas

```typescript
// ✅ SIEMPRE usar transacciones para actualizar stock
import { runTransaction } from 'firebase/firestore';

await runTransaction(db, async (transaction) => {
  // 1. Leer estado actual
  const productDoc = await transaction.get(productRef);
  const currentStock = getCurrentStock(productDoc);
  
  // 2. Validar que sigue habiendo stock
  if (currentStock < quantity) {
    throw new Error('Stock insuficiente');
  }
  
  // 3. Actualizar stock
  transaction.update(productRef, { 
    'variants.X.sizes.Y.stock': currentStock - quantity 
  });
  
  // 4. Crear orden
  transaction.set(ordenRef, orderData);
  
  // Todo o nada - si algo falla, se revierte todo
});
```

#### 3. Verificación de `publishOnline`

```typescript
// En todas las consultas de la tienda, SIEMPRE filtrar por publishOnline
const q = query(
  collection(db, 'productos'),
  where('publishOnline', '==', true) // ⭐ CRÍTICO
);
```

---

## 📊 Monitoreo y Analytics

### Eventos Importantes a Trackear

```typescript
// Google Analytics 4 / Firebase Analytics

// 1. Vista de producto
analytics.logEvent('view_item', {
  item_id: product.id,
  item_name: product.name,
  item_category: product.category,
  price: product.publicPrice
});

// 2. Añadir al carrito
analytics.logEvent('add_to_cart', {
  items: [{
    item_id: product.id,
    item_name: product.name,
    item_variant: variant.colorName,
    quantity: quantity,
    price: finalPrice
  }]
});

// 3. Inicio de checkout
analytics.logEvent('begin_checkout', {
  value: cartTotal,
  currency: 'MXN',
  items: cartItems
});

// 4. Compra completada
analytics.logEvent('purchase', {
  transaction_id: orderId,
  value: total,
  currency: 'MXN',
  items: orderItems
});

// 5. Click en WhatsApp (bajo pedido)
analytics.logEvent('select_content', {
  content_type: 'whatsapp_order',
  item_id: product.id,
  reason: 'out_of_stock'
});
```

---

## 🚀 Checklist de Implementación

### Frontend (Tienda Online)

- [ ] Configurar Firebase SDK
- [ ] Crear página de catálogo (filtrar por `publishOnline === true`)
- [ ] Crear página de detalle de producto
- [ ] Implementar selector de variante (color)
- [ ] Implementar selector de talla
- [ ] Mostrar indicadores de stock
- [ ] Integrar botón Stripe (stock > 0)
- [ ] Integrar botón WhatsApp (stock === 0)
- [ ] Crear página de carrito
- [ ] Implementar checkout con Stripe
- [ ] Crear página de confirmación
- [ ] Agregar Google Analytics

### Backend (API)

- [ ] Configurar Stripe
- [ ] Crear endpoint `/api/create-checkout-session`
- [ ] Crear endpoint `/api/stripe-webhook`
- [ ] Implementar función `validateStock()`
- [ ] Implementar función `handleStripeWebhook()`
- [ ] Configurar variables de entorno
- [ ] Implementar transacciones atómicas
- [ ] Agregar logging y monitoreo
- [ ] Configurar CORS
- [ ] Implementar rate limiting

### Firebase

- [ ] Configurar reglas de seguridad en Firestore
- [ ] Crear índices compuestos:
  - `publishOnline` + `dateAdded`
  - `publishOnline` + `category`
  - `category` + `dateAdded`
- [ ] Configurar backup automático
- [ ] Configurar alertas de cuota

---

## 📞 Soporte y Contacto

Para preguntas o problemas con la integración:

- **Email:** soporte@malim.com
- **WhatsApp:** +52 55 1234 5678
- **Documentación Intranet:** `README_INVENTARIO.md`

---

## 📄 Licencia y Notas

**Última actualización:** 17 de diciembre de 2025

**Versión:** 1.0.0

**Tecnologías:**
- Firebase Firestore
- Stripe Payment Gateway
- WhatsApp Business API
- React + TypeScript
- Node.js + Express

---

## 🎯 Resumen Ejecutivo

### Lo Más Importante

1. **Campo Crítico: `publishOnline`**
   - `true` = Visible en tienda
   - `false` = Solo intranet

2. **Lógica de Stock:**
   - `stock > 0` → Botón Stripe (compra inmediata)
   - `stock === 0` → Botón WhatsApp (bajo pedido)

3. **Actualizaciones de Stock:**
   - SIEMPRE usar transacciones atómicas
   - Validar en backend, no confiar en frontend
   - Registrar movimientos en `inventory_movements`

4. **Estructura de Datos:**
   - Producto → Variantes (colores) → Tallas → Stock
   - Cada talla tiene su propio `variantSku` único

5. **Integraciones:**
   - Stripe para pagos con stock
   - WhatsApp para pedidos sin stock
   - Firebase Firestore como base de datos única

---

**¡Listo para integrar con la tienda en línea!** 🚀
