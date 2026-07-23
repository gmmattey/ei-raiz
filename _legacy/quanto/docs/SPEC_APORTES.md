# SPEC — Aportes Adicionais

> Status: **backlog** — spec aprovada, implementação futura  
> Aprovado em: 2026-06-14  
> Depende de: SPEC-007 (Tela de Detalhe), FEAT-017 (backend do detalhe)  
> Tasks relacionadas: SPEC-008, INFRA-003, FEAT-018

---

## 1. Visão Geral

### Motivação

Hoje o Quanto sabe **quanto você tem**, mas não sabe **quanto você colocou**. Sem essa informação, gain é impossível de calcular com precisão, e o usuário não consegue responder perguntas básicas:

- BOVA11 rendeu bem ou mal? Em quanto tempo?
- Esse fundo CVM está valorizando mais que o CDI?
- Quando foi meu último aporte nessa ação?

O campo `assets.invested` já existe no schema para armazenar o total investido. O problema é que hoje ele é preenchido manualmente e nunca atualizado. Aportes transforma esse campo em algo **derivado automaticamente** da soma dos aportes registrados.

### O que a feature faz

1. Cria a tabela `asset_contributions` — cada aporte é um evento: data, valor, nota
2. `assets.invested` passa a ser calculado como `SUM(amount)` dos aportes do ativo
3. Usuário registra aportes em ACAO, FII, RF e TESOURO (ativos onde decide ativamente quanto investir)
4. PREVIDENCIA, POUPANCA e COFRINHO ficam de fora — aportes nesses são automáticos, externos ou o usuário não sabe o valor exato

### O que não faz

- Não calcula rentabilidade com datas de compra por lote (preço médio ponderado por tempo) — anti-escopo
- Não registra venda ou resgate de cotas — anti-escopo
- Não registra proventos, dividendos ou come-cotas — anti-escopo
- Não registra aportes para PREVIDENCIA, POUPANCA, COFRINHO

---

## 2. Quais Ativos Aceitam Aportes

| Classe | Aceita Aportes? | Motivo |
|---|---|---|
| ACAO | ✓ | Usuário decide quando e quanto comprar |
| FII | ✓ | Usuário decide quando e quanto comprar |
| FUNDO | ✓ | Usuário aplica valores no fundo |
| RF | ✓ | CDB, LCA, LCI, debenture — usuário decide o montante |
| TESOURO | ✓ | Tesouro Direto — usuário faz aportes no site |
| PREVIDENCIA | ✗ | Automático (empresa + funcionário), valor exato desconhecido |
| POUPANCA | ✗ | Não rastreado por aporte neste MVP |
| COFRINHO | ✗ | Cofrinho informal, sem registro de entrada |

---

## 3. Schema — Nova Tabela

### `asset_contributions`

```sql
CREATE TABLE IF NOT EXISTS asset_contributions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id      INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id       TEXT    NOT NULL,
  amount        REAL    NOT NULL CHECK(amount > 0),
  contributed_at TEXT   NOT NULL,  -- ISO 8601, ex: '2026-05-15T10:00:00Z'
  note          TEXT,              -- opcional, ex: 'Comprei na baixa'
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contributions_asset
  ON asset_contributions(asset_id, contributed_at DESC);

CREATE INDEX IF NOT EXISTS idx_contributions_user
  ON asset_contributions(user_id, contributed_at DESC);
```

### Coluna adicionada em `assets`

`invested` já existe no schema como `REAL`. Nenhuma alteração de schema necessária. Mas o comportamento muda:

- **Antes:** `invested` é preenchido manualmente no cadastro e na edição (Sheet B)
- **Depois:** `invested` é recalculado automaticamente como `SUM(amount)` de `asset_contributions` sempre que um aporte é adicionado ou excluído

O campo continua editável manualmente no Sheet B para ativos sem aportes (compatibilidade retroativa e para casos onde o usuário não quer registrar aportes individuais).

---

## 4. Migration SQL

Arquivo: `migrations/004_asset_contributions.sql`

```sql
-- Up
CREATE TABLE IF NOT EXISTS asset_contributions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id       INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id        TEXT    NOT NULL,
  amount         REAL    NOT NULL CHECK(amount > 0),
  contributed_at TEXT    NOT NULL,
  note           TEXT,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contributions_asset
  ON asset_contributions(asset_id, contributed_at DESC);

CREATE INDEX IF NOT EXISTS idx_contributions_user
  ON asset_contributions(user_id, contributed_at DESC);
```

