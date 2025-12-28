// Servicio de autenticación con Firebase Phone Auth
import { auth } from '../credenciales';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber 
} from 'firebase/auth';

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
