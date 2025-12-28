# 🎨 Integración Frontend - Asesor de Estilo Mia

## 📋 Resumen del Flujo

```
1. Usuario abre modal → Chatea libremente (SIN login)
2. Mia hace preguntas y conoce necesidades
3. Cuando Mia esté lista para recomendar:
   └─ Si NO está logeado → Pide login con teléfono
   └─ Si está logeado → Envía recomendaciones
4. Usuario se logea con Firebase Phone Auth
5. Envía mensaje nuevamente (ahora con phoneNumber)
6. Recibe recomendaciones de productos
```

---

## 🔐 Paso 1: Configurar Firebase Authentication

### Instalar Firebase en tu Frontend

```bash
npm install firebase
```

### Inicializar Firebase

```javascript
// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_BUCKET",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

### Implementar Phone Authentication

```javascript
// authService.js
import { auth } from './firebase';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber 
} from 'firebase/auth';

// 1. Configurar reCAPTCHA (solo una vez al montar el componente)
export function setupRecaptcha(elementId = 'recaptcha-container') {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
      'size': 'invisible',
      'callback': (response) => {
        console.log('✅ reCAPTCHA resuelto');
      },
      'expired-callback': () => {
        console.log('⚠️ reCAPTCHA expirado');
      }
    });
  }
  return window.recaptchaVerifier;
}

// 2. Enviar código SMS
export async function sendVerificationCode(phoneNumber) {
  try {
    // phoneNumber debe estar en formato internacional: +521234567890
    const appVerifier = setupRecaptcha();
    const confirmationResult = await signInWithPhoneNumber(
      auth, 
      phoneNumber, 
      appVerifier
    );
    
    // Guardar para usar después
    window.confirmationResult = confirmationResult;
    
    console.log('✅ Código SMS enviado a:', phoneNumber);
    return { success: true, confirmationResult };
  } catch (error) {
    console.error('❌ Error al enviar SMS:', error);
    
    // Resetear reCAPTCHA en caso de error
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.render().then((widgetId) => {
        grecaptcha.reset(widgetId);
      });
    }
    
    return { success: false, error: error.message };
  }
}

// 3. Verificar código SMS y obtener ID Token
export async function verifyCode(code) {
  try {
    const confirmationResult = window.confirmationResult;
    if (!confirmationResult) {
      throw new Error('No hay solicitud de verificación pendiente');
    }
    
    // Confirmar el código
    const result = await confirmationResult.confirm(code);
    const user = result.user;
    
    // IMPORTANTE: Obtener el ID Token para enviar al backend
    const idToken = await user.getIdToken();
    
    console.log('✅ Usuario autenticado:', user.phoneNumber);
    console.log('✅ ID Token obtenido');
    
    return { 
      success: true, 
      user,
      idToken  // Este es el que enviarás al backend
    };
  } catch (error) {
    console.error('❌ Error al verificar código:', error);
    return { success: false, error: error.message };
  }
}

// 4. Obtener usuario actual y su ID Token
export async function getCurrentUser() {
  const user = auth.currentUser;
  if (!user) return null;
  
  // Obtener token actualizado
  const idToken = await user.getIdToken();
  
  return {
    user,
    idToken
  };
}