---

## 5. API — Novos Endpoints

### 5.1 `POST /api/assets/:id/contributions`

Registra um novo aporte.

**Autenticação:** Bearer token (obrigatório)

**Request body:**

```ts
{
  amount: number          // R$ do aporte (obrigatório, > 0)
  contributedAt: string   // ISO 8601 (obrigatório, não pode ser futuro)
  note?: string           // Observação opcional (max 200 chars)
}
```

**Resposta (201):**

```ts
{
  id: number
  assetId: number
  amount: number
  contributedAt: string
  note: string | null
  invested: number        // novo total de invested do ativo
}
```

**Implementação:**

```ts
app.post('/api/assets/:id/contributions', async (c) => {
  const userId = c.get('userId')
  const db = c.env.DB
  const assetId = Number(c.req.param('id'))
  const body = await c.req.json()

  if (!Number.isInteger(assetId) || assetId < 1) {
    return c.json({ error: 'Invalid asset id' }, 400)
  }

  // Validar que o ativo pertence ao usuário e aceita aportes
  const asset = await db.prepare(`
    SELECT id, class FROM assets
    WHERE id = ? AND user_id = ? AND status != 'archived'
  `).bind(assetId, userId).first<{ id: number; class: string }>()

  if (!asset) return c.json({ error: 'Asset not found' }, 404)

  const ACCEPTS_CONTRIBUTIONS = ['ACAO', 'FII', 'FUNDO', 'RF', 'TESOURO']
  if (!ACCEPTS_CONTRIBUTIONS.includes(asset.class)) {
    return c.json({ error: 'This asset class does not accept contributions' }, 422)
  }

  // Validar payload
  const { amount, contributedAt, note } = body
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return c.json({ error: 'amount must be a positive number' }, 400)
  }
  if (!contributedAt || typeof contributedAt !== 'string') {
    return c.json({ error: 'contributedAt is required' }, 400)
  }
  const ts = Date.parse(contributedAt)
  if (isNaN(ts) || ts > Date.now() + 60_000) {
    return c.json({ error: 'contributedAt must be a valid past date' }, 400)
  }
  if (note && (typeof note !== 'string' || note.length > 200)) {
    return c.json({ error: 'note must be a string up to 200 chars' }, 400)
  }

  // Inserir aporte
  const inserted = await db.prepare(`
    INSERT INTO asset_contributions (asset_id, user_id, amount, contributed_at, note)
    VALUES (?, ?, ?, ?, ?)
    RETURNING id
  `).bind(assetId, userId, amount, contributedAt, note ?? null).first<{ id: number }>()

  // Recalcular e persistir invested no asset
  const totals = await db.prepare(`
    SELECT SUM(amount) AS total FROM asset_contributions
    WHERE asset_id = ? AND user_id = ?
  `).bind(assetId, userId).first<{ total: number }>()

  const invested = totals?.total ?? amount
  await db.prepare(`UPDATE assets SET invested = ? WHERE id = ?`)
    .bind(invested, assetId).run()

  return c.json({
    id: inserted!.id,
    assetId,
    amount,
    contributedAt,
    note: note ?? null,
    invested,
  }, 201)
})
```

---

### 5.2 `GET /api/assets/:id/contributions`

Lista todos os aportes de um ativo, do mais recente ao mais antigo.

**Autenticação:** Bearer token (obrigatório)

**Resposta (200):**

```ts
{
  assetId: number
  total: number           // soma de todos os aportes (= assets.invested)
  count: number
  contributions: {
    id: number
    amount: number
    contributedAt: string
    note: string | null
    createdAt: string
  }[]
}
```

**Implementação:**

