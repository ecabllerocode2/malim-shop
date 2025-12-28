# Integración Frontend - Chat Asesor de Estilo "Mia"

## Endpoint
```
POST https://malim-backend.vercel.app/api/asesor-estilo
```

## Flujo de Autenticación

### 1. Primer Mensaje (Saludo) - SIN AUTENTICACIÓN
El usuario puede enviar su **primer mensaje de saludo** sin estar autenticado.

**Request:**
```javascript
fetch('https://malim-backend.vercel.app/api/asesor-estilo', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    mensaje: "Hola",
    imagen: null,  // opcional
    idToken: null  // NO enviar token todavía
  })
});
```

**Response:**
```json
{
  "success": true,
  "response": "¡Hola! 💝 Cuéntame, ¿para qué tipo de ocasión estás buscando outfit?",
  "mode": "discovery",
  "isAuthenticated": false,
  "userId": null
}
```

### 2. Segundo Mensaje - PEDIR AUTENTICACIÓN
Cuando el usuario envíe el **segundo mensaje sin estar autenticado**, el backend pedirá login.

**Request:**
```javascript
fetch('https://malim-backend.vercel.app/api/asesor-estilo', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    mensaje: "Para trabajo",
    imagen: null,
    idToken: null  // Sin token
  })
});
```

**Response:**
```json
{
  "success": true,
  "requiresAuth": true,
  "message": "Para poder recordar tus preferencias y mostrarte los productos perfectos para ti, necesito que inicies sesión con tu número de teléfono. ¿Te parece bien? 💝",
  "mode": "auth_required"
}
```

### 3. Mostrar Modal de Login/Registro

Cuando recibas `requiresAuth: true`, debes:

1. **Mostrar un modal/pantalla de autenticación**
2. **Implementar autenticación con Firebase Auth (Phone)**
3. **Obtener el ID Token**

**Ejemplo con Firebase:**
```javascript
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';

// Configurar reCAPTCHA
const auth = getAuth();
const appVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
  size: 'invisible'
});

// Enviar código
const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);

// Verificar código
const result = await confirmationResult.confirm(verificationCode);

// Obtener ID Token
const idToken = await result.user.getIdToken();
```

### 4. Mensajes Posteriores - CON AUTENTICACIÓN

Una vez autenticado, **siempre envía el idToken** en todas las peticiones.

**Request:**
```javascript
const idToken = await firebase.auth().currentUser.getIdToken();

fetch('https://malim-backend.vercel.app/api/asesor-estilo', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    mensaje: "Busco ropa elegante para la oficina",
    imagen: null,
    idToken: idToken  // ✅ Siempre incluir
  })
});
```

**Response (Modo Descubrimiento):**
```json
{
  "success": true,
  "response": "¡Perfecto! Para la oficina necesitas piezas versátiles. ¿Qué colores prefieres?",
  "mode": "discovery",
  "isAuthenticated": true,
  "userId": "firebase_user_id_123"
}
```

### 5. Recomendaciones de Productos

Después de 2-3 intercambios, el backend cambiará automáticamente a **modo recomendación**.

**Response (Modo Recomendación):**
```json
{
  "success": true,
  "response": "¡Tengo opciones perfectas para ti! 💼\n\n1. **Blusa Ejecutiva Blanca** - Ideal para la oficina, corte clásico. $45.00\nhttps://malim-shop.vercel.app/producto/BL-001\n\n2. **Pantalón de Vestir Negro** - Elegante y versátil. $55.00 (15% OFF)\nhttps://malim-shop.vercel.app/producto/PT-004",
  "mode": "recommendation",
  "isAuthenticated": true,
  "userId": "firebase_user_id_123"
}
```

## Envío de Imágenes

Las imágenes deben enviarse en **formato Base64** con el prefijo `data:image/`.

