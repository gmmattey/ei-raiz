# QUANTO — Pipeline CVM: Cotacoes Automaticas de Fundos

> Cotacao automatica para fundos de investimento via dados abertos da CVM.

**Data:** 2026-06-14
**Status:** Aprovado para implementacao
**Depende de:** Spec funcional v1.3 (RN-01 a RN-98)
**Extends:** F-QUOTE (cotacoes automaticas)

---

## 1. Spec Funcional

### 1.1 Problema

Hoje o Quanto atualiza automaticamente cotacoes de acoes e FIIs via BRAPI, mas **fundos de investimento** (classe FUNDO) dependem de saldo manual. O usuario precisa abrir o app da corretora, copiar o saldo, e digitar no Quanto — mensalmente. Isso e o principal gerador de atrito no uso do app (contexto "atualizacao mensal" na spec v1.3, secao 2.2).

A CVM (Comissao de Valores Mobiliarios) publica diariamente o valor da cota (VL_QUOTA) de todos os ~22.000 fundos de investimento do Brasil. Essa informacao e publica, gratuita, e suficiente para calcular o saldo automatico de qualquer fundo: `saldo = quantidade_de_cotas × valor_da_cota`.

### 1.2 Solucao

Estender o mecanismo de cotacao automatica do Quanto para suportar fundos de investimento via dados da CVM:

- Usuario cadastra fundo informando **CNPJ do fundo** (buscavel por nome) + **quantidade de cotas**
- Sistema atualiza **diariamente** o valor da cota via informe diario da CVM
- Saldo calculado automaticamente: `qty × vl_quota`
- Mesmo UX dos ativos BRAPI: badge "auto", indicador de frescor, zero acao manual

### 1.3 Fontes de dados CVM

| Fonte | URL | Formato | Tamanho | Frequencia |
|-------|-----|---------|---------|------------|
| Cadastro geral de fundos | `dados.cvm.gov.br/dados/FI/CAD/DADOS/cad_fi.csv` | CSV (Latin-1, separador `;`) | ~17 MB | Atualizado diariamente |
| Informes diarios | `dados.cvm.gov.br/dados/FI/DOC/INF_DIARIO/DADOS/inf_diario_fi_{YYYYMM}.zip` | ZIP contendo CSV (UTF-8, separador `;`) | ~10 MB zip, ~120 MB CSV | Mensal (atualizado diariamente dentro do mes) |

### 1.4 Casos de uso

**UC-CVM-01: Cadastrar fundo com cotacao automatica**
1. Usuario toca FAB (+) na tela Carteira
2. Seleciona instituicao e classe = "FUNDO"
3. Campo "Buscar fundo" aparece — usuario digita parte do nome (min 3 caracteres)
4. Sistema busca em `cvm_funds_cache` por nome (LIKE)
5. Resultados exibidos: nome do fundo + gestora + CNPJ
6. Usuario seleciona um fundo
7. Sistema preenche nome e vincula o CNPJ
8. Usuario informa quantidade de cotas (obrigatorio) e valor investido (opcional)
9. Submit → ativo criado com modo auto/CVM
10. Proximo cron atualiza o valor da cota; saldo calculado automaticamente

**UC-CVM-02: Atualizacao automatica diaria**
1. Cron trigger dispara as 22h UTC (19h BRT)
2. Worker consulta quais CNPJs de fundos existem nos assets dos usuarios
3. Se nenhum CNPJ CVM: encerra (zero trabalho)
4. Faz fetch do ZIP do informe diario do mes corrente
5. Stream-parse do CSV: filtra apenas os CNPJs necessarios
6. Para cada CNPJ, pega o VL_QUOTA da data mais recente
7. Upsert em `quotes_cache` (CNPJ como chave, VL_QUOTA como price)
8. Balance atualizado automaticamente pelo calculo existente: `qty × price`

**UC-CVM-03: Refresh do cadastro de fundos**
1. Cron trigger dispara dia 2 de cada mes, 23h UTC
2. Worker faz fetch de `cad_fi.csv` (17 MB)
3. Decodifica Latin-1 manualmente (Workers nao suporta TextDecoder latin-1)
4. Filtra: apenas `SIT = EM FUNCIONAMENTO NORMAL`
5. Upsert em `cvm_funds_cache` (~15K fundos ativos)
6. Fundos cancelados desde o ultimo refresh sao removidos do cache