```ts
app.get('/api/assets/:id/contributions', async (c) => {
  const userId = c.get('userId')
  const db = c.env.DB
  const assetId = Number(c.req.param('id'))

  if (!Number.isInteger(assetId) || assetId < 1) {
    return c.json({ error: 'Invalid asset id' }, 400)
  }

  const asset = await db.prepare(`
    SELECT id FROM assets WHERE id = ? AND user_id = ? AND status != 'archived'
  `).bind(assetId, userId).first()

  if (!asset) return c.json({ error: 'Asset not found' }, 404)

  const result = await db.prepare(`
    SELECT id, amount, contributed_at, note, created_at
    FROM asset_contributions
    WHERE asset_id = ? AND user_id = ?
    ORDER BY contributed_at DESC
  `).bind(assetId, userId).all<{
    id: number; amount: number; contributed_at: string;
    note: string | null; created_at: string
  }>()

  const contributions = result.results ?? []
  const total = contributions.reduce((acc, r) => acc + r.amount, 0)

  return c.json({
    assetId,
    total,
    count: contributions.length,
    contributions: contributions.map(r => ({
      id: r.id,
      amount: r.amount,
      contributedAt: r.contributed_at,
      note: r.note ?? null,
      createdAt: r.created_at,
    })),
  })
})
```

---

### 5.3 `DELETE /api/assets/:id/contributions/:cid`

Remove um aporte. Recalcula `assets.invested` automaticamente.

**Autenticação:** Bearer token (obrigatório)

**Resposta (200):**

```ts
{
  deleted: true
  invested: number    // novo total após remoção
}
```

**Implementação:**

```ts
app.delete('/api/assets/:id/contributions/:cid', async (c) => {
  const userId = c.get('userId')
  const db = c.env.DB
  const assetId = Number(c.req.param('id'))
  const cid = Number(c.req.param('cid'))

  if (!Number.isInteger(assetId) || !Number.isInteger(cid)) {
    return c.json({ error: 'Invalid id' }, 400)
  }

  const contrib = await db.prepare(`
    SELECT id FROM asset_contributions
    WHERE id = ? AND asset_id = ? AND user_id = ?
  `).bind(cid, assetId, userId).first()

  if (!contrib) return c.json({ error: 'Contribution not found' }, 404)

  await db.prepare(
    `DELETE FROM asset_contributions WHERE id = ?`
  ).bind(cid).run()

  // Recalcular invested
  const totals = await db.prepare(`
    SELECT SUM(amount) AS total FROM asset_contributions
    WHERE asset_id = ? AND user_id = ?
  `).bind(assetId, userId).first<{ total: number | null }>()

  const invested = totals?.total ?? null
  await db.prepare(`UPDATE assets SET invested = ? WHERE id = ?`)
    .bind(invested, assetId).run()

  return c.json({ deleted: true, invested })
})
```

---

## 6. Impacto em Endpoints Existentes

### `GET /api/portfolio`

Sem mudanças na resposta. O campo `invested` em cada asset já existia. Agora passa a ser calculado a partir dos aportes em vez de ser preenchido manualmente.

### `GET /api/assets/:id/detail` (FEAT-017)

Retorna `contributions[]` na resposta. Já especificado em SPEC_ASSET_DETAIL.md.

### `PUT /api/assets/:id`

Continua aceitando `invested` no body para edição manual. Porém: se o ativo tiver aportes registrados (`COUNT(asset_contributions) > 0`), o campo `invested` no Sheet B fica read-only e exibe "calculado pelos aportes". O valor manual é ignorado se houver aportes.

Regra aplicada no endpoint:

```ts
const hasContribs = await db.prepare(
  `SELECT COUNT(*) AS n FROM asset_contributions WHERE asset_id = ? AND user_id = ?`
).bind(id, userId).first<{ n: number }>()

if (hasContribs?.n ?? 0 > 0) {
  // ignora updates.invested — calculado pelos aportes
  delete updates.invested
}
```

---

## 7. UX — Fluxo de Registro de Aporte

### Acesso

O Sheet de Aporte é acessado via:

1. Botão **"+ Registrar Aporte"** na Tela de Detalhe do Ativo (FEAT-017)
2. FAB (+) na Tela Carteira → opção "Registrar Aporte" (melhoria futura, não no MVP desta feature)

### Sheet de Aporte (Sheet E)

