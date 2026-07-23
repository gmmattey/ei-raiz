# SPEC — Tela de Detalhe do Ativo

> Status: **backlog** — spec aprovada, implementação futura  
> Aprovado em: 2026-06-14  
> Depende de: FEAT-006 (Tela Carteira), INFRA-003 (asset_contributions)  
> Tasks relacionadas: SPEC-007, FEAT-017  
> Relacionada a: SPEC_APORTES.md (FEAT-018), SPEC_AI_FEATURES.md (FEAT-015)

---

## 1. Visão Geral

### Motivação

Hoje, tocar em um ativo na Carteira abre o Sheet B (edição). O usuário que quer **entender** o ativo — cotação histórica, gain, contexto no patrimônio — não tem onde ir. Precisa abrir o app da corretora, perder o contexto do total consolidado.

O valor do Quanto não é ter os dados da XP (a XP tem). É mostrar esses dados **no contexto do patrimônio total consolidado**: BOVA11 vale R$ 5.925 e representa 8,2% do meu patrimônio — isso a XP não mostra.

### O que a feature faz

Cria uma **Tela de Detalhe do Ativo** acessada ao tocar em qualquer ativo na Carteira, com:

- Gráfico de cotação histórica (para ACAO/FII via BRAPI)
- Posição completa: quantidade, preço médio, valor atual, gain
- Contexto no patrimônio: % do total, % da classe
- Acesso ao Sheet B de edição ("Editar")
- Acesso ao aporte ("+ Aporte") — integra FEAT-018
- Botão de análise IA ("✦ Analisar") — integra FEAT-015

### O que não faz

- Não mostra histórico de cotas CVM no gráfico (MVP — ver Stretch Goals)
- Não mostra histórico de saldo manual no gráfico (MVP)
- Não exibe dividendos, proventos ou IR (anti-escopo)
- Não recomenda ação (anti-escopo)

---

## 2. Escopo por Tipo de Ativo

A tela se adapta ao tipo do ativo. Três variações:

### Variação A — ACAO / FII (auto, BRAPI)

| Componente | Exibe? | Fonte |
|---|---|---|
| Gráfico histórico de cotação | ✓ | BRAPI `/api/quote/{ticker}?range=...` |
| Preço atual + variação no dia | ✓ | `quotes_cache` (já disponível) |
| Seletor de período (1M/3M/6M/1A) | ✓ | Parâmetro `range` no BRAPI |
| Quantidade de cotas/ações | ✓ | `assets.qty` |
| Preço médio de compra | ✓ | `assets.invested ÷ assets.qty` |
| Valor atual da posição | ✓ | `qty × price` |
| Gain R$ e % | ✓ | `balance - invested` |
| % do patrimônio total | ✓ | `balance ÷ total_balance` |
| % da classe no patrimônio | ✓ | views existentes |
| Histórico de aportes | ✓ | `asset_contributions` (FEAT-018) |
| Botão Analisar (FEAT-015) | ✓ | — |

### Variação B — FUNDO (auto, CVM)

| Componente | Exibe? | Nota |
|---|---|---|
| Gráfico histórico de cotas | ✗ | Sem histórico no `quotes_cache` (stretch goal) |
| Cota atual | ✓ | `quotes_cache` via CNPJ |
| Quantidade de cotas | ✓ | `assets.qty` |
| Valor atual da posição | ✓ | `qty × cota` |
| Gain R$ e % | ✓ | `balance - invested` |
| Dados do fundo (gestor, CNPJ, classe ANBIMA) | ✓ | `cvm_funds_cache` |
| % do patrimônio total e da classe | ✓ | — |
| Histórico de aportes | ✓ | `asset_contributions` (FEAT-018) |
| Botão Analisar (FEAT-015) | ✓ | — |

### Variação C — RF / TESOURO / PREVIDENCIA / POUPANCA / COFRINHO (manual)

