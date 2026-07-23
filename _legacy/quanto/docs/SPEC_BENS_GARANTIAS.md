# SPEC — Bens e Garantias

> Status: **backlog** — spec aprovada, implementação futura  
> Aprovado em: 2026-06-14  
> Tasks relacionadas: SPEC-009, INFRA-004, FEAT-019, FEAT-020  
> Independente de: SPEC_APORTES.md, SPEC_ASSET_DETAIL.md

---

## 1. Visão Geral

### Motivação

O Quanto hoje consolida **patrimônio investível** — ativos financeiros líquidos ou semi-líquidos onde o usuário tomou uma decisão de alocação. Mas o patrimônio real de uma pessoa inclui muito mais:

- **FGTS**: fundo compulsório, R$ X depositados pelo empregador, não acessível livremente
- **Imóvel**: bem real com valor estimado em centenas de milhares, geralmente o maior "ativo" de uma pessoa
- **Veículo**: bem depreciável com valor de mercado consultável via FIPE

Esses bens não devem entrar na carteira de investimentos (seriam distorcivos — o FGTS rende abaixo do CDI, imóvel tem liquidez zero). Mas **compõem o patrimônio bruto** e são relevantes para o usuário entender o quadro completo.

A pergunta "quanto eu tenho, de fato?" tem duas respostas legítimas:
- **Patrimônio investível**: o que está em ativos financeiros (resposta atual do Quanto)
- **Patrimônio bruto**: inclui FGTS + imóveis + veículos (resposta nova)

### O que esta feature faz

1. Cria um novo modo **"Bens e Garantias"** — separado da carteira de investimentos
2. Suporta três tipos: **FGTS**, **Imóvel**, **Veículo**
3. Exibe o total de bens separado dos investimentos
4. Permite o usuário ver o **patrimônio bruto** (investimentos + bens) como número opcional na Tela Hoje

### O que não faz

- Não mistura bens com a carteira de investimentos
- Não calcula rentabilidade de bens (o apartamento não "rendeu X%")
- Não integra APIs externas (FIPE, Caixa) no MVP — tudo manual
- Não rastreia financiamento/dívida atrelada ao bem (stretch goal)
- Não calcula depreciação de veículo
- Não calcula imposto de transmissão (ITBI), IPTU ou IPVA

---

## 2. Distinção: Investimentos vs Bens e Garantias

| Dimensão | Investimentos (atual) | Bens e Garantias (novo) |
|---|---|---|
| Liquidez | Alta a média (pode vender/resgatar) | Baixa a nula (FGTS = restrito, imóvel = meses, carro = semanas) |
| Decisão | Usuário decide alocar | Compulsório (FGTS) ou necessidade (casa, carro) |
| Rendimento | Sim — yield, valorização, CDI | Não rastreado (imóvel pode subir, carro deprecia) |
| Garantia | Não diretamente | FGTS garante demissão, imóvel é garantia real |
| Aparece em portfólio | ✓ | ✗ (seção própria) |
| Aparece no patrimônio bruto | ✓ | ✓ (soma opcional) |

---

## 3. Tipos de Bens

### 3.1 FGTS

**O que é:** Fundo de Garantia do Tempo de Serviço, 8% do salário bruto depositado pelo empregador mensalmente na Caixa Econômica Federal. Rendimento: TR + 3% a.a. (historicamente abaixo da inflação).

**Por que é "garantia":** Resgatável em demissão sem justa causa, compra do primeiro imóvel, doenças graves, aposentadoria. Enquanto isso, é bloqueado.

**Campos:**
| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `name` | TEXT | ✓ | Ex: "FGTS Empresa ABC" ou simplesmente "FGTS" |
| `estimated_value` | REAL | ✓ | Saldo atual (consultado no app Caixa) |
| `employer` | TEXT | — | Nome do empregador (opcional) |
| `notes` | TEXT | — | Observação livre |

**Atualização:** manual. O usuário consulta o app Caixa, digita o saldo.

**Não rastreado:** conta vinculada FGTS separada por emprego (simplificação MVP — um bem por vínculo ativo).

---

### 3.2 Imóvel (Apartamento / Casa / Terreno)

**O que é:** Bem imóvel em nome do usuário — residência, investimento imobiliário ou terreno.

**Por que é "garantia":** Pode ser dado como garantia real em financiamentos (alienação fiduciária), usufruído como moradia (evitando custo de aluguel).

