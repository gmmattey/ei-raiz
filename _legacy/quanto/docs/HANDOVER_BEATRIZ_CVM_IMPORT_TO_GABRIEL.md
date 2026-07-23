# Handover: CVM Pipeline & Import XLSX → Gabriel

**De:** Beatriz (Data & Design)
**Para:** Gabriel (Especialista Data/Eng)
**Data:** 2026-06-17
**Status:** ✅ Handover completo — Gabriel assume responsabilidade de dados

---

## 0. Contexto Rápido

O Quanto usa dois mecanismos de cotação automática:

| Mecanismo | Para que serve | Onde vive |
|-----------|---------------|-----------|
| **BRAPI** | Ações e FIIs (B3) | `refreshQuotes()` em `src/index.ts` |
| **CVM** | Fundos de investimento (~15K fundos BR) | `src/cvm.ts` — tudo aqui |

Antes do pipeline CVM, qualquer fundo de investimento precisava de atualização manual mensal (usuário abria app da corretora, copiava o saldo). Era o maior ponto de atrito. O pipeline resolve isso via dados abertos da CVM.

---

## 1. Pipeline CVM — Visão Geral

### 1.1 Fontes de dados

| Fonte | URL | Formato | Tamanho | Frequência |
|-------|-----|---------|---------|-----------|
| Cadastro de fundos | `dados.cvm.gov.br/dados/FI/CAD/DADOS/cad_fi.csv` | CSV Latin-1, separador `;` | ~17 MB | Atualizado diariamente, mas só lemos mensalmente |
| Informes diários | `dados.cvm.gov.br/dados/FI/DOC/INF_DIARIO/DADOS/inf_diario_fi_{YYYYMM}.zip` | ZIP com CSV UTF-8, separador `;` | ~10 MB zip / ~120 MB CSV | Arquivo do mês corrente cresce diariamente |

### 1.2 Dois cron jobs

```
0 22 * * 1-5   → refreshCvmQuotes()      # diário (seg-sex) às 22h UTC = 19h BRT
0 23 2 * *     → refreshCvmFundsCache()  # mensal (dia 2) às 23h UTC
```

O horário 22h UTC foi escolhido porque a CVM publica os informes ao longo da tarde (tipicamente 16h-18h BRT). Rodar antes arriscaria pegar dados incompletos.

---

## 2. Arquivo Central: `src/cvm.ts`

Todo o código CVM está em `src/cvm.ts` (453 linhas). Zero dependências externas — só Web APIs nativas do Cloudflare Workers.

### 2.1 `refreshCvmQuotes()` — cron diário de cotações

**O que faz:** Atualiza o `VL_QUOTA` (valor da cota) dos fundos que os usuários possuem.

**Fluxo:**
```
1. SELECT DISTINCT ticker FROM assets WHERE quote_source = 'CVM' → set de CNPJs
2. Se set vazio → retorna imediatamente (RN-112: zero fetch externo)
3. Monta URL: CVM_INFORME_BASE/inf_diario_fi_{YYYYMM}.zip
4. fetch() → ArrayBuffer (~10 MB)
5. parseZipHeader() → localiza o stream DEFLATE dentro do ZIP
6. streamParseCsvFromZip() → filtra só os CNPJs do set, pega VL_QUOTA mais recente
7. db.batch() → upsert em quotes_cache com CNPJ como ticker
```

**Por que stream?**  
O CSV descomprimido chega a ~120 MB. Se usarmos `fflate.unzipSync()` ele materializa tudo em memória (120 MB + 10 MB ZIP = 130 MB > 128 MB do Workers). Com `DecompressionStream('deflate-raw')` nativo, o pico fica em ~12 MB.

```typescript
// Trecho-chave: pipe de descompressão streaming
const lineStream = compressedStream
  .pipeThrough(new DecompressionStream('deflate-raw'))
  .pipeThrough(new TextDecoderStream('utf-8'))
  .pipeThrough(createLineSplitter())
```