// 5. Cerrar sesión
export async function logout() {
  await auth.signOut();
  window.confirmationResult = null;
  window.recaptchaVerifier = null;
}
```

---

## 🚀 Paso 2: Integrar con el Endpoint

### Endpoint URL
```
POST https://tu-dominio.vercel.app/api/asesor-estilo
```

### Request Body

**Sin autenticación (modo descubrimiento libre):**
```json
{
  "mensaje": "Hola, busco un vestido",
  "imagen": null
}
```

**Con autenticación (para recibir recomendaciones):**
```json
{
  "mensaje": "Muéstrame opciones",
  "imagen": null,
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

**Con imagen:**
```json
{
  "mensaje": "¿Qué colores me quedan?",
  "imagen": "data:image/jpeg;base64,/9j/4AAQ...",
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

> **⚠️ IMPORTANTE:** El `idToken` se obtiene de Firebase Auth después de autenticar exitosamente con `user.getIdToken()`. Este token está firmado y tiene una validez de 1 hora.

### Tipos de Respuestas

#### 1. Modo Descubrimiento (sin productos)
```json
{
  "success": true,
  "response": "¡Hola! 💝 Cuéntame, ¿para qué ocasión estás buscando outfit?",
  "mode": "discovery",
  "isAuthenticated": false,
  "userId": null
}
```

#### 2. Requiere Autenticación
```json
{
  "success": true,
  "requiresAuth": true,
  "message": "¡Perfecto! 💝 Tengo opciones increíbles para ti. Para mostrarte nuestros productos y que puedas comprar, necesito que inicies sesión con tu número de teléfono. ¿Te parece bien?",
  "mode": "auth_required"
}
```

#### 3. Modo Recomendación (con productos)
```json
{
  "success": true,
  "response": "¡Perfecto! Te recomiendo:\n\n1. Vestido Rojo Elegante - $850\n   https://malim-shop.vercel.app/producto/MAL-VES-001\n\n2. ...",
  "mode": "recommendation",
  "isAuthenticated": true,
  "userId": "firebase-uid-123"
}
```

#### 4. Error de Autenticación
```json
{
  "success": false,
  "error": "Token inválido o expirado. Por favor, inicia sesión nuevamente."
}
```

> **Nota:** Los tokens de Firebase expiran después de 1 hora. Si recibes este error, debes refrescar el token con `user.getIdToken(true)` o pedir al usuario que inicie sesión nuevamente.

---

## 💻 Paso 3: Implementación React Completa

```javascript
// components/AsesorMiaModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { getCurrentUser, sendVerificationCode, verifyCode } from '../services/authService';

export default function AsesorMiaModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const messagesEndRef = useRef(null);

  // Verificar si hay usuario logeado
  useEffect(() => {
    const loadUser = async () => {
      const userData = await getCurrentUser();
      if (userData) {
        setCurrentUser(userData.user);
        setIdToken(userData.idToken);
      }
    };
    loadUser();
  }, []);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mensaje de bienvenida
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: '¡Hola! 💝 Soy Mia, tu asesora de estilo personal. ¿En qué puedo ayudarte hoy?'
      }]);
    }
  }, [isOpen]);

  // Enviar mensaje al backend
  const sendMessage = async (messageText, imageBase64 = null) => {
    if (!messageText.trim()) return;

    // Agregar mensaje del usuario al chat
    const userMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setSelectedImage(null);
    setLoading(true);

    try {
      const requestBody = {
        mensaje: messageText,
        imagen: imageBase64
      };

      // Si el usuario está logeado, incluir idToken
      if (idToken) {
        requestBody.idToken = idToken;
      }

      const response = await fetch('https://tu-dominio.vercel.app/api/asesor-estilo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!data.success) {
        // Si el token expiró, intentar refrescar
        if (data.error && data.error.includes('Token')) {
          const userData = await getCurrentUser();
          if (userData) {
            setIdToken(userData.idToken);
            // Reintentar con token nuevo
            return sendMessage(messageText, imageBase64);
          }
        }
        throw new Error(data.error || 'Error al procesar el mensaje');
      }

      // Caso 1: Requiere autenticación
      if (data.requiresAuth) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message,
          requiresAuth: true
        }]);
        setShowPhoneAuth(true);
        return;
      }

      // Caso 2: Respuesta normal (discovery o recommendation)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        mode: data.mode
      }]);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'system',
        content: '⚠️ Ocurrió un error. Por favor intenta de nuevo.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputMessage, selectedImage);
  };

  // Manejar selección de imagen
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert('La imagen es muy pesada. Máximo 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Iniciar proceso de autenticación por teléfono
  const handlePhoneAuthStart = async () => {
    if (!phoneNumber.trim()) {
      alert('Por favor ingresa tu número de teléfono');
      return;
    }

    // Asegurar formato internacional
    const formattedPhone = phoneNumber.startsWith('+') 
      ? phoneNumber 
      : `+52${phoneNumber}`;

    setLoading(true);
    const result = await sendVerificationCode(formattedPhone);
    setLoading(false);

    if (result.success) {
      setCodeSent(true);
      alert('✅ Código enviado a tu teléfono');
    } else {
      alert('❌ Error: ' + result.error);
    }
  };

  // Verificar código SMS
  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      alert('Por favor ingresa el código');
      return;
    }

    setLoading(true);
    const result = await verifyCode(verificationCode);
    setLoading(false);

    if (result.success) {
      setCurrentUser(result.user);
      setIdToken(result.idToken); // Guardar el token
      setShowPhoneAuth(false);
      setCodeSent(false);
      setPhoneNumber('');
      setVerificationCode('');
      
      // Reenviar el último mensaje del usuario ahora con autenticación
      const lastUserMessage = messages
        .filter(m => m.role === 'user')
        .pop();
      
      if (lastUserMessage) {
        sendMessage(lastUserMessage.content);
      }
    } else {
      alert('❌ Código incorrecto: ' + result.error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <h2>💝 Mia - Tu Asesora de Estilo</h2>
          {currentUser && (
            <span className="auth-badge">✓ {currentUser.phoneNumber}</span>
          )}
          <button onClick={onClose}>✕</button>
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-content">{msg.content}</div>
            </div>
          ))}
          {loading && <div className="loading">Mia está pensando...</div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Phone Auth Panel */}
        {showPhoneAuth && (
          <div className="phone-auth-panel">
            {!codeSent ? (
              <>
                <h3>Iniciar Sesión</h3>
                <input
                  type="tel"
                  placeholder="+52 123 456 7890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <button onClick={handlePhoneAuthStart} disabled={loading}>
                  Enviar Código SMS
                </button>
              </>
            ) : (
              <>
                <h3>Verificar Código</h3>
                <input
                  type="text"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                />
                <button onClick={handleVerifyCode} disabled={loading}>
                  Verificar
                </button>
              </>
            )}
            <div id="recaptcha-container"></div>
          </div>
        )}

        {/* Input Area */}
        {!showPhoneAuth && (
          <form onSubmit={handleSubmit} className="input-area">
            {selectedImage && (
              <div className="image-preview">
                <img src={selectedImage} alt="Preview" />
                <button type="button" onClick={() => setSelectedImage(null)}>
                  ✕
                </button>
              </div>
            )}
            
            <div className="input-group">
              <label htmlFor="image-upload" className="image-button">
                📷
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              
              <input
                type="text"
                placeholder="Escribe tu mensaje..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={loading}
              />
              
              <button type="submit" disabled={loading || !inputMessage.trim()}>
                Enviar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
```

---

## 🎨 CSS Básico

```css
/* AsesorMiaModal.css */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 20px;
  border-bottom: 2px solid #ffeef8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);
  color: white;
  border-radius: 20px 20px 0 0;
}

.auth-badge {
  font-size: 0.85em;
  background: rgba(255, 255, 255, 0.3);
  padding: 5px 10px;
  border-radius: 10px;
}

.chat-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #fafafa;
}