**UC-CVM-04: Fundo nao encontrado no CVM**
1. Usuario busca fundo pelo nome, nao encontra
2. Opcao "Cadastrar manualmente" permanece disponivel
3. Usuario cria fundo sem CNPJ → modo manual (comportamento atual preservado)

### 1.5 Regras de negocio

#### Cotacao CVM (extends F-QUOTE)

- **RN-99:** Ativos com `quote_source = 'CVM'` tem saldo calculado como `qty × vl_quota`, onde `vl_quota` vem de `quotes_cache` usando o CNPJ do fundo como chave
- **RN-100:** O valor da cota (VL_QUOTA) e atualizado diariamente pelo cron CVM. Nao ha refresh on-demand no endpoint `/api/portfolio` para ativos CVM (diferente do BRAPI que refresha a cada 15 min)
- **RN-101:** Se a cota CVM nao esta disponivel (fundo novo, CVM fora do ar), usa `invested` como fallback de saldo — mesma logica de RN-06
- **RN-102:** Ativos CVM exibem badge "auto" na tela Carteira — mesmo tratamento visual de ativos BRAPI
- **RN-103:** O indicador de frescor para ativos CVM usa `quotes_cache.fetched_at`. Um ativo CVM e considerado stale se `fetched_at` > 3 dias (vs 30 dias para manuais). Tres dias acomoda fins de semana e feriados
- **RN-104:** Ao cadastrar fundo via busca CVM, `qty` (quantidade de cotas) e obrigatorio. Sem `qty`, nao e possivel calcular saldo automatico

#### Cadastro de fundos

- **RN-105:** A busca de fundos pesquisa por `denom_social LIKE '%query%'` na tabela `cvm_funds_cache`, limitada a 20 resultados, ordenada por `vl_patrim_liq DESC` (fundos maiores primeiro)
- **RN-106:** Resultados da busca exibem: nome do fundo (truncado em 60 chars), gestora, CNPJ formatado. Fonte: `cvm_funds_cache`
- **RN-107:** O cadastro CVM (`cvm_funds_cache`) e atualizado mensalmente. Filtra apenas fundos com `SIT = 'EM FUNCIONAMENTO NORMAL'` e `TP_FUNDO IN ('FI', 'CLASSES - FIF')`
- **RN-108:** O CNPJ e armazenado formatado (`XX.XXX.XXX/XXXX-XX`) — mesmo formato da fonte CVM

#### Cron CVM

- **RN-109:** O cron de cotas CVM roda diariamente as 22:00 UTC (apos fechamento do mercado BR e publicacao pela CVM)
- **RN-110:** O cron de cadastro CVM roda no dia 2 de cada mes, 23:00 UTC
- **RN-111:** Se o fetch da CVM falhar (timeout, erro HTTP, ZIP corrompido), o cron encerra silenciosamente sem alterar dados existentes. O cron do dia seguinte tenta novamente
- **RN-112:** O cron CVM so executa se existirem ativos com `quote_source = 'CVM'` no banco. Se nenhum usuario tem fundos CVM, o cron retorna imediatamente (zero fetch externo)

#### Integracao com features existentes

- **RN-113:** Ativos CVM participam normalmente do calculo de patrimonio total (RN-01), ganho (RN-07), alocacao por instituicao/classe (RN-94), e snapshot mensal (RN-43)
- **RN-114:** Ativos CVM podem ser importados via XLSX. A planilha deve conter CNPJ do fundo e quantidade de cotas. O import reconhece CNPJs e seta `quote_source = 'CVM'` automaticamente
- **RN-115:** Na edicao de ativo CVM (Sheet B), o usuario pode alterar `qty` (apos novo aporte ou resgate parcial). O nome e CNPJ sao readonly

---

## 2. Spec Tecnica

### 2.1 Alteracoes no schema D1

#### Tabela `assets` — nova coluna

```sql
ALTER TABLE assets ADD COLUMN quote_source TEXT
  CHECK (quote_source IS NULL OR quote_source IN ('BRAPI', 'CVM'));
```

- `NULL` → comportamento atual (BRAPI se ticker presente, manual se nao)
- `'BRAPI'` → explicito BRAPI (equivalente a NULL com ticker)
- `'CVM'` → cotacao via CVM; `ticker` armazena CNPJ do fundo