| Componente | Exibe? | Nota |
|---|---|---|
| Gráfico | ✗ | Sem série histórica (stretch goal com FEAT-018) |
| Saldo atual | ✓ | `assets.manual_balance` |
| Gain R$ e % | ✓ | Somente se `invested` preenchido |
| Frescor | ✓ | `balance_updated_at` → dias desde última atualização |
| % do patrimônio total e da classe | ✓ | — |
| Histórico de aportes | Somente RF/TESOURO | Apenas classes onde usuário aporta ativamente |
| Botão Analisar (FEAT-015) | ✓ | — |
| Botão Atualizar Saldo | ✓ | Atalho para Sheet A (saldo rápido) |

---

## 3. Navegação

### Mudança no comportamento de toque

**Antes:** tocar em ativo na Carteira → abre Sheet B (edição)  
**Depois:** tocar em ativo na Carteira → abre Tela de Detalhe

Sheet B permanece acessível via botão **"Editar"** na Tela de Detalhe.

### Hierarquia de navegação

```
Navbar → Carteira
  └── [tap ativo] → Tela Detalhe (push, back arrow no topo)
       ├── [Editar] → Sheet B (edit/remove) — comportamento atual
       ├── [+ Aporte] → Sheet de Aporte (FEAT-018)
       └── [✦ Analisar] → Sheet de Análise IA (FEAT-015)
```

### Header da tela

```
← Voltar                              [Editar]
```

- "← Voltar" fecha a tela e retorna à Carteira
- "Editar" abre o Sheet B existente sem fechar a tela de detalhe (overlay)

---

## 4. Layout — Variação A (ACAO/FII)

```
┌────────────────────────────────────────┐
│ ← Voltar                    [Editar]  │
├────────────────────────────────────────┤
│                                        │
│  BOVA11                                │
│  iShares Ibovespa ETF · XP             │
│  Renda Variável                        │
│                                        │
│  R$ 5.925,00                           │
│  +R$ 25,00  (+0,42%)  desde a compra  │
│                                        │
│  [1M]  [3M]  [6M]  [1A]              │
│ ┌──────────────────────────────────┐  │
│ │                                  │  │
│ │        gráfico SVG               │  │
│ │                                  │  │
│ └──────────────────────────────────┘  │
│  R$ 112,50 hoje  ▼ -0,8% no dia      │
│                                        │
│ ─ Sua posição ──────────────────────  │
│  Quantidade          50 ações          │
│  Preço médio         R$ 118,00        │
│  Valor atual         R$ 5.925,00      │
│                                        │
│ ─ Gain ─────────────────────────────  │
│  +R$ 25,00  (+0,42%)                  │
│  Investido: R$ 5.900,00               │
│                                        │
│ ─ Na carteira ──────────────────────  │
│  8,2% do patrimônio total             │
│  Renda Variável: 18% do total         │
│                                        │
│ ─ Aportes ──────────────────────────  │
│  3 aportes registrados                 │
│  Último: 15/05/2026                    │
│                           [Ver todos] │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │       ✦  Analisar ativo          │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │       +  Registrar Aporte        │  │
│ └──────────────────────────────────┘  │
│                                        │
└────────────────────────────────────────┘
```

---

## 5. Layout — Variação B (FUNDO CVM)

```
┌────────────────────────────────────────┐
│ ← Voltar                    [Editar]  │
├────────────────────────────────────────┤
│                                        │
│  BTG Pactual Logística FII             │
│  BTLG11 · XP · FII                    │
│                                        │
│  R$ 13.900,00                          │
│  +R$ 400,00  (+2,96%)  desde a compra │
│                                        │
│ ─ Dados do fundo ───────────────────  │
│  Gestor          BTG Pactual           │
│  Classe ANBIMA   FII - Tijolo          │
│  CNPJ            XX.XXX.XXX/0001-XX   │
│                                        │
│ ─ Sua posição ──────────────────────  │
│  Quantidade       1.174 cotas          │
│  Cota atual       R$ 11,84             │
│  Valor atual      R$ 13.900,00         │
│                                        │
│ ─ Gain ─────────────────────────────  │
│  +R$ 400,00  (+2,96%)                 │
│  Investido: R$ 13.500,00              │
│                                        │
│ ─ Na carteira ──────────────────────  │
│  5,6% do patrimônio total             │
│  FIIs: 10% do total                   │
│                                        │
│        [✦ Analisar ativo]             │
│        [+  Registrar Aporte]          │
│                                        │
└────────────────────────────────────────┘
```