### 2.2 `refreshCvmFundsCache()` — cron mensal de cadastro

**O que faz:** Repopula `cvm_funds_cache` com os ~15K fundos ativos.

**Fluxo:**
```
1. fetch(CVM_CADASTRO_URL) → ArrayBuffer (~17 MB)
2. decodeLatin1(buffer) → string  ← ponto crítico, ver seção 2.4
3. split('\n') → linhas
4. Filtra: cols[7] === 'EM FUNCIONAMENTO NORMAL'
5. Extrai 9 colunas de 41 (ver mapeamento abaixo)
6. DELETE FROM cvm_funds_cache + batch INSERT em grupos de 11 rows
```

**Mapeamento de colunas do `cad_fi.csv`:**

| Índice | Campo CSV | Campo D1 |
|--------|-----------|----------|
| 1 | `CNPJ_FUNDO` | `cnpj` (PK) |
| 2 | `DENOM_SOCIAL` | `denom_social` |
| 7 | `SIT` | filtro: só `'EM FUNCIONAMENTO NORMAL'` |
| 12 | `CLASSE` | `classe` |
| 14 | `RENTAB_FUNDO` | `rentab_fundo` (benchmark: DI, Ibovespa...) |
| 16 | `FUNDO_COTAS` | `fundo_cotas` (S/N — fundo feeder?) |
| 25 | `VL_PATRIM_LIQ` | `vl_patrim_liq` (AUM — usado para ordenar busca) |
| 29 | `ADMIN` | `admin` |
| 32 | `GESTOR` | `gestor` |
| 40 | `CLASSE_ANBIMA` | `classe_anbima` |

### 2.3 `searchFunds()` — busca por nome ou CNPJ

Chamado pelo endpoint `GET /api/funds/search?q=`. Sem auth (tabela pública).

```sql
SELECT cnpj, denom_social, gestor, classe, classe_anbima, rentab_fundo, vl_patrim_liq
FROM cvm_funds_cache
WHERE denom_social LIKE '%' || ?1 || '%' COLLATE NOCASE
   OR REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '/', ''), '-', '') LIKE '%' || ?2 || '%'
ORDER BY vl_patrim_liq DESC
LIMIT 20
```

`?1` = query original (busca por nome), `?2` = query só com dígitos (busca por CNPJ).  
Mínimo 3 caracteres — verificado no handler antes de chamar `searchFunds()`.

### 2.4 `decodeLatin1()` — workaround crítico

Workers **não suporta** `TextDecoder('latin1')`. O `cad_fi.csv` usa Latin-1 (ISO-8859-1).

```typescript
// Processamos em chunks de 8192 para não explodir a call stack
export function decodeLatin1(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunks: string[] = []
  for (let i = 0; i < bytes.length; i += 8192) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + 8192)))
  }
  return chunks.join('')
}
```

ISO-8859-1 mapeia bytes 0x00-0xFF diretamente para code points Unicode U+0000-U+00FF, então `String.fromCharCode` é **correto por definição**.  
Se a CVM migrar para UTF-8 no futuro: caracteres ASCII (>95% do conteúdo) produzem resultado idêntico — nenhum dado quebra.

### 2.5 `parseZipHeader()` — parse manual do header ZIP

O ZIP da CVM tem estrutura trivial: arquivo único, DEFLATE, sem criptografia.

```
Bytes 0-29:   Local file header fixo (30 bytes)
Bytes 30-N:   Filename (variável, tipicamente 24 bytes para inf_diario_fi_YYYYMM.csv)
Byte N+1:     Raw DEFLATE stream
```

O parser extrai:
- **offset 8:** método de compressão (deve ser 8 = DEFLATE)
- **offset 18:** tamanho comprimido
- **offset 26:** tamanho do filename
- **offset 28:** tamanho do extra field
- `dataOffset = 30 + filenameLength + extraLength`

### 2.6 CSV do informe diário — estrutura das colunas

