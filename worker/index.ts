// worker/index.ts
// Service Worker custom extensions for Totten Web Push Notifications

declare const self: any;

// Push event - Disparado quando o servidor envia uma notificação push
self.addEventListener("push", (event: any) => {
  let data = {
    title: "Totten",
    body: "Você tem uma nova notificação.",
    icon: "/android-chrome-192x192.png",
    badge: "/favicon-32x32.png",
    url: "/admin/dashboard",
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      data.body = event.data.text();
    }
  }

  const options: NotificationOptions = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    data: { url: data.url },
    vibrate: [200, 100, 200],
    tag: "totten-push-notification",
    renotify: true,
  } as any;

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click event - Foca na aba aberta ou abre a tela desejada
self.addEventListener("notificationclick", (event: any) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/admin/dashboard";

  event.waitUntil(
    (self as any).clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients: any[]) => {
        for (const client of windowClients) {
          if (client.url && "focus" in client) {
            if (client.url.includes(urlToOpen)) {
              return client.focus();
            }
          }
        }
        if ((self as any).clients.openWindow) {
          return (self as any).clients.openWindow(urlToOpen);
        }
      }),
  );
});

export {};