---

## 6. Layout — Variação C (Manual)

```
┌────────────────────────────────────────┐
│ ← Voltar                    [Editar]  │
├────────────────────────────────────────┤
│                                        │
│  Previdência Onze                      │
│  ONZE · Previdência                    │
│                                        │
│  R$ 52.800,00                          │
│  Atualizado há 31 dias  ⚠             │
│                                        │
│ ─ Gain ─────────────────────────────  │
│  +R$ 4.800,00  (+10,0%)               │
│  Investido: R$ 48.000,00              │
│                                        │
│ ─ Na carteira ──────────────────────  │
│  21,2% do patrimônio total            │
│  Previdência: 21% do total            │
│                                        │
│ ─ Atualização ──────────────────────  │
│  Última: 14/05/2026                    │
│  [⟳ Atualizar Saldo]                  │
│                                        │
│        [✦ Analisar ativo]             │
│                                        │
└────────────────────────────────────────┘
```

---

## 7. API — Novos Endpoints

### 7.1 `GET /api/assets/:id/detail`

Retorna dados completos do ativo com contexto do portfólio.

**Autenticação:** Bearer token (obrigatório)

**Parâmetros de path:** `id` — ID do ativo

**Resposta:**

```ts
{
  asset: {
    id: number
    institution: string
    institutionName: string | null
    class: AssetClass
    name: string
    ticker: string | null
    qty: number | null
    invested: number | null
    manualBalance: number | null
    price: number | null          // cotação atual (quotes_cache)
    balance: number               // valor atual calculado
    gain: number | null           // null se invested não preenchido
    gainPct: number | null        // null se invested não preenchido
    avgCost: number | null        // invested / qty (só para auto assets)
    quoteSource: 'BRAPI' | 'CVM' | null
    balanceUpdatedAt: string | null
    staleDays: number | null
    status: AssetStatus
  },
  fund: {                         // só para FUNDO (quote_source = 'CVM')
    cnpj: string
    denomSocial: string
    classe: string | null
    classeAnbima: string | null
    gestor: string | null
    admin: string | null
    vlPatrimLiq: number | null
  } | null,
  context: {
    portfolioTotal: number        // patrimônio total do usuário
    assetPct: number              // este ativo como % do total
    classPct: number              // classe deste ativo como % do total
    classTotal: number            // total da classe
    classAssetCount: number       // quantos ativos nesta classe
  },
  contributions: {                // lista de aportes (FEAT-018)
    id: number
    amount: number
    contributedAt: string
    note: string | null
  }[]
}
```

**Implementação:**