```
TP_FUNDO_CLASSE ; CNPJ_FUNDO_CLASSE ; ID_SUBCLASSE ; DT_COMPTC ; VL_TOTAL ; VL_QUOTA ; VL_PATRIM_LIQ ; ...
    0                   1                  2              3          4          5            6
```

O parser usa:
- `cols[1]` = CNPJ do fundo (chave de filtro)
- `cols[3]` = data de competência (formato YYYY-MM-DD)
- `cols[5]` = VL_QUOTA — ignora se `<= 0`

Mantém apenas a linha com **data mais recente** por CNPJ (fundo pode ter múltiplas linhas no mês).

---

## 3. Schema D1 para Dados CVM

### 3.1 Tabela `cvm_funds_cache` — cadastro de fundos

```sql
CREATE TABLE cvm_funds_cache (
  cnpj           TEXT PRIMARY KEY,  -- XX.XXX.XXX/XXXX-XX (formato CVM)
  denom_social   TEXT NOT NULL,     -- nome completo ("ICATU VANGUARDA DIV ACOES FI")
  classe         TEXT,              -- "Multimercado", "Ações", "Renda Fixa"...
  classe_anbima  TEXT,              -- classificação ANBIMA mais específica
  gestor         TEXT,              -- gestora ("XP INVESTIMENTOS")
  admin          TEXT,              -- administradora
  fundo_cotas    TEXT,              -- "S" ou "N" — fundo feeder?
  rentab_fundo   TEXT,              -- benchmark ("DI", "Ibovespa", "IPCA+X%")
  vl_patrim_liq  REAL,             -- AUM — ordenação da busca
  fetched_at     TEXT NOT NULL      -- ISO 8601 UTC
);

CREATE INDEX idx_cvm_funds_nome ON cvm_funds_cache(denom_social COLLATE NOCASE);
```

Estimativa: ~15.000 rows, ~5 MB em D1.

### 3.2 Coluna `quote_source` em `assets`

```sql
ALTER TABLE assets ADD COLUMN quote_source TEXT
  CHECK (quote_source IS NULL OR quote_source IN ('BRAPI', 'CVM'));
```

| Valor | Significado |
|-------|------------|
| `NULL` | BRAPI se tiver ticker, manual se não tiver |
| `'BRAPI'` | Explícito BRAPI (B3) |
| `'CVM'` | Fundo via CVM; campo `ticker` armazena o CNPJ |

**Decisão arquitetural importante:** `assets.ticker` armazena o CNPJ para fundos CVM. Isso permite que as views SQL (`vw_portfolio_summary`, etc.) funcionem sem nenhuma alteração — o join `quotes_cache q ON q.ticker = a.ticker` funciona identicamente para BRAPI (ticker) e CVM (CNPJ).

### 3.3 Tabela `quotes_cache` — compartilhada entre BRAPI e CVM

```sql
CREATE TABLE quotes_cache (
  ticker     TEXT PRIMARY KEY,  -- ticker BRAPI ou CNPJ CVM
  price      REAL NOT NULL,     -- preço da ação OU VL_QUOTA do fundo
  fetched_at TEXT NOT NULL
);
```

Para CVM, `price` contém `VL_QUOTA`. O cálculo de saldo `qty × price` funciona igual.

### 3.4 Frescor de ativos CVM (RN-103)

Ativo CVM é considerado **stale se `fetched_at` > 3 dias** (vs. 30 dias para manuais).  
3 dias acomoda fins de semana e feriados — a CVM só publica em dias úteis.

---

## 4. Import XLSX — Wizard 3 Etapas

### 4.1 Fluxo completo

```
Tela Importar
  ↓ Step 1: Upload (drag & drop ou click)
  ↓ handleFile() → mostra nome + tamanho do arquivo
  ↓ click "Processar" → loadSheetJS() [lazy load de SheetJS cdn]
  ↓ parseFile() → FileReader.readAsArrayBuffer
  ↓ XLSX.read() → workbook
  ↓ forEach sheetName → SHEET_CLASSES → parse rows
  ↓ smartClassifyImport() → POST /api/import/analyze (AI Llama 3B)
  ↓ Step 2: Revisão (tabela com badges OK/ALERTA/ERRO, badges IA)
  ↓ click "Confirmar" → renderImportConfirm()
  ↓ Step 3: Confirmação (preview do que será importado)
  ↓ click "Importar" → POST /api/import → assets criados em batch
  ↓ volta para Step 1, toast de sucesso
```

