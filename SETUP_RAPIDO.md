# ⚡ Setup Rápido - Monorepo

## 🚀 Requisitos Iniciais
- **Node.js 18+**
- **npm v9+**
- **Wrangler CLI** (`npm i -g wrangler`)

## 🚀 Passo a Passo

```bash
# 1. Clone/extraia o projeto
cd "Esquilo Invest"

# 2. Instale dependências da raiz
npm install

# 3. Prepare o banco local (SQLite via D1)
cd apps/api
wrangler d1 migrations apply ei-raiz --local
wrangler d1 execute ei-raiz --local --file ../../banco/seed.sql

# 4. Volte para a raiz e inicie TUDO
cd ../..
npm run dev:all
```

## 🌐 Acesso
- **Frontend**: http://localhost:3000 ✅
- **API**: http://localhost:8787 ✅

---

## ❓ Dúvidas Rápidas

- **Porta 3000 ocupada?** → O Vite tentará a próxima.
- **Porta 8787 ocupada?** → Mude o `wrangler.toml` da `apps/api`.
- **Erro de types?** → Tente `npm run typecheck` na raiz.
- **Deseja rodar apenas o web?** → `npm run dev` na raiz.

---

**Agora você tem a arquitetura monorepo rodando localmente! 🎉**