.message {
  margin-bottom: 15px;
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 15px;
  line-height: 1.4;
}

.message.assistant .message-content {
  background: white;
  border: 2px solid #ff6b9d;
}

.message.user .message-content {
  background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);
  color: white;
}

.phone-auth-panel {
  padding: 20px;
  background: #e3f2fd;
  border-top: 2px solid #1976d2;
}

.phone-auth-panel h3 {
  margin-bottom: 10px;
  color: #1976d2;
}

.phone-auth-panel input {
  width: 100%;
  padding: 12px;
  margin-bottom: 10px;
  border: 2px solid #1976d2;
  border-radius: 10px;
  font-size: 1em;
}

.phone-auth-panel button {
  width: 100%;
  padding: 12px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
}

.input-area {
  padding: 20px;
  border-top: 2px solid #ffeef8;
}

.input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.image-button {
  background: #e3f2fd;
  border: 2px solid #1976d2;
  color: #1976d2;
  padding: 10px 15px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1.2em;
}

.input-group input[type="text"] {
  flex: 1;
  padding: 12px;
  border: 2px solid #ffeef8;
  border-radius: 10px;
  font-size: 1em;
}

.input-group button {
  background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
}

.input-group button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.image-preview {
  margin-bottom: 10px;
  position: relative;
}

.image-preview img {
  max-width: 150px;
  border-radius: 10px;
  border: 2px solid #ff6b9d;
}

.image-preview button {
  position: absolute;
  top: 5px;
  right: 5px;
  background: red;
  color: white;
  border: none;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  cursor: pointer;
}

