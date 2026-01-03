/* global importScripts, firebase, clients */
// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.

// NOTE: removed accidental require of autoprefixer (not available in SW)
// Replace 10.13.2 with latest version of the Firebase JS SDK.
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyAcPmOLCEeL5sRenwhtTWCIBawWNcnD4Ls",
  authDomain: "malim-app.firebaseapp.com",
  projectId: "malim-app",
  storageBucket: "malim-app.firebasestorage.app",
  messagingSenderId: "953747301080",
  appId: "1:953747301080:web:d3cfd18e9be012bb822dad",
  measurementId: "G-9DD5YEX28R"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message ' +
    payload
  );
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image,
    data: {
      click_action: payload.data?.click_action
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickAction = event.notification.data?.click_action;
  // Validar que la URL sea relativa o pertenezca al mismo origen para prevenir apertura de sitios externos maliciosos
  try {
    if (!clickAction) return;
    // permitir rutas relativas
    if (clickAction.startsWith('/')) {
      event.waitUntil(clients.openWindow(clickAction));
      return;
    }

    // Permitir solo si coincide con el origen del service worker
    const origin = self.location && self.location.origin ? self.location.origin : null;
    if (origin && clickAction.startsWith(origin)) {
      event.waitUntil(clients.openWindow(clickAction));
      return;
    }

    // Si no es una URL permitida, ignorar y loguear
    console.warn('Ignored notification click_action with disallowed origin:', clickAction);
  } catch (e) {
    console.warn('Error handling notification click_action:', e);
  }
});