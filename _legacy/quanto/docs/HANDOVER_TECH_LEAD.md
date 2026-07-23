# Handover Tech Lead — Thiago → Carlos

> **Data:** 2026-06-17  
> **De:** Thiago (Tech Lead → Scrum Master)  
> **Para:** Carlos (assume Tech Lead)  
> **Contexto:** CHR-001 — Thiago transiciona para SM. Carlos assume code review técnico, decisões arquiteturais e validação Cloudflare.

---

## 1. Visão Geral da Arquitetura

### Stack decidida (não mudar sem discussão)

```
Cloudflare Workers (Hono)
└─ src/index.ts       — 1 arquivo, todos os endpoints
└─ src/auth.ts        — PBKDF2 + JWT
└─ src/cvm.ts         — pipeline CVM (fundos)
Cloudflare D1 (SQLite)
└─ 5 tabelas + 4 views SQL
Cloudflare AI (Workers AI)
└─ binding AI opcional — Smart Labels + Smart Import + Análise
Public assets (Vanilla JS/CSS — ZERO build, ZERO framework)
```

**Por que Hono + Worker único?** Simplicidade. Um Worker com 2000 linhas é trivial de debugar. Micro-services seriam morte por complexidade num projeto custo-zero.

**Por que Vanilla JS?** Sem build = sem npm install em produção, sem version drift, SW cache previsível, deploy é `wrangler deploy`.

---

## 2. Limites Cloudflare Free Tier — Decorar Estes Números

| Recurso | Limite Free | Status Atual |
|---|---|---|
| Worker CPU/req | **10ms** | OK — queries D1 dominam; AI é async |
| Requests/dia | **100k** | OK para usuários atuais |
| D1 reads/dia | **5M** | OK — portfolio faz ~6 queries |
| D1 writes/dia | **100k** | OK — writes só em mutações |
| D1 rows total | **500M** (5GB) | OK |
| Cron invocações/dia | **500** | **ATENÇÃO** — 4 crons configurados |
| Workers AI requests | **limite generoso** free | OK — uso leve |

### Crons configurados (`wrangler.toml`)

```
"0 12 * * *"    — refreshQuotes (BRAPI) + refreshMacro — daily
"0 12 1 * *"    — snapshot mensal — 1x/mês
"0 22 * * 1-5"  — refreshCvmQuotes — seg-sex
"0 23 2 * *"    — refreshCvmFundsCache — mensal
```

**Regra de ouro:** Nunca adicionar cron sem contar quantas invocações/dia isso gera. Com 4 crons atuais: ~35 invocações/dia de segunda a sexta. Margem boa.

### O que pode explodir o free tier

1. **Loops N+1 em D1** — cada request já faz 5-7 queries; não adicionar mais sem medir
2. **Batch sem limite** — `POST /api/import` usa `db.batch(stmts)` — ok porque itens são limitados pela UI; se liberarmos API pública, adicionar `items.slice(0, 200)`
3. **AI síncrona** — se `generateDisplayName` fosse síncrona, estouraria 10ms. Está corretamente fire-and-forget via `.catch(() => {})`

---

## 3. Decisões Arquiteturais Tomadas (e Por Quê)

### 3.1 Auth: Email+senha próprio, sem Cloudflare Access

**Decisão:** PBKDF2-SHA256 (100K iterações) + JWT HS256 8h em `src/auth.ts`.

**Por quê:** Cloudflare Access cobra por usuário no free tier (max 50 users). Próprio = custo zero, controle total, multi-user ilimitado.

**Trade-off aceito:** Sem OAuth/SSO. Recuperação de senha via CPF+nascimento (sem email — não queremos dependência de serviço de email).

**⚠️ BUG CRÍTICO ABERTO:** `wrangler.toml` tem `JWT_SECRET = "quanto-jwt-secret-2026-mude-em-producao"` **em texto plano**. Em produção isso precisa virar um Cloudflare Secret:
```bash
wrangler secret put JWT_SECRET
# digita o secret no prompt
```
O wrangler.toml deve ter apenas `JWT_SECRET = ""` ou remover a linha var.

