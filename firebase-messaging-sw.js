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
    // [T-PUSH-04] Corrigé d'après manifest.json : les icônes réelles sont
    // "icon-192.png" / "icon-48.png" (pas "icon-192x192.png"), placées à la
    // racine du site aux côtés de manifest.json (pas dans un dossier "icons/"),
    // et en chemin relatif (site hébergé en sous-dossier GitHub Pages). Aucune
    // icône dédiée 72x72 n'existe : icon-48.png (la plus petite disponible)
    // sert de badge en attendant qu'une icône dédiée soit ajoutée si besoin.
    icon: "icon-192.png",
    badge: "icon-48.png",
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
  // [T-PUSH-04] "/" pointait à la racine du domaine plutôt qu'au dossier réel
  // de déploiement (GitHub Pages en sous-dossier) — même piège que pour les
  // icônes ci-dessus. "." reste dans le dossier de ce Service Worker.
  const targetUrl = event.notification.data?.url || ".";
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
