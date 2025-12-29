# Formato de Datos de Usuario - Backend

## Resumen de Cambios

Se implementó autenticación gratuita con Firebase (Google Sign-In y Email/Password) + captura obligatoria de datos adicionales (nombre y WhatsApp) para marketing.

**IMPORTANTE**: El frontend captura los datos pero **NO los guarda en Firestore**. Los envía al backend en cada request y el backend los guarda usando Firebase Admin SDK (con permisos totales).

## Nuevo Flujo de Autenticación

1. **Usuario se autentica** con Google o Email/Password (gratuito)
2. **Frontend captura** nombre completo y número de WhatsApp
3. **Frontend guarda temporalmente** en localStorage
4. **Frontend envía userData** en cada request al backend
5. **Backend guarda** en Firestore (`users_asistant/{userId}`) usando Admin SDK

---

## Estructura de Datos del Usuario en Firebase

### Colección: `users_asistant/{userId}`

```javascript
{
  "nombre": "María García López",
  "whatsapp": "5551234567",          // 10 dígitos sin +52
  "email": "maria@example.com",      // Del auth provider
  "updatedAt": "2025-12-28T10:30:00Z"
}
```

### Campos

| Campo | Tipo | Obligatorio | Descripción | Ejemplo |
|-------|------|-------------|-------------|---------|
| `nombre` | String | ✅ Sí | Nombre completo del usuario | `"María García López"` |
| `whatsapp` | String | ✅ Sí | Número de WhatsApp (10 dígitos) | `"5551234567"` |
| `email` | String | ✅ Sí | Email del usuario | `"maria@example.com"` |
| `updatedAt` | String (ISO 8601) | ✅ Sí | Última actualización | `"2025-12-28T10:30:00Z"` |

---

## ID Token de Firebase

El `idToken` que recibes en el backend ahora incluye:

```json
{
  "iss": "https://securetoken.google.com/tu-proyecto",
  "aud": "tu-proyecto",
  "auth_time": 1735387800,
  "user_id": "abc123xyz789",
  "sub": "abc123xyz789",
  "iat": 1735387800,
  "exp": 1735391400,
  "email": "maria@example.com",
  "email_verified": true,
  "firebase": {
    "identities": {
      "google.com": ["1234567890"],
      "email": ["maria@example.com"]
    },
    "sign_in_provider": "google.com"
  }
}
```

### Campos Importantes del Token

- `user_id` / `sub`: ID único del usuario (usar como clave)
- `email`: Email del usuario
- `email_verified`: Si el email está verificado
- `sign_in_provider`: Método de autenticación (`google.com`, `password`)

---

## Cómo Obtener los Datos Adicionales en el Backend

### ✅ Opción Recomendada: Usar los datos que envía el frontend

El frontend envía `userData` en cada request cuando el usuario está autenticado:

```javascript
app.post('/api/asesor-estilo', async (req, res) => {
  const { idToken, mensaje, userData } = req.body;
  
  // 1. Verificar token
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  const userId = decodedToken.uid;
  
  // 2. Validar que el email coincida (seguridad)
  if (userData && userData.email !== decodedToken.email) {
    return res.status(401).json({ 
      success: false, 
      error: 'Datos de usuario no coinciden' 
    });
  }
  
  // 3. Guardar/actualizar en Firestore usando tu función existente
  if (userData) {
    await saveUserForRemarketing(
      { uid: userId, email: decodedToken.email, ...decodedToken },
      userData  // { nombre, whatsapp }
    );
    
    console.log('✅ Datos guardados:', userData.nombre, userData.whatsapp);
  }
  
  // ... resto de la lógica
});
```

### Cambios Necesarios en tu Backend Actual

Tu función `saveUserForRemarketing()` ya está casi perfecta. Solo necesitas asegurarte de usar `userData` del request:

```javascript
// ANTES: Intentaba leer de colección "usuarios" (que no existe)
try {
    const usuarioDoc = await db.collection('usuarios').doc(userAuth.uid).get();
    if (usuarioDoc.exists) {
        const usuarioData = usuarioDoc.data();
        nombre = usuarioData.nombre || nombre;
        whatsapp = usuarioData.whatsapp || whatsapp;
    }
} catch (err) {
    console.log('⚠️ No se pudieron obtener datos adicionales de usuarios');
}

// DESPUÉS: Usar los datos que envía el frontend
let nombre = userAuth.displayName || additionalData.nombre || null;
let whatsapp = additionalData.whatsapp || null;

// Ya no necesitas leer de otra colección, el frontend envía todo
```

