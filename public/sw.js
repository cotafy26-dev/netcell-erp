/* Service worker — habilita instalar como app (PWA) e trata Web Push /
   clique na notificação. Sem cache offline (não serve versão velha do app). */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || 'NetCell ERP';
  const options = {
    body: data.body || 'Você tem uma nova atualização no sistema.',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: data.tag || 'netcell-erp',
    renotify: true,
    requireInteraction: true,
    vibrate: [300, 120, 300],
    data: { url: data.url || '/admin' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/admin';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientes) => {
      for (const c of clientes) {
        if ('focus' in c) {
          c.navigate?.(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
