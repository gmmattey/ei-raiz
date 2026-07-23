# Handover: Thiago (Tech Lead) → Carlos

> **Data:** 2026-06-17  
> **De:** Thiago (Tech Lead → Scrum Master)  
> **Para:** Carlos (assume Tech Lead + code review técnico)  
> **Tarefa:** CHR-001 / CHR-004  
> **Referência anterior:** `docs/HANDOVER_TECH_LEAD.md` (versão resumida, criada 2026-06-17)

---

## TL;DR para Carlos começar hoje

1. Leia as seções 4 (migrations), 5 (bugs críticos), 6 (checklist de PR) agora
2. Execute as 3 migrations pendentes em prod (seção 4)
3. Corrija o JWT_SECRET hardcoded (seção 8)
4. Para qualquer dúvida técnica: me chama como SM. Tenho contexto de tudo.

---

## 1. Por Que Cada Decisão Arquitetural Foi Tomada

### 1.1 Por que Hono (não Express/Remix/Fastify)?

- **Hono roda em Cloudflare Workers nativamente.** Express não roda — Workers não têm Node.js runtime.
- Hono tem zero dependências de Node (`fs`, `net`, `http`). Outros frameworks do ecossistema Node quebram.
- Hono tem tipagem TypeScript nativa com `Bindings` e `Variables` — veja `src/index.ts` linha 6-16.
- Bundle size importa no Worker: Hono tem ~12KB minificado.

**Regra:** Se alguém propuser outro framework, a pergunta é "roda em CF Workers sem polyfill?" Se a resposta for não, a conversa acabou.

### 1.2 Por que D1 (não Postgres/PlanetScale/Turso)?

- **Custo zero.** Postgres gerenciado começa em $20+/mês. D1 free tier: 5GB, 5M reads/dia, 100k writes/dia.
- D1 é SQLite, que roda dentro do Worker no mesmo datacenter. Latência ~1ms. Postgres externo = round-trip de rede + latência.
- SQLite é suficiente para o Quanto: dados relacionais simples, escala vertical por user_id.
- Views SQL funcionam — `vw_portfolio_summary`, `vw_freshness` etc. fazem o trabalho pesado no banco.

**Trade-offs aceitos:**
- Sem transações distribuídas (não precisamos)
- D1 não tem `RETURNING` em batch — usamos `db.batch()` sem RETURNING quando possível
- SQLite tem tipos frouxos — validamos no backend, não dependemos do banco

### 1.3 Por que PWA offline (Service Worker)?

- O app é usado em momentos de checagem rápida (metrô, reunião). Conexão instável é real.
- `public/sw.js` faz cache do último estado com `v3` cache key.
- Sem framework de PWA — Service Worker vanilla é simples o suficiente.
- Manifest.json permite instalar no Android como app nativo (sem Play Store).

**Limitação:** Offline mostra dados do último `fetch`, não dados ao vivo. Isso é intencional. O usuário vê o estado anterior, não dados errados.

### 1.4 Por que free tier Cloudflare (e não um VPS)?

- Custo zero é o requisito do projeto. "Stack custo R$ 0" está no `CLAUDE.md`.
- Workers + D1 + AI + Assets = tudo no mesmo provedor, sem egress entre serviços.
- O free tier do Cloudflare é generoso para o volume esperado (< 1k usuários ativos/dia).
- Deploy é `wrangler deploy` — sem CI/CD externo necessário.

**Risco:** Se o projeto crescer além do free tier, o plano Workers Paid começa em $5/mês com limites muito maiores. Migração é transparente — só trocar o plano.

### 1.5 Por que Vanilla JS (sem React/Vue/Svelte)?

- **Zero build = zero friction.** Sem `npm install`, sem bundler, sem node_modules em produção.
- Service Worker faz cache de `app.js` como um único arquivo. Com bundle, o cache invalidation fica complexo.
- O Quanto tem 4 telas. Isso não justifica um framework.
- React/Vue trazem virtual DOM overhead para um app que atualiza poucos elementos por interação.