### 4.2 Formato esperado da planilha XLSX

O arquivo `public/template-quanto.xlsx` é o template de referência. Cada sheet corresponde a uma classe de ativo:

| Nome da aba | Classe mapeada |
|-------------|---------------|
| `Acoes/FIIs` ou `Acoes-FIIs` | `ACAO` |
| `Fundos` | `FUNDO` |
| `Previdencia` | `PREVIDENCIA` |
| `Tesouro` | `TESOURO` |
| `Renda Fixa` | `RF` |
| `Poupanca` | `POUPANCA` |
| `Cofrinhos` | `COFRINHO` |

Abas com nome diferente são ignoradas.

**Colunas esperadas por row:**

| Coluna | Tipo | Obrigatório | Observação |
|--------|------|-------------|------------|
| `Nome` | string | ✅ | Nome do ativo. Se ausente E sem Ticker → row ignorada |
| `Ticker` | string | ❌ | Ticker B3 (ex: "PETR4"). Maiúsculo automático |
| `Instituicao` | string | ❌ | XP, ITAU ou ONZE. Qualquer outro → OUTROS |
| `Quantidade` | number | ❌ | Qty de cotas/ações. Obrigatório se tiver Ticker |
| `Saldo Atual` | number | ❌ | Saldo manual em R$. Vírgula como decimal aceita |
| `Valor Aplicado` | number | ❌ | Valor investido em R$. Vírgula como decimal aceita |

### 4.3 Lógica de parsing (`parseFile()` em `public/app.js`)

```javascript
// Lib: SheetJS (lazy loaded do CDN sheetjs.com, só quando chega na tela Importar)
const wb = XLSX.read(e.target.result, { type: 'array' })

// Para cada sheet conhecida:
const cls = SHEET_CLASSES[sheetName]  // ex: "Fundos" → "FUNDO"
const rows = XLSX.utils.sheet_to_json(ws, { defval: null })

// Para cada row:
const ticker = row['Ticker'] ? String(row['Ticker']).trim().toUpperCase() : null
const rawInst = row['Instituicao'] ? String(row['Instituicao']).trim().toUpperCase() : 'OUTROS'
const institution = ['XP', 'ITAU', 'ONZE'].includes(rawInst) ? rawInst : 'OUTROS'
const institutionName = institution === 'OUTROS' ? row['Instituicao'] : null

// Parsing numérico (aceita vírgula como decimal):
manual_balance: row['Saldo Atual'] ? parseFloat(String(row['Saldo Atual']).replace(',', '.')) : null
invested:       row['Valor Aplicado'] ? parseFloat(String(row['Valor Aplicado']).replace(',', '.')) : null
qty:            row['Quantidade'] ? parseFloat(row['Quantidade']) : null
```

**Status por row:**

| Status | Condição | Exibição |
|--------|----------|---------|
| `ok` | Tem nome válido E instituição | Badge verde "OK" |
| `err` | Sem nome E sem ticker | Badge vermelho "ERRO" |

### 4.4 Smart Import (AI) — `smartClassifyImport()`

Após o parse, chama `POST /api/import/analyze` com até 50 itens:
- Backend usa Llama 3B (`@cf/meta/llama-3.2-3b-instruct`)
- Retorna sugestões `{index, class, confidence}`
- Se `confidence >= 0.8` → badge "✦ IA" (alta confiança)
- Se `confidence < 0.8` → badge "✦ IA?" (baixa confiança)
- A sugestão só sobrescreve a classe se o usuário não editou manualmente (`!_userClass`)

O AI é **não-bloqueante**: se falhar (503, timeout), o wizard continua com as classes derivadas do nome da aba.

