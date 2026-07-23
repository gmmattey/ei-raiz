# Quanto — Agentes e Skills

> Referencia local de especializacao do projeto. O workflow principal agora e o padrao do Codex: a thread atual orquestra o trabalho, e estes agentes funcionam como lentes de contexto para partes especificas do repo.

## Agentes

| Agente | Papel | Arquivos principais |
|--------|-------|---------------------|
| **Renata** | Escopo, priorizacao e docs de fusao | `docs/`, `docs/fusao/` |
| **Thiago** | Arquitetura alvo e guardrails tecnicos | `src/`, `schema.sql`, `wrangler.toml`, `apps/`, `packages/` |
| **Carlos** | Backend, schema e migracao de runtime | `src/index.ts`, `src/auth.ts`, `migrations/`, `apps/core-api`, `apps/ingestion-plane` |
| **Marina** | Frontend, telas e migracao de UX | `apps/web`, `public/`, `packages/ui` |
| **Beatriz** | Design-system, branding, import e CVM | `src/cvm.ts`, `docs/branding/`, `docs/`, `packages/ui` |
| **Gabriel** | Migracao de dados e reconciliacao | `schema.sql`, `migrations/`, `src/cvm.ts`, `docs/fusao/` |
| **Pedro** | QA, regressao e paridade de migracao | `tests/`, `docs/TEST_PLAN.md`, `docs/QA_REPORT_*.md` |

## Árvore de decisão — qual agente usar?

```
Tarefa chega
│
├── Escopo, trade-off, prioridade, fusao?
│   └── Renata
│
├── Arquitetura, contratos, estrutura do repo?
│   └── Thiago
│
├── Backend, auth, schema, migration, cron, ingestion?
│   └── Carlos
│
├── Frontend, tela, componente, PWA, responsividade?
│   └── Marina
│
├── Branding, design-system, import, CVM, UX de dados?
│   └── Beatriz
│
├── Migracao de dados, reconciliacao, compatibilidade?
│   └── Gabriel
│
└── Teste, regressao, smoke, paridade funcional?
    └── Pedro
```

## Como usar no Codex

O Codex orquestra o trabalho na thread atual. Use estes agentes para:

- decidir qual perspectiva usar ao analisar um problema
- orientar subtrilhas de implementacao
- revisar se a mudanca cobre escopo, arquitetura, UI, dados ou QA
- tratar `docs/branding/brand-spec.md` e `docs/branding/index.html` como fonte canonica do brand do frontend

## Handoffs recomendados

```text
Renata define recorte
  -> Thiago fecha arquitetura
  -> Carlos implementa backend
  -> Marina implementa frontend
  -> Gabriel valida migracao de dados
  -> Pedro fecha regressao
```

```text
Beatriz define direcao visual e de import
  -> Marina aplica nas telas
  -> Carlos/Gabriel alinham contratos e reconciliacao
  -> Pedro valida paridade
```

## Skills disponíveis

| Skill | Quando usar |
|-------|-------------|
| `/board-update` | Apenas se o usuario pedir para sincronizar o legado `fleet.json` |
| `/deploy` | Quando o codigo estiver pronto para publicar |
| `/write-spec` | Para adicionar ou modificar specs e docs de fusao |
| `/smoke-test` | Apos feature ou antes de deploy |
| `/code-review` | Review de diff no branch atual |
| `/map-existing` | Mapear o estado atual do repo e o que veio do Esquilo |
| `/update-fusion-docs` | Manter `docs/fusao/` como fonte de verdade leve |

## Escopo & Anti-escopo

**Faz (atualizado 2026-06-19):**
- Consolida ativos (ações, FIIs, fundos CVM, renda fixa, previdência, cofrinhos)
- Cotação automática B3/CVM, cache D1 15min
- Import XLSX com wizard 3 etapas + Smart Import AI
- Auth email+senha (PBKDF2 + JWT)
- Bens e Garantias (FGTS, Imóvel, Veículo)
- Tela Detalhe por ativo com gráfico
- Aportes por ativo com histórico
- Benchmarks CDI/SELIC/IPCA
- AI: Smart Labels, Smart Import, Análise Contextual (Workers AI)
- Dark mode, ocultar valores, PWA offline
- Brand canonico do frontend: visual financeiro premium brasileiro, monocromatico, DM Sans/DM Mono, CTA near-black e cor apenas como sinal financeiro

**Não faz (rejeitar sem discussão):**
- Login social, OAuth, 2FA via app
- Proventos, dividendos, IR, come-cotas, preço médio
- Metas, rebalanceamento, recomendações de portfólio
- Open Finance / B3 / CEI (import é via XLSX, não API)
- Notificações push
- Simuladores de decisão

## Fleet legado

`fleet.json` continua no repo como artefato historico e pode ser consultado para contexto. Ele nao e mais a fonte principal de coordenacao do projeto.

## Stack (estado atual)

| Camada | Escolha |
|--------|---------|
| Backend | Cloudflare Workers + Hono (`src/index.ts`) |
| Auth | Email+senha PBKDF2-SHA256 + JWT HS256 8h (`src/auth.ts`) |
| Banco | D1 (SQLite) — 8 tabelas + views |
| Frontend | Vanilla JS + CSS buildless com shell ativo em `apps/web` e legado preservado em `public/` |
| Cotações | BRAPI (ações/FIIs) + CVM ZIP stream (`src/cvm.ts`) |
| AI | Workers AI — Llama 1B (labels), Llama 3B (import), Qwen3 30B (análise) |
| Import | SheetJS lazy-loaded via CDN |
| PWA | manifest.json + Service Worker ativos em `apps/web`, com legado preservado em `public/` |
| Deploy | `wrangler deploy` — Worker único com assets |

## Brand canonico do frontend

Use obrigatoriamente estes arquivos como fonte de verdade visual:

- `docs/branding/brand-spec.md`
- `docs/branding/index.html`

Regras obrigatorias:

- remover o brand antigo como base visual
- migrar `--ink`, `--paper`, `--petro`, `--verde`, `--vinho`, `--amber` para os tokens novos do brand
- se algum alias temporario permanecer por compatibilidade, documentar
- priorizar as telas `Hoje`, `Carteira`, `Historico`, `Importar`
- garantir os sheets `Saldo rapido`, `Editar/remover ativo`, `Novo ativo`, `Upload/importacao XLSX`
