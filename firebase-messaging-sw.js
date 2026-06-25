importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBO3BwYiEnF0K86j49aooqenWGgBj5yCLY",
  authDomain: "ideenapp-63691.firebaseapp.com",
  projectId: "ideenapp-63691",
  storageBucket: "ideenapp-63691.firebasestorage.app",
  messagingSenderId: "797997840846",
  appId: "1:797997840846:web:a6c32b1316d7972714539f"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Neue Idee';
  const body = payload.notification?.body || '';
  self.registration.showNotification(title, {
    body,
    tag: 'ideenapp-' + Date.now(),
    renotify: true
  });
});
