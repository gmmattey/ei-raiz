# Backend Inventory — Auditoria Pré-Refactor

Snapshot do backend, banco e integração frontend-backend **antes** do rebuild.
Referência fria: este inventário não será atualizado durante a execução; é o baseline de comparação no relatório final.

Data-base: 2026-04-20 (início da branch `refactor/backend-rebuild-canonical`).

---

## Stack

- **Runtime/Frameworks**: Node.js + TypeScript, Cloudflare Workers + D1 (SQLite), sem ORM.
- **Monorepo**: `servidores/porta-entrada/` (gateway), `servidores/modulos-backend/` (7 módulos locais), `bibliotecas/contratos/`, `apresentacao/` (React 18 + Vite + Tailwind).
- **Migrations**: SQL numerado em `infra/banco/migrations/`, execução aparentemente manual (sem ferramenta formal detectada).
- **HTTP no frontend**: Fetch nativo, sem axios/react-query.

---

## 1. Rotas públicas por domínio (126 rotas em 16 arquivos)

| Arquivo | Rotas | Contagem |
|---------|-------|----------|
| `servidores/porta-entrada/src/server/routes/admin.routes.ts` (1167 linhas) | admin CVM, config, auditoria, parametros | 38 |
| `servidores/porta-entrada/src/server/routes/carteira.routes.ts` | ativos, benchmark, movimentacoes, dashboard, resumo | 18 |
| `servidores/porta-entrada/src/server/routes/financial.routes.ts` | market quotes, funds, FIPE, history | 15 |
| `servidores/porta-entrada/src/server/routes/insights.routes.ts` | analises, recomendacoes, score | 14 |
| `servidores/porta-entrada/src/server/routes/auth.routes.ts` | registrar, entrar, recuperar, redefinir | 8 |
| `servidores/porta-entrada/src/server/routes/perfil.routes.ts` | dados, preferencias | 5 |
| `servidores/porta-entrada/src/server/routes/historico.routes.ts` | snapshots, reconstrucao | 5 |
| `servidores/porta-entrada/src/server/routes/posicoes.routes.ts` | CRUD posicoes_financeiras | 4 |
| `servidores/porta-entrada/src/server/routes/aportes.routes.ts` | registrar, resumo | 4 |
| `servidores/porta-entrada/src/server/routes/financial-core.routes.ts` | summary, assets, history (novo canônico) | 4 |
| `servidores/porta-entrada/src/server/routes/importacao.routes.ts` | upload, validacao | 3 |
| `servidores/porta-entrada/src/server/routes/app.routes.ts` | content, config pública | 2 |
| `servidores/porta-entrada/src/server/routes/score.routes.ts` | calculo, detalhamento | 2 |
| `servidores/porta-entrada/src/server/routes/decisoes.routes.ts` | simulacoes | 2 |
| `servidores/porta-entrada/src/server/routes/telemetria.routes.ts` | evento | 1 |
| `servidores/porta-entrada/src/server/routes/vera.routes.ts` | adapter externo | 1 |

Coexistência legada confirmada:
- `/api/carteira/*` + `/api/financial-core/*` + `/api/financial/*` (3 stacks financeiras).
- `/api/insights/score` + `/api/score/*` (2 caminhos para score).
- `/api/admin/fundos/cvm/*` + `/api/admin/cvm/*` (2 prefixes CVM).

---

## 2. Services principais (20+)

| Serviço | Propósito | Duplicação |
|---------|-----------|-----------|
| `PortfolioViewService` | carteira + cálculos agregados | **sim** — conflita com `FinancialCoreService` |
| `FinancialCoreService` | fonte canônica de patrimônio (novo) | **sim** — sobrepõe `PortfolioViewService` |
| `UnifiedScoreService` | score único oficial | — |
| `PortfolioAnalysisService` | análises técnicas | **sim** — sobrepõe `UnifiedScoreService` |
| `BenchmarkService` | comparação vs CDI | — |
| `MarketDataService` | cotações BRAPI | — |
| `FundDataService` | fundos CVM | — |
| `FipeService` | veículos | — |
| `SessionMarketService` | cache de mercado por sessão | — |
| Módulos em `modulos-backend/` (7 micro-serviços locais) | autenticacao, carteira, decisoes, historico, importacao, insights, perfil | delegação do gateway |

---

## 3. SQL cru em rotas (≈30 queries)

