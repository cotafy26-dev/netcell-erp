import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = document.getElementById('root')!;

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // Falha de configuração: mostra um aviso legível em vez de tela branca.
  root.innerHTML = `
    <div style="min-height:100dvh;display:grid;place-items:center;padding:24px;
                font-family:system-ui,sans-serif;background:#090909;color:#fff">
      <div style="max-width:520px;text-align:center">
        <h1 style="font-size:1.3rem;margin-bottom:8px">Configuração ausente</h1>
        <p style="color:#bbb;line-height:1.6">
          As variáveis <code style="color:#ffd400">VITE_SUPABASE_URL</code> e
          <code style="color:#ffd400">VITE_SUPABASE_ANON_KEY</code> não foram definidas
          no build deste site. Configure-as no painel de deploy e gere um novo build
          (salvar as variáveis sozinho não aplica — é preciso rebuildar).
        </p>
      </div>
    </div>`;
} else {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