### 3.2 Banco: Views SQL, não lógica no serviço

**Decisão:** `vw_portfolio_summary`, `vw_allocation_by_institution`, `vw_allocation_by_class`, `vw_freshness` — toda agregação vive no SQL.

**Por quê:** D1 é SQLite, SQLite é rápido para aggregations. Fazer SUM/GROUP BY em JS seria N queries + memória no Worker.

**Regra:** Se alguém propuser fazer um `.reduce()` em JS para somar saldos, recuse e proponha uma view/query.

### 3.3 Soft Delete — nunca hard delete

**Decisão:** `status = 'archived'` para assets e goods. DELETE nunca acontece.

**Por quê:** Integridade referencial com `asset_contributions`. Hard delete quebraria histórico de aportes.

**Exceção aprovada:** `asset_contributions` tem DELETE real (o usuário pode excluir um aporte individual). Isso é intencional — o aporte não tem dependentes.

### 3.4 UPSERT com ON CONFLICT para idempotência

Usado em: `quotes_cache`, `macro_cache`, `snapshots`.

```sql
INSERT INTO quotes_cache (ticker, price, fetched_at) VALUES (?, ?, datetime('now'))
ON CONFLICT(ticker) DO UPDATE SET price = excluded.price, fetched_at = excluded.fetched_at
```

**Por quê:** Cron pode ser chamado duas vezes (retry do Cloudflare). UPSERT = seguro por design.

### 3.5 Dynamic SET builder para PATCHes parciais

`PUT /api/assets/:id` constrói o SET dinamicamente:

```typescript
for (const key of allowedFields) {
  if (!(key in body)) continue
  setClauses.push(`${key} = ?`)
  bindings.push(value ?? null)
}
```

**Por quê:** Frontend pode enviar só os campos que mudaram. Evita sobrescrever dados com `undefined`.

**Regra:** Nunca aceitar um campo JSON-null e sobrescrever um campo importante. Sempre verificar se o campo está no `allowedFields` antes de escrever.

### 3.6 Cache BRAPI 15 min — validado por TTL in-query

```sql
WHERE (julianday('now') - julianday(q.fetched_at)) * 1440 > 15
```

**Por quê:** `julianday` devolve fração de dia; multiplicar por 1440 (min/dia) dá minutos. Mais preciso que comparar strings.

### 3.7 Isolamento por user_id — regra não negociável

**TODA query** tem `WHERE ... AND user_id = ?`. Sem exceção.

Verificar em code review: se uma query toca `assets`, `snapshots`, `goods` ou `asset_contributions` sem `user_id` no bind, é bug de segurança.

### 3.8 Pipeline CVM — stream-parse ZIP

CVM disponibiliza informe diário de cotas como ZIP (~50MB). `src/cvm.ts` faz stream-parse sem materializar o ZIP inteiro em memória (Workers têm 128MB de RAM).

**Cuidado:** Se alguém propuser `await response.arrayBuffer()` no ZIP do CVM, vai estourar memória. Manter o stream-parse atual.

---

## 4. Migrations Pendentes em Produção — AÇÃO REQUERIDA

Três migrations foram criadas mas **ainda não executadas em produção**. O código já está deployado esperando as tabelas.

| Migration | Tabela | Task | Comando |
|---|---|---|---|
| `004_asset_contributions.sql` | `asset_contributions` | INFRA-003 | `wrangler d1 execute quanto-db --remote --file=migrations/004_asset_contributions.sql` |
| `005_goods.sql` | `goods` | INFRA-004 | `wrangler d1 execute quanto-db --remote --file=migrations/005_goods.sql` |
| `006_macro_cache.sql` | `macro_cache` | INFRA-002 | `wrangler d1 execute quanto-db --remote --file=migrations/006_macro_cache.sql` |