Nao e necessario novo indice — o filtro por `quote_source` sempre acompanha `user_id` e `status`, cobertos pelo indice existente `idx_assets_user`.

#### Nova tabela `cvm_funds_cache`

```sql
CREATE TABLE cvm_funds_cache (
  cnpj           TEXT PRIMARY KEY,  -- XX.XXX.XXX/XXXX-XX
  denom_social   TEXT NOT NULL,     -- nome completo do fundo
  classe         TEXT,              -- Multimercado, Acoes, Renda Fixa...
  classe_anbima  TEXT,              -- classificacao ANBIMA
  gestor         TEXT,              -- nome da gestora
  admin          TEXT,              -- nome da administradora
  fundo_cotas    TEXT,              -- S/N (flag fundo de cotas/feeder)
  rentab_fundo   TEXT,              -- benchmark (DI, Ibovespa, IPCA...)
  vl_patrim_liq  REAL,             -- patrimonio liquido (para ordenacao)
  fetched_at     TEXT NOT NULL
);

CREATE INDEX idx_cvm_funds_nome ON cvm_funds_cache(denom_social);
```

Estimativa: ~15.000 rows, ~5 MB em D1.

#### Views — ZERO alteracoes

As views `vw_portfolio_summary`, `vw_allocation_*`, `vw_freshness` **nao mudam**. O calculo `a.qty * COALESCE(q.price, 0)` funciona identicamente para BRAPI (ticker) e CVM (CNPJ como ticker), pois ambos usam `quotes_cache` com o mesmo join: `q.ticker = a.ticker`.

A unica excecao e `vw_freshness`, que hoje filtra `ticker IS NULL` para pegar apenas manuais. Ativos CVM tem `ticker IS NOT NULL` (contem CNPJ), entao sao corretamente excluidos da view de frescor manual — e isso e o comportamento desejado.

### 2.2 Alteracoes na API

#### POST /api/assets — aceitar `cvm_cnpj`

Novo campo opcional no request body:

```typescript
// Request body (adicional)
{
  cvm_cnpj: string  // CNPJ do fundo CVM (XX.XXX.XXX/XXXX-XX)
  qty: number       // obrigatorio quando cvm_cnpj presente
  // ticker NÃO deve ser enviado junto com cvm_cnpj
}
```

Logica no handler:
- Se `cvm_cnpj` presente: setar `ticker = cvm_cnpj`, `quote_source = 'CVM'`, ignorar `manual_balance`
- Se `ticker` presente (sem cvm_cnpj): comportamento atual (BRAPI)
- Se nenhum: modo manual (atual)
- Validar: `cvm_cnpj` e `ticker` sao mutuamente exclusivos

#### GET /api/portfolio — novo campo no response

Cada asset no response ganha:
```typescript
{
  // campos existentes...
  quoteSource: 'BRAPI' | 'CVM' | null  // novo
}
```

Alteracao na query de stale tickers (refresh BRAPI):
```sql
-- ANTES:
WHERE a.ticker IS NOT NULL AND ...

-- DEPOIS (exclui CVM do refresh BRAPI):
WHERE a.ticker IS NOT NULL
  AND (a.quote_source IS NULL OR a.quote_source = 'BRAPI')
  AND ...
```

#### GET /api/funds/search — NOVO endpoint

```
GET /api/funds/search?q=icatu+vanguarda
```

Response:
```json
{
  "results": [
    {
      "cnpj": "73.232.530/0001-39",
      "name": "ICATU VANGUARDA DIV ACOES FI",
      "manager": "ICATU VANGUARDA",
      "class": "Acoes",
      "classAnbima": "Acoes Indice Ativo",
      "benchmark": "Ibovespa",
      "aum": 1234567890.50
    }
  ]
}
```

Query D1:
```sql
SELECT cnpj, denom_social, gestor, classe, classe_anbima, rentab_fundo, vl_patrim_liq
FROM cvm_funds_cache
WHERE denom_social LIKE '%' || ? || '%'
ORDER BY vl_patrim_liq DESC
LIMIT 20
```

Sem auth (tabela de referencia publica). Busca case-insensitive via `COLLATE NOCASE` no indice ou `UPPER()`.

### 2.3 Cron triggers

#### wrangler.toml (alteracoes)

