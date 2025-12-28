// Servicio de autenticación con Firebase
import { auth } from '../credenciales';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const db = getFirestore();

/**
 * Configurar reCAPTCHA (solo una vez al montar el componente)
 * @param {string} elementId - ID del elemento donde se renderizará reCAPTCHA
 * @returns {RecaptchaVerifier}
 */
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

/**
 * Enviar código de verificación SMS
 * @param {string} phoneNumber - Número en formato internacional: +521234567890
 * @returns {Promise<{success: boolean, confirmationResult?: any, error?: string}>}
 */
export async function sendVerificationCode(phoneNumber) {
  try {
    // Asegurar formato internacional
    const formattedPhone = phoneNumber.startsWith('+') 
      ? phoneNumber 
      : `+52${phoneNumber.replace(/\D/g, '')}`;
    
    const appVerifier = setupRecaptcha();
    const confirmationResult = await signInWithPhoneNumber(
      auth, 
      formattedPhone, 
      appVerifier
    );
    
    // Guardar para usar después
    window.confirmationResult = confirmationResult;
    
    console.log('✅ Código SMS enviado a:', formattedPhone);
    return { success: true, confirmationResult };
  } catch (error) {
    console.error('❌ Error al enviar SMS:', error);
    
    // Resetear reCAPTCHA en caso de error
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.render().then((widgetId) => {
          if (window.grecaptcha) {
            window.grecaptcha.reset(widgetId);
          }
        });
      } catch (e) {
        console.warn('Error al resetear reCAPTCHA:', e);
      }
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Verificar código SMS y obtener ID Token
 * @param {string} code - Código de 6 dígitos recibido por SMS
 * @returns {Promise<{success: boolean, user?: any, idToken?: string, error?: string}>}
 */
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

/**
 * Obtener usuario actual y su ID Token
 * @param {boolean} forceRefresh - Forzar actualización del token
 * @returns {Promise<{user: any, idToken: string} | null>}
 */
export async function getCurrentUser(forceRefresh = false) {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    // Obtener token actualizado
    const idToken = await user.getIdToken(forceRefresh);
    
    return {
      user,
      idToken
    };
  } catch (error) {
    console.error('Error al obtener token:', error);
    return null;
  }
}

/**
 * Cerrar sesión
 */
export async function logout() {
  try {
    await auth.signOut();
    window.confirmationResult = null;
    window.recaptchaVerifier = null;
    console.log('✅ Sesión cerrada');
  } catch (error) {
    console.error('❌ Error al cerrar sesión:', error);
    throw error;
  }
}

/**
 * ==========================================
 * AUTENTICACIÓN CON GOOGLE (GRATUITA)
 * ==========================================
 */

/**
 * Iniciar sesión con Google
 * @returns {Promise<{success: boolean, user?: any, idToken?: string, error?: string}>}
 */
export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const idToken = await user.getIdToken();
    
    console.log('✅ Usuario autenticado con Google:', user.email);
    
    return {
      success: true,
      user,
      idToken,
      isNewUser: result._tokenResponse?.isNewUser || false
    };
  } catch (error) {
    console.error('❌ Error al autenticar con Google:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ==========================================
 * AUTENTICACIÓN CON EMAIL (GRATUITA)
 * ==========================================
 */

/**
 * Registrar nuevo usuario con email
 * @param {string} email 
 * @param {string} password 
 * @param {string} displayName - Nombre del usuario
 * @returns {Promise<{success: boolean, user?: any, idToken?: string, error?: string}>}
 */
export async function signUpWithEmail(email, password, displayName) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    // Actualizar el nombre del usuario
    if (displayName) {
      await updateProfile(user, { displayName });
    }
    
    const idToken = await user.getIdToken();
    
    console.log('✅ Usuario registrado con email:', email);
    
    return {
      success: true,
      user,
      idToken,
      isNewUser: true
    };
  } catch (error) {
    console.error('❌ Error al registrar usuario:', error);
    let errorMessage = 'Error al crear cuenta';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Este email ya está registrado';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'La contraseña debe tener al menos 6 caracteres';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido';
    }
    
    return { success: false, error: errorMessage };
  }
}

/**
 * Iniciar sesión con email
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{success: boolean, user?: any, idToken?: string, error?: string}>}
 */
export async function signInWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    const idToken = await user.getIdToken();
    
    console.log('✅ Usuario autenticado con email:', email);
    
    return {
      success: true,
      user,
      idToken,
      isNewUser: false
    };
  } catch (error) {
    console.error('❌ Error al iniciar sesión:', error);
    let errorMessage = 'Error al iniciar sesión';
    
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      errorMessage = 'Email o contraseña incorrectos';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido';
    }
    
    return { success: false, error: errorMessage };
  }
}

/**
 * ==========================================
 * DATOS ADICIONALES DEL USUARIO
 * ==========================================
 */

/**
 * Guardar datos adicionales del usuario en Firestore
 * @param {string} userId - ID del usuario de Firebase
 * @param {object} data - Datos adicionales (nombre, whatsapp, etc.)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function saveUserData(userId, data) {
  try {
    const userRef = doc(db, 'usuarios', userId);
    await setDoc(userRef, {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log('✅ Datos de usuario guardados en Firestore');
    return { success: true };
  } catch (error) {
    console.error('❌ Error al guardar datos:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener datos adicionales del usuario
 * @param {string} userId - ID del usuario de Firebase
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getUserData(userId) {
  try {
    const userRef = doc(db, 'usuarios', userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: true, data: null };
    }
  } catch (error) {
    console.error('❌ Error al obtener datos:', error);
    return { success: false, error: error.message };
  }
}