```ts
app.get('/api/assets/:id/detail', async (c) => {
  const userId = c.get('userId')
  const db = c.env.DB
  const id = Number(c.req.param('id'))

  if (!Number.isInteger(id) || id < 1) {
    return c.json({ error: 'Invalid asset id' }, 400)
  }

  // 1. Buscar ativo com cotação
  const asset = await db.prepare(`
    SELECT a.*, q.price,
      CASE
        WHEN a.ticker IS NOT NULL THEN a.qty * COALESCE(q.price, 0)
        ELSE COALESCE(a.manual_balance, 0)
      END AS balance,
      CASE
        WHEN a.balance_updated_at IS NOT NULL
          THEN CAST(julianday('now') - julianday(a.balance_updated_at) AS INTEGER)
        ELSE NULL
      END AS stale_days
    FROM assets a
    LEFT JOIN quotes_cache q ON q.ticker = a.ticker
    WHERE a.id = ? AND a.user_id = ? AND a.status != 'archived'
  `).bind(id, userId).first<AssetDetailRow>()

  if (!asset) return c.json({ error: 'Asset not found' }, 404)

  // 2. Contexto do portfólio
  const summary = await db.prepare(
    `SELECT total_balance FROM vw_portfolio_summary WHERE user_id = ?`
  ).bind(userId).first<{ total_balance: number }>()

  const classTotal = await db.prepare(`
    SELECT total_balance FROM vw_allocation_by_class
    WHERE user_id = ? AND class = ?
  `).bind(userId, asset.class).first<{ total_balance: number }>()

  const portfolioTotal = summary?.total_balance ?? 0
  const balance = asset.balance ?? 0

  // 3. Dados do fundo CVM (se aplicável)
  let fund = null
  if (asset.quote_source === 'CVM' && asset.ticker) {
    fund = await db.prepare(
      `SELECT cnpj, denom_social, classe, classe_anbima, gestor, admin, vl_patrim_liq
       FROM cvm_funds_cache WHERE cnpj = ?`
    ).bind(asset.ticker).first()
  }

  // 4. Aportes (FEAT-018)
  const contribResult = await db.prepare(`
    SELECT id, amount, contributed_at, note
    FROM asset_contributions
    WHERE asset_id = ? AND user_id = ?
    ORDER BY contributed_at DESC
  `).bind(id, userId).all()

  const invested = asset.invested ?? null
  const gain = invested ? balance - invested : null
  const gainPct = invested && invested > 0 ? ((balance / invested) - 1) * 100 : null
  const avgCost = asset.ticker && asset.qty && invested
    ? invested / asset.qty
    : null

  return c.json({
    asset: {
      id: asset.id,
      institution: asset.institution,
      institutionName: asset.institution_name ?? null,
      class: asset.class,
      name: asset.name,
      ticker: asset.ticker ?? null,
      qty: asset.qty ?? null,
      invested,
      manualBalance: asset.manual_balance ?? null,
      price: asset.price ?? null,
      balance,
      gain,
      gainPct,
      avgCost,
      quoteSource: asset.quote_source ?? (asset.ticker ? 'BRAPI' : null),
      balanceUpdatedAt: asset.balance_updated_at ?? null,
      staleDays: asset.stale_days ?? null,
      status: asset.status,
    },
    fund,
    context: {
      portfolioTotal,
      assetPct: portfolioTotal > 0 ? (balance / portfolioTotal) * 100 : 0,
      classPct: portfolioTotal > 0 ? ((classTotal?.total_balance ?? 0) / portfolioTotal) * 100 : 0,
      classTotal: classTotal?.total_balance ?? 0,
    },
    contributions: contribResult.results.map(r => ({
      id: r.id,
      amount: r.amount,
      contributedAt: r.contributed_at,
      note: r.note ?? null,
    })),
  })
})
```

---

### 7.2 `GET /api/assets/:id/history`

Proxy do histórico de cotações BRAPI. Somente para ativos com `quote_source = 'BRAPI'`.

**Parâmetros de query:** `period` — `1mo` | `3mo` | `6mo` | `1y` (default: `6mo`)

**Resposta:**

```ts
{
  ticker: string,
  period: string,
  dataPoints: {
    date: string    // 'YYYY-MM-DD'
    close: number   // preço de fechamento ajustado
  }[]
}
```

**Implementação:**

```ts
app.get('/api/assets/:id/history', async (c) => {
  const userId = c.get('userId')
  const db = c.env.DB
  const id = Number(c.req.param('id'))
  const period = c.req.query('period') ?? '6mo'

  const VALID_PERIODS = ['1mo', '3mo', '6mo', '1y']
  if (!VALID_PERIODS.includes(period)) {
    return c.json({ error: 'Invalid period' }, 400)
  }

  // Verificar que o ativo pertence ao usuário e é BRAPI
  const asset = await db.prepare(`
    SELECT ticker, quote_source FROM assets
    WHERE id = ? AND user_id = ? AND status != 'archived'
  `).bind(id, userId).first<{ ticker: string | null; quote_source: string | null }>()

  if (!asset) return c.json({ error: 'Asset not found' }, 404)

  const isbrapi = !asset.quote_source || asset.quote_source === 'BRAPI'
  if (!asset.ticker || !isbrapi) {
    return c.json({ error: 'History not available for this asset type' }, 422)
  }

  const baseUrl = c.env.BRAPI_BASE_URL ?? 'https://brapi.dev/api'
  const token = c.env.BRAPI_TOKEN
  const url = token
    ? `${baseUrl}/quote/${asset.ticker}?range=${period}&interval=1d&fundamental=false&dividends=false&token=${token}`
    : `${baseUrl}/quote/${asset.ticker}?range=${period}&interval=1d&fundamental=false&dividends=false`

  try {
    const resp = await fetch(url)
    if (!resp.ok) return c.json({ error: 'Failed to fetch history' }, 502)

    const data = await resp.json<{
      results?: {
        symbol: string
        historicalDataPrice?: { date: number; close: number }[]
      }[]
    }>()

    const result = data.results?.[0]
    if (!result?.historicalDataPrice?.length) {
      return c.json({ ticker: asset.ticker, period, dataPoints: [] })
    }

    const dataPoints = result.historicalDataPrice
      .filter(p => p.close > 0)
      .map(p => ({
        date: new Date(p.date * 1000).toISOString().slice(0, 10),
        close: p.close,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return c.json({ ticker: asset.ticker, period, dataPoints })
  } catch {
    return c.json({ error: 'Internal server error' }, 500)
  }
})
```