- `admin.routes.ts` linhas 244, 266, 271, 318, 394, 512, 523, 547 — SELECT/INSERT em `simulacoes_parametros`, `cotas_fundos_cvm`.
- `posicoes.routes.ts` linhas 30, 54, 66, 88 — CRUD `posicoes_financeiras` direto.
- `telemetria.routes.ts` — INSERT direto em `telemetria_eventos`.
- `app.routes.ts` — `obterAppConfig` inline.

Zero repositórios centralizados para essas operações no gateway (apenas dentro dos 7 módulos, mas o gateway ignora e faz SQL direto).

---

## 4. Banco — 33 tabelas, 0 VIEWs

### Lista completa
| # | Tabela | FK usuario_id | ON DELETE |
|---|--------|---------------|-----------|
| 1 | `usuarios` | — | — |
| 2 | `perfil_financeiro` | sim | CASCADE |
| 3 | `plataformas_vinculadas` | sim | CASCADE |
| 4 | `ativos` | sim | CASCADE |
| 5 | `importacoes` | sim | CASCADE |
| 6 | `itens_importacao` | via importacao_id | — |
| 7 | `snapshots_patrimonio` | sim | CASCADE |
| 8 | `recuperacoes_acesso` | sim | CASCADE |
| 9 | `cotacoes_ativos_cache` | — | — |
| 10 | `snapshots_score` | sim | CASCADE |
| 11 | `configuracoes_produto` | — | — |
| 12 | `feature_flags` | — | — |
| 13 | `configuracoes_menu` | — | — |
| 14 | `content_blocks` | — | — |
| 15 | `corretoras_suportadas` | — | — |
| 16 | `admin_usuarios` | — | — |
| 17 | `admin_auditoria` | — | — |
| 18 | `posicoes_financeiras` | **coluna sem FK** | **ausente** |
| 19 | `simulacoes` | **coluna sem FK** | **ausente** |
| 20 | `simulacoes_historico` | via simulacao_id sem FK | **ausente** |
| 21 | `simulacoes_parametros` | — | — |
| 22 | `perfil_contexto_financeiro` | sim | CASCADE |
| 23 | `ativos_movimentacoes` | sim | CASCADE |
| 24 | `telemetria_eventos` | — | — |
| 25 | `recuperacao_senhas_pins` | sim | CASCADE |
| 26 | `snapshots_score_unificado` | sim | CASCADE |
| 27 | `portfolio_snapshots` | **coluna sem FK** | **ausente** |
| 28 | `portfolio_analytics` | **coluna sem FK** | **ausente** |
| 29 | `historico_carteira_mensal` | sim | CASCADE |
| 30 | `fila_reconstrucao_carteira` | sim | CASCADE |
| 31 | `cotacoes_fundos_cvm` | — | — |
| 32 | `fundos_cvm_cadastro` | — | — |
| 33 | `aportes` | sim | CASCADE |
| 34 | `preferencias_usuario` | sim | CASCADE |
| 35 | `cvm_ingestion_runs` | — | — |
| 36 | `cvm_backfill_runs` | — | — |

(Contagem real: 33 tabelas + colunas retroativas adicionadas em migrations expansoras.)

### Duplicação conceitual
- **Grupo A — Posições**: `ativos`, `posicoes_financeiras`, `aportes`, `ativos_movimentacoes`.
- **Grupo B — Snapshots de patrimônio**: `snapshots_patrimonio`, `portfolio_snapshots`, `historico_carteira_mensal`.
- **Grupo C — Scores**: `snapshots_score`, `snapshots_score_unificado`, `portfolio_analytics`.
- **Grupo D — Perfil**: `perfil_financeiro`, `perfil_contexto_financeiro`.

### Colunas JSON (11+)
`ativos.aliases_json`, `posicoes_financeiras.metadata_json`, `perfil_contexto_financeiro.contexto_json`, `itens_importacao.metadata_json`, `simulacoes.{premissas_json, resultado_json, metadata_json}`, `snapshots_score.{blocos_json, fatores_positivos_json, fatores_negativos_json}`, `snapshots_score_unificado.{pilares_json, inputs_resumo_json}`, `portfolio_snapshots.payload_json`, `portfolio_analytics.payload_json`, `historico_carteira_mensal.payload_json`, `cotacoes_ativos_cache.payload_json`.

### Migrations instáveis
- 0010: 7 colunas retroativas em `ativos` (normalização atrasada).
- 0033: rename `retorno_12m → rentabilidade_desde_aquisicao_pct` (correção de concepção inicial fraca).
- 0034: bugfix rentabilidade mensal (separação de escopos — gráfico estava errado).
- 0035: apenas documentação, nunca implementada.
- `_031_add_pin_to_recuperacoes_acesso.sql.skip` — migration abandonada.

