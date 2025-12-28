# Uso de la colección `productos_public` en la tienda

## Campos expuestos (sin datos sensibles)
- name
- productSku
- category
- publicPrice
- offerPercentage
- shortDetails
- longDescription
- publishOnline
- dateAdded
- variants[]: id, variantSku, colorName, hexColor, imageUrls[], sizes[] { size, stock, isInStock }

## Lectura con Firebase (JS SDK v9+)
```ts
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from './firebase'; // inicialización existente

const db = getFirestore(app);

export async function fetchCatalog() {
  const ref = collection(db, 'productos_public');
  const q = query(ref, where('publishOnline', '==', true));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
```

## Consideraciones
- Solo contiene campos públicos; costos/proveedores no están presentes.
- Filtra siempre `publishOnline == true`.
- El ID de documento coincide con el SKU (o el ID usado en intranet), útil para enlaces/imágenes.