---

## 8. Frontend — Gráfico SVG

O gráfico usa o padrão SVG inline já estabelecido no Quanto (Tela Histórico). Linha simples, sem eixos elaborados.

### Dados de entrada

```js
// dataPoints: [{ date: '2026-01-02', close: 115.30 }, ...]
function renderPriceChart(dataPoints, containerId) {
  if (!dataPoints.length) return

  const W = 340, H = 120, PAD = 8

  const prices = dataPoints.map(d => d.close)
  const minP = Math.min(...prices)
  const maxP = Math.max(...prices)
  const range = maxP - minP || 1

  const pts = dataPoints.map((d, i) => {
    const x = PAD + (i / (dataPoints.length - 1)) * (W - PAD * 2)
    const y = PAD + (1 - (d.close - minP) / range) * (H - PAD * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const firstClose = prices[0]
  const lastClose  = prices[prices.length - 1]
  const up = lastClose >= firstClose
  const color = up ? 'var(--verde)' : 'var(--vinho)'

  document.getElementById(containerId).innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <polyline points="${pts.join(' ')}"
        fill="none" stroke="${color}" stroke-width="1.5"
        stroke-linejoin="round" stroke-linecap="round"/>
    </svg>`
}
```

### Seletor de período

```html
<div class="period-selector" role="group" aria-label="Período do gráfico">
  <button class="period-btn active" data-period="1mo">1M</button>
  <button class="period-btn" data-period="3mo">3M</button>
  <button class="period-btn" data-period="6mo">6M</button>
  <button class="period-btn" data-period="1y">1A</button>
