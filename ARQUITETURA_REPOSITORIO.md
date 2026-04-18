# Arquitetura do Repositório — Esquilo Invest

## Estrutura Normalizada em Português

Este documento descreve a nova estrutura do repositório após reorganização de 2026-04-18.

```
esquilo-invest/
│
├── apresentacao/                    # Frontend — Aplicação Web (React + Vite)
│   ├── src/
│   │   ├── features/               # Funcionalidades por domínio
│   │   ├── components/             # Componentes reutilizáveis
│   │   ├── hooks/                  # Custom hooks
│   │   ├── context/                # Contexto React
│   │   ├── services/               # Chamadas à API
│   │   ├── utils/                  # Funções utilitárias
│   │   ├── types/                  # Tipos TypeScript
│   │   ├── styles/                 # Estilos CSS/Tailwind
│   │   ├── app/                    # Layout, routing, providers
│   │   └── index.tsx
│   ├── public/                     # Assets estáticos
│   ├── package.json                # @ei/web
│   ├── wrangler.toml               # Configuração Cloudflare Pages
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── servidores/                      # Backend — Servidores e APIs
│   │
│   ├── porta-entrada/              # API Gateway (Cloudflare Workers)
│   │   ├── src/
│   │   │   ├── gateway/            # Roteamento principal
│   │   │   ├── handlers/           # Request handlers
│   │   │   ├── middleware/         # Middleware de autenticação, validação
│   │   │   ├── router/             # Definição de rotas
│   │   │   ├── server/
│   │   │   │   ├── services/       # Orquestração de serviços
│   │   │   │   ├── mappers/        # Transformação de dados
│   │   │   │   ├── jobs/           # Jobs agendados (crons)
│   │   │   │   └── providers/      # Provedores de instâncias
│   │   │   └── utils/              # Utilitários
│   │   ├── package.json            # @ei/api
│   │   ├── wrangler.toml           # Configuração Cloudflare Workers + D1
│   │   └── tsconfig.json
│   │
│   └── modulos-backend/            # Serviços de Negócio (Microserviços)
│       │
│       ├── autenticacao/           # Serviço de autenticação
│       │   ├── src/
│       │   ├── testes/
│       │   └── package.json        # @ei/servico-autenticacao
│       │
│       ├── carteira/               # Serviço de portfolio/carteira
│       │   └── ...
│       │
│       ├── decisoes/               # Serviço de simuladores e decisões
│       │   └── ...
│       │
│       ├── historico/              # Serviço de histórico e snapshots
│       │   └── ...
│       │
│       ├── importacao/             # Serviço de importação de dados
│       │   └── ...
│       │
│       ├── insights/               # Serviço de análises e insights
│       │   └── ...
│       │
│       └── perfil/                 # Serviço de perfil do usuário
│           └── ...
│
├── bibliotecas/                    # Pacotes Compartilhados (Monorepo Libraries)
│   │
│   ├── contratos/                  # Tipos, interfaces e contracts
│   │   ├── src/
│   │   ├── package.json            # @ei/contratos
│   │   └── tsconfig.json
│   │
│   ├── utilitarios/                # Funções reutilizáveis (utils)
│   │   ├── src/
│   │   └── package.json            # @ei/utilitarios
│   │
│   └── validacao/                  # Schemas de validação (Zod)
│       ├── src/
│       └── package.json            # @ei/validacao
│
├── infra/                          # Infraestrutura e Banco de Dados
│   │
│   ├── banco/                      # Database (Cloudflare D1)
│   │   ├── migrations/             # Scripts de migração SQL
│   │   └── seed/                   # Dados de seed para desenvolvimento
│   │
│   ├── docker-compose.yml          # Stack local (desenvolvimento)
│   └── .env.example                # Variáveis de ambiente modelo
│
├── testes/                         # Testes Automatizados
│   │
│   ├── e2e/                        # Testes end-to-end (Playwright)
│   ├── integracao/                 # Testes de integração
│   └── massa-dados/                # Dados para testes
│       └── csv/
│
├── documentacao/                   # Documentação do Projeto
│   │
│   ├── arquitetura/                # Docs arquitetônicos
│   ├── marca/                      # Guia de branding
│   ├── produto/                    # Especificações de produto
│   ├── prompts/                    # Prompts para IA
│   ├── qa/                         # Planos de QA/testes
│   ├── triagem/                    # Triagem e análises
│   ├── mobile-wireframes.md        # Especificação mobile (NOVO)
│   ├── README.md
│   └── ...
│
├── midia/                          # Brand Assets e Recursos
│   │
│   ├── marca/                      # Logo e identidade visual
│   ├── fontes/                     # Arquivos de fontes
│   ├── icones/                     # Ícones da marca
│   ├── imagens/                    # Imagens gerais
│   └── documentos/                 # Documentos PDF, etc
│
├── utilitarios/                    # Scripts e Ferramentas
│   │
│   ├── scripts/                    # Scripts de deploy, setup, etc
│   │   ├── setup.sh                # Setup inicial do ambiente
│   │   └── ...
│   │
│   ├── dev/                        # Configurações de desenvolvimento
│   │   └── ...
│   │
│   └── iniciar-ambiente-teste.bat  # Script Windows (dev)
│
├── package.json                    # Monorepo root config
├── package-lock.json               # Lockfile
├── tsconfig.json                   # TypeScript config compartilhado
├── .gitignore
├── README.md                       # Documentação principal
├── Makefile                        # Comandos úteis
└── .github/
    └── workflows/                  # GitHub Actions (CI/CD)
```

---

## Mapeamento de Mudanças (Antiga → Nova)

