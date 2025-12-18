# 🔍 PROBLEMA: Stock no se descuenta después del pago

## 📊 Diagnóstico

### Estructura actual en Firestore:

```javascript
{
  id: "MAL-PLA-CAM-A81PC",  // ID del producto
  name: "Camiseta Nike One",
  variants: [
    {
      id: 1765992186874,  // ID de la variante (timestamp)
      colorName: "Color 1",
      hexColor: "#FFFFFF",
      imageUrls: ["url1.jpg", "url2.jpg"],
      sizes: [
        {
          size: "(32-34)",
          stock: 10,
          variantSku: "MAL-PLA-CAM-A81PC-1765992186874-(32-34)"  // ✓ SÍ TIENE
        },
        {
          size: "M",
          stock: 5,
          variantSku: "MAL-PLA-CAM-A81PC-1765992186874-M"  // ✓ SÍ TIENE
        }
      ]
    }
  ]
}
```

### ❌ Problema identificado:

1. **En el frontend**: Lee el `variantSku` directamente de Firestore
   - Ejemplo: `MAL-PLA-CAM-A81PC-1765992186874-(32-34)`

2. **En el backend**: El webhook de Stripe recibe este SKU pero NO está implementada la lógica para:
   - Buscar el producto en Firestore
   - Localizar la variante
   - Encontrar la talla por su `variantSku`
   - Descontar el stock

3. **Resultado**: El pago se procesa pero el stock no se actualiza

---

## ✅ SOLUCIÓN: Actualizar el backend para parsear el SKU

### Opción 1: Backend inteligente (RECOMENDADA) 📝

Actualiza tu webhook/endpoint de descuento para parsear el SKU:

```javascript
// En tu webhook o función de descuento de stock
// Archivo: api/stripe-webhook.js o similar

import { db } from './firebase-config.js';  // Tu configuración
import { doc, getDoc, updateDoc, arrayUnion, setDoc, Timestamp } from 'firebase/firestore';

async function descontarStock(itemsMetadata) {
  for (const item of itemsMetadata) {
    try {
      const { variantSku, productId, variantId, size, quantity, productName } = item;
      
      console.log(`📦 Procesando: ${productName}`);
      console.log(`   SKU: ${variantSku}`);
      console.log(`   Producto ID: ${productId}`);
      console.log(`   Variante ID: ${variantId}`);
      console.log(`   Talla: ${size}`);
      console.log(`   Cantidad: ${quantity}`);

      // 1. Obtener el documento del producto
      const productRef = doc(db, 'productos', productId);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        console.error(`❌ Producto no encontrado: ${productId}`);
        continue;
      }

      const productData = productSnap.data();
      
      // 2. Buscar la variante y la talla por variantSku
      const variants = productData.variants || [];
      let variantIndex = -1;
      let sizeIndex = -1;

      // OPCIÓN A: Buscar por variantSku (MÁS CONFIABLE)
      for (let i = 0; i < variants.length; i++) {
        const sizes = variants[i].sizes || [];
        const foundSizeIndex = sizes.findIndex(s => s.variantSku === variantSku);
        if (foundSizeIndex !== -1) {
          variantIndex = i;
          sizeIndex = foundSizeIndex;
          break;
        }
      }

      // OPCIÓN B: Fallback - Buscar por variantId y size
      if (variantIndex === -1 || sizeIndex === -1) {
        variantIndex = variants.findIndex(v => v.id === variantId);
        if (variantIndex !== -1) {
          const sizes = variants[variantIndex].sizes || [];
          sizeIndex = sizes.findIndex(s => s.size === size);
        }
      }

      if (variantIndex === -1 || sizeIndex === -1) {
        console.error(`❌ Talla no encontrada con SKU: ${variantSku}`);
        console.error(`   Intentó también buscar: variantId=${variantId}, size=${size}`);
        continue;
      }

      const currentStock = sizes[sizeIndex].stock || 0;
      const newStock = Math.max(0, currentStock - quantity);

      // 3. Actualizar el stock
      sizes[sizeIndex].stock = newStock;
      variants[variantIndex].sizes = sizes;

      await updateDoc(productRef, {
        variants: variants
      });

      console.log(`✅ Stock actualizado: ${currentStock} → ${newStock}`);
      console.log(`   Producto: ${productId}`);
      console.log(`   Variante: ${variantId}`);
      console.log(`   Talla: ${size}`);

    } catch (error) {
      console.error(`❌ Error al descontar stock para ${item.productName}:`, error);
      // No lanzar error para no bloquear otros items
    }
  }
}

// En tu webhook de checkout.session.completed
export default async function webhookHandler(req, res) {
  // ... tu código de verificación de Stripe ...

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    console.log('💳 Pago completado:', session.id);
    console.log('📧 Cliente:', session.customer_email);
    
    // Obtener items desde metadata
    const itemsJSON = session.metadata.items;
    
    if (itemsJSON) {
      try {
        const items = JSON.parse(itemsJSON);
        console.log(`📦 Procesando ${items.length} items...`);
        
        await descontarStock(items);
        
        // 4. Opcional: Guardar la orden en Firestore
        const orderRef = doc(db, 'orders', session.id);
        await setDoc(orderRef, {
          sessionId: session.id,
          customerEmail: session.customer_email,
          customerName: session.metadata.customerName,
          customerPhone: session.metadata.customerPhone,
          shippingAddress: session.metadata.shippingAddress,
          items: items,
          subtotal: parseFloat(session.metadata.subtotal),
          shippingCost: parseFloat(session.metadata.shippingCost),
          total: parseFloat(session.metadata.total),
          isFreeShipping: session.metadata.isFreeShipping === 'true',
          status: 'pending',  // pending, processing, shipped, delivered
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        
        console.log('✅ Orden guardada:', session.id);
        
      } catch (error) {
        console.error('❌ Error al procesar items:', error);
      }
    } else {
      console.warn('⚠️  No se encontraron items en metadata');
    }
  }

  res.json({ received: true });
}
```