```toml
[triggers]
crons = [
  "0 12 * * *",     # cotacoes BRAPI diarias (meio-dia UTC = 9h BRT)
  "0 12 1 * *",     # snapshot mensal (dia 1, meio-dia UTC)
  "0 22 * * 1-5",   # cotas CVM diarias (22h UTC = 19h BRT, seg-sex)
  "0 23 2 * *"      # cadastro CVM mensal (dia 2, 23h UTC)
]
```

#### Handler (scheduled event)

```typescript
async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
  if (event.cron === '0 12 * * *') {
    ctx.waitUntil(refreshQuotes(env.DB, env))
  } else if (event.cron === '0 12 1 * *') {
    ctx.waitUntil(runMonthlySnapshot(env.DB))
  } else if (event.cron === '0 22 * * 1-5') {
    ctx.waitUntil(refreshCvmQuotes(env.DB))     // NOVO
  } else if (event.cron === '0 23 2 * *') {
    ctx.waitUntil(refreshCvmFundsCache(env.DB)) // NOVO
  }
}
```

### 2.4 Parsing CVM no Worker (core tecnico)

#### Informe diario: stream-parse do ZIP

O ZIP da CVM tem estrutura trivial: arquivo unico, DEFLATE, sem criptografia.

```
Bytes 0-29:   Local file header (30 bytes fixos)
Bytes 30-N:   Filename (tamanho variavel, tipicamente 24 bytes)
Byte N+1:     Raw DEFLATE stream → DecompressionStream('deflate-raw')
```

Workers suporta `DecompressionStream('deflate-raw')` nativamente. Nao e necessaria nenhuma biblioteca externa.

**Fluxo:**

```
1. Fetch ZIP (~10 MB) → ArrayBuffer
2. Ler local file header (30 bytes):
   - offset 8: compression method (esperar 8 = DEFLATE)
   - offset 18: compressed size (uint32 LE)
   - offset 26: filename length (uint16 LE)
   - offset 28: extra field length (uint16 LE)
3. Calcular data offset: 30 + filename_length + extra_length
4. Criar ReadableStream do DEFLATE slice
5. Pipe por DecompressionStream('deflate-raw')
6. Pipe por TextDecoderStream('utf-8')
7. Pipe por line splitter (TransformStream customizado)
8. Para cada linha:
   - Split por ';'
   - Se CNPJ_FUNDO_CLASSE in cnpjSet → manter
   - Senao → descartar
9. Resultado: ~20 linhas de ~500.000
```

**Memoria de pico:** ~12 MB (10 MB do ZIP buffer + buffers de streaming). Longe dos 128 MB.

**CPU:** Cron com intervalo >= 1h tem 15 minutos de CPU. Parsing de 500K linhas com filtro leva segundos.

#### Cadastro: fetch e parse Latin-1

O `cad_fi.csv` usa encoding Latin-1, que Workers nao suporta em TextDecoder. Workaround:

```typescript
function decodeLatin1(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunks: string[] = []
  for (let i = 0; i < bytes.length; i += 8192) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + 8192)))
  }
  return chunks.join('')
}
```

ISO-8859-1 mapeia bytes 0x00-0xFF diretamente para code points Unicode U+0000-U+00FF. O workaround e correto por definicao.

**Fluxo:**
1. Fetch `cad_fi.csv` (17 MB) → ArrayBuffer
2. Decodificar Latin-1 → string
3. Split por linhas, split por `;`
4. Filtrar: `SIT = 'EM FUNCIONAMENTO NORMAL'`
5. Extrair 9 colunas de 41
6. Batch upsert em `cvm_funds_cache`

**Batch insert:** D1 limita 100 params por query. Com 9 colunas, max 11 rows por INSERT. Para 15K rows: ~1.364 INSERTs via `db.batch()` (limite: 1.000 queries por invocacao). Solucao: usar 2 invocacoes de batch, ou INSERT com menos colunas.

Alternativa mais eficiente: DELETE + INSERT em batches (replace all), pois e um cache completo que e reconstruido mensalmente.

### 2.5 Limites validados do Cloudflare

| Recurso | Limite (paid) | Uso estimado | Margem |
|---------|---------------|-------------|--------|
| CPU time (cron >= 1h) | 15 minutos | ~10 segundos | 90x |
| Memoria | 128 MB | ~30 MB pico | 4x |
| Fetch response body | Sem limite | 17 MB (cadastro) | — |
| Subrequests por invocacao | 10.000 | 1 (um fetch) | 10.000x |
| D1 queries por invocacao | 1.000 | ~200 (batch inserts) | 5x |
| D1 database size | 10 GB | ~10 MB adicional | 1.000x |
| Cron triggers | 250 | 4 (total) | 62x |