### 4.5 Endpoint `POST /api/import` — inserção em batch

```typescript
// Recebe array de itens validados
// Para cada item:
const isManual = !i.ticker
INSERT INTO assets (..., balance_updated_at)
VALUES (..., ${isManual ? "datetime('now')" : 'NULL'})
```

**Validações do backend:**
- `institution` deve ser `XP|ITAU|ONZE|OUTROS`
- Se `institution = OUTROS`, `institution_name` é obrigatório
- `class` deve ser uma das 7 classes válidas
- `name` é obrigatório
- Se tem `ticker`, `qty` é obrigatório
- Se não tem `ticker`, `manual_balance` é obrigatório

**Após inserção:** Para itens com `invested > 0` e classe elegível (ACAO, FII, FUNDO, RF, TESOURO), cria automaticamente um aporte inicial em `asset_contributions`.

---

## 5. Integração entre CVM e Import XLSX

**RN-114:** A planilha XLSX pode conter fundos CVM. Para que o import reconheça automaticamente:
- A aba deve ser `Fundos`
- A coluna `Ticker` deve conter o CNPJ formatado (ex: `73.232.530/0001-39`)
- Backend detecta: se `class = FUNDO` e o "ticker" parece um CNPJ → `quote_source = 'CVM'`

**Estado atual (2026-06-17):** Essa lógica **ainda não está implementada no `POST /api/import`**. O handler atual trata o campo como ticker B3 simples. Gabriel precisa implementar a detecção de CNPJ no import.

---

## 6. Edge Cases e Regras de Negócio

### 6.1 Fundo cadastrado como CVM — fallback de cota ausente

Fluxo de cadastro (Sheet C → `POST /api/assets`):
```
1. Usuário seleciona fundo via busca CVM
2. Frontend envia: { cvm_cnpj, initial_balance (saldo em R$) }
3. Backend tenta: qty = initial_balance / quotes_cache.price (cota atual)
4. Se cota NÃO está no cache → cvmFallbackToManual = true
   → Cria ativo manual com initial_balance como manual_balance
   → quote_source = NULL (modo manual temporário)
5. Próximo cron CVM popula quotes_cache → ativo ainda fica manual
   → BUG PENDENTE: ativo fica preso em modo manual após o primeiro cron
```

**Tarefa para Gabriel:** Implementar reconciliação pós-cron — após `refreshCvmQuotes()`, verificar ativos com `quote_source IS NULL` que têm CNPJ em cvm_funds_cache e convertê-los para modo CVM automaticamente.

### 6.2 VL_QUOTA = 0 para fundo do usuário

```typescript
const quota = parseFloat(quotaStr)
if (!(quota > 0)) continue  // ignora VL_QUOTA = 0
```

Fundos em liquidação podem ter VL_QUOTA = 0. Não atualizamos o cache — mantemos o último valor válido. Saldo zero seria incorreto.

### 6.3 CNPJ do usuário não encontrado no informe diário

O fundo pode não ter operado naquele dia (feriado, suspensão, bloqueio da CVM). Comportamento: `quotes_cache` não é atualizado, o app usa o último valor válido. Indicador de frescor (3 dias) alerta o usuário se ficar desatualizado.

### 6.4 CVM fora do ar

```typescript
try {
  resp = await fetch(zipUrl)
} catch (err) {
  console.log(`CVM quotes: fetch failed for ${zipUrl}`, err)
  return  // encerra silenciosamente — próximo cron tenta
}
if (!resp.ok) {
  console.log(`CVM quotes: HTTP ${resp.status} for ${zipUrl}`)
  return
}
```

Sem retry automático. O cron do dia seguinte tenta novamente. Dados existentes ficam intactos.

### 6.5 ZIP corrompido ou formato diferente

```typescript
if (magic !== 0x04034b50) throw new Error('ZIP: invalid magic bytes...')
if (compressionMethod !== 8) throw new Error('ZIP: unsupported compression method...')
```

