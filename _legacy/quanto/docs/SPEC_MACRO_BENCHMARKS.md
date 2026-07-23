# SPEC — Benchmarks Macroeconômicos (CDI · SELIC · IPCA)

> Status: **backlog** — spec aprovada, implementação futura  
> Aprovado em: 2026-06-14  
> Depende de: FEAT-005 (Tela Hoje concluída)  
> Tasks relacionadas: FEAT-016, INFRA-002

---

## 1. Visão Geral

### Motivação

O Quanto mostra "Quanto você tem, de fato." — mas sem referência, o número não tem contexto. Um patrimônio que rendeu +3% no ano pode ser ótimo ou medíocre, dependendo de onde o dinheiro estava. CDI, SELIC e IPCA são as três réguas que o investidor brasileiro usa instintivamente.

Esta feature adiciona esses três benchmarks como **dado contextual passivo** — exibidos discretamente ao lado dos números, sem recomendar ação nenhuma.

### O que a feature faz

- Busca CDI anual, SELIC e IPCA 12m via `BRAPI /api/v2/macro/latest` uma vez por dia
- Armazena em nova tabela `macro_cache` no D1
- Expõe via campo `benchmarks` no `GET /api/portfolio` (zero requisições extras do frontend)
- Exibe em três pontos da UI: barra de contexto na Tela Hoje, cabeçalho RF na Carteira, e painel de Histórico

### O que a feature **não** faz

- Não calcula "% do CDI" por ativo individual (requereria taxa contratada por ativo, não armazenada)
- Não recomenda ação com base nos índices
- Não acumula histórico de CDI/SELIC/IPCA (apenas valor mais recente)
- Não usa endpoints pagos da BRAPI além do plano atual
- Não cria nova tela ou novo endpoint público

---

## 2. Dados Disponíveis

### Endpoint BRAPI

```
GET https://brapi.dev/api/v2/macro/latest
     ?symbols=cdi,selic,ipca12m
     &token={BRAPI_TOKEN}
```

**Resposta esperada:**
```json
{
  "results": [
    {
      "slug": "cdi",
      "name": "Taxa CDI",
      "unit": "percentPerYear",
      "latestValue": 13.15,
      "latestDate": "2026-06-13"
    },
    {
      "slug": "selic",
      "name": "Taxa Selic",
      "unit": "percentPerYear",
      "latestValue": 13.25,
      "latestDate": "2026-06-13"
    },
    {
      "slug": "ipca12m",
      "name": "IPCA acumulado 12 meses",
      "unit": "percent",
      "latestValue": 4.83,
      "latestDate": "2026-05-31"
    }
  ],
  "requestedAt": "2026-06-14T12:00:00Z",
  "took": 42
}
```

**Slugs utilizados:**

| Slug | Significado | Unidade | Frequência de atualização |
|---|---|---|---|
| `cdi` | Taxa CDI ao ano | % a.a. | Diária (dias úteis) |
| `selic` | Taxa Selic ao ano | % a.a. | Diária (dias úteis) |
| `ipca12m` | IPCA acumulado 12m | % acumulado | Mensal |

### Custo / Limites BRAPI

- 1 requisição por dia = ~30 req/mês
- Plano free: 15.000 req/mês — **não impacta quota de cotações**
- Token existente (`BRAPI_TOKEN`) já está configurado no `wrangler.toml`
- Nenhum custo incremental nem upgrade de plano necessário

---

## 3. Schema — Nova Tabela `macro_cache`

### Migration SQL

Criar arquivo `schema_macro_cache.sql` (a ser aplicado via `wrangler d1 execute`):

```sql
-- Quanto · Migration: macro_cache
-- Adiciona tabela de cache de indicadores macroeconômicos

CREATE TABLE IF NOT EXISTS macro_cache (
  slug           TEXT PRIMARY KEY,   -- 'cdi' | 'selic' | 'ipca12m'
  value          REAL NOT NULL,      -- valor percentual (ex: 13.15 para 13,15% a.a.)
  reference_date TEXT,               -- data de referência do índice (YYYY-MM-DD)
  fetched_at     TEXT NOT NULL       -- timestamp da última atualização (ISO 8601 UTC)
);
```