**Ejemplo:**
```javascript
const imageFile = event.target.files[0];
const reader = new FileReader();

reader.onloadend = async () => {
  const base64Image = reader.result; // "data:image/jpeg;base64,/9j/4AAQ..."
  
  const response = await fetch('https://malim-backend.vercel.app/api/asesor-estilo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mensaje: "¿Qué te parece este outfit?",
      imagen: base64Image,  // ✅ Base64 con prefijo
      idToken: idToken
    })
  });
};

reader.readAsDataURL(imageFile);
```

**Límites:**
- Tamaño máximo: **4MB**
- Formatos: JPG, PNG, WEBP

## Manejo de Errores

### Error 401 - Token Inválido
```json
{
  "success": false,
  "error": "Token inválido o expirado. Por favor, inicia sesión nuevamente."
}
```
**Acción:** Cerrar sesión y pedir login nuevamente.

### Error 400 - Datos Inválidos
```json
{
  "success": false,
  "error": "El mensaje es requerido y debe ser texto válido."
}
```

### Error 500 - Error del Servidor
```json
{
  "success": false,
  "error": "Ocurrió un error procesando tu solicitud. Por favor intenta de nuevo."
}
```

## Ejemplo Completo de Implementación

```javascript
class ChatAsesorEstilo {
  constructor() {
    this.endpoint = 'https://malim-backend.vercel.app/api/asesor-estilo';
    this.isAuthenticated = false;
  }

  async sendMessage(mensaje, imagen = null) {
    try {
      // Obtener token si está autenticado
      let idToken = null;
      if (this.isAuthenticated) {
        const user = firebase.auth().currentUser;
        if (user) {
          idToken = await user.getIdToken();
        }
      }

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mensaje,
          imagen,
          idToken
        })
      });

      const data = await response.json();

      // Si pide autenticación
      if (data.requiresAuth) {
        this.showLoginModal();
        return {
          type: 'auth_required',
          message: data.message
        };
      }

      // Respuesta normal
      return {
        type: data.mode,
        message: data.response,
        isAuthenticated: data.isAuthenticated
      };

    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      return {
        type: 'error',
        message: 'Error de conexión. Intenta de nuevo.'
      };
    }
  }

  async authenticate(phoneNumber, verificationCode) {
    // Implementar autenticación con Firebase
    // ...
    this.isAuthenticated = true;
  }

  showLoginModal() {
    // Mostrar modal de autenticación
    // ...
  }
}
```

## Estados del Chat

| Estado | `mode` | `requiresAuth` | `isAuthenticated` | Acción Frontend |
|--------|--------|----------------|-------------------|-----------------|
| Saludo inicial | `discovery` | `false` | `false` | Mostrar respuesta |
| Sin auth después del saludo | `auth_required` | `true` | `false` | **Mostrar modal de login** |
| Descubriendo necesidades | `discovery` | `false` | `true` | Mostrar respuesta |
| Mostrando productos | `recommendation` | `false` | `true` | Mostrar respuesta con links |

## Notas Importantes

1. **Persistir la autenticación**: Usa `firebase.auth().onAuthStateChanged()` para mantener la sesión
2. **Refrescar token**: Firebase maneja automáticamente el refresh del token
3. **Historial**: El backend guarda automáticamente el historial cuando hay autenticación
4. **Primera interacción**: Permite el saludo sin autenticación para mejor UX
5. **Links de productos**: En modo `recommendation`, parsea los enlaces para hacerlos clicables

## Testing

```javascript
// Test 1: Saludo sin auth
await sendMessage("Hola", null, null);
// Espera: mode: "discovery", requiresAuth: false

// Test 2: Segundo mensaje sin auth
await sendMessage("Para fiesta", null, null);
// Espera: requiresAuth: true, mode: "auth_required"

// Test 3: Después de autenticar
await sendMessage("Para fiesta", null, idToken);
// Espera: mode: "discovery", isAuthenticated: true

// Test 4: Continuación
await sendMessage("Elegante, colores oscuros", null, idToken);
// Espera: mode: "recommendation" (con productos)
```

## Configuración de Firebase (Frontend)

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  // ... resto de configuración
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
```

---

**¿Necesitas ayuda?** Contacta al equipo de backend.