Se a CVM mudar o formato (nunca aconteceu), o cron encerra com log de erro. Requer intervenção manual. Assina `console.log()` no Cloudflare Dashboard para monitorar.

### 6.6 Batch insert D1 — limite de 1000 queries por batch()

Para ~15K fundos com 11 rows por INSERT: ~1.364 statements. D1 limita 1000 por `db.batch()`.

```typescript
// Solução: dois batches sequenciais
// 1º batch: DELETE + primeiros 999 INSERTs
// 2º+ batch: restante (em grupos de 1000)
const firstBatch = [deleteStmt, ...allInsertStmts.slice(0, 999)]
await db.batch(firstBatch)

let offset = 999
while (offset < allInsertStmts.length) {
  const batch = allInsertStmts.slice(offset, offset + 1000)
  await db.batch(batch)
  offset += 1000
}
```

### 6.7 Múltiplas classes de cotas do mesmo fundo

O CSV pode ter múltiplas linhas para um mesmo CNPJ (classes diferentes, subclasses). O `streamParseCsvFromZip()` mantém apenas a linha com **data mais recente**:

```typescript
const existing = results.get(cnpj)
if (!existing || date > existing.date) {
  results.set(cnpj, { date, quota })
}
```

Se um CNPJ tem subclasses com VL_QUOTA diferentes, pega a linha mais recente — que pode ser de subclasse diferente a cada dia. **Isso é um edge case não tratado.** Para a maioria dos fundos (classe única), não é problema.

### 6.8 Duplicatas no import XLSX

O `POST /api/import` não verifica duplicatas. Se o usuário importar o mesmo arquivo duas vezes, os ativos são criados dobrados. **Não há deduplicação hoje.** Tarefa para Gabriel: implementar check de `(user_id, name, institution)` antes do INSERT, ou flag de idempotência na UI.

### 6.9 Fundos extintos no XLSX

Se o usuário tem um ativo CVM e o fundo é extinto (SIT muda para diferente de `'EM FUNCIONAMENTO NORMAL'`):
- `refreshCvmFundsCache()` remove o fundo do `cvm_funds_cache` (DELETE + reinsert sem o fundo)
- O ativo continua existindo em `assets` com `quote_source = 'CVM'`
- `refreshCvmQuotes()` não encontra o CNPJ no informe diário → não atualiza o cache
- Após 3 dias sem atualização → indicador de frescor alerta o usuário
- **Não há alerta específico de "fundo extinto"** — é tratado como frescor ruim

---

## 7. Endpoints Relevantes

### 7.1 `GET /api/funds/search?q=` (público, sem auth)

```
Request:  GET /api/funds/search?q=icatu+vanguarda
Response: {
  results: [{
    cnpj: "73.232.530/0001-39",
    name: "ICATU VANGUARDA DIV ACOES FI",
    manager: "ICATU VANGUARDA",
    class_: "Ações",
    classAnbima: "Ações Índice Ativo",
    benchmark: "Ibovespa",
    aum: 1234567890.50
  }]
}
```

Mínimo 3 chars (`q.length < 3` → retorna `{ results: [] }`).

### 7.2 `POST /api/assets` com `cvm_cnpj`

```json
{
  "institution": "XP",
  "class": "FUNDO",
  "name": "Icatu Vanguarda Div Ações FI",
  "cvm_cnpj": "73.232.530/0001-39",
  "initial_balance": 15000.00,
  "invested": 13500.00
}
```

**Regras de validação:**
- `cvm_cnpj` e `ticker` são mutuamente exclusivos
- Se `cvm_cnpj` presente: `qty` ou `initial_balance` obrigatório
- Se `ticker` presente (sem `cvm_cnpj`): `qty` obrigatório
- Se nenhum dos dois: `manual_balance` obrigatório

### 7.3 `POST /api/import`