**Impacto atual:** Os endpoints de aportes, bens e benchmarks macro retornam silenciosamente null/empty (try/catch no portfolio os protege). Sem crash, mas sem funcionalidade.

**Antes de executar:** Sempre verificar o SQL da migration. Nunca executar `--local` quando quer `--remote`.

---

## 5. Checklist de Code Review — O Que Verificar

### Segurança (p0 — bloquear o PR se falhar)

- [ ] Toda query que acessa dados do usuário tem `user_id = ?` no WHERE
- [ ] Nenhuma concatenação de string em SQL (usar `?` bind parameters sempre)
- [ ] Validação de enum antes de gravar (`VALID_INSTITUTIONS`, `VALID_CLASSES`, `VALID_STATUSES`)
- [ ] JWT_SECRET vem do `c.env.JWT_SECRET`, não hardcoded
- [ ] Nenhum dado sensível logado em `console.log` (password_hash, token)

### Performance (p1 — pedir revisão se falhar)

- [ ] Queries novas não criam N+1 (não fazer query dentro de `.map()`)
- [ ] Aggregações ficam em SQL, não em JS
- [ ] Fetch externo (BRAPI/CVM) tem try/catch e não bloqueia a response principal
- [ ] Workers AI calls são fire-and-forget ou têm timeout adequado
- [ ] Cron novo não ultrapassa 35 invocações/dia (limite free tier: 500/dia)

### Consistência (p2 — feedback de melhoria)

- [ ] Campos de resposta em camelCase (API contract)
- [ ] Soft delete, nunca hard delete em `assets`, `goods`, `snapshots`
- [ ] UPSERT para operações idempotentes
- [ ] Nenhum `npm install` no frontend
- [ ] Nenhuma dependência nova no frontend (Vanilla JS — sem framework)

### Tipagem TypeScript

- [ ] `npm run typecheck` passa com 0 erros antes do merge
- [ ] Tipos Hono (`Bindings`, `Variables`) propagados corretamente
- [ ] Nenhum `as any` sem justificativa no comentário

---

## 6. Bugs Confirmados pelo Carlos na Auditoria (FEAT-023)

Registrado aqui para que Carlos já saiba o estado:

| Bug | Descrição | Status |
|---|---|---|
| `display_name` no portfolio | `mapAsset()` não inclui `display_name` no response — frontend tem campo mas API não manda | **ABERTO** |
| TABS swipe | Swipe horizontal de tabs possivelmente quebrado | **ABERTO** |
| FII em contributions | `ACCEPTS_CONTRIBUTIONS` inclui 'FII' mas `VALID_CLASSES` não tem FII — FII é tratado como ACAO | **ABERTO** (FII não existe como classe, é ACAO) |
| schema.sql desatualizado | `schema.sql` não tem as tabelas `asset_contributions`, `goods`, `macro_cache` | **ABERTO** — schema.sql é referência, migrations são truth |
| JWT hardcoded | `wrangler.toml` tem JWT_SECRET em texto plano | **CRÍTICO — ABERTO** |
| BRAPI sem token | Auditoria identificou que BRAPI_TOKEN pode estar ausente em alguns deploys | Verificar secret configurado |

---

## 7. Padrões de Erro — Como Respondemos

```typescript
// Validação: 400 com details
return c.json({ error: 'Invalid request body', details: errors }, 400)

// Não autenticado: 401
return c.json({ error: 'Token ausente' }, 401)

// Não encontrado: 404
return c.json({ error: 'Asset not found' }, 404)

// Conflito: 409
return c.json({ error: 'Email já cadastrado' }, 409)

// Regra de negócio: 422
return c.json({ error: 'This asset class does not accept contributions' }, 422)

// Interno: 500 genérico (nunca expor stack trace)
return c.json({ error: 'Internal server error' }, 500)
```

**Regra:** Errors que chegam ao usuário ficam em português. Logs internos ficam em inglês.

---

## 8. Estrutura de Arquivo — O Que Está Onde

