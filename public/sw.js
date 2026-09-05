/* Kill-switch service worker.
   Versões antigas registravam um SW que, preso no aparelho, deixava a tela
   preta. Este arquivo existe só para "matar" esses registros: quando o
   navegador busca /sw.js para atualizar, recebe este script, que se
   desregistra, limpa os caches e recarrega as abas. Sem cache, sem fetch. */

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (e) {
        /* ignore */
      }
      try {
        await self.registration.unregister();
      } catch (e) {
        /* ignore */
      }
      try {
        const clients = await self.clients.matchAll({ type: 'window' });
        for (const c of clients) c.navigate(c.url);
      } catch (e) {
        /* ignore */
      }
    })(),
  );
});