```json
{
  "items": [
    {
      "institution": "XP",
      "class": "ACAO",
      "name": "Petrobras PN",
      "ticker": "PETR4",
      "qty": 100,
      "invested": 2800.00
    },
    {
      "institution": "ITAU",
      "class": "RF",
      "name": "CDB Itaú 105% CDI",
      "manual_balance": 50000.00,
      "invested": 45000.00
    }
  ]
}
```

### 7.4 `POST /api/import/analyze` (Smart Import AI)

```json
// Request
{ "items": [{ "name": "Petrobras PN", "ticker": "PETR4" }] }

// Response
{ "suggestions": [{ "index": 0, "class": "ACAO", "confidence": 0.97 }] }
```

---

## 8. Checklist de QA para Testes de Import

### 8.1 Testes manuais com planilha real

Use `public/template-quanto.xlsx` como base. Testar:

| Caso | Descrição | Resultado Esperado |
|------|-----------|------------------|
| **Caso feliz** | Planilha completa com todas as abas | Todos os ativos importados, toast de sucesso |
| **Aba desconhecida** | Aba extra "Outros" na planilha | Aba ignorada silenciosamente |
| **Row sem Nome e sem Ticker** | Row completamente vazia | Badge ERRO, não importa |
| **Valor com vírgula** | `Saldo Atual = "15.234,56"` | Parseado corretamente como 15234.56 |
| **Instituição desconhecida** | `Instituicao = "BTG"` | institution=OUTROS, institutionName="BTG" |
| **Fundo sem Saldo** | Row de fundo sem `Saldo Atual` | `manual_balance = null` → importado como manual_balance=0 |
| **Import duplo** | Importar o mesmo arquivo duas vezes | Assets duplicados (bug conhecido — ver 6.8) |
| **Arquivo corrompido** | `.xlsx` com conteúdo inválido | Toast "Erro ao processar planilha" |
| **Arquivo muito grande** | XLSX com 500+ rows | Deve processar sem timeout (SheetJS lida bem) |

### 8.2 Testes de pipeline CVM

Para testar localmente sem acertar a CVM de verdade:

```typescript
// Criar mock de fetch no Vitest (quando tiver testes automatizados)
// Por enquanto, validar com wrangler dev + curl:

# 1. Verificar se cvm_funds_cache está populada
curl -H "Authorization: Bearer $JWT" http://localhost:8787/api/funds/search?q=icatu

# 2. Verificar quotes_cache após cron manual
# No wrangler.toml, adicionar trigger ad-hoc ou chamar refresh via endpoint de debug

# 3. Verificar se ativo CVM tem saldo calculado
curl -H "Authorization: Bearer $JWT" http://localhost:8787/api/portfolio
# → asset.quoteSource = "CVM", asset.balance = qty * price
```

### 8.3 Casos negativos da API (regressão)

```bash
# Import sem itens
curl -X POST /api/import -d '{"items": []}' → 400

# Item sem nome
curl -X POST /api/import -d '{"items": [{"institution": "XP", "class": "RF"}]}' → 400

# cvm_cnpj + ticker juntos
curl -X POST /api/assets -d '{"cvm_cnpj": "...", "ticker": "PETR4", ...}' → 400

# Busca com menos de 3 chars
curl /api/funds/search?q=ab → { results: [] }
```

---

## 9. Tarefas Pendentes para Gabriel

### P0 — Crítico

| ID | Tarefa | Onde |
|----|--------|------|
| **T-CVM-01** | Reconciliação pós-cron: converter ativos em modo manual-fallback para CVM quando cota estiver disponível | `refreshCvmQuotes()` em `src/cvm.ts` |
| **T-IMP-01** | Detecção de CNPJ no `POST /api/import`: se classe = FUNDO e campo ticker parece CNPJ → `quote_source = 'CVM'` | `POST /api/import` em `src/index.ts` |

### P1 — Importante

| ID | Tarefa | Onde |
|----|--------|------|
| **T-IMP-02** | Deduplicação no import: verificar se já existe ativo com mesmo `(user_id, name, institution)` antes de inserir | `POST /api/import` |
| **T-CVM-02** | Alerta de fundo extinto: quando CNPJ não está mais em `cvm_funds_cache`, exibir aviso específico em vez de só frescor ruim | Frontend + lógica de portfolio |
| **QA-002** | Testes automatizados para import XLSX (task já existe no fleet.json) | `tests/` com Playwright |