**Por que uma tabela nova e não reusar `quotes_cache`?**

A `quotes_cache` armazena preços de ativos (ações, FIIs, cotas CVM) com semântica diferente: `ticker` → `price` em reais. Macroíndices são taxas percentuais, não preços. Misturar causaria ambiguidade e dificultaria queries e manutenção.

### Registros esperados após primeira execução

| slug | value | reference_date |
|---|---|---|
| `cdi` | `13.15` | `2026-06-13` |
| `selic` | `13.25` | `2026-06-13` |
| `ipca12m` | `4.83` | `2026-05-31` |

---

## 4. Backend — Função `refreshMacroIndicators()`

### Localização

Nova função em `src/index.ts`, próxima ao helper `refreshQuotes()` existente (linha ~905).

### Implementação

```ts
async function refreshMacroIndicators(db: D1Database, env: Bindings): Promise<void> {
  const baseUrl = env.BRAPI_BASE_URL ?? 'https://brapi.dev/api'
  const token   = env.BRAPI_TOKEN
  const symbols = 'cdi,selic,ipca12m'
  const url = token
    ? `${baseUrl}/v2/macro/latest?symbols=${symbols}&token=${token}`
    : `${baseUrl}/v2/macro/latest?symbols=${symbols}`

  try {
    const resp = await fetch(url)
    if (!resp.ok) return  // Non-fatal: use stale cache

    const data = await resp.json<{
      results?: {
        slug: string
        latestValue: number
        latestDate: string
      }[]
    }>()

    if (!data.results?.length) return

    const stmts = data.results
      .filter(r => ['cdi', 'selic', 'ipca12m'].includes(r.slug))
      .map(r =>
        db
          .prepare(
            `INSERT INTO macro_cache (slug, value, reference_date, fetched_at)
             VALUES (?, ?, ?, datetime('now'))
             ON CONFLICT(slug) DO UPDATE
               SET value          = excluded.value,
                   reference_date = excluded.reference_date,
                   fetched_at     = excluded.fetched_at`
          )
          .bind(r.slug, r.latestValue, r.latestDate ?? null)
      )

    if (stmts.length > 0) {
      await db.batch(stmts)
    }
  } catch {
    // Non-fatal: stale data is acceptable for macro indicators
  }
}
```

**Regras:**
- Falha silenciosa: se BRAPI estiver indisponível, mantém cache anterior
- Upsert idempotente: re-executar não duplica registros
- Filtra slugs explicitamente para evitar inserir dados inesperados

---

## 5. Cron — Integração no Scheduler Existente

### `wrangler.toml` — sem alteração de crons

O cron `0 12 * * *` já existe para cotações BRAPI diárias. Macro indicators são coletados **na mesma execução**, aproveitando o mesmo gatilho.

```toml
# wrangler.toml — sem alteração necessária
[triggers]
crons = [
  "0 12 * * *",   # cotacoes BRAPI diarias + macro indicators
  "0 12 1 * *",   # snapshot mensal
  "0 22 * * 1-5", # cotas CVM diarias
  "0 23 2 * *"    # cadastro CVM mensal
]
```

### Modificação no `scheduled()` handler

```ts
// src/index.ts — handler scheduled existente
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    if (event.cron === '0 12 * * *') {
      // Ambas as funções rodam em paralelo no mesmo cron
      ctx.waitUntil(Promise.all([
        refreshQuotes(env.DB, env),
        refreshMacroIndicators(env.DB, env),  // NOVO
      ]))
    } else if (event.cron === '0 12 1 * *') {
      ctx.waitUntil(runMonthlySnapshot(env.DB))
    } else if (event.cron === '0 22 * * 1-5') {
      ctx.waitUntil(refreshCvmQuotes(env.DB))
    } else if (event.cron === '0 23 2 * *') {
      ctx.waitUntil(refreshCvmFundsCache(env.DB))
    }
  },
}
```

**Por que não criar um novo cron separado?**

CDI/SELIC/IPCA mudam com a mesma frequência que as cotações (ou menos). Agregar no mesmo cron minimiza complexidade operacional e mantém o painel Fleet alinhado.

---