**Campos:**
| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `name` | TEXT | ✓ | Ex: "Apartamento Moema", "Terreno Campinas" |
| `property_type` | ENUM | ✓ | APARTAMENTO, CASA, TERRENO, SALA_COMERCIAL |
| `estimated_value` | REAL | ✓ | Valor de mercado estimado (auto-avaliação) |
| `area_m2` | REAL | — | Área útil em m² |
| `city` | TEXT | — | Cidade |
| `state` | TEXT | — | Estado (UF) |
| `is_financed` | BOOLEAN | — | True se ainda tem financiamento (informativo) |
| `notes` | TEXT | — | Observação livre |

**Atualização:** manual. O usuário atualiza quando achar relevante (anualmente, após avaliação, etc.).

**Não rastreado no MVP:** saldo devedor do financiamento, IPTU, valor de compra histórico, valorização %.

---

### 3.3 Veículo (Carro / Moto)

**O que é:** Bem móvel — automóvel, motocicleta, caminhonete.

**Por que é "patrimônio":** Bem com valor de mercado consultável via Tabela FIPE. Pode ser alienado. Depreciação é real mas não rastreada no MVP.

**Campos:**
| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `name` | TEXT | ✓ | Ex: "Honda Civic 2020", "Toyota Corolla Cross" |
| `vehicle_type` | ENUM | ✓ | CARRO, MOTO, UTILITARIO |
| `estimated_value` | REAL | ✓ | Valor de mercado (referência FIPE ou avaliação própria) |
| `year` | INTEGER | — | Ano do modelo |
| `brand` | TEXT | — | Marca (Honda, Toyota, etc.) |
| `model` | TEXT | — | Modelo |
| `is_financed` | BOOLEAN | — | True se ainda tem financiamento (informativo) |
| `notes` | TEXT | — | Observação livre |

**Atualização:** manual. FIPE consultável pelo usuário externamente.

**Não rastreado no MVP:** placa, saldo devedor do financiamento, IPVA.

---

## 4. Schema — Nova Tabela

### `goods`

```sql
CREATE TABLE IF NOT EXISTS goods (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          TEXT    NOT NULL,
  type             TEXT    NOT NULL CHECK(type IN ('FGTS','IMOVEL','VEICULO')),
  name             TEXT    NOT NULL,

  -- Valor estimado (todos os tipos)
  estimated_value  REAL    NOT NULL CHECK(estimated_value >= 0),
  balance_updated_at TEXT,            -- quando foi atualizado pela última vez

  -- Campos específicos de imóvel
  property_type    TEXT    CHECK(property_type IN ('APARTAMENTO','CASA','TERRENO','SALA_COMERCIAL')),
  area_m2          REAL,
  city             TEXT,
  state            TEXT,             -- UF, 2 letras

  -- Campos específicos de veículo
  vehicle_type     TEXT    CHECK(vehicle_type IN ('CARRO','MOTO','UTILITARIO')),
  year             INTEGER CHECK(year BETWEEN 1900 AND 2100),
  brand            TEXT,
  model_name       TEXT,

  -- Campos específicos de FGTS
  employer         TEXT,

  -- Compartilhado
  is_financed      INTEGER DEFAULT 0 CHECK(is_financed IN (0,1)),  -- BOOLEAN
  notes            TEXT,
  status           TEXT    NOT NULL DEFAULT 'active'
                           CHECK(status IN ('active','archived')),
  created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_goods_user
  ON goods(user_id, status);
```

---

## 5. Migration SQL

Arquivo: `migrations/005_goods.sql`

```sql
-- Up
CREATE TABLE IF NOT EXISTS goods (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          TEXT    NOT NULL,
  type             TEXT    NOT NULL CHECK(type IN ('FGTS','IMOVEL','VEICULO')),
  name             TEXT    NOT NULL,
  estimated_value  REAL    NOT NULL CHECK(estimated_value >= 0),
  balance_updated_at TEXT,
  property_type    TEXT    CHECK(property_type IN ('APARTAMENTO','CASA','TERRENO','SALA_COMERCIAL')),
  area_m2          REAL,
  city             TEXT,
  state            TEXT,
  vehicle_type     TEXT    CHECK(vehicle_type IN ('CARRO','MOTO','UTILITARIO')),
  year             INTEGER CHECK(year BETWEEN 1900 AND 2100),
  brand            TEXT,
  model_name       TEXT,
  employer         TEXT,
  is_financed      INTEGER DEFAULT 0 CHECK(is_financed IN (0,1)),
  notes            TEXT,
  status           TEXT    NOT NULL DEFAULT 'active'
                           CHECK(status IN ('active','archived')),
  created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_goods_user ON goods(user_id, status);
```