### P2 — Melhorias

| ID | Tarefa | Onde |
|----|--------|------|
| **T-CVM-03** | Retry automático no cron CVM: 1 retry com 5s delay se fetch falhar (especificado em RN mas não implementado) | `refreshCvmQuotes()` |
| **T-CVM-04** | Múltiplas subclasses do mesmo CNPJ: estratégia explícita (pegar a de maior `VL_PATRIM_LIQ` ao invés de a mais recente) | `streamParseCsvFromZip()` |
| **T-IMP-03** | Importação de fundos CVM via CNPJ na planilha: detectar CNPJ na coluna Ticker da aba Fundos e criar com `quote_source = 'CVM'` | Frontend parser + backend |

---

## 10. Mapa de Arquivos

```
src/
  cvm.ts          ← TODO o pipeline CVM (453 linhas, zero deps externas)
  index.ts        ← Handlers dos endpoints:
                     GET /api/funds/search (ln 38-48)
                     POST /api/assets com cvm_cnpj (ln 546-710)
                     POST /api/import (ln 988-1086)
                     POST /api/import/analyze (ln 916-986)
                     scheduled() crons (ln 1992-2005)

public/
  app.js          ← Frontend:
                     initImport() (ln 1475)
                     handleFile() (ln 1501)
                     parseFile() (ln 1518) ← XLSX parsing
                     smartClassifyImport() (ln 1575) ← AI
                     renderImportReview() (ln 1596)
                     renderImportConfirm() (ln 1635)
                     confirmImport() (ln 1659)
                     selectFund() / onFundSearch() (ln 1296-1370) ← CVM autocomplete
  template-quanto.xlsx ← template de referência para usuários

docs/
  SPEC_CVM_PIPELINE.md ← spec funcional + técnica + arquitetural completa (17 RNs)

schema.sql        ← assets (quote_source), cvm_funds_cache, quotes_cache
wrangler.toml     ← 4 cron triggers (incluindo 2 CVM)
```

---

## 11. Decisões Arquiteturais (para não refazer o debate)

| Decisão | O que e por quê |
|---------|----------------|
| **`DecompressionStream` nativo** | Zero libs externas. `fflate.unzipSync()` excederia 128 MB de RAM do Workers |
| **`ticker` armazena CNPJ para CVM** | Reutiliza views SQL existentes sem nenhuma alteração. Semanticamente impreciso, mas ganho é zero alteração em 4 views |
| **`quotes_cache` compartilhada** | Mesmo join, mesmo cálculo `qty × price`. Alternativa (tabela separada) exigiria refatorar todas as views |
| **Sem backfill histórico** | Quanto usa snapshots mensais para histórico. VL_QUOTA histórico = anti-escopo (seria para rentabilidade, que não é uma feature) |
| **Cron seg-sex** | CVM não publica em fins de semana. Rodar sábado/domingo baixaria o mesmo ZIP sem dados novos |
| **Latin-1 com `String.fromCharCode`** | Limitação do Workers (sem TextDecoder latin1). Workaround correto por definição (ISO-8859-1 ↔ Unicode BMP identidade) |
| **Sem deduplicação no import** | MVP: simplicidade > segurança contra duplo-import. Usuário tem controle no Step 2 (remover items) |

---

## 12. Q&A com Beatriz (disponível)

Esta é minha última entrega como responsável por dados. Mas estou disponível para:
- Walkthrough do código (CHR-008 no fleet.json)
- Perguntas sobre edge cases não documentados aqui
- Validação de UX do wizard import (continuo como designer)

Boa sorte, Gabriel. O pipeline CVM foi das peças mais interessantes de construir — zero dependências externas, streaming real em Workers, parsing binário de ZIP. O código é limpo e bem comentado.

— Beatriz
