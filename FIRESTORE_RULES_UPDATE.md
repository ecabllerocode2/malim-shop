# 🔥 Actualizar Reglas de Firestore

## Problema Solucionado

El catálogo no mostraba productos porque:
1. ❌ El `ProductsContext` consultaba la colección `"disponible"` en lugar de `"productos"`
2. ❌ Las reglas de Firestore no permitían hacer queries

## Cambios Realizados

### 1. ProductsContext Actualizado

Ahora consulta correctamente:
```javascript
const q = query(
  collection(db, "productos"),
  where("publishOnline", "==", true),
  orderBy("dateAdded", "desc")
);
```

### 2. Reglas de Firestore Actualizadas

Las reglas ahora permiten:
- ✅ Leer productos individuales si `publishOnline == true`
- ✅ Hacer queries/list en la colección de productos
- ✅ Solo admin puede escribir

## 📋 Cómo Desplegar las Nuevas Reglas

### Opción 1: Desde Firebase Console (Recomendado)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **malim-app**
3. Ve a **Firestore Database** > **Reglas**
4. Copia y pega el contenido del archivo `firestore.rules`
5. Click en **Publicar**

### Opción 2: Desde Firebase CLI

```bash
# Si tienes Firebase CLI instalado
firebase deploy --only firestore:rules
```

### Opción 3: Manual (Copiar y Pegar)

Copia este contenido y pégalo en Firebase Console:

\`\`\`
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    function isBackend() {
      return request.auth != null && request.auth.token.admin == true;
    }
    
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    // PRODUCTOS: Público para lectura, escritura solo Admin
    match /productos/{productId} {
      allow get: if resource.data.publishOnline == true || isBackend();
      allow list: if true;
      allow create, update, delete: if isBackend();
      
      match /{subcollection=**} {
        allow read: if get(/databases/$(database)/documents/productos/$(productId)).data.publishOnline == true || isBackend();
        allow write: if isBackend();
      }
    }
    
    match /ordenes/{orderId} {
      allow read: if isOwner(resource.data.userId) || isBackend();
      allow write: if isBackend();
    }
    
    match /pagos/{pagoId} {
      allow read: if isOwner(resource.data.userId) || isBackend();
      allow write: if isBackend();
    }
    
    match /clientes/{clienteId} {
      allow read: if isOwner(clienteId) || isBackend();
      allow write: if isBackend();
    }
    
    match /credenciales/{document=**} {
      allow read, write: if isBackend();
    }
    
    match /inventory_movements/{movementId} {
      allow read, write: if isBackend();
    }
    
    match /entregas/{entregaId} {
      allow read, write: if isBackend();
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
\`\`\`

## ✅ Verificar que Funciona

1. Despliega las nuevas reglas
2. Recarga tu aplicación en el navegador
3. Los productos deberían aparecer inmediatamente
4. Si sigues sin ver productos, abre la consola del navegador (F12) y busca errores

## 🔍 Si Aún No Funciona

Verifica en la consola del navegador:
```javascript
// Abre la consola del navegador (F12) y ejecuta:
console.log('Error:', error);
```

O revisa:
1. ¿Hay productos con `publishOnline: true` en Firestore?
2. ¿Las credenciales de Firebase están correctas?
3. ¿Hay errores en la consola del navegador?

## 📊 Estructura Esperada en Firestore

Tus productos deben tener esta estructura:

```javascript
productos/{productId} = {
  publishOnline: true,  // ⭐ DEBE SER true
  name: "Vestido Floral",
  category: "vestidos",
  publicPrice: 800,
  offerPercentage: 20,
  dateAdded: 1734480000000, // timestamp
  variants: [...]
}
```

## 🚀 Despliegue en Vercel

Las reglas de Firestore son independientes del despliegue de Vercel. Solo necesitas:

1. Desplegar las reglas en Firebase Console
2. Hacer push de tu código a la rama `desarrollo-v2`
3. Vercel creará automáticamente la URL de preview

```bash
git add .
git commit -m "fix: Corregir conexión a Firestore y reglas de seguridad"
git push origin desarrollo-v2
```