</div>
```

Ao clicar, fetch `GET /api/assets/:id/history?period={period}` e re-renderiza o SVG. Mostra skeleton loader durante o fetch.

---

## 9. Regras de Negócio

| ID | Regra |
|---|---|
| RN-D01 | Tocar em ativo na Carteira abre a Tela de Detalhe (não Sheet B) |
| RN-D02 | "Editar" na Tela de Detalhe abre Sheet B como overlay |
| RN-D03 | Gráfico de cotação exibido somente para `quote_source = 'BRAPI'` |
| RN-D04 | Para CVM (FUNDO), gráfico omitido; exibir dados do fundo de `cvm_funds_cache` |
| RN-D05 | Para ativos manuais, gráfico omitido; exibir saldo e frescor |
| RN-D06 | Gain (R$ e %) exibido somente se `invested` estiver preenchido |
| RN-D07 | Preço médio (`avgCost`) exibido somente para ativos auto com `qty > 0` |
| RN-D08 | Período default do gráfico: 6M |
| RN-D09 | Ativos com `staleDays > 30` exibem alerta ⚠ e botão "Atualizar Saldo" |
| RN-D10 | Botão "✦ Analisar" sempre visível (integra FEAT-015) |
| RN-D11 | Botão "+ Aporte" visível para ACAO, FII, RF, TESOURO; oculto para PREVIDENCIA, POUPANCA, COFRINHO |
| RN-D12 | Seção "Aportes" exibe contagem e data do último; link "Ver todos" abre lista completa |
| RN-D13 | Se `contributions` vazio e botão Aporte visível, seção mostra "Nenhum aporte registrado" com link para registrar |
| RN-D14 | `context.assetPct` com 1 casa decimal; formatar como "8,2% do patrimônio total" |
| RN-D15 | Histórico do gráfico carregado sob demanda (lazy) após render inicial da tela |
| RN-D16 | Se `GET /api/assets/:id/history` retornar erro ou lista vazia, ocultar área do gráfico e exibir "Gráfico indisponível" |
| RN-D17 | Para fundos CVM, dados de `cvm_funds_cache` podem ser `null` se fundo não estiver no cache — exibir só o disponível |

---

## 10. Integração com FEAT-015 (Análise IA)

O botão "✦ Analisar" aciona `POST /api/ai/analyze` com:

```json
{ "context": "asset", "asset_id": 42 }
```

O Worker busca dados do ativo (já disponíveis no D1) e monta o contexto para o Qwen3. Sem custo extra de query — os dados do detalhe já foram carregados.

---

## 11. Integração com FEAT-018 (Aportes)

- O botão "+ Registrar Aporte" abre o Sheet de Aporte (FEAT-018)
- A seção "Aportes" exibe `contributions[]` retornado pelo `GET /api/assets/:id/detail`
- Após registrar um aporte, o detalhe recarrega para refletir o novo `invested` e gain

---

## 12. Checklist de Implementação

### Pré-requisito
- [ ] FEAT-006 (Tela Carteira) concluída
- [ ] INFRA-003 (tabela `asset_contributions`) aplicada — dependência de FEAT-018

### FEAT-017 — Backend

- [ ] Implementar `GET /api/assets/:id/detail` em `src/index.ts`
- [ ] Implementar `GET /api/assets/:id/history` em `src/index.ts`
- [ ] Testar Variação A (ACAO): BOVA11 com dados reais BRAPI
- [ ] Testar Variação B (FUNDO CVM): fundo com dados em `cvm_funds_cache`
- [ ] Testar Variação C (manual): Previdência sem ticker
- [ ] Testar ativo sem `invested` → gain = null, sem erro
- [ ] Testar período inválido em `/history` → 400

### FEAT-017 — Frontend

- [ ] Criar `public/detail.js` (ou modularizar em `public/app.js`)
- [ ] Alterar evento de tap na lista da Carteira: de abrir Sheet B para abrir Tela Detalhe
- [ ] Implementar navegação push/pop (back button funcional)
- [ ] Renderizar Variação A com gráfico SVG e seletor de período
- [ ] Renderizar Variação B com dados do fundo CVM
- [ ] Renderizar Variação C com saldo manual e alerta de frescor
- [ ] Lazy-load do gráfico após render inicial
- [ ] Skeleton loader durante fetch do histórico
- [ ] Botão "Editar" abre Sheet B (comportamento atual, só mover o gatilho)
- [ ] Botão "+ Aporte" → Sheet de Aporte (placeholder até FEAT-018)
- [ ] Botão "✦ Analisar" → Sheet de Análise (placeholder até FEAT-015)
- [ ] Testar: sem `invested` → gain oculto, sem quebra
- [ ] Testar: histórico indisponível → mensagem discreta, sem quebra
- [ ] Testar: back button retorna à posição de scroll da Carteira

### Documentação
- [ ] Atualizar `docs/api-spec.yaml` com os dois novos endpoints

---

## 13. Stretch Goals

| Stretch | O que exige | Complexidade |
|---|---|---|
| Gráfico de cotas CVM histórico | Nova tabela `cvm_fund_history` (1 row/dia/fundo) | Alta — impacto no cron CVM |
| Gráfico de saldo manual ao longo do tempo | Usar `asset_contributions` como série | Baixa — disponível após FEAT-018 |
| Variação vs benchmark no gráfico (ex: BOVA11 vs Ibovespa) | BRAPI suporta múltiplos tickers no mesmo request | Média — segunda linha no SVG |
| Dividendos / Proventos recebidos | Anti-escopo — não implementar | — |
