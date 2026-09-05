# NetCell ERP

Site institucional + Painel administrativo + Portal do Cliente da **NetCell Informática**,
no mesmo domínio. **Vite + React + Supabase** — build 100% estático.

## Duas entradas num projeto só

| Arquivo | O que é | Rota |
|---|---|---|
| `index.html` | Página de vendas (estática, sem React) — cópia da landing institucional | `/` |
| `app.html`   | Shell do React (login, painel, portal) | `/login`, `/admin/*`, `/portal/*` |

O `.htaccess` (em `public/`) serve `index.html`/`app.html` diretamente quando
pedidos por nome, e manda qualquer outra rota (que não é arquivo real) pro
`app.html`, onde o React Router assume.

> Editou a página de vendas? É `index.html` na raiz — mesmo arquivo/estilo do
> repositório `netcell-site` (`apps/site/index.html`). Mantenha os dois em sincronia
> ao editar um dos dois, ou centralize num só no futuro.

## Rodar

```bash
npm install
cp .env.example .env     # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev              # abre http://localhost:3000/app.html (o painel)
```

Em dev, `http://localhost:3000/` mostra a página de vendas; o painel é em `/app.html`
(o `.htaccess` só existe em produção/Apache — o dev server do Vite não reescreve rotas).

## Build

```bash
npm run build            # gera ./dist  (é isso que sobe no Hostinger)
```

## Deploy (Hostinger — Git)

Framework **Vite** · Build `npm install && npm run build` · Output `dist` ·
Variáveis: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Banco

O schema, as migrations e o seed ficam no repositório do site
(`netcell-site` → `packages/db` e `supabase/`). Este repositório é só o front-end.

Login inicial: `admin@netcellinformatica.com.br`.