---

## 6. API — Endpoints

### 6.1 `GET /api/goods`

Lista todos os bens ativos do usuário com total.

**Resposta:**

```ts
{
  total: number          // soma de estimated_value de todos os bens ativos
  byType: {
    FGTS: number         // total FGTS
    IMOVEL: number       // total imóveis
    VEICULO: number      // total veículos
  },
  goods: {
    id: number
    type: 'FGTS' | 'IMOVEL' | 'VEICULO'
    name: string
    estimatedValue: number
    balanceUpdatedAt: string | null
    staleDays: number | null
    propertyType: string | null
    vehicleType: string | null
    year: number | null
    brand: string | null
    modelName: string | null
    employer: string | null
    city: string | null
    state: string | null
    isFinanced: boolean
    notes: string | null
    status: string
  }[]
}
```

**Implementação:**

```ts
app.get('/api/goods', async (c) => {
  const userId = c.get('userId')
  const db = c.env.DB

  const result = await db.prepare(`
    SELECT *,
      CASE WHEN balance_updated_at IS NOT NULL
        THEN CAST(julianday('now') - julianday(balance_updated_at) AS INTEGER)
        ELSE NULL
      END AS stale_days
    FROM goods
    WHERE user_id = ? AND status = 'active'
    ORDER BY type, name
  `).bind(userId).all<GoodRow>()

  const goods = result.results ?? []
  const total = goods.reduce((s, g) => s + g.estimated_value, 0)
  const byType = { FGTS: 0, IMOVEL: 0, VEICULO: 0 }
  for (const g of goods) byType[g.type as keyof typeof byType] += g.estimated_value

  return c.json({
    total,
    byType,
    goods: goods.map(g => ({
      id: g.id,
      type: g.type,
      name: g.name,
      estimatedValue: g.estimated_value,
      balanceUpdatedAt: g.balance_updated_at ?? null,
      staleDays: g.stale_days ?? null,
      propertyType: g.property_type ?? null,
      vehicleType: g.vehicle_type ?? null,
      year: g.year ?? null,
      brand: g.brand ?? null,
      modelName: g.model_name ?? null,
      employer: g.employer ?? null,
      city: g.city ?? null,
      state: g.state ?? null,
      isFinanced: Boolean(g.is_financed),
      notes: g.notes ?? null,
      status: g.status,
    })),
  })
})
```

---

### 6.2 `POST /api/goods`

Cria um novo bem.

**Request body:**

```ts
{
  type: 'FGTS' | 'IMOVEL' | 'VEICULO'   // obrigatório
  name: string                             // obrigatório
  estimatedValue: number                   // obrigatório, >= 0

  // IMOVEL
  propertyType?: 'APARTAMENTO' | 'CASA' | 'TERRENO' | 'SALA_COMERCIAL'
  areaM2?: number
  city?: string
  state?: string                           // UF, 2 letras

  // VEICULO
  vehicleType?: 'CARRO' | 'MOTO' | 'UTILITARIO'
  year?: number
  brand?: string
  modelName?: string

  // FGTS
  employer?: string

  // Compartilhado
  isFinanced?: boolean
  notes?: string
}
```

**Resposta (201):** objeto do bem criado com `id`.

**Validações:**

```ts
// type obrigatório e válido
if (!['FGTS','IMOVEL','VEICULO'].includes(body.type)) → 400

// IMOVEL requer propertyType
if (body.type === 'IMOVEL' && !body.propertyType) → 400

// VEICULO requer vehicleType
if (body.type === 'VEICULO' && !body.vehicleType) → 400

// estimatedValue ≥ 0
if (body.estimatedValue < 0) → 400

// state: 2 letras maiúsculas se preenchido
if (body.state && !/^[A-Z]{2}$/.test(body.state)) → 400
```

---

### 6.3 `PUT /api/goods/:id`

Atualiza um bem. Aceita qualquer subset dos campos.

Ao atualizar `estimatedValue`, persiste automaticamente `balance_updated_at = datetime('now')`.

**Resposta (200):** objeto atualizado.

---

### 6.4 `DELETE /api/goods/:id`

Soft delete: seta `status = 'archived'`.

**Resposta (200):** `{ archived: true }`

---

### 6.5 Modificação em `GET /api/portfolio`

Adicionar campo `grossWealth` na resposta do portfolio para permitir exibição do patrimônio bruto:

```ts
// Existente
{
  summary: { totalBalance, invested, gainR, gainPct },
  ...
}

// Após esta feature
{
  summary: { totalBalance, invested, gainR, gainPct },
  goods: { total, byType },   // NOVO — null se feature não implementada
  grossWealth: number | null, // totalBalance + goods.total
  ...
}
```