**Regra não-negociável:** Nenhum `npm install` no frontend. Se alguém propuser uma biblioteca JS para o frontend, a resposta é não.

---

## 2. Estrutura do Código — O Que Está Onde

```
src/
  index.ts     — Worker principal: todos os endpoints Hono, cron handlers, helpers (2006 linhas)
  auth.ts      — PBKDF2-SHA256 + JWT HS256 (90 linhas, sem dependências externas)
  cvm.ts       — Pipeline CVM: refreshCvmQuotes, refreshCvmFundsCache, searchFunds

public/
  index.html   — SPA completa: 5 telas + 6 sheets no DOM (estático)
  app.js       — Toda lógica frontend: auth, portfolio, detalhe, aportes, bens, wizard XLSX
  style.css    — Tokens CSS + componentes + dark mode
  sw.js        — Service Worker v3 (cache-first com fallback)
  manifest.json — PWA manifest

migrations/
  001_*.sql    — Schema inicial (users, assets, quotes_cache, cvm_funds_cache, snapshots)
  002_*.sql    — display_name em assets
  003_*.sql    — cvm_funds_cache (reescrita)
  004_*.sql    — asset_contributions          ← PENDENTE em prod (INFRA-003)
  005_*.sql    — goods                        ← PENDENTE em prod (INFRA-004)
  006_*.sql    — macro_cache                  ← PENDENTE em prod (INFRA-002)

schema.sql     — Referência da spec ORIGINAL (desatualizado: não tem as tabelas de migrations 004-006)
wrangler.toml  — Config do Worker: bindings D1, AI, vars, crons
docs/          — Specs funcionais e técnicas
```

### O Worker em `src/index.ts`

O arquivo tem 2006 linhas porque tudo está num único Worker. Isso é intencional. A ordem dos `app.use()` e `app.get/post/put/delete()` importa:

```
1. CORS middleware (app.use '*')
2. Public endpoints (health, funds/search, auth/*)
3. Auth middleware (app.use '/api/*') — protege tudo abaixo
4. Portfolio, assets, history, snapshot, import, goods, AI analyze
5. Cron handlers (scheduled())
6. Helpers (refreshQuotes, upsertSnapshot, etc.)
```

---

## 3. Padrões de Código que Exijo em PRs

### 3.1 user_id em TODA query de dados do usuário

```typescript
// ✅ CORRETO
const result = await db
  .prepare('SELECT * FROM assets WHERE id = ? AND user_id = ?')
  .bind(id, userId)
  .first()

// ❌ ERRADO — qualquer usuário pode acessar qualquer asset
const result = await db
  .prepare('SELECT * FROM assets WHERE id = ?')
  .bind(id)
  .first()
```

**Verificar em PRs:** Toda query em `assets`, `snapshots`, `goods`, `asset_contributions` DEVE ter `user_id = ?` no WHERE. Sem exceção.

### 3.2 Bind parameters — nunca concatenar SQL

```typescript
// ✅ CORRETO
.prepare('SELECT * FROM assets WHERE ticker = ?').bind(ticker)

// ❌ ERRADO — SQL injection
.prepare(`SELECT * FROM assets WHERE ticker = '${ticker}'`)
```

**D1 aceita apenas `?` como placeholder.** Sem `$1`, sem `:param`.

### 3.3 Dynamic SET builder para PATCHes parciais

```typescript
const setClauses: string[] = []
const bindings: unknown[] = []

for (const key of allowedFields) {
  if (!(key in body)) continue
  setClauses.push(`${key} = ?`)
  bindings.push(body[key] ?? null)
}

if (setClauses.length === 0) return c.json({ error: 'No fields to update' }, 400)
bindings.push(id, userId) // WHERE id = ? AND user_id = ?
```

**Por quê:** Permite PATCH parcial sem sobrescrever campos não enviados.

### 3.4 UPSERT com ON CONFLICT para idempotência

