# ✅ SOLUCIÓN RÁPIDA: Descontar Stock con Stripe

## 🎯 Resumen Ejecutivo

**Situación**: Los pagos funcionan pero el stock no se descuenta.

**Causa**: El webhook de Stripe no tiene implementada la lógica para descontar stock en Firestore.

**Solución**: Implementar el webhook que escucha `checkout.session.completed` y descuenta el stock.

---

## 📝 Código del Webhook (Copiar y Pegar)

Crea o actualiza: `/api/stripe-webhook.js` en tu backend

```javascript
import Stripe from 'stripe';
import { db } from './firebase-config.js';  // Ajusta a tu configuración
import { doc, getDoc, updateDoc, setDoc, Timestamp } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Función para descontar stock
async function descontarStock(itemsMetadata) {
  for (const item of itemsMetadata) {
    try {
      const { variantSku, productId, productName } = item;
      
      console.log(`📦 Descontando: ${productName} (SKU: ${variantSku})`);

      // 1. Obtener producto
      const productRef = doc(db, 'productos', productId);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        console.error(`❌ Producto no encontrado: ${productId}`);
        continue;
      }

      const productData = productSnap.data();
      const variants = productData.variants || [];

      // 2. Buscar la talla por variantSku
      let variantIndex = -1;
      let sizeIndex = -1;

      for (let i = 0; i < variants.length; i++) {
        const sizes = variants[i].sizes || [];
        const foundIndex = sizes.findIndex(s => s.variantSku === variantSku);
        if (foundIndex !== -1) {
          variantIndex = i;
          sizeIndex = foundIndex;
          break;
        }
      }

      if (variantIndex === -1 || sizeIndex === -1) {
        console.error(`❌ Talla no encontrada con SKU: ${variantSku}`);
        continue;
      }

      // 3. Descontar stock
      const currentStock = variants[variantIndex].sizes[sizeIndex].stock || 0;
      const newStock = Math.max(0, currentStock - item.quantity);

      variants[variantIndex].sizes[sizeIndex].stock = newStock;

      // 4. Actualizar Firestore
      await updateDoc(productRef, { variants });

      console.log(`✅ Stock actualizado: ${currentStock} → ${newStock} (${productName})`);

    } catch (error) {
      console.error(`❌ Error al descontar ${item.productName}:`, error);
    }
  }
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // Verificar firma de Stripe
      const rawBody = await getRawBody(req);
      event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (err) {
      console.error('⚠️  Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Procesar evento
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      console.log('💳 Pago completado:', session.id);
      console.log('📧 Cliente:', session.customer_email);
      
      // Descontar stock
      if (session.metadata.items) {
        const items = JSON.parse(session.metadata.items);
        await descontarStock(items);
        
        // Opcional: Guardar orden
        await setDoc(doc(db, 'orders', session.id), {
          sessionId: session.id,
          customerEmail: session.customer_email,
          customerName: session.metadata.customerName,
          customerPhone: session.metadata.customerPhone,
          shippingAddress: session.metadata.shippingAddress,
          items: items,
          total: parseFloat(session.metadata.total),
          status: 'pending',
          createdAt: Timestamp.now()
        });
        
        console.log('✅ Orden guardada:', session.id);
      }
    }

    res.json({ received: true });
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}

// Helper para obtener raw body (requerido por Stripe)
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export const config = {
  api: {
    bodyParser: false,  // Importante: Stripe necesita el raw body
  },
};
```

---

## ⚙️ Configuración en Stripe Dashboard

1. Ve a https://dashboard.stripe.com/test/webhooks
2. Click en "Add endpoint"
3. URL: `https://tu-backend.vercel.app/api/stripe-webhook`
4. Eventos a escuchar: `checkout.session.completed`
5. Copia el **Signing secret** (empieza con `whsec_...`)
6. Agrégalo a Vercel como `STRIPE_WEBHOOK_SECRET`

---

## 🧪 Probar

1. **Haz una compra de prueba**:
   - Tarjeta: `4242 4242 4242 4242`
   - Fecha: Cualquier futura (12/34)
   - CVC: 123

2. **Revisa logs de Vercel**:
   ```
   💳 Pago completado: cs_test_abc123
   📧 Cliente: test@example.com
   📦 Descontando: Camiseta Nike One (SKU: MAL-PLA-CAM-A81PC-...)
   ✅ Stock actualizado: 10 → 9 (Camiseta Nike One)
   ✅ Orden guardada: cs_test_abc123
   ```

3. **Verifica en Firestore**:
   - Ve a `productos > [tu-producto] > variants > sizes`
   - Confirma que el `stock` disminuyó

---

## 📋 Variables de Entorno Necesarias

En Vercel > Settings > Environment Variables:

```bash
STRIPE_SECRET_KEY=sk_test_...          # Ya lo tienes
STRIPE_WEBHOOK_SECRET=whsec_...        # Nuevo (del paso anterior)
```

---

## ✅ Checklist Final

- [ ] Webhook creado en `/api/stripe-webhook.js`
- [ ] Firebase config importada correctamente
- [ ] Webhook registrado en Stripe Dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` agregada a Vercel
- [ ] Prueba realizada con tarjeta test
- [ ] Logs muestran descuento exitoso
- [ ] Stock verificado en Firestore

---

## 🆘 Si algo falla

**Problema**: "Webhook signature verification failed"
- **Solución**: Verifica que `STRIPE_WEBHOOK_SECRET` sea correcto

**Problema**: "Talla no encontrada con SKU"
- **Solución**: Ejecuta `diagnosticarEstructura()` en la consola del frontend para ver la estructura real

**Problema**: Stock no se descuenta
- **Solución**: Revisa los logs de Vercel, busca el mensaje "✅ Stock actualizado"

---

**Con este webhook implementado, el stock se descontará automáticamente después de cada pago exitoso.** 🎉
