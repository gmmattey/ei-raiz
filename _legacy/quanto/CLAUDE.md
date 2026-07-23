# Quanto

> "Quanto voce tem, de fato."

PWA de consolidacao de patrimonio. Multi-user ready (auth via email/senha + JWT). Substitui o Esquilo Invest — que ficou grande demais e cheio de falhas. O Quanto faz uma coisa bem: mostrar o numero total do patrimonio.

## Escopo

**Faz:**
- Consolida ativos reais (XP, Itau/ION, Onze) em um numero
- Cotacao automatica de acoes/FIIs da B3 via BRAPI
- Cotacao automatica de fundos de investimento via CVM (dados abertos)
- Saldo manual para previdencia, cofrinhos e poupanca
- CRUD completo de ativos (adicionar, editar, atualizar saldo, soft delete)
- Indicador de frescor por instituicao (quando cada manual foi atualizado)
- Snapshot mensal automatico (cron dia 1)
- Import de planilha XLSX (wizard: upload → parse → revisao → confirmar)
- Multi-user com JWT da aplicacao (user_id em todas as tabelas, sem dependencia de auth externa)
- Ocultar valores (privacidade em publico)
- Dark mode (segue preferencia do sistema)

**NAO faz (anti-escopo):**
- Login social e auth externa adicional (o app ja tem login/register/recover por conta propria)
- Proventos, dividendos, IR, come-cotas, preco medio
- Metas, rebalanceamento, recomendacoes
- Open Finance / B3 / CEI (import e via planilha XLSX, nao API)
- Notificacoes push
- Simuladores de decisao
- chatbot generalista como superficie principal de produto

## Stack (custo R$ 0)

| Camada | Escolha |
|---|---|
| Backend | Cloudflare Workers + Hono |
| Banco | D1 (SQLite) — schema vivo com `users`, `assets`, `quotes_cache`, `cvm_funds_cache`, `snapshots`, `asset_contributions`, `goods`, `macro_cache`, `asset_lifecycle_events`, `operation_logs` e views |
| Frontend | Vanilla JS + CSS (sem framework) via Workers Assets, com `apps/web` ativo e `public/` preservado como legado |
| Cotacoes | BRAPI (brapi.dev) — cache D1 15 min |
| Auth | Email/senha + JWT HS256 — user_id via Authorization Bearer |
| Import | XLSX via SheetJS (lazy loaded) — wizard 3 etapas |
| PWA | manifest.json + Service Worker (offline com ultimo estado) |
| Deploy | `wrangler deploy` — Worker unico com assets |

## Telas ativas

1. **Hoje** — numero-tese gigante, ganho sobre aplicado, card de frescor, alocacao por instituicao/classe
2. **Carteira** — lista agrupada, filtros, resgates e acesso ao detalhe
3. **Detalhe** — grafico, aportes, lifecycle, analise contextual e edicao minima
4. **Historico** — grafico/lista mensal
5. **Importar** — wizard 3 etapas: upload XLSX → revisao com badges → confirmar
6. **Bens** — leitura, criacao, edicao e arquivamento

## Banco D1

- `users`
- `assets`
- `quotes_cache`
- `cvm_funds_cache`
- `snapshots`
- `asset_contributions`
- `goods`
- `macro_cache`
- `asset_lifecycle_events`
- `operation_logs`

## API (Hono)

- `GET /api/portfolio` — resumo completo com frescor e alocacao
- `GET /api/assets/:id/detail` — leitura profunda do ativo
- `GET /api/assets/:id/history` — serie do ativo com degradacao segura
- `POST /api/assets` — criar ativo
- `PUT /api/assets/:id` — editar ativo ou atualizar saldo
- `DELETE /api/assets/:id` — soft delete (status=archived)
- `POST /api/assets/:id/contributions` — registrar aporte
- `GET /api/assets/:id/contributions` — listar aportes
- `DELETE /api/contributions/:id` — remover aporte
- `POST /api/assets/:id/start-exit` — iniciar fluxo de saida
- `POST /api/assets/:id/cancel-exit` — cancelar fluxo de saida
- `POST /api/assets/:id/sale` — concluir venda
- `GET /api/history` — snapshots mensais
- `POST /api/snapshot` — upsert snapshot (debug/admin)
- `POST /api/import` — processar itens confirmados do import XLSX
- `POST /api/import/analyze` — classificacao degradavel via AI
- `GET /api/goods` / `POST /api/goods` / `PUT /api/goods/:id` / `DELETE /api/goods/:id` — bens
- `POST /api/ai/analyze` — analise contextual
- `GET /api/funds/search?q=` — busca de fundos CVM por nome (autocomplete)
- `GET /api/health` — healthcheck

Middleware: extrai `user_id` do header `Authorization: Bearer <jwt>`. Cria user no primeiro acesso via `POST /api/auth/register`.