---

## 5. Frontend — 21 clientes em `apresentacao/src/cliente-api/`

`auth.ts`, `carteira.ts`, `insights.ts`, `financialCore.ts`, `historico.ts`, `aportes.ts`, `decisoes.ts`, `admin.ts`, `market.ts`, `portfolio.ts`, `perfil.ts`, `importacao.ts`, `fipe.ts`, `conteudo.ts`, `config.ts`, `funds.ts`, `vera.ts`, `telemetria.ts`, + `authStorage.ts`, `http.ts`, `index.ts`.

### Mapa tela → endpoints consumidos (fragmentação confirmada)

| Tela | # |
|------|---|
| Home (desktop) | **7** (Promise.all: resumoCarteira, ativos, dashboardPatrimonio, benchmark, historicoMensal, resumoInsights, perfil) |
| Carteira (desktop) | **6** (Promise.all) |
| DetalheAtivo | **5+** |
| Admin | **16** |
| Aportes | **6** |
| PerfilUsuario | **8+** (com FIPE) |
| CarSimulator | **7** |
| PropertySimulator | 3 |
| Importar | 3 |
| Insights | 2 |

### Compat cascata
- `obterResumoCarteiraComFallback` (carteira.ts:14-39): `/api/financial-core/summary` → `/api/carteira/resumo` + mapeia camelCase EN → PT.
- `obterBenchmarkCarteiraComFallback` (carteira.ts:45-64): `/api/financial-core/history+summary` → `/api/carteira/benchmark`.
- `obterResumoComFallback` (insights.ts:117-154): mescla `/api/insights/summary` + `/api/insights/resumo`.

### Agregação no cliente
- `Home.jsx:233-310`: compõe dashboard a partir de 6 respostas em Promise.all.
- `Carteira.jsx:59-129`: `GraficoAlocacao()` agrega ativos, calcula percentuais no JSX.
- `DetalheAtivo.jsx:131-143`: 2 Promise.all sequenciais.

### Contratos duplicados
- `ResumoInsights` redefinida em `cliente-api/insights.ts:4-74` com campos camelCase + snake_case paralelos.
- `DashboardPatrimonioResponse` inline em `cliente-api/carteira.ts:66-72`.

---

## 6. Jobs, filas, caches

| Item | Tipo | Propósito |
|------|------|-----------|
| `market-refresh` | cron 5min | atualiza cotações BRAPI |
| `historico-mensal` | cron D-1 3am | snapshot mensal |
| `portfolio-orchestrator` | trigger manual | dispara fila |
| `portfolio-reprocess` | queue | processa fila em lotes |
| `fila_reconstrucao_carteira` | tabela-fila | retry assíncrono |
| `cotacoes_ativos_cache` | cache DB | 5min TTL, BRAPI |
| `SessionMarketService` | cache in-memory | request lifetime |

---

## 7. Problemas de nomenclatura (exemplos concretos)

| Conceito | Nomes coexistindo | Arquivos |
|----------|-------------------|----------|
| Carteira | `portfolio`, `carteira` | carteira.routes.ts, portfolio.ts cliente, PortfolioViewService |
| Score | `UnifiedScore`, `score` | score.routes.ts, insights.routes.ts, UnifiedScoreService |
| Patrimônio | `financial-core`, `patrimonio`, `contextoPatrimonial` | financial-core.routes, insights, perfil |
| Ativos | `assets`, `ativos` | financial-core.routes, carteira.routes |
| Benchmark | `benchmark` (EN) | benchmark.service.ts (nenhum `indice` PT) |
| Rentabilidade | `return`, `rentabilidade`, `retorno_12m` → `rentabilidade_desde_aquisicao_pct` | mig 0033 |

---

## Veredicto baseline

Backend em transição caótica com dois stacks financeiros concorrentes, SQL espalhado em 8 arquivos de rota, 126 endpoints que deveriam ser ~36, e nomenclatura mista EN/PT para os mesmos conceitos. Schema com 4 grupos de duplicação, 10+ tabelas sem FK em `usuario_id`, 11+ colunas JSON guardando estrutura normalizável. Frontend com `Promise.all` de 6-7 endpoints por tela e compat cascata mapeando inline.

**Refactor é urgente e viável**. Como é greenfield (dados atuais descartáveis), o corte é limpo: novo schema + novos domínios + novos clientes, sem pontes intermediárias.