```
┌────────────────────────────────────────┐
│  Registrar Aporte                   ✕  │
├────────────────────────────────────────┤
│                                        │
│  BOVA11 · XP · Renda Variável         │
│  Total investido: R$ 5.900,00         │
│                                        │
│  Valor do aporte *                     │
│  ┌──────────────────────────────────┐  │
│  │  R$ _______________________      │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Data do aporte *                      │
│  ┌──────────────────────────────────┐  │
│  │  DD/MM/AAAA  (padrão: hoje)     │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Observação (opcional)                 │
│  ┌──────────────────────────────────┐  │
│  │  Ex: comprei na baixa            │  │
│  └──────────────────────────────────┘  │
│                                        │
│ ┌──────────────────────────────────┐   │
│ │          Registrar               │   │
│ └──────────────────────────────────┘   │
│                                        │
└────────────────────────────────────────┘
```

**Comportamento:**

- Campo "Valor" com `inputmode="decimal"`, máscara BRL (R$ 1.500,00)
- Campo "Data" com `type="date"`, default = hoje, máximo = hoje
- "Observação" sem formatação especial, max 200 chars
- Ao confirmar: POST → sucesso → sheet fecha → Tela Detalhe recarrega com novos valores de `invested` e `gain`
- Erro de validação: mensagem inline abaixo do campo

---

## 8. UX — Lista de Aportes

Na Tela de Detalhe, seção "Aportes" exibe:

```
─ Aportes ──────────────────────────────
 3 aportes · Total: R$ 5.900,00

 R$ 2.000,00 · 15/05/2026  [✕]
 Comprei na baixa

 R$ 2.500,00 · 10/03/2026  [✕]

 R$ 1.400,00 · 08/01/2026  [✕]

[+ Registrar Aporte]
```

**Comportamento:**

- Lista exibida diretamente na Tela de Detalhe (sem navegação extra)
- Botão [✕] por aporte: confirma remoção com alerta nativo (confirm dialog) antes de deletar
- Após remoção: lista e values de `invested`/`gain` atualizam em tempo real
- Se lista vazia: "Nenhum aporte registrado. Registre para calcular o gain com precisão."

---

## 9. Regras de Negócio

| ID | Regra |
|---|---|
| RN-A01 | Aportes disponíveis somente para classes: ACAO, FII, FUNDO, RF, TESOURO |
| RN-A02 | `amount` deve ser positivo (> 0) |
| RN-A03 | `contributedAt` não pode ser data futura |
| RN-A04 | Nota limitada a 200 caracteres |
| RN-A05 | Após POST ou DELETE de aporte, `assets.invested` é recalculado automaticamente como `SUM(amount)` |
| RN-A06 | Se todos os aportes forem removidos, `assets.invested` volta a `null` |
| RN-A07 | Se ativo tiver aportes registrados, campo `invested` no Sheet B fica read-only |
| RN-A08 | Gain exibido na Tela Detalhe somente se `invested IS NOT NULL AND invested > 0` |
| RN-A09 | Gain% = `((balance / invested) - 1) × 100` |
| RN-A10 | Exclusão de aporte requer confirmação do usuário antes de chamar DELETE |
| RN-A11 | Aportes de um ativo deletado (soft delete → archived) são preservados no banco (ON DELETE CASCADE só em hard delete) |
| RN-A12 | Aportes não são exportados pelo XLSX template neste MVP |
| RN-A13 | Um ativo pode ter qualquer quantidade de aportes (sem limite) |

---

## 10. Gain — Cálculo Detalhado

O gain é calculado na camada de apresentação (frontend e `GET /api/assets/:id/detail`), nunca persistido em banco.

```
balance = qty × price           (para ACAO/FII/FUNDO)
balance = manual_balance        (para RF/TESOURO)

invested = SUM(amount) FROM asset_contributions WHERE asset_id = ?
         -- OU --
         = assets.invested      (se não há aportes registrados, valor manual)

gain_r$  = balance - invested   (somente se invested IS NOT NULL)
gain_pct = (balance / invested - 1) × 100
```

**Exibição:**

| Cenário | Exibição |
|---|---|
| `invested = null` | Seção gain oculta; "Investido: não informado" |
| `invested > 0, gain > 0` | "+R$ X,XX (+Y,Y%)" em verde |
| `invested > 0, gain < 0` | "-R$ X,XX (-Y,Y%)" em vermelho |
| `invested > 0, gain = 0` | "R$ 0,00 (0%)" em neutro |

---

## 11. Integração com GET /api/portfolio

O endpoint `GET /api/portfolio` retorna o campo `invested` de cada asset no array `assets`. Esse campo já reflete o `SUM` dos aportes (pois `assets.invested` é atualizado automaticamente). Nenhuma mudança de interface na resposta do portfolio.

