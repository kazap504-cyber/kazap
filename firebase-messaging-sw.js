importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyCyk_4gju7qsbHPdx5Jp4kD-D3AIslGAQ8",
  authDomain: "kazap-f8ff6.firebaseapp.com",
  projectId: "kazap-f8ff6",
  messagingSenderId: "160428099617",
  appId: "1:160428099617:web:852f982bbcf179b3513b60"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title = "Kazap", body = "Notification" } = payload.notification || {};
  const notificationOptions = {
    body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    tag: "kazap-notification",
    vibrate: [200, 100, 200],
    actions: [
      { action: "open", title: "Ouvrir" },
      { action: "dismiss", title: "Ignorer" }
    ]
  };
  self.registration.showNotification(title, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