```sql
INSERT INTO quotes_cache (ticker, price, fetched_at) VALUES (?, ?, datetime('now'))
ON CONFLICT(ticker) DO UPDATE SET price = excluded.price, fetched_at = excluded.fetched_at
```

**Onde usar:** Toda operação que pode ser repetida (crons, retries, snapshots).

### 3.5 Erros não-fatais com try/catch e fallback

```typescript
// Padrão: feature opcional não quebra a response principal
let benchmarks = { cdi: null, selic: null, ipca12m: null, fetchedAt: null }
try {
  // busca macro_cache
  benchmarks = ...
} catch {
  // Non-fatal: benchmarks stays null, portfolio continues working
}
```

**Regra:** Qualquer feature que pode falhar sem quebrar o fluxo principal usa este padrão. Ver: benchmarks, goods, display_name generation.

### 3.6 Soft delete — nunca hard delete em assets/goods

```typescript
// ✅ CORRETO
UPDATE assets SET status = 'archived' WHERE id = ? AND user_id = ?

// ❌ ERRADO
DELETE FROM assets WHERE id = ? AND user_id = ?
```

**Exceção aprovada:** `asset_contributions` tem DELETE real (contributions não têm dependentes).

### 3.7 Validação com enum antes de gravar

```typescript
const VALID_INSTITUTIONS = ['XP', 'ITAU', 'ONZE', 'OUTROS'] as const
const VALID_CLASSES = ['ACAO', 'FUNDO', 'RF', 'TESOURO', 'PREVIDENCIA', 'POUPANCA', 'COFRINHO'] as const

if (!VALID_INSTITUTIONS.includes(institution as Institution)) {
  errors.push(`field 'institution' must be one of: ${VALID_INSTITUTIONS.join(', ')}`)
}
```

**Nunca confiar no frontend.** Sempre validar no backend antes do INSERT/UPDATE.

### 3.8 Aggregações no SQL, não em JS

```typescript
// ✅ CORRETO — aggregação no banco
const summary = await db
  .prepare('SELECT * FROM vw_portfolio_summary WHERE user_id = ?')
  .bind(userId).first()

// ❌ ERRADO — busca tudo e soma em JS
const assets = await db.prepare('SELECT * FROM assets WHERE user_id = ?').bind(userId).all()
const total = assets.results.reduce((s, a) => s + (a.balance ?? 0), 0)
```

**D1 é SQLite rodando no datacenter. Aggregations são O(n) no banco vs O(n) + latência de rede em JS.**

---

## 4. Migrations Pendentes em Produção — EXECUTAR HOJE

Três migrations criadas, código deployado, tabelas **não existem em produção**. Os endpoints retornam `null/empty` silenciosamente (protegidos por try/catch). Sem crash, sem funcionalidade.

| Migration | Task | Tabela criada | Impacto em prod |
|---|---|---|---|
| `migrations/004_asset_contributions.sql` | INFRA-003 | `asset_contributions` | Aportes não salvam, invested não recalcula |
| `migrations/005_goods.sql` | INFRA-004 | `goods` | Bens e FGTS/Imóvel/Veículo invisíveis |
| `migrations/006_macro_cache.sql` | INFRA-002 | `macro_cache` | CDI/SELIC/IPCA não aparecem |

**Comandos (executar nesta ordem):**

```bash
wrangler d1 execute quanto-db --remote --file=migrations/004_asset_contributions.sql
wrangler d1 execute quanto-db --remote --file=migrations/005_goods.sql
wrangler d1 execute quanto-db --remote --file=migrations/006_macro_cache.sql
```

**Antes de executar:** Sempre ler o arquivo SQL. Verificar que é `--remote` (produção) e não `--local`. Sem risco de breaking change — todas são ADD TABLE, sem ALTER em tabelas existentes.

---

## 5. Bugs Confirmados — Estado Atual

Da auditoria FEAT-023 (Carlos, 2026-06-16):