.loading {
  text-align: center;
  padding: 10px;
  color: #ff6b9d;
  font-style: italic;
}
```

---

## 📊 Estructura de Base de Datos

### Colección: `usuarios_asesor`

Cada documento tiene el UID del usuario de Firebase Auth como ID:

```javascript
{
  uid: "firebase-uid-123",
  telefono: "+521234567890",
  nombre: "María García",
  fechaCreacion: Timestamp,
  ultimaInteraccion: Timestamp,
  totalInteracciones: 15,
  origen: "asesor_estilo",
  activo: true,
  conversaciones: [
    {
      fecha: Timestamp,
      mensaje: "Busco vestido para boda",
      respuesta: "¡Qué emoción! ¿Prefieres elegante o casual?",
      tieneImagen: false,
      modo: "discovery"
    },
    {
      fecha: Timestamp,
      mensaje: "Elegante",
      respuesta: "Perfecto! Te recomiendo...",
      tieneImagen: false,
      modo: "recommendation"
    }
  ]
}
```

---

## 🔄 Flujo Completo de Usuario

### Caso 1: Usuario No Logeado

```
1. Usuario: "Hola"
   → Backend responde en modo discovery (sin requerir auth)

2. Usuario: "Busco vestido para boda"
   → Backend sigue en modo discovery (haciendo preguntas)

3. Usuario: "Elegante, colores rojos"
   → Backend detecta que está lista para recomendar
   → Verifica que NO hay phoneNumber en el request
   → Responde: { requiresAuth: true, message: "... necesito que inicies sesión ..." }

4. Frontend muestra panel de autenticación

5. Usuario ingresa teléfono → recibe SMS → verifica código

6. Frontend reenvía último mensaje AHORA con phoneNumber

7. Backend recibe mensaje con phoneNumber válido
   → Verifica autenticación en Firebase Auth
   → Crea/actualiza usuario en usuarios_asesor
   → Activa modo recommendation
   → Envía productos

8. Usuario recibe recomendaciones con enlaces
```

### Caso 2: Usuario Ya Logeado

```
1. Usuario abre modal → getCurrentUser() retorna usuario

2. Usuario: "Busco algo casual"
   → Request incluye phoneNumber desde el inicio

3. Backend:
   → Verifica autenticación ✓
   → Recupera historial previo
   → Responde en modo discovery

4. Usuario: "Para el trabajo"
   → Backend determina que está listo
   → Como ya está autenticado, envía recomendaciones directamente

5. Usuario recibe productos sin interrupciones
```

---

## 🎯 Puntos Importantes

### ✅ Hacer

1. **Siempre enviar idToken cuando esté disponible**
   ```javascript
   if (idToken) {
     requestBody.idToken = idToken;
   }
   ```

2. **Obtener idToken después de autenticar**
   ```javascript
   const result = await verifyCode(code);
   const idToken = result.idToken; // Guardarlo en el estado
   ```

3. **Refrescar token si expira**
   ```javascript
   // Si el backend retorna error de token
   const userData = await getCurrentUser(); // Obtiene token fresco
   setIdToken(userData.idToken);
   ```

4. **Formato internacional del teléfono**
   ```javascript
   const phone = phoneNumber.startsWith('+') 
     ? phoneNumber 
     : `+52${phoneNumber}`;
   ```

5. **Reenviar mensaje después del login**
   ```javascript
   // Después de autenticar exitosamente
   const lastUserMessage = messages.filter(m => m.role === 'user').pop();
   sendMessage(lastUserMessage.content);
   ```

### ❌ No Hacer

1. ❌ No enviar phoneNumber directamente (usar idToken)
2. ❌ No cachear el idToken por más de 1 hora (expira)
3. ❌ No mostrar panel de auth si `requiresAuth` es false
4. ❌ No comprimir/modificar el formato de imagen Base64
5. ❌ No reusar tokens expirados

---

## 🔑 Gestión de ID Tokens (IMPORTANTE)

### ¿Qué es el ID Token?

El **ID Token** es un JWT (JSON Web Token) firmado por Firebase que contiene:
- UID del usuario
- Número de teléfono
- Fecha de emisión y expiración
- Firma criptográfica de Firebase

### Ciclo de Vida del Token

```
┌─────────────────────────────────────────────┐
│  Usuario autentica con Firebase Auth       │
│  → confirmationResult.confirm(code)         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Firebase retorna usuario autenticado      │
│  → user.getIdToken()                        │
│  → Token válido por 1 hora                  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Frontend envía token al backend           │
│  → { idToken: "eyJhbGci..." }               │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Backend verifica con Firebase Admin       │
│  → admin.auth().verifyIdToken(idToken)      │
│  → Extrae UID y phoneNumber del token       │
│  → ✅ Autenticación verificada              │
└─────────────────────────────────────────────┘
```

### Manejo de Tokens Expirados

```javascript
// En tu componente React
const sendMessage = async (messageText) => {
  try {
    const response = await fetch('/api/asesor-estilo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mensaje: messageText,
        idToken: idToken
      })
    });

    const data = await response.json();

    // Si el token expiró
    if (!data.success && data.error?.includes('Token')) {
      console.log('🔄 Token expirado, refrescando...');
      
      // Obtener token fresco
      const user = auth.currentUser;
      if (user) {
        const newToken = await user.getIdToken(true); // force refresh
        setIdToken(newToken);
        
        // Reintentar con token nuevo
        return sendMessage(messageText);
      }
    }

    // Procesar respuesta normal...
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Verificación en el Backend