```
src/
  index.ts   — App Hono completo: endpoints, cron handlers, helpers
  auth.ts    — hashPassword, verifyPassword, signToken, verifyToken
  cvm.ts     — refreshCvmQuotes, refreshCvmFundsCache, searchFunds

public/
  index.html — SPA single-page, 4 telas + 5 sheets no DOM
  app.js     — Toda a lógica frontend (auth, portfolio, bens, aportes, detalhe)
  style.css  — Design system: tokens CSS + componentes
  sw.js      — Service Worker v3

migrations/
  001_*.sql  — Schema inicial
  002_*.sql  — display_name no assets
  003_*.sql  — cvm_funds_cache
  004_*.sql  — asset_contributions ← PENDENTE em prod (INFRA-003)
  005_*.sql  — goods              ← PENDENTE em prod (INFRA-004)
  006_*.sql  — macro_cache        ← PENDENTE em prod (INFRA-002)

schema.sql   — Referência da spec (pode estar desatualizado vs migrations)
wrangler.toml — Config do Worker
```

---

## 9. Variáveis de Ambiente / Secrets

| Variável | Onde | Status |
|---|---|---|
| `JWT_SECRET` | `wrangler.toml` vars (!) | **MOVER PARA SECRET** urgente |
| `BRAPI_TOKEN` | Cloudflare secret | Verificar se está setado |
| `BRAPI_BASE_URL` | `wrangler.toml` vars | OK — não é secret |
| `AI` binding | `wrangler.toml` [ai] | OK — Workers AI |
| `DB` binding | `wrangler.toml` [[d1_databases]] | OK |

Comandos para secrets:
```bash
wrangler secret put JWT_SECRET
wrangler secret put BRAPI_TOKEN
wrangler secret list  # verifica o que está configurado
```

---

## 10. Próximas Decisões Arquiteturais Pendentes

Estas são discussões que ainda não tivemos — Carlos precisa conduzir:

### 10.1 Migrations em produção (imediato)
Executar INFRA-002, INFRA-003, INFRA-004 em sequência. Sem risco de breaking change (só ADD TABLE).

### 10.2 FII como classe própria vs ACAO
Atualmente FII é mapeado como `ACAO` (classe mais próxima). A spec não lista FII como classe separada. Decidir se vira `FII` ou fica como está. Impacto: `ACCEPTS_CONTRIBUTIONS` tem 'FII' mas não existe no enum.

### 10.3 `display_name` no response do portfolio
`mapAsset()` no GET /api/portfolio não inclui `display_name`. Frontend tem o campo. Adicionar uma linha — mas validar o impacto no frontend antes.

### 10.4 JWT Secret em produção
Ação não-técnica mas crítica: mover JWT_SECRET para Cloudflare Secret antes de qualquer usuário real usar o sistema.

### 10.5 Telas pendentes (UI)
FEAT-005 (Hoje), FEAT-006 (Carteira), FEAT-007 (Histórico), FEAT-008 (Import XLSX) — todas `backlog`. Backend está pronto. Marina ou claude precisam implementar.

---

## 11. O Que Renata Precisa Saber

- **Renata NÃO precisa revisar decisões técnicas** — Carlos tem autonomia total em code review técnico
- Para mudanças que afetam UX ou contratos de API: Carlos consulta Renata antes de implementar
- Para mudanças puramente internas (refactor, segurança, performance): Carlos decide sozinho
- Thiago (como SM) facilita se houver impasse entre Carlos e Renata em decisões técnicas com impacto de produto

---

## 12. Referências Rápidas

- Spec funcional: `docs/SPEC_FUNCIONAL_v1.md`
- Spec técnica: `docs/QUANTO_SPEC_v4.md`
- OpenAPI: `docs/api-spec.yaml`
- QA report: `docs/QA_REPORT_2026-06-16.md`
- Limites Cloudflare Workers: https://developers.cloudflare.com/workers/platform/limits/
- Limites D1: https://developers.cloudflare.com/d1/platform/limits/