Para o cálculo de gain global do portfolio:

```sql
-- View já existente vw_portfolio_summary pode ser expandida para incluir:
SUM(CASE WHEN invested IS NOT NULL THEN balance ELSE 0 END) AS total_with_invested,
SUM(COALESCE(invested, 0)) AS total_invested,
SUM(COALESCE(invested, 0)) - SUM(CASE WHEN invested IS NOT NULL THEN balance ELSE 0 END) AS total_gain
```

Isso é uma melhoria futura — o MVP se concentra no detalhe do ativo.

---

## 12. Checklist de Implementação

### INFRA-003 — Schema

- [ ] Criar `migrations/004_asset_contributions.sql` com o SQL acima
- [ ] Aplicar migration no D1 (`wrangler d1 execute quanto-db --file=migrations/004_asset_contributions.sql`)
- [ ] Testar: ON DELETE CASCADE quando ativo é hard deleted
- [ ] Testar: índices criados corretamente

### FEAT-018 — Backend

- [ ] Implementar `POST /api/assets/:id/contributions` em `src/index.ts`
- [ ] Implementar `GET /api/assets/:id/contributions` em `src/index.ts`
- [ ] Implementar `DELETE /api/assets/:id/contributions/:cid` em `src/index.ts`
- [ ] Validar classes que aceitam aportes (ACAO, FII, FUNDO, RF, TESOURO)
- [ ] Garantir recálculo de `assets.invested` após POST e DELETE
- [ ] Modificar `PUT /api/assets/:id` para ignorar `invested` se há aportes
- [ ] Testar com ativo sem aportes: `invested` volta a null após último delete
- [ ] Testar classe inválida (PREVIDENCIA) → 422

### FEAT-018 — Frontend

- [ ] Criar Sheet E (Sheet de Aporte) — HTML + CSS + JS
- [ ] Campo "Valor" com `inputmode="decimal"` e máscara BRL
- [ ] Campo "Data" com default hoje, `max="hoje"`
- [ ] Campo "Observação" opcional, contador de chars
- [ ] Abrir Sheet E ao clicar "+ Registrar Aporte" na Tela Detalhe
- [ ] Após POST bem-sucedido: fechar sheet + recarregar detalhe do ativo
- [ ] Exibir lista de aportes na seção "Aportes" da Tela Detalhe
- [ ] Botão [✕] por aporte com confirm dialog
- [ ] Após DELETE: atualizar lista e recalcular gain exibido
- [ ] Estado vazio: mensagem de incentivo para registrar o primeiro aporte
- [ ] Ocultar botão "+ Registrar Aporte" para PREVIDENCIA, POUPANCA, COFRINHO

### Documentação

- [ ] Atualizar `docs/api-spec.yaml` com os 3 novos endpoints
- [ ] Atualizar `schema.sql` com a nova tabela

---

## 13. Impacto em Features Existentes

| Feature | Impacto |
|---|---|
| FEAT-017 (Detalhe do Ativo) | `contributions[]` já incluído na resposta de `GET /api/assets/:id/detail` |
| FEAT-006 (Tela Carteira) | Sem mudanças — `balance` e `invested` já existem, gain pode ser exibido nos cards se quiser |
| FEAT-013 (Smart Labels) | Sem impacto |
| FEAT-015 (Análise IA) | Dados de aportes enriquecem o contexto enviado ao Qwen3 (quando foi o último aporte, ritmo de investimento) |
| Import XLSX | Sem impacto no MVP — aportes não importados via XLSX |

---

## 14. Stretch Goals

| Stretch | O que exige |
|---|---|
| Editar aporte (valor e/ou data) | `PUT /api/assets/:id/contributions/:cid` + UI |
| Aporte em PREVIDENCIA/POUPANCA como histórico de saldo | Tabela separada `balance_history` — design diferente de aportes |
| Exportar aportes no XLSX template | Adicionar aba "Aportes" na planilha de exportação |
| Gain global na Tela Hoje | Expandir `vw_portfolio_summary` com totais de invested |
| Aporte via FAB na Tela Carteira | Adicionar opção no FAB + seleção de ativo |
| Gráfico de evolução do saldo manual usando aportes | Para RF/TESOURO, cada aporte = ponto na timeline |