| # | Arquivo | Linha aprox. | Bug | Severidade |
|---|---|---|---|---|
| B1 | `src/index.ts` | ~407-431 | `mapAsset()` não inclui `display_name` no response — frontend tem o campo mas API não manda | P1 |
| B2 | `public/app.js` | tabs listener | Swipe horizontal de tabs possivelmente quebrado | P2 |
| B3 | `src/index.ts` | ~1109 | `ACCEPTS_CONTRIBUTIONS = ['ACAO', 'FII', ...]` — 'FII' não é uma classe válida (deve ser 'ACAO') | P1 |
| B4 | `schema.sql` | - | `schema.sql` não tem `asset_contributions`, `goods`, `macro_cache` — desalinhado com migrations | P3 (doc) |
| B5 | `wrangler.toml` | vars | `JWT_SECRET` hardcoded em texto plano — **CRÍTICO** | P0 |
| B6 | - | - | `BRAPI_TOKEN` pode estar ausente em alguns ambientes | P1 |

### Fix rápido para B1 (display_name no portfolio):

Em `src/index.ts`, na função `mapAsset()`, adicionar `displayName`:

```typescript
return {
  id: row.id,
  institution: row.institution,
  institutionName: row.institution_name ?? null,
  class: row.class,
  name: row.name,
  displayName: row.display_name ?? null,  // ← ADICIONAR ESTA LINHA
  ticker: row.ticker ?? null,
  // ... resto dos campos
}
```

E na query SQL de `activeAssets`, garantir que `a.display_name` está no SELECT (já está — `a.display_name` é incluído via `a.*` na verdade não, está explícito em `a.id, a.institution, a.institution_name, ...` mas `display_name` não está listado — verificar e adicionar ao SELECT).

### Fix rápido para B3 (FII em contributions):

```typescript
// Linha ~1109 — remover 'FII' (não é uma classe válida)
const ACCEPTS_CONTRIBUTIONS = ['ACAO', 'FUNDO', 'RF', 'TESOURO'] // sem 'FII'
```

### Fix crítico para B5 (JWT_SECRET):

```bash
# 1. Setar o secret no Cloudflare
wrangler secret put JWT_SECRET
# (digitar um valor forte no prompt — nunca reutilizar o hardcoded)

# 2. Remover do wrangler.toml
# Apagar ou deixar vazio: JWT_SECRET = ""
```

---

## 6. Checklist de Code Review para Carlos

### P0 — Bloquear o PR se falhar

- [ ] Toda query em `assets`/`goods`/`snapshots`/`asset_contributions` tem `AND user_id = ?`
- [ ] Nenhuma concatenação de string em SQL (só `?` placeholders)
- [ ] Enum validado antes de gravar (`VALID_INSTITUTIONS`, `VALID_CLASSES`, `VALID_STATUSES`, etc.)
- [ ] `JWT_SECRET` vem de `c.env.JWT_SECRET`, não string literal
- [ ] Nenhum `password_hash` ou `token` em `console.log`
- [ ] `npm run typecheck` passa com 0 erros

### P1 — Pedir revisão antes de aprovar

- [ ] Nenhum loop N+1 (query dentro de `.map()`)
- [ ] Aggregações ficam em SQL (não `.reduce()` em JS para somar saldos)
- [ ] Fetch externo (BRAPI/CVM) tem try/catch não-fatal
- [ ] Workers AI call é fire-and-forget (`.catch(() => {})`) se não bloquear a response
- [ ] Soft delete para `assets` e `goods` (não DELETE)
- [ ] UPSERT para operações idempotentes (crons, upserts de cache)
- [ ] Novo cron: verificar total de invocações/dia (limite: 500/dia; atual: ~35/dia)

### P2 — Feedback, não bloqueador

- [ ] Resposta da API em camelCase
- [ ] Nenhuma biblioteca JS nova no frontend (Vanilla only)
- [ ] Erros do usuário em português; logs internos em inglês
- [ ] Tipagem TypeScript sem `as any` injustificado

---