## 6. API — Modificação em `GET /api/portfolio`

### Campo `benchmarks` no response

Adicionar ao `GET /api/portfolio` após as queries existentes:

```ts
// Buscar benchmarks macro do cache
const macroRows = await db
  .prepare(`SELECT slug, value, reference_date, fetched_at FROM macro_cache`)
  .all<{ slug: string; value: number; reference_date: string | null; fetched_at: string }>()

const macroMap = Object.fromEntries(macroRows.results.map(r => [r.slug, r]))

const benchmarks = {
  cdi:     macroMap['cdi']     ? { value: macroMap['cdi'].value,     referenceDate: macroMap['cdi'].reference_date }     : null,
  selic:   macroMap['selic']   ? { value: macroMap['selic'].value,   referenceDate: macroMap['selic'].reference_date }   : null,
  ipca12m: macroMap['ipca12m'] ? { value: macroMap['ipca12m'].value, referenceDate: macroMap['ipca12m'].reference_date } : null,
  fetchedAt: macroMap['cdi']?.fetched_at ?? null,
}
```

Incluir no `return c.json({ ... })` existente:

```ts
return c.json({
  userName,
  total: totalBalance,
  invested: totalInvested,
  gain,
  gainPct,
  quotesFetchedAt: latestQuote?.fetched_at ?? null,
  benchmarks,          // NOVO
  freshness: { ... },
  byInstitution,
  byClass,
  assets: activeAssets.results.map(mapAsset),
  redeeming: redeemingAssets.results.map(mapAsset),
})
```

### Response shape completo de `benchmarks`

```ts
type Benchmarks = {
  cdi:     { value: number; referenceDate: string | null } | null
  selic:   { value: number; referenceDate: string | null } | null
  ipca12m: { value: number; referenceDate: string | null } | null
  fetchedAt: string | null
}
```

**Quando `benchmarks.cdi` é `null`?**  
Somente antes da primeira execução do cron (ambiente fresh / nova instância D1). A partir do primeiro `0 12 * * *` bem-sucedido, os três campos são populados e permanecem válidos indefinidamente via upsert.

**Tratamento de cache velho:**  
Não há expiração forçada no lado do servidor. O frontend exibe o valor com a `referenceDate`, dando transparência ao usuário. CDI e SELIC mudam somente em reuniões do COPOM (a cada ~45 dias), então um cache de 24h é mais que suficiente.

---

## 7. Frontend — Integração nos Três Pontos

### 7.1 Tela Hoje — Barra de contexto

**Onde:** Abaixo do card de ganho/retorno, acima da alocação.

**Quando exibir:** Sempre que `benchmarks.cdi !== null`.

**Layout:**

```
┌─────────────────────────────────────────────────┐
│  Referências de mercado                         │
│  CDI  13,15% a.a.  ·  SELIC  13,25% a.a.  ·  IPCA 12m  4,83%  │
└─────────────────────────────────────────────────┘
```

**Regras de exibição (RN):**

- **RN-B01:** Exibir os três indicadores em linha única, separados por ` · `
- **RN-B02:** Formato de valor: `X,XX% a.a.` para CDI e SELIC; `X,XX%` para IPCA 12m
- **RN-B03:** Se `gainPct` estiver disponível e for positivo, exibir comparação discreta abaixo da barra: `"Seu retorno: +X,X% · CDI: X,X% a.a."` — sem julgamento de valor
- **RN-B04:** Se `gainPct` for `null` (invested não preenchido), suprimir a linha de comparação
- **RN-B05:** Toda a barra some quando `total === 0` (carteira vazia, empty state ativo)
- **RN-B06:** Ao tocar/clicar em qualquer indicador, não fazer nada (não é interativo — é dado)
- **RN-B07:** Texto de rodapé sutil com a data de referência: `"Atualizado em DD/MM/AAAA"` usando `benchmarks.fetchedAt`

**HTML / CSS reference:**