---

## Formato del Request al Backend

### Endpoint: `POST /api/asesor-estilo`

```javascript
{
  "mensaje": "Busco ropa elegante para la oficina",
  "imagen": null,  // o base64 con imagen
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE...",
  "userData": {    // IMPORTANTE: El frontend SIEMPRE envía esto cuando está autenticado
    "nombre": "María García López",
    "whatsapp": "5551234567",
    "email": "maria@example.com"
  }
}
```

### ⚠️ IMPORTANTE - Seguridad

El **frontend NO guarda en Firestore**, solo envía los datos al backend. El backend debe:

1. Verificar el `idToken`
2. Validar que `userData.email` coincida con el email del token
3. Guardar en Firestore usando la función existente `saveUserForRemarketing()`

---

## Guardar Datos para Marketing

### Estructura Recomendada para Marketing

Crea una colección separada para marketing:

```javascript
// Colección: marketing_contacts/{userId}
{
  "nombre": "María García López",
  "whatsapp": "+525551234567",       // Formato internacional
  "email": "maria@example.com",
  "primeraInteraccion": "2025-12-28T10:30:00Z",
  "ultimaInteraccion": "2025-12-28T14:45:00Z",
  "totalInteracciones": 5,
  "consentimiento": true,             // Aceptó recibir mensajes
  "preferencias": {
    "categorias": ["oficina", "casual"],
    "colores": ["negro", "blanco"],
    "presupuesto": "medio"
  },
  "conversiones": {
    "productosVistos": ["BL-001", "PT-004"],
    "productosComprados": []
  }
}
```

### Script de Migración/Guardado

```javascript
async function saveMarketingContact(userId, userData, conversationData) {
  const marketingRef = db.collection('marketing_contacts').doc(userId);
  
  await marketingRef.set({
    nombre: userData.nombre,
    whatsapp: `+52${userData.whatsapp}`,  // Agregar +52
    email: userData.email,
    primeraInteraccion: admin.firestore.FieldValue.serverTimestamp(),
    ultimaInteraccion: admin.firestore.FieldValue.serverTimestamp(),
    totalInteracciones: admin.firestore.FieldValue.increment(1),
    consentimiento: true,
    preferencias: conversationData.preferencias || {},
    conversiones: {
      productosVistos: conversationData.productosVistos || [],
      productosComprados: []
    }
  }, { merge: true });
}
```

---

## Validaciones Importantes

### En el Backend

```javascript
function validateUserData(userData) {
  const errors = [];
  
  // Validar nombre
  if (!userData.nombre || userData.nombre.trim().length < 2) {
    errors.push('Nombre inválido');
  }
  
  // Validar WhatsApp (10 dígitos)
  const whatsappRegex = /^[0-9]{10}$/;
  if (!userData.whatsapp || !whatsappRegex.test(userData.whatsapp)) {
    errors.push('WhatsApp debe tener 10 dígitos');
  }
  
  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!userData.email || !emailRegex.test(userData.email)) {
    errors.push('Email inválido');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Uso
const validation = validateUserData(userData);
if (!validation.valid) {
  return res.status(400).json({
    success: false,
    error: validation.errors.join(', ')
  });
}
```

---

## Exportar Datos para Marketing

### Query de Firestore

```javascript
async function exportMarketingContacts() {
  const snapshot = await db.collection('marketing_contacts')
    .where('consentimiento', '==', true)
    .get();
  
  const contacts = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    contacts.push({
      nombre: data.nombre,
      whatsapp: data.whatsapp,
      email: data.email,
      totalInteracciones: data.totalInteracciones,
      ultimaInteraccion: data.ultimaInteraccion
    });
  });
  
  return contacts;
}
```

### Formato CSV para Exportación

```csv
nombre,whatsapp,email,total_interacciones,ultima_interaccion
María García López,+525551234567,maria@example.com,5,2025-12-28T14:45:00Z
Juan Pérez,+525559876543,juan@example.com,3,2025-12-27T10:30:00Z
```

---

## Métodos de Autenticación Soportados

| Método | Proveedor Firebase | Gratuito | Email Verificado |
|--------|-------------------|----------|------------------|
| Google Sign-In | `google.com` | ✅ Sí | ✅ Sí (automático) |
| Email/Password | `password` | ✅ Sí | ⚠️ Opcional |

### Identificar Método de Autenticación

