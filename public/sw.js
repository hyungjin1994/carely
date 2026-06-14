// Carely service worker — 푸시 알림 + 클릭 라우팅. 오프라인 캐싱은 하지 않음.

const VERSION = "carely-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)),
      );
    })(),
  );
});

self.addEventListener("fetch", () => {
  // Pass-through.
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Carely", body: event.data.text() };
  }

  const title = payload.title || "Carely";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icon.svg",
    badge: payload.badge || "/icon.svg",
    tag: payload.tag,
    data: { url: payload.url || "/home", ...(payload.data || {}) },
    renotify: !!payload.tag,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data && event.notification.data.url) || "/home";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        const url = new URL(client.url);
        const origin = new URL(self.location.origin).origin;
        if (url.origin === origin) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await client.navigate(targetUrl);
            } catch {
              // navigate() 는 cross-origin/sandboxed 에서 throw 할 수 있음
            }
          }
          return;
        }
      }

      await self.clients.openWindow(targetUrl);
    })(),
  );
});