### 2.6 Tratamento de erros

| Cenario | Comportamento | Justificativa |
|---------|--------------|---------------|
| CVM fora do ar (HTTP 5xx) | Log warning, encerrar sem alterar dados | Dados existentes permanecem validos; proximo cron tenta novamente |
| ZIP corrompido (magic bytes != PK) | Log error, encerrar | Nao arriscar parse de dados invalidos |
| Compression method != DEFLATE | Log error, encerrar | ZIP com metodo diferente nao e esperado; investigar manualmente |
| CSV com schema diferente (colunas faltando) | Log error, encerrar | CVM pode ter mudado formato; precisa intervencao |
| CNPJ do usuario nao encontrado no informe | Manter ultima cota valida | Fundo pode nao ter operado naquele dia (feriado, suspensao) |
| VL_QUOTA = 0 para fundo do usuario | Ignorar (nao atualizar quotes_cache) | Fundo em liquidacao; saldo zero seria incorreto |
| D1 batch insert falha parcialmente | Rollback via transaction; log error | Atomicidade do refresh |
| Fetch timeout (>30s download) | Retry uma vez com 5s delay; se falhar, encerrar | CVM pode estar lenta; nao bloquear Worker |

### 2.7 Alteracoes no frontend

| Componente | Alteracao |
|------------|----------|
| Sheet C (cadastro novo) | Quando `class = 'FUNDO'`: exibir campo "Buscar fundo" com autocomplete. Ao selecionar, preencher nome + CNPJ. Campo `qty` obrigatorio. `manual_balance` escondido |
| Sheet C (fallback) | Link "Nao encontrou? Cadastrar manualmente" → modo manual atual |
| Sheet B (edicao) | Para ativos CVM: `qty` editavel, `nome` e `CNPJ` readonly. Botao "Atualizar cotas" → PUT com novo `qty` |
| Tela Carteira | Badge "auto" para CVM (mesma cor/estilo do BRAPI). Nenhuma distincao visual necessaria |
| Tela Hoje | Zero alteracoes — o calculo de total ja funciona via views |

---

## 3. Decisoes Arquiteturais

### 3.1 DecompressionStream nativo vs fflate

**Decisao:** Usar `DecompressionStream('deflate-raw')` nativo do Workers.

**Motivo:** O CSV descomprimido de um mes cheio chega a ~120 MB. A funcao `fflate.unzipSync()` materializa o arquivo inteiro em memoria (120 MB + 10 MB ZIP = 130 MB > 128 MB limite). Com DecompressionStream nativo, o streaming mantem o pico de memoria em ~12 MB.

**Trade-off:** Requer parse manual do ZIP local file header (30 bytes, trivial). Em troca, zero dependencias externas e streaming real.

### 3.2 Filtro por CNPJs do usuario vs pipeline completo

**Decisao:** O cron faz fetch do ZIP completo mas filtra apenas os CNPJs dos fundos que usuarios possuem.

**Motivo:** O ZIP da CVM nao suporta query por CNPJ — e necessario baixar o arquivo inteiro (~10 MB). Porem, de ~500.000 linhas, apenas ~20-50 sao relevantes (fundos do usuario). O filtro reduz o volume de dados processados em 10.000x.

**Trade-off:** Se nenhum usuario tem fundos CVM, o cron detecta isso ANTES do fetch e retorna imediatamente (RN-112).

### 3.3 Reuso de `quotes_cache` vs tabela separada

**Decisao:** Reusar `quotes_cache` existente, com CNPJ como chave (campo `ticker`).

**Motivo:** As views SQL e o calculo de portfolio ja fazem `JOIN quotes_cache q ON q.ticker = a.ticker` e `a.qty * COALESCE(q.price, 0)`. Se o CNPJ for armazenado em `assets.ticker` e o VL_QUOTA em `quotes_cache.price`, **zero alteracoes** sao necessarias nas 4 views e no calculo de balance.

**Trade-off:** Semanticamente, `ticker` nao e o nome ideal para armazenar um CNPJ. Porem, o ganho de zero-alteracao em views (62 linhas de SQL intocadas) supera a imprecisao semantica. O campo `quote_source` documenta a intencao.