```html
<section class="benchmarks-bar" id="benchmarks-bar" hidden>
  <span class="benchmarks-label">Referências</span>
  <div class="benchmarks-values">
    <span class="bm-item">
      <span class="bm-name">CDI</span>
      <span class="bm-value" id="bm-cdi">–</span>
    </span>
    <span class="bm-sep">·</span>
    <span class="bm-item">
      <span class="bm-name">SELIC</span>
      <span class="bm-value" id="bm-selic">–</span>
    </span>
    <span class="bm-sep">·</span>
    <span class="bm-item">
      <span class="bm-name">IPCA 12m</span>
      <span class="bm-value" id="bm-ipca">–</span>
    </span>
  </div>
  <span class="benchmarks-date" id="bm-date"></span>
</section>
```

```css
.benchmarks-bar {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 16px;
  background: var(--surface-raised);
  border-radius: 10px;
  margin: 0 16px 12px;
}

.benchmarks-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
}

.benchmarks-values {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.bm-item {
  display: flex;
  gap: 4px;
  align-items: baseline;
}

.bm-name {
  font-size: 11px;
  color: var(--text-secondary);
}

.bm-value {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.bm-sep {
  color: var(--text-tertiary);
  font-size: 11px;
}

.benchmarks-date {
  font-size: 10px;
  color: var(--text-tertiary);
}
```

**JavaScript (renderização):**

```js
function renderBenchmarks(benchmarks) {
  const bar = document.getElementById('benchmarks-bar')
  if (!benchmarks?.cdi) { bar.hidden = true; return }

  const fmt = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  document.getElementById('bm-cdi').textContent   = `${fmt(benchmarks.cdi.value)}% a.a.`
  document.getElementById('bm-selic').textContent = `${fmt(benchmarks.selic.value)}% a.a.`
  document.getElementById('bm-ipca').textContent  = `${fmt(benchmarks.ipca12m.value)}%`

  if (benchmarks.fetchedAt) {
    const d = new Date(benchmarks.fetchedAt)
    document.getElementById('bm-date').textContent =
      `Ref. ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
  }

  bar.hidden = false
}
```

---

### 7.2 Tela Carteira — Cabeçalho do grupo RF

**Onde:** Ao lado do título do grupo de classe `RF` (Renda Fixa) na lista agrupada por classe.

**Quando exibir:** Somente quando o agrupamento ativo for **por classe** E o grupo RF existir E `benchmarks.cdi !== null`.

**Layout:**

```
Renda Fixa  (4 ativos)                    CDI: 13,15% a.a.
──────────────────────────────────────────────────────────
  CDB XP 109% CDI                              R$ 88.000
  LCI Itaú                                     R$ 22.000
  ...
```

**Regras:**

- **RN-B08:** O badge CDI aparece somente no cabeçalho do grupo `RF`, nunca em outros grupos (ACAO, FUNDO, etc.)
- **RN-B09:** Quando o agrupamento for por instituição, não exibir CDI nos cabeçalhos de instituição (contexto ambíguo)
- **RN-B10:** O badge é somente leitura, sem tooltip ou ação
- **RN-B11:** Se a lista RF estiver vazia (sem ativos RF), o cabeçalho e o badge não aparecem

**HTML:**

```html
<div class="group-header">
  <span class="group-title">Renda Fixa</span>
  <span class="group-count">(4 ativos)</span>
  <span class="group-benchmark" id="group-rf-cdi" hidden>
    CDI: <strong id="group-rf-cdi-value">–</strong>
  </span>
</div>
```

**JavaScript:**

```js
function renderGroupBenchmarks(benchmarks, byClass) {
  const rfGroup = byClass.find(g => g.class === 'RF')
  const badge = document.getElementById('group-rf-cdi')
  if (!rfGroup || !benchmarks?.cdi) { badge.hidden = true; return }

  const fmt = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  document.getElementById('group-rf-cdi-value').textContent = `${fmt(benchmarks.cdi.value)}% a.a.`
  badge.hidden = false
}
```

---

### 7.3 Tela Histórico — Referência textual

**Onde:** Acima ou abaixo do gráfico SVG de evolução mensal.

**Quando exibir:** Quando há pelo menos 1 snapshot E `benchmarks.selic !== null`.

**Layout:**

```
Evolução do patrimônio
                                           Selic atual: 13,25% a.a.
  [gráfico SVG]