## 7. Limites do Free Tier Cloudflare — Os Números Críticos

| Recurso | Limite | Situação atual | Risco |
|---|---|---|---|
| CPU por request | **10ms** | OK — D1 queries dominam, IA é async | BAIXO |
| Requests/dia | **100k** | OK para o volume atual | BAIXO |
| D1 reads/dia | **5M rows** | OK — portfolio: ~6-8 queries | BAIXO |
| D1 writes/dia | **100k** | OK — só em mutações | BAIXO |
| D1 storage | **5GB** | OK — dataset leve | BAIXO |
| Cron invocações/dia | **500** | 4 crons = ~35/dia seg-sex | BAIXO |
| Workers AI | **~10k/dia** free | OK — uso leve e opcional | BAIXO |

### O que pode explodir o free tier

1. **N+1 em D1:** Portfolio já faz 5-7 queries por request. Não adicionar mais sem medir.
2. **CVM ZIP em memória:** Se alguém fizer `await response.arrayBuffer()` no ZIP do CVM (~50MB), estoura a RAM do Worker (128MB). O stream-parse atual em `src/cvm.ts` é correto.
3. **AI síncrona:** `generateDisplayName()` é fire-and-forget corretamente. Se tornar síncrona, estoura 10ms de CPU.
4. **Batch import sem limite:** `POST /api/import` usa `db.batch(stmts)`. A UI limita o upload, mas se alguém chamar a API diretamente com 10k items, vai explodir D1 writes.

---

## 8. Secrets e Variáveis de Ambiente

| Variável | Local atual | Correto? | Ação |
|---|---|---|---|
| `JWT_SECRET` | `wrangler.toml` [vars] em texto plano | ❌ **NÃO** | Mover para Cloudflare Secret **urgente** |
| `BRAPI_TOKEN` | Cloudflare Secret (deve estar) | ✅ | Verificar com `wrangler secret list` |
| `BRAPI_BASE_URL` | `wrangler.toml` [vars] | ✅ não é secret | OK |
| `DB` | `wrangler.toml` [[d1_databases]] binding | ✅ | OK |
| `AI` | `wrangler.toml` [ai] binding | ✅ | OK — Workers AI |

```bash
# Verificar secrets configurados em prod
wrangler secret list

# Corrigir JWT_SECRET
wrangler secret put JWT_SECRET
# → digitar um valor forte (40+ chars, aleatório)
```

---

## 9. Arquitetura da Auth — Como Funciona

`src/auth.ts` é a implementação completa de auth. Zero dependências externas.

```
Registro: email + senha + CPF + nascimento
  → hashPassword (PBKDF2-SHA256, 100k iterações, salt de 16 bytes)
  → INSERT users (email, password_hash, cpf, birth_date)
  → signToken (JWT HS256, 8h TTL)
  → retorna { token, expiresAt, user }

Login:
  → busca user por email
  → verifyPassword (constant-time comparison)
  → signToken
  → retorna { token, expiresAt, user }

Recuperação:
  → valida email + CPF + nascimento
  → hashPassword da nova senha
  → UPDATE users SET password_hash
  → (sem envio de email — sem dependência externa)

Middleware:
  → extrai Bearer do header Authorization
  → verifyToken (valida assinatura HMAC + expiração)
  → c.set('userId', payload.userId)
  → próximos handlers usam c.get('userId')
```

**Por que CPF+nascimento para recovery?** Sem dependência de serviço de email. Sem SMTP. Sem custo. Trade-off: dados pessoais armazenados. Aceito para este escopo.

---

## 10. Pipeline CVM — Arquitetura

`src/cvm.ts` implementa o pipeline de cotações de fundos de investimento.