## Convencoes

- Frontend: Vanilla JS + CSS, sem framework, sem build
- Fontes: Archivo 700/800 (titulos) + Inter 400-700 (corpo), self-hosted woff2
- Cores: --ink #16242F, --paper #FBFCFD, --petro #2A5A66, --verde #1F7A4D, --vinho #C2335B, --amber #B7791F
- API em ingles: `/api/portfolio`, `/api/assets`
- Banco em ingles: `assets`, `quotes_cache`, `snapshots`
- Responsivo mobile-first (PWA instalavel Android)

## Documentacao

- `docs/SPEC_CVM_PIPELINE.md` — spec pipeline CVM: cotacoes automaticas de fundos (RN-99 a RN-115, arquitetura, stream-parse ZIP)
- `docs/SPEC_FUNCIONAL_v1.md` — spec funcional vigente v1.3 (98 RNs, donut chart, barra empilhada, filtros, sub-agrupamento)
- `docs/QUANTO_SPEC_v4.md` — spec tecnica vigente v4 (derivada da funcional v1.3, donut, sub-agrupamento, localStorage, institution_name)
- `docs/api-spec.yaml` — OpenAPI 3.0 dos 7 endpoints (derivada da spec tecnica v4)
- `schema.sql` + `migrations/` — inventario vivo do schema e das views
- `docs/quanto-mockup-v5.html` — mockup interativo v5 alinhado com spec v1.3 (donut chart, barra empilhada, sub-agrupamento, filtros, 98 RNs)
- `docs/QUANTO_SPEC_v3.md` — spec tecnica v3 (referencia historica)
- `docs/QUANTO_SPEC_v2.md` — spec tecnica v2 (referencia historica)
- `docs/quanto-mockup-v4.html` — mockup v4 (referencia)
- `docs/quanto-mockup-v3.html` — mockup v3 (referencia)
- `docs/branding/` — icones, wordmark, SVGs da marca
- `docs/ei-raiz-mapeamento.html` — mapeamento do Esquilo Invest (referencia do que existia)
- `docs/AUDITORIA_MIGRACAO_QUANTO.md` — auditoria de migracao (codigo e infra)
- `docs/AUDITORIA_FUNCIONAL_ESQUILO.md` — auditoria funcional (features e reuso)
- `docs/QA_REPORT_2026-06-16.md` — relatorio de QA com cobertura, resultados e riscos residuais

## Origem: Esquilo Invest

O codigo do Esquilo Invest esta em `_audit/ei-raiz/` (clone do GitHub) e pode ser reaproveitado onde fizer sentido.
O Esquilo tinha 22 telas, 36 endpoints, 26 tabelas — complexidade que causou falhas.
O Quanto reduziu a superficie do Esquilo, mas hoje ja opera com shell novo ativo, backend monolitico modularizado e cobertura funcional bem acima do bootstrap inicial.

### Codigo reaproveitavel do Esquilo (~1.400 linhas)

- Views SQL: vw_patrimonio_resumo, vw_patrimonio_alocacao, vw_patrimonio_posicoes
- Cron jobs: cotacoes BRAPI, snapshot mensal
- Backend: CRUD com dynamic SET builder, D1 wrapper
- Frontend: formatadores BRL/data/%, cache localStorage+TTL, grafico SVG evolucao
- Import: parser XLSX (6 parsers por tipo), template estilizado, wizard 3 etapas
- Cross-cutting: ocultar valores, dark mode, consolidacao de ativos

## Fleet legado

`fleet.json` permanece no repo apenas como artefato historico e consultivo.

No workflow padrao do Codex:

- a thread atual conduz a execucao
- a documentacao de trabalho deve ficar em `docs/` e, para a fusao, em `docs/fusao/`
- `fleet.json` so deve ser atualizado se o usuario pedir explicitamente compatibilidade com o painel Fleet antigo

## QA — Definicao de Pronto

QA nao e etapa opcional. Para qualquer mudança de produto, API ou UI:

- Atualize ou crie testes automatizados em `tests/` antes de considerar a entrega concluida.
- Para cada implementacao nova ou bug corrigido, atualize tambem a planilha/base de testes em `docs/TEST_PLAN.md` e, quando aplicavel, a planilha XLSX de referencia do projeto.
- Rode `npm run typecheck` e `npm test` antes de entregar.
- Se houver comportamento visual, valide no navegador com Playwright.
- Registre o resultado em `docs/QA_REPORT_2026-06-16.md` ou crie um novo relatorio datado quando o escopo mudar.
- Se a mudanca alterar fluxo, contrato de API, auth ou importacao, cubra o caso feliz e ao menos um negativo.
- Nao trate QA como pós-escrito: se a feature nao tem teste, ela ainda nao esta pronta.