### 3.4 Backfill historico vs dados correntes

**Decisao:** Nao implementar backfill. Apenas dados do mes corrente.

**Motivo:** O Quanto ja captura historico via snapshots mensais (cron dia 1). Se o cron CVM roda antes do snapshot, o snapshot registra o patrimonio com cotas atualizadas. Dados historicos de VL_QUOTA por fundo nao sao necessarios para o calculo do patrimonio — sao necessarios para rentabilidade do fundo, que esta fora do escopo (anti-escopo: preco medio por trade).

**Extensao futura:** Se quisermos mostrar rentabilidade de fundos, sera necessario armazenar VL_QUOTA historico. Isso pode ser adicionado sem alterar a arquitetura atual — basta uma tabela `cvm_quotes_history` populada pelo mesmo cron.

### 3.5 Encoding Latin-1 sem TextDecoder

**Decisao:** Workaround manual com `String.fromCharCode()`.

**Motivo:** Workers nao suporta `TextDecoder('latin1')` — limitacao documentada e sem previsao de correcao. O workaround e correto por definicao: ISO-8859-1 e um mapeamento identidade para os primeiros 256 code points Unicode.

**Risco:** Nenhum. A CVM usa Latin-1 consistentemente. Se migrar para UTF-8 no futuro, o workaround produz resultado identico para caracteres ASCII (que sao >95% do conteudo).

### 3.6 Cron seg-sex vs diario

**Decisao:** Cron CVM roda seg-sex (`0 22 * * 1-5`), nao todos os dias.

**Motivo:** A CVM so publica informes em dias uteis. Rodar sabado/domingo faria fetch do mesmo ZIP sem dados novos — desperdicio de bandwidth e CPU. O cron de sabado/domingo nao causaria erro (simplesmente nao encontraria dados novos), mas e desnecessario.

**Trade-off:** Se houver feriado na segunda, os dados de sexta ficam validos ate terca. O indicador de frescor CVM (RN-103, threshold 3 dias) acomoda isso.

### 3.7 Horario do cron: 22h UTC

**Decisao:** 22:00 UTC = 19:00 BRT.

**Motivo:** A CVM publica os informes diarios ao longo da tarde, com atraso variavel (tipicamente 16h-18h BRT). As 19h BRT, a probabilidade de os dados estarem disponiveis e alta. Rodar antes (ex: 15h BRT) arriscaria pegar dados incompletos.

---

## 4. Resumo de impacto

| Componente | Alteracoes |
|------------|-----------|
| `schema.sql` | +1 coluna em `assets`, +1 tabela `cvm_funds_cache` |
| `src/index.ts` | +2 cron handlers, +1 endpoint `/api/funds/search`, ajuste em POST assets e stale-ticker query |
| `wrangler.toml` | +2 cron triggers |
| Views SQL | Zero alteracoes |
| `vw_portfolio_summary` | Zero alteracoes |
| `vw_allocation_*` | Zero alteracoes |
| `vw_freshness` | Zero alteracoes |
| Frontend (JS) | Sheet C (autocomplete fundo), Sheet B (edicao CVM) |
| Frontend (CSS) | Nenhuma |
| Dependencias externas | Nenhuma (zero libs adicionadas) |
| Custo adicional | R$ 0 (dentro dos limites free/paid do Workers + D1) |

### Estimativa de implementacao

| Tarefa | Linhas | Complexidade |
|--------|--------|-------------|
| `refreshCvmQuotes()` — cron diario com ZIP stream-parse | ~100 | Media |
| `refreshCvmFundsCache()` — cron mensal com Latin-1 parse | ~80 | Media |
| ZIP header parser + DecompressionStream pipe | ~40 | Baixa |
| Latin-1 decoder | ~10 | Baixa |
| CSV line splitter (TransformStream) | ~25 | Baixa |
| Endpoint `/api/funds/search` | ~30 | Baixa |
| Ajustes em POST /api/assets (aceitar `cvm_cnpj`) | ~20 | Baixa |
| Ajuste em stale-ticker query (excluir CVM) | ~5 | Trivial |
| Schema migration | ~15 | Trivial |
| Frontend: autocomplete fundo + Sheet C ajuste | ~80 | Media |
| **Total** | **~405** | |