```javascript
const decodedToken = await admin.auth().verifyIdToken(idToken);
const provider = decodedToken.firebase.sign_in_provider;

if (provider === 'google.com') {
  console.log('Usuario autenticado con Google');
} else if (provider === 'password') {
  console.log('Usuario autenticado con Email/Password');
}
```

---

## Ejemplo Completo: Endpoint Actualizado

```javascript
const admin = require('firebase-admin');
const db = admin.firestore();

app.post('/api/asesor-estilo', async (req, res) => {
  try {
    const { mensaje, imagen, idToken } = req.body;
    
    // Validar mensaje
    if (!mensaje || typeof mensaje !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'El mensaje es requerido y debe ser texto válido.'
      });
    }
    
    let userId = null;
    let userData = null;
    
    // Si hay token, verificar y obtener datos del usuario
    if (idToken) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        userId = decodedToken.uid;
        
        // Obtener datos adicionales de Firestore
        const userDoc = await db.collection('users_asistant').doc(userId).get();
        if (userDoc.exists) {
          userData = userDoc.data();
          
          // Guardar/actualizar en marketing
          await db.collection('marketing_contacts').doc(userId).set({
            nombre: userData.nombre,
            whatsapp: `+52${userData.whatsapp}`,
            email: decodedToken.email,
            ultimaInteraccion: admin.firestore.FieldValue.serverTimestamp(),
            totalInteracciones: admin.firestore.FieldValue.increment(1),
            consentimiento: true
          }, { merge: true });
        }
      } catch (error) {
        console.error('Error al verificar token:', error);
        return res.status(401).json({
          success: false,
          error: 'Token inválido o expirado. Por favor, inicia sesión nuevamente.'
        });
      }
    }
    
    // Contar mensajes del usuario en la sesión actual
    let messageCount = 1;
    if (userId) {
      // Lógica para contar mensajes...
    }
    
    // Si es el segundo mensaje y no hay usuario, pedir auth
    if (messageCount >= 2 && !userId) {
      return res.json({
        success: true,
        requiresAuth: true,
        message: "Para poder recordar tus preferencias y mostrarte los productos perfectos para ti, necesito que inicies sesión. ¿Te parece bien? 💝",
        mode: "auth_required"
      });
    }
    
    // Procesar con OpenAI/Claude
    const respuestaIA = await procesarConIA(mensaje, imagen, userData);
    
    // Guardar en historial si hay usuario
    if (userId) {
      await guardarEnHistorial(userId, mensaje, respuestaIA);
    }
    
    res.json({
      success: true,
      response: respuestaIA,
      mode: determinarModo(messageCount),
      isAuthenticated: !!userId,
      userId
    });
    
  } catch (error) {
    console.error('Error en asesor-estilo:', error);
    res.status(500).json({
      success: false,
      error: 'Ocurrió un error procesando tu solicitud. Por favor intenta de nuevo.'
    });
  }
});
```

---

## Preguntas Frecuentes

### ¿Cómo envío mensajes de WhatsApp a estos usuarios?

Usa una API de WhatsApp Business como:
- **Twilio**: https://www.twilio.com/whatsapp
- **WhatsApp Business API**: Oficial de Meta
- **Gupshup**: https://www.gupshup.io

Ejemplo con Twilio:

```javascript
const twilio = require('twilio');
const client = twilio(accountSid, authToken);

async function sendWhatsAppMessage(phone, message) {
  await client.messages.create({
    from: 'whatsapp:+14155238886',  // Tu número de Twilio
    to: `whatsapp:${phone}`,         // +525551234567
    body: message
  });
}
```

### ¿Cómo validar que el WhatsApp es real?

No hay forma 100% segura sin enviar un código de verificación. Opciones:

1. **Confiar en el usuario** (actual)
2. **Verificación posterior**: Enviar código por WhatsApp después del registro
3. **Validación en lote**: Usar API de WhatsApp para verificar números activos

### ¿El email viene verificado con Google Sign-In?

✅ **Sí**, Google verifica automáticamente el email.

Con Email/Password, puedes forzar verificación:

```javascript
await sendEmailVerification(user);
```

---

## Testing

### Datos de Prueba

```javascript
// Usuario de prueba
{
  "nombre": "Test User",
  "whatsapp": "5500000000",
  "email": "test@example.com"
}
```

### Verificar en Firestore Console

1. Ir a Firebase Console → Firestore Database
2. Buscar colección `users_asistant`
3. Verificar que cada usuario autenticado tenga sus datos completos

---

## Contacto

Si tienes dudas sobre esta implementación, contacta al equipo de frontend.