```

**Regras:**

- **RN-B12:** Exibir SELIC (não CDI) na tela de Histórico — SELIC é o referencial usado para Tesouro e é mais conhecido pelo público geral
- **RN-B13:** Não traçar linha de CDI acumulado no gráfico SVG (requereria série histórica mensal — fora de escopo desta spec; ver Stretch Goals)
- **RN-B14:** Texto posicionado como `caption` discreto, não sobreposição no gráfico

---

## 8. Regras de Negócio Consolidadas

| ID | Regra |
|---|---|
| RN-B01 | Três indicadores exibidos: CDI, SELIC, IPCA 12m |
| RN-B02 | Formato CDI/SELIC: `X,XX% a.a.` / IPCA: `X,XX%` |
| RN-B03 | Comparação gain vs CDI só quando gainPct disponível e positivo |
| RN-B04 | Sem comparação quando invested não preenchido (gainPct = null) |
| RN-B05 | Barra de benchmarks oculta quando carteira vazia |
| RN-B06 | Indicadores não são interativos |
| RN-B07 | Data de referência exibida como rodapé discreto |
| RN-B08 | Badge CDI na Carteira só no cabeçalho do grupo RF |
| RN-B09 | Badge CDI não aparece em agrupamento por instituição |
| RN-B10 | Badge CDI é somente leitura |
| RN-B11 | Badge CDI não aparece se grupo RF estiver vazio |
| RN-B12 | Tela Histórico exibe SELIC, não CDI |
| RN-B13 | Sem linha de CDI acumulado no gráfico SVG (fora de escopo) |
| RN-B14 | Texto de SELIC no Histórico é caption discreto |
| RN-B15 | `benchmarks` null-safe: UI não quebra se cache vazio |
| RN-B16 | Cache velho (> 24h por falha de BRAPI) é melhor que nenhum — não expirar forçadamente |

---

## 9. Tratamento de Erros e Fallback

### Cenário 1 — BRAPI indisponível no cron

`refreshMacroIndicators()` retorna sem lançar erro. O cache anterior permanece válido. CDI/SELIC mudam apenas em reuniões do COPOM (intervalo mínimo de ~45 dias), então o cache envelhece graciosamente.

### Cenário 2 — `macro_cache` ainda vazia (ambiente novo)

`GET /api/portfolio` retorna `benchmarks: { cdi: null, selic: null, ipca12m: null, fetchedAt: null }`.  
O frontend oculta toda a barra de benchmarks via `hidden` (RN-B15).  
Sem mensagem de erro para o usuário.

### Cenário 3 — Slug ausente na resposta da BRAPI

O `.filter(r => ['cdi', 'selic', 'ipca12m'].includes(r.slug))` ignora slugs desconhecidos. Se um slug esperado não vier na resposta, seu registro anterior no cache fica intacto.

### Cenário 4 — D1 indisponível durante a query de benchmarks

A query de `macro_cache` pode lançar exceção. O handler atual de `GET /api/portfolio` tem try/catch global que retorna 500. **Alternativa:** envolver somente a query de macro em try/catch isolado e retornar `benchmarks: null` para não derrubar o endpoint inteiro.

**Implementação recomendada:**

```ts
let benchmarks = null
try {
  const macroRows = await db
    .prepare(`SELECT slug, value, reference_date, fetched_at FROM macro_cache`)
    .all<MacroRow>()
  // ... montar objeto benchmarks
} catch {
  // Non-fatal: benchmarks fica null, portfolio continua funcionando
}
```

---

## 10. OpenAPI — Atualização em `docs/api-spec.yaml`

Adicionar ao schema da resposta de `GET /api/portfolio`:

```yaml
benchmarks:
  type: object
  nullable: true
  properties:
    cdi:
      type: object
      nullable: true
      properties:
        value:         { type: number, example: 13.15 }
        referenceDate: { type: string, format: date, nullable: true, example: "2026-06-13" }
    selic:
      type: object
      nullable: true
      properties:
        value:         { type: number, example: 13.25 }
        referenceDate: { type: string, format: date, nullable: true, example: "2026-06-13" }
    ipca12m:
      type: object
      nullable: true
      properties:
        value:         { type: number, example: 4.83 }
        referenceDate: { type: string, format: date, nullable: true, example: "2026-05-31" }
    fetchedAt:
      type: string
      format: date-time
      nullable: true
      example: "2026-06-14T12:00:00Z"
