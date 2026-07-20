# EI Raiz

Monorepo Cloudflare-native da nova arquitetura do Esquilo Invest, voltado à consolidação de carteira, diagnóstico de risco e inteligência financeira.

## Arquitetura

O projeto utiliza npm workspaces e separa aplicação, domínio, contratos compartilhados e persistência.

```text
apps/
  web/             Frontend React + Vite
  api/             API em Cloudflare Workers
servicos/          Regras de domínio reutilizáveis
pacotes/           Contratos, validações e utilitários
banco/             Migrations e scripts para D1
docs/              Arquitetura, produto e identidade visual
```

## Pré-requisitos

- Node.js 18 ou superior
- npm 9 ou superior
- Wrangler CLI

## Desenvolvimento local

```bash
npm install
npm run dev:all
```

Serviços esperados:

- Web: `http://localhost:3000`
- API: `http://localhost:8787`

Também é possível executar os ambientes separadamente:

```bash
npm run dev
npm run dev:api
```

## Scripts principais

| Comando | Finalidade |
|---|---|
| `npm run dev:all` | Inicia web e API |
| `npm run build` | Gera os builds dos workspaces |
| `npm run typecheck` | Valida os tipos do monorepo |
| `npm run deploy:api` | Publica a API em Workers |
| `npm run deploy:web` | Publica o frontend em Pages |

## Documentação

- `SETUP_RAPIDO.md`: configuração inicial
- `AMBIENTE_LOCAL.md`: ambiente local e troubleshooting
- `docs/arquitetura/`: decisões e fluxos técnicos
- `docs/marca/`: identidade visual e design system

## Regras de manutenção

- Contratos compartilhados devem permanecer em `pacotes/`.
- Regras de domínio não devem ser duplicadas entre web e API.
- Mudanças em banco precisam incluir migration versionada.
- Documentação que não representa o código atual deve ser atualizada ou arquivada.

## Status

Arquitetura em desenvolvimento ativo. Versão de referência: `0.1.0`.