---

### Opción 2: Agregar variantSku a Firestore (Más trabajo inicial)

Si prefieres, puedes ejecutar un script para agregar `variantSku` a cada talla:

```javascript
// Script para migrar datos (ejecutar una vez)
import { db } from './firebase-config.js';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

async function agregarVariantSkus() {
  const productosRef = collection(db, 'productos');
  const snapshot = await getDocs(productosRef);

  for (const docSnap of snapshot.docs) {
    const productId = docSnap.id;
    const data = docSnap.data();
    
    if (data.variants && Array.isArray(data.variants)) {
      let updated = false;
      
      for (const variant of data.variants) {
        if (variant.sizes && Array.isArray(variant.sizes)) {
          for (const size of variant.sizes) {
            if (!size.variantSku) {
              size.variantSku = `${productId}-${variant.id}-${size.size}`;
              updated = true;
            }
          }
        }
      }
      
      if (updated) {
        const productRef = doc(db, 'productos', productId);
        await updateDoc(productRef, {
          variants: data.variants
        });
        console.log(`✅ Actualizado: ${productId}`);
      }
    }
  }
  
  console.log('🎉 Migración completada');
}
```

---

## 🧪 Prueba el fix:

1. **Actualiza el backend** con el código de la Opción 1
2. **Haz un pago de prueba** con una tarjeta de test
3. **Revisa los logs de Vercel**:
   ```
   📦 Procesando: Camiseta Nike One
      SKU: MAL-PLA-CAM-A81PC-1765992186874-(32-34)
      Producto ID: MAL-PLA-CAM-A81PC
      Variante ID: 1765992186874
      Talla: (32-34)
      Cantidad: 1
   ✅ Stock actualizado: 10 → 9
   ```

4. **Verifica en Firestore** que el stock disminuyó

---

## 📊 Para diagnosticar en el frontend:

En la consola del navegador, ejecuta:

```javascript
// Importa el diagnóstico
import { diagnosticarEstructura } from './utils/diagnostico';
diagnosticarEstructura();
```

O simplemente abre la consola y pega:
```javascript
window.diagnosticarEstructura()
```

Esto te mostrará la estructura exacta de tus productos.

---

## 🚨 Checklist

- [ ] Backend actualizado con función `descontarStock()`
- [ ] Webhook configurado para `checkout.session.completed`
- [ ] Logs muestran que se está procesando correctamente
- [ ] Prueba realizada con tarjeta test `4242 4242 4242 4242`
- [ ] Stock verificado en Firestore después de la prueba
- [ ] (Opcional) Colección `orders` creada con reglas de seguridad

---

## 💡 Nota importante:

El problema NO está en el frontend. El frontend está enviando correctamente:
- `productId`
- `variantId`  
- `size`
- `quantity`
- `variantSku` (generado)

El problema está en que el **backend no está usando esta información para buscar y descontar el stock en Firestore**.

Implementa la función `descontarStock()` en tu webhook y el problema quedará resuelto. 🎯
