# 🚀 Esquilo Invest - Guia do Ambiente Local (Monorepo)

Bem-vindo! Este documento explica como rodar a aplicação Esquilo Invest em seu computador com a arquitetura de **Monorepo**.

---

## 🏗️ Estrutura do Monorepo

O projeto está dividido em workspaces (npm):

1. **`apps/web`**: Frontend React + Vite + Tailwind.
2. **`apps/api`**: Gateway API em Cloudflare Worker.
3. **`servicos/*`**: Lógica de negócio modularizada.
4. **`pacotes/*`**: Contratos e utilitários compartilhados.

---

## 📋 Pré-requisitos

- **Node.js** 18.0.0+ ([Download](https://nodejs.org/))
- **npm** v9.0.0+ (incluso no Node.js)
- **Wrangler CLI** para emular Cloudflare localmente:
  ```bash
  npm install -g wrangler
  ```

---

## 🎯 Iniciação Rápida

### 1. Instalar Tudo
Na raiz do projeto:
```bash
npm install
```

### 2. Preparar Banco Local (D1/SQLite)
O projeto usa Cloudflare D1. Para rodar localmente:
```bash
cd apps/api
wrangler d1 migrations apply ei-raiz --local
wrangler d1 execute ei-raiz --local --file ../../banco/seed.sql
cd ../..
```

### 3. Rodar Tudo (Recomendado)
Para iniciar o **Frontend (3000)** e a **API (8787)** ao mesmo tempo:
```bash
npm run dev:all
```

Acesse: **http://localhost:3000**

---

## 🔧 Scripts Úteis (Raiz)

| Comando | Função |
|---------|--------|
| `npm run dev` | Inicia apenas o Frontend |
| `npm run dev:api` | Inicia apenas a API |
| `npm run dev:all` | Inicia ambos (Frontend + API) |
| `npm run build` | Faz build de todos os projetos |
| `npm run typecheck`| Verifica tipos (TypeScript) |

---

## 📍 Portas e URLs

| Serviço | URL Local | Porta |
|---------|-----------|-------|
| Frontend (Vite) | `http://localhost:3000` | 3000 |
| API (Wrangler) | `http://localhost:8787` | 8787 |

---

## ⚙️ Variáveis de Ambiente

### Frontend (`apps/web/.env.local`)
```env
VITE_API_URL=http://localhost:8787
VITE_APP_NAME=Esquilo Invest
```

### API (`apps/api/.dev.vars`)
Copie do `.dev.vars.example`:
```bash
cp apps/api/.dev.vars.example apps/api/.dev.vars
```

---

## 📁 Arquitetura de Pastas

```
Esquilo Invest/
├── apps/
│   ├── web/                 # React (Vite)
│   └── api/                 # Workers (Gateway)
├── servicos/                # Domínio modular
│   ├── autenticacao/
│   ├── carteira/
│   └── insights/
├── pacotes/                 # Compartilhados
│   ├── contratos/           # Types/Interfaces
│   └── validacao/           # Schemas (Zod)
├── banco/                   # SQL/Migrations
├── package.json             # Workspaces config
└── README.md                # Visão geral
```

---

## 🐛 Solução de Problemas

### Erro "Workspaces not found"
Certifique-se que você rodou `npm install` na **raiz** do projeto, e não apenas dentro de um app.

### API não responde (CORS)
O frontend em `localhost:3000` faz requisições para `localhost:8787`. O Worker da API já está configurado para aceitar CORS em modo dev, mas verifique se o script `dev:api` está rodando.

### Banco de Dados não existe
Se receber erros SQL, refaça as migrations:
```bash
cd apps/api
wrangler d1 migrations apply ei-raiz --local
```

---

## 📊 Monitoramento Local

### Logs da API (Worker)
Os logs do worker aparecem no terminal onde rodou `npm run dev:api` ou `npm run dev:all`.

### Logs do Frontend
Console do navegador (F12).

---

## ship Build para Produção

### Localmente
```bash
npm run build
```

### Deploy Cloudflare
Consulte **[docs/arquitetura/deploy-cloudflare.md](./docs/arquitetura/deploy-cloudflare.md)** para o passo a passo completo.

---

**Versão:** 1.1.0 (Monorepo)  
**Data:** 2026-04-11  
**Status:** Atualizado para Monorepo ✅