```
Fonte: CVM (dados abertos) — informe diário de cotas
URL: https://dados.cvm.gov.br/dados/FI/DOC/INF_DIARIO/DADOS/inf_diario_fi_{YYYY}{MM}.zip

refreshCvmFundsCache() — cron mensal (0 23 2 * *)
  → stream-parse do arquivo de cadastro (~15k fundos ativos)
  → UPSERT em cvm_funds_cache (cnpj, denom_social, classe, gestor, etc.)

refreshCvmQuotes() — cron diário seg-sex (0 22 * * 1-5)
  → pega os assets com quote_source = 'CVM'
  → busca informe mais recente no ZIP da CVM
  → stream-parse sem materializar o ZIP em memória (CRÍTICO — ZIP tem ~50MB)
  → UPSERT em quotes_cache

searchFunds(db, q) — chamado por GET /api/funds/search
  → busca por nome (LIKE) ou CNPJ (exato)
  → retorna max 20 resultados com CNPJ + nome + classe
```

**⚠️ Nunca fazer `await response.arrayBuffer()` no ZIP da CVM.** O Worker tem 128MB de RAM. O ZIP tem ~50MB. Estoura.

---

## 11. Crons Configurados

```
"0 12 * * *"    — refreshQuotes (BRAPI tickers) + refreshMacro (CDI/SELIC/IPCA)
"0 12 1 * *"    — runMonthlySnapshot (foto mensal do patrimônio)
"0 22 * * 1-5"  — refreshCvmQuotes (cotações de fundos)
"0 23 2 * *"    — refreshCvmFundsCache (cadastro de ~15k fundos)
```

Todos em `wrangler.toml` e dispatch em `scheduled()` no final de `src/index.ts`.

**Regra:** Adicionar cron só se o evento for diferente dos 4 existentes. Calcular invocações/dia antes. Limite free: 500/dia.

---

## 12. Features de IA (Workers AI)

Três features, todas opcionais (o app funciona sem elas):

### Smart Labels — `generateDisplayName()`
- Model: `@cf/meta/llama-3.2-1b-instruct`
- Trigger: fire-and-forget em POST /api/assets e PUT /api/assets/:id (quando `name` muda)
- Salva em `assets.display_name` (nullable)
- Frontend usa `displayName ?? name` como fallback
- Binding: `c.env.AI` (guard com `if (!c.env.AI)`)

### Smart Import — POST /api/import/analyze
- Model: `@cf/meta/llama-3.2-3b-instruct`
- Classifica lista de ativos importados (ACAO/FUNDO/RF/etc.)
- Limita a 50 items por chamada
- Retorna `{ suggestions: [{ index, class, confidence }] }`
- Endpoint público protegido por autenticação

### Análise Contextual — POST /api/ai/analyze
- Model: `@cf/meta/llama-3.2-3b-instruct` (nota: descrito como Qwen3 no fleet.json, mas código usa Llama)
- Context: 'portfolio' ou 'asset'
- Retorna observações factuais em português + disclaimer obrigatório
- Nunca faz recomendações de compra/venda (prompt engineering)

---

## 13. Tabelas e Views — Referência Rápida

### Tabelas (5 em prod quando migrations aplicadas)

```sql
users             — email, password_hash, name, cpf, birth_date
assets            — portfólio por usuário; status: active/redeeming/archived
quotes_cache      — cache BRAPI + CVM; TTL 15min validado por query
cvm_funds_cache   — ~15k fundos CVM; atualizado mensalmente
snapshots         — foto mensal por usuário (UNIQUE user_id+month)
asset_contributions — aportes por ativo (PENDENTE migração INFRA-003)
goods             — bens e garantias (PENDENTE migração INFRA-004)
macro_cache       — CDI/SELIC/IPCA (PENDENTE migração INFRA-002)
```

### Views (4, em schema.sql e aplicadas)

```sql
vw_portfolio_summary         — total_balance, total_invested, gain por user
vw_allocation_by_institution — saldo por instituição + display_name para OUTROS
vw_allocation_by_class       — saldo por classe
vw_freshness                 — frescor de ativos manuais por instituição
```

### Índices importantes

