import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  // Absoluto: o app é servido na raiz do domínio, e o fallback de SPA
  // (.htaccess -> /app.html) precisa que os assets resolvam por caminho
  // absoluto independente da URL atual (/admin/clientes, /portal etc.).
  base: '/',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rollupOptions: {
      input: {
        // index.html = página de vendas (estática, sem React)
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        // app.html = shell do React (painel/portal), servido pelo .htaccess
        // para qualquer rota que não seja um arquivo real (/login, /admin, /portal...)
        app: fileURLToPath(new URL('./app.html', import.meta.url)),
      },
    },
  },
  server: { host: true, port: 3000, open: '/app.html' },
  preview: { host: true, port: 4173 },
});