```

---

## 11. Custo e Impacto Operacional

| Item | Impacto |
|---|---|
| Requisições BRAPI extras | +1/dia (+~30/mês) — plano free não é afetado |
| Armazenamento D1 | +3 linhas na `macro_cache` — negligível |
| Latência `GET /api/portfolio` | +1 query D1 local (~2ms) — imperceptível |
| Crons adicionais | Nenhum — agrega no cron existente `0 12 * * *` |
| Custo total | **R$ 0** |

---

## 12. Checklist de Implementação

### Pré-requisitos
- [ ] FEAT-005 (Tela Hoje) concluída
- [ ] FEAT-006 (Tela Carteira) concluída

### INFRA-002 — Schema macro_cache
- [ ] Criar `schema_macro_cache.sql` com `CREATE TABLE macro_cache`
- [ ] Aplicar em D1: `wrangler d1 execute quanto-db --remote --file=schema_macro_cache.sql`
- [ ] Verificar criação: `wrangler d1 execute quanto-db --remote --command="SELECT name FROM sqlite_master WHERE type='table'"`

### FEAT-016 — Backend
- [ ] Adicionar `refreshMacroIndicators()` em `src/index.ts`
- [ ] Atualizar `scheduled()` handler para chamar `refreshMacroIndicators` junto com `refreshQuotes` no cron `0 12 * * *`
- [ ] Adicionar query de `macro_cache` em `GET /api/portfolio` com try/catch isolado
- [ ] Incluir campo `benchmarks` no `return c.json()`
- [ ] Testar trigger manual do cron: `wrangler dev` + `curl localhost:8787/__scheduled?cron=0+12+*+*+*`
- [ ] Verificar dados em D1: `wrangler d1 execute quanto-db --remote --command="SELECT * FROM macro_cache"`

### FEAT-016 — Frontend (Tela Hoje)
- [ ] Adicionar `#benchmarks-bar` ao HTML da Tela Hoje
- [ ] Implementar `renderBenchmarks(benchmarks)` no JS
- [ ] Chamar `renderBenchmarks()` após `loadPortfolio()` retornar
- [ ] Testar: carteira vazia → barra hidden; carteira com dados → barra visível
- [ ] Testar: `benchmarks.cdi === null` → barra hidden (sem erro)

### FEAT-016 — Frontend (Tela Carteira)
- [ ] Adicionar `#group-rf-cdi` ao template do cabeçalho de grupo RF
- [ ] Implementar `renderGroupBenchmarks()` no JS
- [ ] Testar: agrupamento por classe + RF existe → badge visível
- [ ] Testar: agrupamento por instituição → badge ausente
- [ ] Testar: sem ativos RF → badge ausente

### FEAT-016 — Frontend (Tela Histórico)
- [ ] Adicionar caption de SELIC acima/abaixo do gráfico SVG
- [ ] Ocultar caption quando `benchmarks.selic === null`

### FEAT-016 — Documentação
- [ ] Atualizar `docs/api-spec.yaml` com schema `benchmarks`
- [ ] Atualizar comentário do cron `0 12 * * *` no `wrangler.toml`

---

## 13. Stretch Goals (fora desta spec)

Estas extensões foram identificadas e descartadas conscientemente para manter o escopo focado. Podem virar specs próprias no futuro.

| Stretch | O que exigiria | Complexidade |
|---|---|---|
| CDI acumulado vs portfolio no gráfico histórico | Série histórica mensal de CDI via BRAPI `/api/v2/macro/series` | Alta — nova query, novo processamento de série, mudança no SVG |
| "% do CDI" por ativo RF | Campo `rate_pct_cdi` na tabela `assets` | Média — schema + UI de cadastro |
| Retorno real (gain − IPCA) | Apenas cálculo frontend com dados já disponíveis | Baixa — mas requer validação conceitual |
| Alerta quando SELIC/CDI mudam | Comparar valor novo vs cached, notificar via UI | Média — lógica de diff no cron |
