// Service worker mínimo: habilita a instalação como app (PWA) sem fazer
// cache — assim nunca serve uma versão velha depois de um novo deploy.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {
  // sem handler de cache: o navegador busca da rede normalmente.
});
