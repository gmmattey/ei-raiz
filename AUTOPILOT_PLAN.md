# AUTOPILOT PLAN — Quanto

> Gerado: 2026-06-14  
> Specs: 6 specs em backlog

---

## Inventário de Implementação

### INFRA-002 — Tabela `macro_cache`
- Arquivo: `migrations/006_macro_cache.sql`
- SQL: `CREATE TABLE macro_cache (slug TEXT PK, value REAL, reference_date TEXT, fetched_at TEXT)`
- Sem dependências

### INFRA-003 — Tabela `asset_contributions`
- Arquivo: `migrations/004_asset_contributions.sql`
- SQL: tabela + 2 índices
- Sem dependências de feature (pré-requisito para FEAT-017 e FEAT-018)

### INFRA-004 — Tabela `goods`
- Arquivo: `migrations/005_goods.sql`
- SQL: tabela large + 1 índice
- Sem dependências

### FEAT-016 — Benchmarks Macro (CDI/SELIC/IPCA)
**Backend:**
- `refreshMacroIndicators()` em src/index.ts
- Atualizar `scheduled()` handler — `0 12 * * *` chama ambas
- Adicionar campo `benchmarks` em `GET /api/portfolio`

**Frontend:**
- `#benchmarks-bar` em public/index.html (Tela Hoje)
- `renderBenchmarks()` em public/app.js
- Badge CDI no grupo RF (Tela Carteira)
- Caption SELIC na Tela Histórico

### FEAT-017 — Tela de Detalhe do Ativo
**Backend:**
- `GET /api/assets/:id/detail` 
- `GET /api/assets/:id/history`

**Frontend:**
- Seção `#screen-detail` em index.html
- `openDetail(id)` / `renderDetail()` em app.js
- Gráfico SVG de cotação + seletor de período
- Navegação: tap na linha → Detail (não Sheet B)
- Botão "Editar" → Sheet B
- Botão "+ Aporte" → Sheet E
- Botão "✦ Analisar" → Sheet análise (placeholder)

### FEAT-018 — Aportes Adicionais
**Backend:**
- `POST /api/assets/:id/contributions`
- `GET /api/assets/:id/contributions`
- `DELETE /api/assets/:id/contributions/:cid`
- Atualizar `PUT /api/assets/:id` — ignorar `invested` se há aportes

**Frontend:**
- Sheet E (`#sheet-aporte`) em index.html
- `openSheetAporte(id)` / `saveAporte()` em app.js
- Lista de aportes na Tela Detalhe
- `deleteContribution(id, cid)` com confirm dialog

### FEAT-019 — Bens e Garantias (Backend)
**Backend:**
- `GET /api/goods`
- `POST /api/goods`
- `PUT /api/goods/:id`
- `DELETE /api/goods/:id`
- Atualizar `GET /api/portfolio` — incluir `goods` e `grossWealth`

### FEAT-020 — Bens e Garantias (Frontend)
**Frontend:**
- 5ª aba "Bens" na navbar em index.html
- Seção `#screen-bens` em index.html
- Sheet F (`#sheet-bem`) em index.html
- `loadGoods()` / `renderGoods()` em app.js
- `openSheetBem()` / `saveBem()` em app.js
- Toggle patrimônio bruto na Tela Hoje

### FEAT-021 — Redesign Visual
**CSS:**
- Atualizar tokens de cor (--petro: #1B4D57, etc.)
- Shell position:fixed
- Tab bar 64px + safe-area
- Animações: qFade, qDonut, qDraw, qPulse, qFill

**HTML:**
- Header petróleo (Tela Hoje) vs branco (outras)
- Chip de ganho translúcido
- Dot de frescor pulsante
- FAB border-radius 18px
- Drag handle nos sheets
- Zona de perigo inline no Sheet B

### FEAT-013/014/015 — AI Features
**Infra:**
- Adicionar `[ai]` binding no wrangler.toml
- Migration para `display_name TEXT` em `assets`

**Backend:**
- `src/ai.ts` com 3 funções
- `POST /api/ai/analyze` endpoint
- Chamar `generateDisplayName()` no POST/PUT /api/assets

**Frontend:**
- Botão "✦ Analisar" na Tela Hoje, Carteira, Detalhe
- Sheet de análise com skeleton loader + observações
- Disclaimer obrigatório

---

## Ordem de Desenvolvimento

### Fase 1 — Migrations (PARALELO, sem dependências entre si)
- INFRA-002: migrations/006_macro_cache.sql
- INFRA-003: migrations/004_asset_contributions.sql
- INFRA-004: migrations/005_goods.sql

### Fase 2 — Backend (SEQUENCIAL, mesmo arquivo)
1. FEAT-016 backend (refreshMacroIndicators + portfolio)
2. FEAT-018 backend (contributions endpoints)
3. FEAT-017 backend (detail + history endpoints)
4. FEAT-019 backend (goods endpoints + grossWealth)
5. FEAT-013 backend (display_name + ai.ts + analyze endpoint)

### Fase 3 — Frontend HTML (SEQUENCIAL, mesmo arquivo)
1. Benchmarks bar (FEAT-016)
2. Tela Detalhe (FEAT-017)
3. Sheet E Aportes (FEAT-018)
4. Tela Bens + Sheet F (FEAT-020)
5. Design tokens/animações (FEAT-021)

### Fase 4 — Frontend JS (SEQUENCIAL, mesmo arquivo)
1. renderBenchmarks (FEAT-016)
2. openDetail / renderDetail (FEAT-017)
3. openSheetAporte / saveAporte (FEAT-018)
4. loadGoods / renderGoods (FEAT-020)
5. AI analyze sheet (FEAT-015)

### Fase 5 — Verificação
1. TypeScript typecheck
2. Corrigir erros (até 5 iterações)
3. Commit atômico por feature

---

## Riscos Identificados

| Risco | Probabilidade | Mitigação |
|---|---|---|
| src/index.ts crescer demais (>1500 linhas) | Alta | Extrair helpers para src/goods.ts, src/contributions.ts |
| Migração remota D1 — requer auth do operador | Alta | Criar SQL, instruir operador no REPORT |
| app.js > 2500 linhas difícil de manter | Média | Aceitar neste MVP; modularização é stretch goal |
| Workers AI billing | Baixa | Free tier 10k neurons/dia cobre MVP |
| `GET /api/assets/:id/history` BRAPI — rate limit | Baixa | Fallback já especificado na spec |

---

## Critério de PRONTO por Item

| Critério | Aplica a |
|---|---|
| TypeScript typecheck passa sem erros | Todos os itens de backend |
| Endpoint retorna JSON válido (sem crash) | Todos os endpoints |
| UI renderiza sem erros de JS | Todos os itens de frontend |
| Migrations SQL sintaticamente corretas | INFRA-* |
| Commit atômico por feature | Fase 5 |
