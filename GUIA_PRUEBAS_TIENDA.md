# 🧪 Guía de Pruebas y Casos de Uso - Tienda Online Malim

## 📋 Índice

1. [Escenarios de Prueba](#escenarios-de-prueba)
2. [Casos de Prueba Detallados](#casos-de-prueba-detallados)
3. [Validaciones Críticas](#validaciones-críticas)
4. [Flujos de Usuario](#flujos-de-usuario)
5. [Manejo de Errores](#manejo-de-errores)
6. [Pruebas de Integración](#pruebas-de-integración)

---

## 🎯 Escenarios de Prueba

### Escenario 1: Compra Exitosa con Stock

**Precondiciones:**
- Producto publicado (`publishOnline: true`)
- Variante con stock > 0
- Usuario con email válido

**Datos de Prueba:**
```
Producto: Vestido Floral Primavera
SKU: MAL-2024-001
Color: Rojo Pasión (ID: 1)
Talla: M
Stock inicial: 5
Precio: $800
Descuento: 20%
Precio final: $640
```

**Pasos:**
1. Usuario navega a catálogo
2. Selecciona producto
3. Selecciona color "Rojo Pasión"
4. Selecciona talla "M"
5. Verifica que muestra "En Stock"
6. Selecciona cantidad: 2
7. Click en "Añadir al Carrito"
8. Navega a checkout
9. Ingresa email: `test@example.com`
10. Click en "Pagar"
11. Sistema valida stock en backend
12. Redirige a Stripe Checkout
13. Completa pago con tarjeta de prueba: `4242 4242 4242 4242`
14. Stripe procesa pago
15. Webhook recibe confirmación
16. Sistema actualiza stock: 5 → 3
17. Crea orden en Firestore
18. Registra movimiento de inventario
19. Usuario redirigido a página de éxito

**Resultado Esperado:**
✅ Orden creada con estado "pagado"
✅ Stock actualizado correctamente (5 → 3)
✅ Movimiento registrado en `inventory_movements`
✅ Email de confirmación enviado (opcional)
✅ Usuario puede ver su orden

**Validación en Firestore:**
```javascript
// Verificar orden
ordenes/{orderId} = {
  clienteEmail: "test@example.com",
  total: 1280,
  estado: "pagado",
  items: [
    {
      productId: "MAL-2024-001",
      variantSku: "MAL-2024-001-1-M",
      quantity: 2,
      price: 640
    }
  ]
}

// Verificar stock actualizado
productos/{productId}/variants[0]/sizes[1] = {
  size: "M",
  stock: 3, // Antes era 5
  isInStock: true
}

// Verificar movimiento
inventory_movements/{movementId} = {
  tipo: "salida",
  motivo: "venta_online",
  variantSku: "MAL-2024-001-1-M",
  cantidad: 2,
  ordenId: "abc123"
}
```

---

### Escenario 2: Producto Bajo Pedido (Sin Stock)

**Precondiciones:**
- Producto publicado (`publishOnline: true`)
- Variante con stock === 0
- WhatsApp configurado

**Datos de Prueba:**
```
Producto: Blusa Elegante Noche
SKU: MAL-2024-015
Color: Azul Marino
Talla: L
Stock: 0
Precio: $600
```

**Pasos:**
1. Usuario navega a producto
2. Selecciona color "Azul Marino"
3. Intenta seleccionar talla "L"
4. Sistema muestra: "Bajo Pedido"
5. **NO muestra** botón "Añadir al Carrito"
6. **SÍ muestra** botón "Consultar Disponibilidad" (WhatsApp)
7. Usuario click en botón WhatsApp
8. Sistema genera mensaje automático
9. Abre WhatsApp Web/App con mensaje prellenado
10. Usuario envía mensaje
11. Vendedor responde manualmente

**Resultado Esperado:**
✅ No se permite añadir al carrito
✅ Botón de WhatsApp visible y funcional
✅ Mensaje generado correctamente
✅ Se abre WhatsApp con número correcto

**Mensaje de WhatsApp Generado:**
```
¡Hola! Me interesa el siguiente producto:

📦 *Blusa Elegante Noche*
🎨 Color: Azul Marino
📏 Talla: L
💰 Precio: $600

¿Está disponible bajo pedido?
```

---

### Escenario 3: Stock Insuficiente (Race Condition)

**Precondiciones:**
- Producto con stock bajo (2 unidades)
- 2 usuarios simultáneos
- Ambos intentan comprar

**Datos de Prueba:**
```
Producto: Pantalón Casual
Stock inicial: 2
Usuario A solicita: 1
Usuario B solicita: 2
```

**Pasos:**
1. Usuario A añade 1 al carrito (no descuenta aún)
2. Usuario B añade 2 al carrito (no descuenta aún)
3. Usuario A procede a checkout primero
4. Backend valida stock: 2 >= 1 ✅
5. Usuario A completa pago
6. Webhook descuenta: 2 → 1
7. Usuario B procede a checkout
8. Backend valida stock: 1 >= 2 ❌
9. Sistema rechaza orden

**Resultado Esperado:**
✅ Usuario A compra exitosamente
❌ Usuario B recibe error de stock insuficiente
✅ Stock final correcto: 1
✅ No se permite overselling

**Mensaje de Error para Usuario B:**
```
Lo sentimos, no hay stock suficiente.
Producto: Pantalón Casual
Solicitado: 2 unidades
Disponible: 1 unidad

Opciones:
- Ajustar cantidad a 1
- Consultar disponibilidad por WhatsApp
```

---

### Escenario 4: Producto No Publicado

**Precondiciones:**
- Producto existe en Firestore
- `publishOnline: false` (borrador)

**Datos de Prueba:**
```
Producto: Vestido Nuevo (Borrador)
publishOnline: false
```

**Pasos:**
1. Usuario intenta acceder a URL directa
2. Sistema consulta Firestore
3. Verifica `publishOnline === false`
4. Redirige a página 404

**Resultado Esperado:**
✅ Producto NO visible en catálogo
✅ URL directa redirige a 404
✅ No aparece en búsquedas
✅ No es accesible desde frontend

---

### Escenario 5: Descuento Aplicado Correctamente

**Datos de Prueba:**
```
Producto: Vestido Premium
Precio público: $1000
Descuento: 30%
Precio final esperado: $700
```

**Pasos:**
1. Usuario navega a producto
2. Sistema calcula: $1000 - ($1000 × 0.30) = $700
3. Muestra precio tachado: ~~$1000~~
4. Muestra precio final: $700
5. Muestra badge: "-30%"
6. Usuario añade al carrito
7. Carrito muestra: $700
8. Checkout muestra: $700
9. Stripe cobra: $700

**Resultado Esperado:**
✅ Precio calculado correctamente
✅ Descuento visible en todas las pantallas
✅ Stripe cobra el precio correcto
✅ No se cobra el precio original

---

## 🔍 Validaciones Críticas

### Validación 1: Stock en Tiempo Real

```typescript
// ❌ INCORRECTO: Confiar en datos del frontend
function addToCart(item) {
  // Malo: El stock podría haber cambiado
  cart.push(item);
}

// ✅ CORRECTO: Validar en backend antes de procesar
async function processCheckout(cart) {
  // Consultar stock actual en Firestore
  const currentStock = await validateStockInDatabase(cart);
  
  if (!currentStock.valid) {
    throw new Error('Stock insuficiente');
  }
  
  // Proceder con pago
}
```

### Validación 2: Transacciones Atómicas

```typescript
// ✅ CORRECTO: Usar transacciones para evitar race conditions
await db.runTransaction(async (transaction) => {
  // 1. Leer stock actual
  const productDoc = await transaction.get(productRef);
  const currentStock = productDoc.data().variants[0].sizes[0].stock;
  
  // 2. Validar
  if (currentStock < quantity) {
    throw new Error('Stock insuficiente');
  }
  
  // 3. Actualizar (todo o nada)
  transaction.update(productRef, { stock: currentStock - quantity });
  transaction.set(orderRef, orderData);
});
```

### Validación 3: Verificar publishOnline

```typescript
// ✅ CORRECTO: Siempre filtrar por publishOnline
const q = query(
  collection(db, 'productos'),
  where('publishOnline', '==', true)
);

// ❌ INCORRECTO: No filtrar
const q = query(
  collection(db, 'productos')
);
```

---

## 📊 Casos de Prueba por Funcionalidad

### Catálogo de Productos

| Test ID | Descripción | Entrada | Resultado Esperado |
|---------|-------------|---------|-------------------|
| CAT-001 | Listar productos publicados | `publishOnline: true` | Solo productos publicados |
| CAT-002 | Filtrar por categoría | `category: 'vestidos'` | Solo vestidos publicados |
| CAT-003 | Ordenar por fecha | `orderBy: 'dateAdded'` | Más recientes primero |
| CAT-004 | Mostrar imágenes | Producto con variantes | Primera imagen de primera variante |
| CAT-005 | Mostrar colores disponibles | Producto con 3 variantes | Círculos de colores visible |
| CAT-006 | Badge de descuento | `offerPercentage: 20` | "-20%" visible |

### Detalle de Producto

| Test ID | Descripción | Entrada | Resultado Esperado |
|---------|-------------|---------|-------------------|
| DET-001 | Galería de imágenes | Variante con 4 imágenes | 4 miniaturas + imagen principal |
| DET-002 | Selector de color | 3 variantes de color | 3 botones de color |
| DET-003 | Selector de talla | 5 tallas disponibles | 5 botones de talla |
| DET-004 | Talla sin stock | `stock: 0` | Botón deshabilitado |
| DET-005 | Stock bajo | `stock: 2` | Badge "¡Solo 2 disponibles!" |
| DET-006 | Stock disponible | `stock: 10` | Badge "En Stock" |
| DET-007 | Precio con descuento | `offerPercentage: 25` | Precio tachado + final |
| DET-008 | Cantidad máxima | Stock: 5, Solicita: 10 | Limitar a 5 |

### Carrito de Compras

| Test ID | Descripción | Entrada | Resultado Esperado |
|---------|-------------|---------|-------------------|
| CAR-001 | Añadir producto | Item válido | Añadido a carrito |
| CAR-002 | Producto duplicado | Mismo SKU | Incrementar cantidad |
| CAR-003 | Eliminar producto | Click eliminar | Producto removido |
| CAR-004 | Actualizar cantidad | Nueva cantidad | Cantidad actualizada |
| CAR-005 | Calcular total | 3 productos | Suma correcta |
| CAR-006 | Vaciar carrito | Click vaciar | Carrito vacío |
| CAR-007 | Persistencia | Recargar página | Carrito recuperado de localStorage |

### Checkout y Pago

| Test ID | Descripción | Entrada | Resultado Esperado |
|---------|-------------|---------|-------------------|
| CHK-001 | Validar email | Email inválido | Error mostrado |
| CHK-002 | Validar stock | Stock disponible | Procede a Stripe |
| CHK-003 | Stock insuficiente | Stock < cantidad | Error "Stock insuficiente" |
| CHK-004 | Crear sesión Stripe | Carrito válido | URL de Stripe generada |
| CHK-005 | Pago exitoso | Tarjeta válida | Orden creada |
| CHK-006 | Pago fallido | Tarjeta rechazada | Volver a intentar |
| CHK-007 | Webhook recibido | Evento de Stripe | Stock actualizado |
| CHK-008 | Timeout de pago | Usuario no completa | Sesión expira (30 min) |

---

## 🔴 Manejo de Errores

### Error 1: Stock Agotado Durante Checkout

**Detección:** Backend valida stock antes de crear sesión de Stripe

**Mensaje al Usuario:**
```
❌ Stock Insuficiente

Lo sentimos, el producto que intentas comprar ya no tiene stock suficiente:

Producto: Vestido Floral
Color: Rojo
Talla: M
Solicitado: 2 unidades
Disponible: 0 unidades

Opciones:
[Consultar por WhatsApp] [Volver al Catálogo]
```

**Acción del Sistema:**
- No crear sesión de Stripe
- No descontar stock
- Limpiar carrito del producto afectado
- Ofrecer alternativas

---

### Error 2: Fallo en Webhook de Stripe

**Detección:** Webhook no recibe confirmación o falla al procesar

**Acciones:**
1. Stripe reintenta webhook automáticamente (hasta 3 días)
2. Sistema de monitoring alerta al admin
3. Admin revisa manualmente en Stripe Dashboard
4. Si pago exitoso pero stock no actualizado:
   - Actualizar stock manualmente en Firestore
   - Registrar movimiento de inventario
   - Enviar confirmación al cliente

**Prevención:**
- Implementar idempotencia (usar `stripeSessionId` como clave única)
- Logging exhaustivo
- Alertas de Slack/Email para fallos

---

### Error 3: Producto No Encontrado

**Detección:** ID de producto inválido o producto eliminado

**Mensaje al Usuario:**
```
❌ Producto No Disponible

El producto que buscas ya no está disponible o ha sido eliminado.

[Volver al Catálogo] [Contactar Soporte]
```

---

### Error 4: Sesión de Stripe Expirada

**Detección:** Usuario deja checkout abierto >30 minutos

**Mensaje al Usuario:**
```
⏱️ Sesión Expirada

Tu sesión de pago ha expirado por seguridad.
Por favor, vuelve a intentar tu compra.

[Reintentar Checkout]
```

**Acción del Sistema:**
- No descontar stock (nunca se descontó)
- Carrito sigue intacto
- Usuario puede crear nueva sesión

---

## 🧪 Pruebas de Integración

### Prueba 1: Flujo Completo con Stripe Test Mode

**Setup:**
```bash
# Variables de entorno
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

**Tarjetas de Prueba:**
```
✅ Pago Exitoso: 4242 4242 4242 4242
❌ Pago Rechazado: 4000 0000 0000 0002
⏳ Requiere Autenticación: 4000 0025 0000 3155
```

**Comando para Probar Webhook Localmente:**
```bash
# Instalar Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe-webhook

# Disparar evento manualmente
stripe trigger checkout.session.completed
```

---

### Prueba 2: Carga de Stress (Múltiples Usuarios)

**Herramienta:** Apache JMeter o Artillery

**Escenario:**
- 100 usuarios simultáneos
- Todos intentan comprar el último producto
- Stock inicial: 1 unidad

**Resultado Esperado:**
- Solo 1 usuario completa compra
- 99 usuarios reciben "Stock insuficiente"
- Stock final: 0
- No overselling

**Configuración Artillery:**
```yaml
config:
  target: 'https://tu-backend.com'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - flow:
      - post:
          url: '/api/create-checkout-session'
          json:
            items:
              - productId: 'test-product'
                quantity: 1
```

---

## 📈 Métricas de Éxito

### KPIs a Monitorear

1. **Tasa de Conversión:**
   - Meta: >3% de visitantes completan compra

2. **Carrito Abandonado:**
   - Meta: <70% abandono

3. **Tiempo de Checkout:**
   - Meta: <2 minutos desde añadir al carrito hasta pago

4. **Errores de Stock:**
   - Meta: <1% de checkouts fallan por stock

5. **Uptime:**
   - Meta: 99.9% disponibilidad

---

## ✅ Checklist de Pre-Lanzamiento

### Funcionalidad
- [ ] Todos los productos publicados tienen `publishOnline: true`
- [ ] Todas las variantes tienen al menos 1 imagen
- [ ] Precios y descuentos calculan correctamente
- [ ] Stock se actualiza correctamente después de pago
- [ ] Webhooks de Stripe funcionan en producción
- [ ] Emails de confirmación se envían
- [ ] WhatsApp abre correctamente con mensaje

### Seguridad
- [ ] Reglas de Firestore configuradas
- [ ] API endpoints protegidos con rate limiting
- [ ] Variables de entorno NO están en código
- [ ] HTTPS habilitado en producción
- [ ] Webhook signature verificada

### Performance
- [ ] Imágenes optimizadas (WebP, <250KB)
- [ ] Lazy loading implementado
- [ ] Caché de productos configurado
- [ ] CDN para assets estáticos

### UX
- [ ] Mensajes de error claros
- [ ] Loading states en botones
- [ ] Responsive en móvil
- [ ] Accesibilidad (ARIA labels)

### Monitoreo
- [ ] Google Analytics configurado
- [ ] Sentry o similar para errores
- [ ] Alertas de Slack para fallos críticos
- [ ] Dashboard de métricas

---

## 🎓 Mejores Prácticas

### 1. Validar Siempre en Backend
```typescript
// ❌ NUNCA confiar solo en frontend
if (clientSays.hasStock) {
  processPayment();
}

// ✅ SIEMPRE validar en backend
const actualStock = await checkDatabaseStock();
if (actualStock >= quantity) {
  processPayment();
}
```

### 2. Usar Transacciones para Updates Críticos
```typescript
// ✅ Transacciones para operaciones atómicas
await db.runTransaction(async (transaction) => {
  // Todo o nada
  transaction.update(productRef, { stock: newStock });
  transaction.set(orderRef, orderData);
});
```

### 3. Logging Exhaustivo
```typescript
console.log('[CHECKOUT] Iniciando proceso', { userId, cartTotal });
console.log('[CHECKOUT] Stock validado', { valid: true });
console.log('[CHECKOUT] Sesión Stripe creada', { sessionId });
console.log('[WEBHOOK] Pago confirmado', { orderId, amount });
console.log('[WEBHOOK] Stock actualizado', { productId, oldStock, newStock });
```

### 4. Idempotencia en Webhooks
```typescript
// ✅ Prevenir procesamiento duplicado
const existingOrder = await db.collection('ordenes')
  .where('stripeSessionId', '==', sessionId)
  .get();

if (!existingOrder.empty) {
  console.log('Orden ya procesada, ignorando webhook');
  return;
}
```

---

**¡Todo listo para lanzar la tienda con confianza!** 🚀✨