Implementação: no handler de `GET /api/portfolio`, fazer uma segunda query em `goods` e agregar. Isolado em try/catch para que falha não quebre o portfolio.

---

## 7. UX — Tela Bens (nova aba)

### 7.1 Navegação

A navbar passa de 4 para 5 abas:

```
[Hoje]  [Carteira]  [Bens]  [Histórico]  [Importar]
```

Ícone sugerido para "Bens": 🏠 (casa) ou um ícone de briefcase/shield para "garantias".

Alternativa: manter 4 abas e colocar "Bens" como seção colapsável dentro de "Hoje". Mas a aba dedicada é mais limpa e explícita.

### 7.2 Layout — Tela Bens

```
┌────────────────────────────────────────┐
│  Bens e Garantias                 [+]  │
├────────────────────────────────────────┤
│                                        │
│  Total de bens                         │
│  R$ 412.500,00                         │
│                                        │
│ ─ FGTS ──────────────────────────────  │
│                             R$ 32.500  │
│  FGTS Empresa Atual                    │
│  R$ 32.500,00 · atualizado há 5 dias  │
│                               [Editar] │
│                                        │
│ ─ Imóveis ────────────────────────────  │
│                            R$ 350.000  │
│  Apartamento Moema           ↪ finan.  │
│  R$ 350.000,00 · 90m² · São Paulo     │
│  Atualizado há 62 dias  ⚠              │
│                               [Editar] │
│                                        │
│ ─ Veículos ───────────────────────────  │
│                             R$ 30.000  │
│  Honda Civic 2020                      │
│  R$ 30.000,00 · atualizado há 12 dias │
│                               [Editar] │
│                                        │
└────────────────────────────────────────┘
```

### 7.3 Sheet de Cadastro de Bem (Sheet F)

O FAB (+) na Tela Bens abre o Sheet F, com seleção de tipo primeiro:

```
┌────────────────────────────────────────┐
│  Adicionar Bem                      ✕  │
├────────────────────────────────────────┤
│  Tipo de bem                           │
│                                        │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │  🏦 FGTS │ │ 🏠 Imóvel│ │ 🚗 Car │ │
│  └──────────┘ └──────────┘ └────────┘ │
│                                        │
│  ─ após selecionar tipo: ─            │
│                                        │
│  [campos específicos do tipo]          │
│                                        │
│  Valor estimado *                      │
│  R$ ___________________               │
│                                        │
│  [Salvar Bem]                          │
│                                        │
└────────────────────────────────────────┘
```

**Campos por tipo:**

**FGTS:**
- Nome (default: "FGTS") + Empregador (opcional) + Valor estimado

**Imóvel:**
- Nome *, Tipo de imóvel *, Valor estimado *, Área (m²), Cidade, Estado, Financiado? (toggle)

**Veículo:**
- Nome *, Tipo *, Valor estimado *, Marca, Modelo, Ano, Financiado? (toggle)

---

## 8. Integração com Tela Hoje

### 8.1 Toggle Patrimônio Investível / Patrimônio Bruto

Na Tela Hoje, abaixo do número-tese, adicionar toggle discreto:

```
  R$ 248.300,00
  Patrimônio investível

  [✦ Ver patrimônio bruto: R$ 660.800]
```

Ao clicar, o número-tese muda para o patrimônio bruto e o label muda para "Patrimônio total (investimentos + bens)". Toggle persiste em localStorage.

**Alternativa mais simples:** linha adicional abaixo do hero, sempre visível:

```
  R$ 248.300,00        ← investimentos
  + R$ 412.500 em bens → R$ 660.800 total
```

O usuário não precisa clicar em nada — vê os dois números.

### 8.2 Indicador de Frescor em Bens

Bens com `staleDays > 60` aparecem com alerta ⚠ na Tela Bens (imóvel não precisa ser atualizado frequentemente, mas FGTS muda mensalmente).

---

## 9. Regras de Negócio

