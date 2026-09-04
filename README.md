# NetCell ERP

Painel administrativo + Portal do Cliente da **NetCell Informática**.
**Vite + React + Supabase** — SPA 100% estática (mesma arquitetura do gtic-chamados).

## Rodar

```bash
npm install
cp .env.example .env     # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev              # http://localhost:3000
```

## Build

```bash
npm run build            # gera ./dist  (é isso que sobe no Hostinger)
```

## Deploy (Hostinger — Git)

Framework **Vite** · Build `npm install && npm run build` · Output `dist` ·
Variáveis: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
O `dist/` já inclui um `.htaccess` para o roteamento do React Router.

## Banco

O schema, as migrations e o seed ficam no repositório do site
(`netcell-site` → `packages/db` e `supabase/`). Este repositório é só o front-end.

Login inicial: `admin@netcellinformatica.com.br`.
