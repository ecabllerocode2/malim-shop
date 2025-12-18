# Integración de Stripe Checkout - Backend

## 📋 Requisitos

1. Instalar el paquete de Stripe en tu backend:

```bash
npm install stripe
```

2. Configurar las variables de entorno en tu backend (Vercel):

```
STRIPE_SECRET_KEY=sk_test_TU_LLAVE_SECRETA_AQUI
```

## 🔑 Obtener las llaves de Stripe

### Modo Test (para desarrollo):

1. Ir a https://dashboard.stripe.com/register
2. Crear cuenta o iniciar sesión
3. Ir a "Developers" > "API keys" > "Get your test API keys"
4. Copiar:
   - **Publishable key** (pk_test_...) → Frontend `.env` como `VITE_STRIPE_PUBLIC_KEY`
   - **Secret key** (sk_test_...) → Backend env como `STRIPE_SECRET_KEY`

### Modo Producción (cuando estés listo):

1. Activar tu cuenta de Stripe
2. Ir a "Developers" > "API keys" > "Get your live API keys"
3. Copiar las llaves **live** (pk_live_... y sk_live_...)

## 📝 Endpoint para crear sesión de Stripe

Crea este archivo en tu backend: `/api/create-checkout-session.js` (para Vercel)

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { cliente, direccion, items, subtotal, costoEnvio, total, metadata } = req.body;

    // Validar datos requeridos
    if (!cliente || !direccion || !items || items.length === 0) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    // Crear line items para Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'mxn',
        product_data: {
          name: item.productName,
          description: `Color: ${item.colorName} | Talla: ${item.size} | SKU: ${item.variantSku}`,
          images: [item.imageUrl],
        },
        unit_amount: Math.round(item.price * 100), // Convertir a centavos
      },
      quantity: item.quantity,
    }));

    // Agregar el costo de envío si aplica
    if (costoEnvio > 0) {
      lineItems.push({
        price_data: {
          currency: 'mxn',
          product_data: {
            name: 'Envío',
            description: 'Costo de envío a domicilio',
          },
          unit_amount: Math.round(costoEnvio * 100),
        },
        quantity: 1,
      });
    }

    // Crear sesión de Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/checkout/cancel`,
      customer_email: cliente.email,
      metadata: {
        customerName: `${cliente.nombre} ${cliente.apellido}`,
        customerPhone: cliente.telefono,
        shippingAddress: `${direccion.calle} ${direccion.numeroExterior}${direccion.numeroInterior ? ' ' + direccion.numeroInterior : ''}, ${direccion.colonia}, ${direccion.ciudad}, ${direccion.estado}, ${direccion.codigoPostal}`,
        shippingReferences: direccion.referencias || '',
        subtotal: subtotal.toString(),
        shippingCost: costoEnvio.toString(),
        total: total.toString(),
        isFreeShipping: metadata?.envioGratis ? 'true' : 'false',
      },
    });

    // Retornar la URL de la sesión
    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('Error al crear sesión de Stripe:', error);
    return res.status(500).json({ 
      message: 'Error al procesar el pago',
      error: error.message 
    });
  }
}
```

## 🧪 Probar la integración

### Tarjetas de prueba de Stripe:

- **Éxito**: `4242 4242 4242 4242`
- **Requiere autenticación**: `4000 0027 6000 3184`
- **Rechazada**: `4000 0000 0000 0002`

**Datos adicionales para pruebas:**
- Fecha de expiración: Cualquier fecha futura (ej: 12/34)
- CVC: Cualquier 3 dígitos (ej: 123)
- Código postal: Cualquier 5 dígitos (ej: 12345)

## 🔔 Webhook para confirmación (Opcional - Recomendado)

Cuando estés listo para producción, crea un webhook para recibir confirmaciones:

1. Crear endpoint `/api/stripe-webhook.js`:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { buffer } = require('micro');

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar eventos
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      
      // Aquí puedes:
      // - Guardar el pedido en Firestore
      // - Enviar email de confirmación
      // - Notificar al equipo
      // - Actualizar inventario
      
      console.log('Pago completado:', session.id);
      console.log('Cliente:', session.customer_email);
      console.log('Metadata:', session.metadata);
      
      break;

    case 'payment_intent.payment_failed':
      const paymentIntent = event.data.object;
      console.log('Pago fallido:', paymentIntent.id);
      break;

    default:
      console.log(`Evento no manejado: ${event.type}`);
  }

  res.json({ received: true });
}
```

2. Configurar webhook en Stripe Dashboard:
   - Ir a "Developers" > "Webhooks"
   - Agregar endpoint: `https://tu-backend.vercel.app/api/stripe-webhook`
   - Seleccionar eventos: `checkout.session.completed`, `payment_intent.payment_failed`
   - Copiar el "Signing secret" y agregarlo como `STRIPE_WEBHOOK_SECRET` en tu backend

## 📦 Variables de entorno del backend

Agregar en Vercel > Settings > Environment Variables:

```
STRIPE_SECRET_KEY=sk_test_... (para test) o sk_live_... (para producción)
STRIPE_WEBHOOK_SECRET=whsec_... (opcional, solo si usas webhooks)
```

## ✅ Checklist de implementación

- [ ] Instalar `stripe` en el backend
- [ ] Obtener llaves de Stripe (test)
- [ ] Configurar `STRIPE_SECRET_KEY` en backend
- [ ] Configurar `VITE_STRIPE_PUBLIC_KEY` en frontend
- [ ] Crear endpoint `/api/create-checkout-session`
- [ ] Probar con tarjeta de prueba `4242 4242 4242 4242`
- [ ] Verificar que redirecciona a success/cancel
- [ ] (Opcional) Configurar webhook para confirmaciones
- [ ] (Producción) Cambiar a llaves live cuando estés listo

## 🔗 Enlaces útiles

- Dashboard de Stripe: https://dashboard.stripe.com
- Documentación de Checkout: https://stripe.com/docs/payments/checkout
- Tarjetas de prueba: https://stripe.com/docs/testing
- Webhooks: https://stripe.com/docs/webhooks