| Antiga | Nova | Descrição |
|--------|------|-----------|
| `apps/web` | `apresentacao/` | Frontend React |
| `apps/api` | `servidores/porta-entrada/` | API Gateway (Cloudflare) |
| `servicos/*` | `servidores/modulos-backend/*` | Microserviços de negócio |
| `pacotes/*` | `bibliotecas/*` | Pacotes compartilhados |
| `banco/` | `infra/banco/` | Database migrations e seed |
| `docs/` | `documentacao/` | Documentação do projeto |
| `assets/` | `midia/` | Brand assets e imagens |
| `scripts/` | `utilitarios/scripts/` | Scripts utilitários |
| `dev/` | `utilitarios/dev/` | Config de desenvolvimento |
| `tests/` | `testes/` | Suites de teste |

---

## Workspaces NPM

O repositório é um **monorepo** com workspaces npm. Cada workspace tem sua própria `package.json`:

### Workspaces de Aplicação
- `apresentacao` → `@ei/web` — Frontend
- `servidores/porta-entrada` → `@ei/api` — API Gateway

### Workspaces de Serviço
- `servidores/modulos-backend/autenticacao` → `@ei/servico-autenticacao`
- `servidores/modulos-backend/carteira` → `@ei/servico-carteira`
- `servidores/modulos-backend/decisoes` → `@ei/servico-decisoes`
- `servidores/modulos-backend/historico` → `@ei/servico-historico`
- `servidores/modulos-backend/importacao` → `@ei/servico-importacao`
- `servidores/modulos-backend/insights` → `@ei/servico-insights`
- `servidores/modulos-backend/perfil` → `@ei/servico-perfil`

### Workspaces de Biblioteca
- `bibliotecas/contratos` → `@ei/contratos`
- `bibliotecas/utilitarios` → `@ei/utilitarios`
- `bibliotecas/validacao` → `@ei/validacao`

---

## Scripts Disponíveis

Na raiz do repositório:

```bash
# Desenvolvimento
npm run dev              # Inicia frontend (apresentacao)
npm run dev:api         # Inicia API (porta-entrada)
npm run dev:all         # Inicia ambos em paralelo

# Build
npm run build           # Build todos os workspaces
npm run typecheck       # Type check em todos

# Deploy
npm run deploy:api      # Deploy da API (Cloudflare Workers)
npm run deploy:web      # Build + Deploy do frontend (Cloudflare Pages)
```

---

## Variáveis de Ambiente

### `infra/.env.example`
Modelo de variáveis. Copie para `.env` local e configure:

```
VITE_API_BASE_URL=https://ei-api-gateway.giammattey-luiz.workers.dev
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
```

---

## Resolução de Imports

### Imports locais (mesmo workspace)
```typescript
import { Component } from '../components/Component';
import { useHook } from '@/hooks/useHook';  // Alias @/
```

### Imports de bibliotecas compartilhadas
```typescript
import { ContractType } from '@ei/contratos';
import { validarEmail } from '@ei/validacao';
import { formatData } from '@ei/utilitarios';
```

### Imports de serviços (apenas na porta-entrada)
```typescript
import { ServicoCarteira } from '@ei/servico-carteira';
import { ServicoInsights } from '@ei/servico-insights';
```

---

## Guia de Localizando Arquivos

### "Onde está o componente X?"
→ `apresentacao/src/components/`

### "Onde está o hook X?"
→ `apresentacao/src/hooks/`

### "Onde está a funcionalidade X (feature)?"
→ `apresentacao/src/features/{feature-name}/`

### "Onde estão os tipos compartilhados?"
→ `bibliotecas/contratos/src/`

### "Onde está o serviço de carteira?"
→ `servidores/modulos-backend/carteira/src/`

### "Onde está a API Gateway?"
→ `servidores/porta-entrada/src/`

### "Onde estão as migrations de banco?"
→ `infra/banco/migrations/`

### "Onde está a documentação?"
→ `documentacao/`

### "Onde estão as imagens e assets?"
→ `midia/`

---

## Configuração do Ambiente Local

```bash
# 1. Clonar repositório
git clone <repo>
cd esquilo-invest

# 2. Instalar dependências
npm install

# 3. Setup do banco de dados
docker-compose -f infra/docker-compose.yml up -d

# 4. Iniciar desenvolvimento
npm run dev:all
```

---

## Deployheck

- **Frontend**: Cloudflare Pages (automatizado via push para `master`)
  - URL: `https://ei-raiz-web.pages.dev/`

- **Backend**: Cloudflare Workers (manualmente ou via CI/CD)
  - URL: `https://ei-api-gateway.giammattey-luiz.workers.dev/`

- **Database**: Cloudflare D1 (migrations via wrangler)

---

## Notas Importantes

1. **Não há pastas antigas**: `apps/`, `servicos/`, `pacotes/`, `banco/`, `docs/`, `assets/`, `scripts/`, `dev/`, `tests/` foram consolidadas na nova estrutura.

2. **node_modules symlinks**: Os workspaces são linkados automaticamente no `node_modules/@ei/`.

3. **TypeScript**: Cada workspace tem seu `tsconfig.json` com refs compartilhados.

4. **Lixo removido**:
   - `.continue/`
   - `dashboard.txt`
   - `RULES_ENGINE_*.md`
   - Temporários (tmp-*.png)

5. **Build funciona**:
   - `npm run build` compila apresentacao (Vite) + porta-entrada (Wrangler)
   - Modulos-backend são compilados conforme referenciados

---

**Última atualização**: 2026-04-18
**Versão**: 1.0 (Reorganização Completa)
