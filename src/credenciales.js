// credenciales.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, where, Timestamp, getDocs, enableIndexedDbPersistence } from "firebase/firestore";
import { getMessaging, getToken } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAcPmOLCEeL5sRenwhtTWCIBawWNcnD4Ls",
  authDomain: "malim-app.firebaseapp.com",
  projectId: "malim-app",
  storageBucket: "malim-app.firebasestorage.app",
  messagingSenderId: "953747301080",
  appId: "1:953747301080:web:d3cfd18e9be012bb822dad",
  measurementId: "G-9DD5YEX28R"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Firestore
const db = getFirestore(app);

// Habilitar persistence (IndexedDB) para reducir lecturas de red cuando sea posible
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistence no activada: múltiples pestañas abiertas');
    } else {
      console.warn('Persistence no soportada:', err);
    }
  });
} catch {
  // En algunos entornos (SSR) esto puede fallar; ignorar
}

// Messaging
const messaging = getMessaging(app);

// Analytics (solo si window existe)
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

// Auth
const auth = getAuth(app);

// Backend API
export const BACKEND_API_URL = 'https://malim-backend.vercel.app';

// Exporta instancias
export { db, messaging, analytics, auth };

export const generateToken = async () => {
  const permission = await Notification.requestPermission();
  console.log(permission);
  if (permission === "granted") {
    const token = await getToken(messaging, {
      vapidKey: "BPM6VClBoZtrYgw2TlJ4o4CPgWOLCbpE9lYdHbV-8RX_x6MaYFUEWG0EjBf7iDEVTMaaObPfU5MB87SPrC2u4rg"
    });
    console.log(token);
    if (token) {
      const tokensRef = collection(db, "tokens");
      const q = query(tokensRef, where("token", "==", token));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await addDoc(tokensRef, {
          token,
          timestamp: Timestamp.now()
        });
        console.log("Token guardado");
      } else {
        console.log("El token ya existe en la base de datos");
      }
    }
  }
};