| ID | Regra |
|---|---|
| RN-B01 | Bens e Garantias são um modo separado da carteira de investimentos |
| RN-B02 | `estimated_value` de bens NÃO entra no `totalBalance` do GET /api/portfolio |
| RN-B03 | `grossWealth` = `totalBalance` (investimentos) + `goods.total` (bens) |
| RN-B04 | Um usuário pode ter múltiplos bens de cada tipo (ex: 2 imóveis) |
| RN-B05 | FGTS: mais de um registro se o usuário tiver mais de um vínculo empregatício |
| RN-B06 | Soft delete via `status='archived'` (mesmo padrão de `assets`) |
| RN-B07 | `balance_updated_at` é atualizado automaticamente ao mudar `estimated_value` |
| RN-B08 | Alerta de frescor (⚠): FGTS > 35 dias, Imóvel > 180 dias, Veículo > 90 dias |
| RN-B09 | `is_financed` é informativo apenas — não rastreia saldo devedor |
| RN-B10 | Patrimônio bruto não aparece nos snapshots mensais no MVP (somente investimentos) |
| RN-B11 | Import XLSX não importa bens no MVP |
| RN-B12 | Bens não participam do cálculo de alocação (donut chart) |
| RN-B13 | Análise IA (FEAT-015) pode mencionar bens ao analisar o portfolio inteiro se `grossWealth` estiver disponível |

---

## 10. Snapshot Mensal

No MVP, o snapshot mensal (`snapshots` table) captura apenas os investimentos financeiros. Stretch goal: adicionar `goods_total` ao snapshot para permitir histórico de patrimônio bruto.

Migration necessária (stretch goal):
```sql
ALTER TABLE snapshots ADD COLUMN goods_total REAL;
```

---

## 11. Limiar de Frescor por Tipo

| Tipo | Frescor aceitável | Motivo |
|---|---|---|
| FGTS | 35 dias | Depósito mensal do empregador — saldo muda todo mês |
| Imóvel | 180 dias | Valor de mercado é estável, avaliação anual é razoável |
| Veículo | 90 dias | Depreciação gradual, mas relevante a cada trimestre |

---

## 12. Checklist de Implementação

### INFRA-004 — Schema

- [ ] Criar `migrations/005_goods.sql`
- [ ] Aplicar no D1: `wrangler d1 execute quanto-db --file=migrations/005_goods.sql`
- [ ] Verificar índice criado

### FEAT-019 — Backend

- [ ] Implementar `GET /api/goods` em `src/index.ts`
- [ ] Implementar `POST /api/goods` com validações por tipo
- [ ] Implementar `PUT /api/goods/:id` com update de `balance_updated_at`
- [ ] Implementar `DELETE /api/goods/:id` (soft delete)
- [ ] Modificar `GET /api/portfolio` para incluir `goods` e `grossWealth`
- [ ] Testar: criar FGTS + Imóvel + Veículo, checar `grossWealth`
- [ ] Testar: `estimatedValue = 0` → válido (bem sem valor ou quitado)
- [ ] Testar: tipo inválido → 400
- [ ] Testar: IMOVEL sem propertyType → 400

### FEAT-020 — Frontend

- [ ] Adicionar aba "Bens" na navbar (5 abas)
- [ ] Criar Tela Bens: total + 3 seções (FGTS, Imóveis, Veículos)
- [ ] FAB (+) abre Sheet F (Sheet de Cadastro de Bem)
- [ ] Sheet F: seleção de tipo → campos dinâmicos por tipo
- [ ] Campo "Valor estimado" com máscara BRL
- [ ] Alerta de frescor (⚠) por limiar definido (RN-B08)
- [ ] Botão "Editar" por bem → abre Sheet F preenchido
- [ ] Integrar patrimônio bruto na Tela Hoje (RN-B03)
- [ ] Empty state em Tela Bens: "Nenhum bem cadastrado. Adicione seu FGTS, imóvel ou veículo."
- [ ] Testar: navbar com 5 abas renderiza corretamente em mobile
- [ ] Testar: toggle patrimônio bruto / investível na Tela Hoje

### Documentação

- [ ] Atualizar `docs/api-spec.yaml` com 4 novos endpoints de `/api/goods`
- [ ] Atualizar `schema.sql` com nova tabela `goods`

---

## 13. Stretch Goals

| Stretch | O que exige |
|---|---|
| Saldo devedor do financiamento | Campo `financing_balance` na tabela `goods`; patrimônio líquido real = assets + goods - financing |
| Auto-avaliação via FIPE | Busca por marca/modelo/ano no FIPE API; sugere valor de mercado atualizado |
| Histórico de valor de bens | Tabela `goods_history`; gráfico de valorização/depreciação |
| Snapshot de patrimônio bruto | `ALTER TABLE snapshots ADD COLUMN goods_total` |
| FGTS automático via Open Finance | API Caixa → saldo FGTS em tempo real (longo prazo) |
| Compartilhamento de bem | Bem como casal/família com percentual de propriedade |
