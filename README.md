# 🐿️ Esquilo Invest - Monorepo

Bem-vindo ao monorepo do **Esquilo Invest**, uma plataforma completa de consolidação de carteira, diagnóstico de risco e inteligência financeira.

## 🏗️ Arquitetura e Estrutura

O projeto utiliza **npm workspaces** e é focado no ecossistema **Cloudflare-native** (Workers, Pages, D1, R2).

```
Esquilo Invest/
├── 📱 apps/
│   ├── web/           # Frontend React + Vite (Cloudflare Pages)
│   └── api/           # Gateway API (Cloudflare Workers)
├── 🧠 servicos/       # Lógica de domínio modular (reutilizável)
│   ├── autenticacao/  # Gestão de usuários e sessões
│   ├── carteira/      # Gestão de ativos e cotações
│   ├── importacao/    # Motores de parse e normalização de dados
│   ├── insights/      # Motor de score e análises preditivas
│   └── ...            # Outros módulos de domínio
├── 📦 pacotes/        # Bibliotecas compartilhadas
│   ├── contratos/     # Tipos e interfaces comuns (Single Source of Truth)
│   ├── validacao/     # Schemas de validação (Zod)
│   └── utilitarios/   # Helpers transversais
└── 🗄️ banco/          # Migrations SQL e scripts D1
```

## 🚀 Como Iniciar (Desenvolvimento)

### Pré-requisitos
- **Node.js 18+**
- **npm v9+**
- **Wrangler CLI** (`npm install -g wrangler`)

### Instalação
Na raiz do projeto:
```bash
npm install
```

### Rodar a Aplicação
Você pode rodar apenas o frontend ou ambos (API + Web):

**Opção 1 (Recomendada - Tudo junto):**
```bash
npm run dev:all
```
*   Web: `http://localhost:3000`
*   API: `http://localhost:8787` (ou porta configurada no wrangler)

**Opção 2 (Apenas Web):**
```bash
npm run dev
```

**Opção 3 (Apenas API):**
```bash
npm run dev:api
```

## 🛠️ Scripts Principais

| Comando | Descrição |
|---------|-----------|
| `npm run dev:all` | Inicia Frontend e API simultaneamente |
| `npm run build` | Build de todos os workspaces |
| `npm run typecheck` | Verifica tipos em todo o monorepo |
| `npm run deploy:api` | Deploy da API para Cloudflare Workers |
| `npm run deploy:web` | Build e Deploy do Frontend para Cloudflare Pages |

## 📖 Documentação Detalhada

- ⚡ **[SETUP_RAPIDO.md](./SETUP_RAPIDO.md)**: Setup em 2 minutos para desenvolvedores.
- 📖 **[AMBIENTE_LOCAL.md](./AMBIENTE_LOCAL.md)**: Guia completo de configuração e troubleshooting.
- 🏗️ **[docs/arquitetura/](./docs/arquitetura/)**: Detalhes técnicos da infraestrutura.
- 🎨 **[docs/marca/](./docs/marca/)**: Design System e Identidade Visual.

---

**Versão:** 0.1.0  
**Status:** Desenvolvimento Ativo 🛠️