El backend NO confía en el phoneNumber enviado directamente. En su lugar:

1. **Recibe el idToken**
2. **Verifica con Firebase Admin:**
   ```javascript
   const decodedToken = await admin.auth().verifyIdToken(idToken);
   // decodedToken contiene:
   // - uid: "firebase-uid-123"
   // - phone_number: "+521234567890"
   // - exp: timestamp de expiración
   ```
3. **Usa los datos del token verificado** (no del request)

### Beneficios de Seguridad

✅ **No se puede falsificar:** El token está firmado por Firebase  
✅ **Validación automática:** Firebase Admin verifica la firma  
✅ **Expiración integrada:** Tokens viejos son rechazados automáticamente  
✅ **Sin base de datos:** No necesitas almacenar sesiones  
✅ **Sin contraseñas:** El teléfono es la credencial

---

## 🧪 Testing

### Test 1: Conversación sin login
```javascript
// Request
{
  "mensaje": "Hola"
}

// Expected Response
{
  "success": true,
  "response": "¡Hola! 💝 Cuéntame, ¿para qué ocasión...?",
  "mode": "discovery",
  "isAuthenticated": false
}
```

### Test 2: Solicitud de auth
```javascript
// Request (después de varias interacciones)
{
  "mensaje": "Muéstrame opciones"
}

// Expected Response
{
  "success": true,
  "requiresAuth": true,
  "message": "¡Perfecto! 💝 ... necesito que inicies sesión ...",
  "mode": "auth_required"
}
```

### Test 3: Con autenticación
```javascript
// Request
{
  "mensaje": "Muéstrame opciones",
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}

// Expected Response
{
  "success": true,
  "response": "Te recomiendo:\n1. Vestido...",
  "mode": "recommendation",
  "isAuthenticated": true,
  "userId": "firebase-uid"
}
```

### Test 4: Token expirado
```javascript
// Request con token viejo (>1 hora)
{
  "mensaje": "Hola",
  "idToken": "expired-token..."
}

// Expected Response
{
  "success": false,
  "error": "Token inválido o expirado. Por favor, inicia sesión nuevamente."
}
```

---

## 📱 Remarketing: Uso de la Colección

La colección `usuarios_asesor` permite:

### 1. Segmentación por Actividad
```javascript
// Usuarios activos en los últimos 7 días
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

const activeUsers = await db.collection('usuarios_asesor')
  .where('ultimaInteraccion', '>=', sevenDaysAgo)
  .get();
```

### 2. Usuarios que No Compraron
```javascript
// Usuarios con conversaciones pero sin compras
const potentialLeads = await db.collection('usuarios_asesor')
  .where('totalInteracciones', '>=', 3)
  .get();

// Filtrar los que tienen modo "recommendation" pero no compraron
```

### 3. Análisis de Conversaciones
```javascript
const userDoc = await db.collection('usuarios_asesor').doc(userId).get();
const data = userDoc.data();

const discoveryCount = data.conversaciones.filter(c => c.modo === 'discovery').length;
const recommendationCount = data.conversaciones.filter(c => c.modo === 'recommendation').length;

console.log(`Preguntas: ${discoveryCount}, Recomendaciones: ${recommendationCount}`);
```

---

## 🚀 Listo para Integrar

Con esta guía tienes todo lo necesario para:
- ✅ Implementar Firebase Phone Auth
- ✅ Conectar con el endpoint
- ✅ Manejar todos los estados de la conversación
- ✅ Recolectar datos para remarketing

**¡El flujo está optimizado para máxima conversión sin fricciones innecesarias!** 🎯