```sql
idx_assets_user         — (user_id, status) — path principal
idx_assets_institution  — (user_id, institution, status) — donut institucional
idx_assets_class        — (user_id, class, status) — donut por classe
idx_assets_freshness    — (user_id, status, balance_updated_at) WHERE ticker IS NULL
idx_snapshots_user      — (user_id, month)
idx_cvm_funds_nome      — denom_social COLLATE NOCASE — busca por nome de fundo
```

---

## 14. Decisões Pendentes para Carlos Conduzir

Estas são discussões que eu deixei em aberto. Carlos decide com consulta a Renata para as que têm impacto de produto.

### 14.1 FII como classe própria (P1)

`VALID_CLASSES` não tem 'FII'. FIIs são cadastrados como 'ACAO'. `ACCEPTS_CONTRIBUTIONS` tinha 'FII' (bug — remover). A spec funcional também não menciona FII como classe separada.

**Opção A:** Deixar como está (FII = ACAO). Sem mudança de schema.
**Opção B:** Adicionar 'FII' a `VALID_CLASSES` e fazer migration. Mais correto financeiramente.

**Minha opinião:** Opção A por ora. FII como ACAO funciona para o propósito do Quanto (consolidação, não análise).

### 14.2 `display_name` no response do portfolio (P1)

`mapAsset()` em GET /api/portfolio não inclui `display_name`. Frontend tem o campo. Fix simples — adicionar ao SELECT e ao objeto de resposta.

**Ação:** Fix imediato (B1 na seção 5).

### 14.3 Telas de UI pendentes (P0 de produto)

FEAT-005 (Hoje), FEAT-006 (Carteira), FEAT-007 (Histórico), FEAT-008 (Import XLSX) — todas no backlog. Backend pronto. Marina precisa implementar. Isso está bloqueando o onboarding do primeiro usuário real.

### 14.4 BRAPI sem fallback de preço (P2)

Se BRAPI retornar erro, o ativo ACAO fica com `balance: null`. O portfolio não quebra (try/catch), mas o ativo some do total. Considerar: mostrar o último preço em cache mesmo que > 15min, com indicador visual de "cotação desatualizada".

### 14.5 Limite de itens no import (P1)

`POST /api/import` não tem limite de `items`. Se chamado diretamente (não via UI), pode receber 10k itens e estourar writes do D1. Adicionar `items.slice(0, 200)` com erro informativo acima do limite.

---

## 15. Para Onde Escalar Dúvidas

| Tipo de dúvida | Quem chamar |
|---|---|
| Arquitetura / decisão técnica | **Carlos decide.** Se impasse com Renata, chamar Thiago (SM). |
| Priorização de features | **Renata** |
| UI/UX, design system | **Beatriz** (design) + **Marina** (implementação) |
| Import XLSX / pipeline CVM | **Carlos** (backend) + **Beatriz** (UX do wizard) |
| QA, testes, regressão | **Pedro** |
| Estrutura de sprint | **Thiago (SM)** |

**Regra geral:** Carlos tem autonomia total em decisões técnicas internas (refactor, segurança, performance). Para mudanças que afetam contratos de API ou UX, consultar Renata antes de implementar.

---

## Referências Rápidas

- Spec funcional: `docs/SPEC_FUNCIONAL_v1.md`
- Spec técnica: `docs/QUANTO_SPEC_v4.md`
- OpenAPI: `docs/api-spec.yaml`
- Spec CVM: `docs/SPEC_CVM_PIPELINE.md`
- Specs de features recentes: `docs/SPEC_AI_FEATURES.md`, `docs/SPEC_APORTES.md`, `docs/SPEC_BENS_GARANTIAS.md`, `docs/SPEC_ASSET_DETAIL.md`
- QA report: `docs/QA_REPORT_2026-06-16.md`
- Auditoria de migração: `docs/AUDITORIA_MIGRACAO_QUANTO.md`
- Cloudflare Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Cloudflare D1 limits: https://developers.cloudflare.com/d1/platform/limits/
- Handover anterior (versão resumida): `docs/HANDOVER_TECH_LEAD.md`
