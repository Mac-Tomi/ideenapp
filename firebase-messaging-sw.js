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
  const title = payload.notification?.title || '💡 Neue Idee';
  const body = payload.notification?.body || '';
  self.registration.showNotification(title, {
    body,
    icon: 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Ctext y=%27.9em%27 font-size=%2790%27%3E%F0%9F%92%A1%3C/text%3E%3C/svg%3E',
    data: payload.data
  });
});
