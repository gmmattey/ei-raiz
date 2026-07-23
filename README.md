# Esquilo Wallet

Monorepo Cloudflare-native da plataforma de consolidação de patrimônio, diagnóstico de risco e
inteligência financeira para investidores brasileiros. Roda em **Cloudflare Workers + D1 (SQLite)
+ Pages**.

## Status

Produção ativa. Versão de referência: `0.1.0`.

- **Web:** https://esquilo.wallet (produção) — build também publicado em https://ei-raiz-web.pages.dev
- **API:** https://ei-api-gateway.giammattey-luiz.workers.dev

### Pendências operacionais conhecidas (2026-07-23)

- Ingestão diária de fundos CVM (`.github/workflows/ingest-cvm.yml`) está com o `schedule`
  desativado — o secret `EI_ADMIN_TOKEN` expirou. Reexecução manual via `workflow_dispatch`
  continua disponível.
- Os 3 cron triggers do Worker (`servidores/porta-entrada/wrangler.toml`) foram removidos
  temporariamente — a conta Cloudflare atingiu o limite de 5 cron triggers. Cotações de mercado,
  consolidação de histórico mensal e a fila de reconstrução de patrimônio não rodam agendadas até
  liberar espaço de cron na conta e reativar.

## Arquitetura

O projeto usa npm workspaces e separa aplicação, domínio, contratos compartilhados e persistência.

```text
apresentacao/          Frontend React + Vite → Cloudflare Pages
servidores/
  porta-entrada/        Backend Cloudflare Worker (API Gateway)
bibliotecas/
  contratos/             Tipos TypeScript compartilhados (DTOs)
  utilitarios/           Funções utilitárias internas
  validacao/             Schemas de validação
infra/
  banco/                 Migrations e seed do D1
utilitarios/
  scripts/               Scripts de operação (ingestão CVM, backfill, reset)
testes/                 Testes e2e + massa de importação
documentacao/           Arquitetura, produto e identidade visual
midia/                  Assets visuais (logos, ícones, fontes)
_legacy/                Gerações anteriores e protótipos relacionados — histórico, não executa
                        (ver _legacy/README.md)
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
| `npm run test:api` | Roda os testes do backend |
| `npm run ingest:cvm` | Ingestão de fundos CVM |
| `npm run backfill:cvm-monthly` | Backfill de histórico mensal CVM |

## Deploy

Automático via GitHub Actions (`.github/workflows/deploy.yml`) a cada push em `master`:
typecheck → build e deploy do frontend (Cloudflare Pages) → deploy do Worker (backend).

## Documentação

- `documentacao/arquitetura/`: decisões e fluxos técnicos
- `documentacao/produto/`: especificação de produto
- `documentacao/marca/`: identidade visual e design system
- `_legacy/README.md`: origem e papel de cada geração anterior consolidada aqui

## Regras de manutenção

- Contratos compartilhados devem permanecer em `bibliotecas/contratos/`.
- Regras de domínio não devem ser duplicadas entre web e API.
- Mudanças em banco precisam incluir migration versionada em `infra/banco/migrations/`.
- Documentação que não representa o código atual deve ser atualizada ou arquivada.
- Nada em `_legacy/` deve ser importado pelo código ativo do monorepo.

## Licença

Não definida.
