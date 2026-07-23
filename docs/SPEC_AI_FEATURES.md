# SPEC — IA no Quanto (Cloudflare Workers AI)

> Status: **backlog** — spec aprovada, implementação futura  
> Aprovado em: 2026-06-14  
> Depende de: FEAT-005, FEAT-006, FEAT-008 (telas concluídas)

---

## Visão geral

Três features de IA usando o binding nativo `AI` do Cloudflare Workers. Um único módulo `src/ai.ts`, um único binding, três casos de uso distintos.

**Filosofia:** IA como assistente silencioso, não como consultor. Nenhuma feature bloqueia o fluxo do usuário — todas são opcionais, assíncronas ou on-demand.

| Feature | Quando roda | Modelo | Prioridade |
|---|---|---|---|
| Smart Labels | On save de ativo (background) | `llama-3.2-1b-instruct` | P1 |
| Smart Import | Upload XLSX → step 2 do wizard | `llama-3.2-3b-instruct` | P1 |
| Análise contextual | On demand (botão "Analisar") | `@qwen/qwen3-30b-a3b` | P2 |

---

## Infra — Workers AI binding

Adicionar em `wrangler.toml`:

```toml
[ai]
binding = "AI"
```

Adicionar ao tipo `Env` em `src/index.ts`:

```ts
AI: Ai  // import { Ai } from '@cloudflare/workers-types'
```

Custo estimado para 1.000 usuários ativos: **< $3/mês** (free tier cobre a maioria).  
Free tier: **10.000 neurons/dia** por conta.

---

## Feature 1 — Smart Labels

### O problema
Fundos CVM têm nomes crus horríveis:  
`"FI RF SIMPLES BANCO XP SA"` → o usuário não sabe o que é isso.

### A solução
Quando um ativo é criado ou atualizado (`POST /api/assets`, `PUT /api/assets/:id`), gerar um `display_name` amigável em background e salvar em D1.

### Implementação

**Schema:** adicionar coluna `display_name TEXT` na tabela `assets` (nullable).  
O frontend usa `display_name ?? name` ao exibir.

**Prompt:**
```
You are a financial asset name formatter for Brazilian investors.
Convert the raw fund/asset name to a short, friendly display name in Portuguese.
Rules: max 30 chars, keep the institution name if recognizable, remove legal suffixes (SA, LTDA, FI, etc).
Examples:
  "FI RF SIMPLES BANCO XP SA" → "XP Simples RF"
  "BTG PACTUAL TESOURO SELIC FI RF" → "BTG Tesouro Selic"
  "ITAÚ PERSONNALITÉ AÇÕES FIC FIA" → "Itaú Personnalité Ações"

Raw name: {{name}}
Display name:
```

**Modelo:** `@cf/meta/llama-3.2-1b-instruct`  
**Latência:** ~300ms (background, não bloqueia resposta ao usuário)  
**Fallback:** se o modelo falhar, `display_name` fica null e o frontend usa `name`.

---

## Feature 2 — Smart Import

### O problema
No wizard de importação XLSX (Sheet D), o usuário carrega a planilha mas tem que:
1. Identificar manualmente qual coluna é qual
2. Corrigir nomes de fundos que não batem com o CVM
3. Atribuir a classe do ativo manualmente para cada linha

### A solução
No step 2 do wizard (revisão), antes de mostrar a tabela ao usuário, rodar IA para:
1. **Detectar colunas** — inferir quais são: nome, valor, quantidade, ticker, instituição
2. **Fuzzy match CVM** — para linhas que parecem fundos, buscar o CNPJ mais provável em `cvm_funds_cache`
3. **Auto-classificar** — sugerir a classe do ativo (`ACAO`, `FII`, `FUNDO`, `RENDA_FIXA`, `PREVIDENCIA`, `OUTRO`)

### Implementação

**Endpoint:** `POST /api/import` já existente — adicionar chamada ao módulo AI após parse do XLSX, antes de retornar preview ao frontend.

**Fluxo:**
```
Upload XLSX → parse colunas → AI analisa cabeçalhos → sugere mapeamento
                            → AI classifica cada linha → sugere asset_class
                            → fuzzy match vs cvm_funds_cache (SQL LIKE + AI rank)
                            → retorna preview com sugestões + confidence
```

**Prompt de detecção de colunas:**
```
You are parsing a Brazilian investment portfolio spreadsheet.
Given these column headers, identify what each column likely represents.
Headers: {{headers_json}}
Return JSON: { "name": "colA", "value": "colB", "quantity": "colC", "ticker": null, "institution": "colD" }
Only include fields you're confident about.
```

**Prompt de classificação:**
```
Classify this Brazilian financial asset into one category.
Asset name: {{name}}
Institution: {{institution}}
Categories: ACAO, FII, FUNDO, RENDA_FIXA, PREVIDENCIA, OUTRO
Return only the category name.
```

**Modelo:** `@cf/meta/llama-3.2-3b-instruct`  
**Latência:** ~800ms por batch (processamento único de toda a planilha, não por linha)  
**Fallback:** se falhar, wizard prossegue normalmente — usuário faz o mapeamento manualmente (comportamento atual).

**UX:** no step 2, cada linha tem um badge de confiança. Usuário pode corrigir antes de confirmar.

---

## Feature 3 — Análise Contextual

### O problema
O usuário está olhando para o número total e não sabe interpretar: está bom? está concentrado demais? teve bom desempenho?

### A solução
Botão **"✦ Analisar"** em três contextos. Ao clicar, abre um bottom sheet com 3–5 observações geradas pelo Qwen3.

### Contextos

| Onde | Botão | Escopo |
|---|---|---|
| Tela Hoje | "✦ Analisar carteira" | Portfolio inteiro |
| Tela Carteira | "✦ Analisar" | Ativos visíveis (respeita filtros ativos) |
| Sheet B (ativo aberto) | "✦ Analisar ativo" | Ativo específico |

### Endpoint

```
POST /api/ai/analyze
Authorization: Bearer <token>

// Carteira inteira
{ "context": "portfolio" }

// Filtro ativo na Carteira
{ "context": "filtered", "filter": { "class": "FUNDO" } }

// Ativo específico
{ "context": "asset", "asset_id": "uuid" }
```

**Response:**
```json
{
  "observations": [
    { "tone": "neutral", "text": "Sua carteira está distribuída em 3 instituições, com XP concentrando 68% do total (R$168K)." },
    { "tone": "attention", "text": "Onze (previdência) não é atualizado há 31 dias. O valor pode estar desatualizado." },
    { "tone": "positive", "text": "Seus ativos de renda fixa representam 72% do patrimônio, perfil conservador com boa previsibilidade." }
  ],
  "disclaimer": "Esta análise é gerada por inteligência artificial com fins informativos e não constitui recomendação de investimento. Consulte um assessor certificado antes de tomar decisões financeiras.",
  "generated_at": "2026-06-14T21:00:00Z"
}
```

### Dados enviados ao modelo por contexto

**Portfolio inteiro:**
- Patrimônio total + variação vs mês anterior
- Alocação por classe (%) e por instituição (% e R$)
- Top 5 ativos por valor (nome, classe, valor, % do total)
- Frescor por instituição (última atualização)
- Performance 3M via snapshots mensais (se disponível)

**Filtro ativo (ex: só FIIs):**
- Subtotal filtrado + % do patrimônio total
- Lista de ativos do filtro (nome, valor, variação de cotação)
- Classe/instituição do contexto

**Ativo específico:**
- Nome, tipo, classe, instituição
- Valor atual + % do patrimônio total
- Cotação atual + variação (BRAPI ou CVM, conforme tipo)
- Benchmark implícito do ativo (CDI para RF, Ibovespa para ACAO, IFIX para FII)
- Data da última atualização manual (se manual)

### Prompt base (portfolio)

```
Você é um assistente de análise patrimonial para o app Quanto.
Analise os dados da carteira abaixo e gere de 3 a 5 observações factuais em português,
sem fazer recomendações de compra, venda ou rebalanceamento.
Foque em: concentração, diversificação, frescor dos dados, performance relativa.
Use linguagem direta, sem jargões. Máximo 2 linhas por observação.

Carteira:
{{context_json}}

Responda em JSON com o campo "observations": array de objetos com "tone" (neutral/attention/positive) e "text".
```

### Modelo
`@qwen/qwen3-30b-a3b` (Mixture of Experts, 30B total / 3B ativos)
- Excelente em português e análise de texto estruturado
- Latência p50: ~1,2s (aceitável para on-demand)
- Free tier cobre ~15–30 análises/dia por conta

### Disclaimer — obrigatório
Exibir sempre no rodapé do sheet de análise:

> *Esta análise é gerada por inteligência artificial com fins informativos e não constitui recomendação de investimento. Consulte um assessor certificado (AAI/CNPI) antes de tomar decisões financeiras.*

### UX

1. Usuário clica "✦ Analisar"
2. Sheet abre com skeleton loader
3. Análise aparece (~1–2s) com observações agrupadas por tom (positivo → neutro → atenção)
4. Disclaimer fixo no rodapé
5. Botão "Fechar"

**O botão não aparece se:**
- O usuário não tiver ativos cadastrados
- O contexto filtrado retornar 0 ativos

---

## Módulo src/ai.ts — esboço

```ts
import type { Ai } from '@cloudflare/workers-types'

export async function generateDisplayName(ai: Ai, rawName: string): Promise<string | null> {
  // Llama 1B — background, fire-and-forget no POST /api/assets
}

export async function analyzeImportRows(ai: Ai, headers: string[], rows: unknown[][]): Promise<ImportSuggestions> {
  // Llama 3B — chamado no POST /api/import após parse
}

export async function analyzeContext(ai: Ai, context: AnalyzeContext): Promise<AnalysisResult> {
  // Qwen3 30B — chamado no POST /api/ai/analyze
}

type AnalyzeContext =
  | { type: 'portfolio'; data: PortfolioData }
  | { type: 'filtered'; data: FilteredData }
  | { type: 'asset'; data: AssetData }
```

---

## Checklist de implementação

### Pré-requisitos
- [ ] Telas Hoje (FEAT-005), Carteira (FEAT-006) e Import (FEAT-008) concluídas
- [ ] Adicionar `[ai]` binding no `wrangler.toml`
- [ ] Adicionar coluna `display_name` em `assets` (migration)

### Smart Labels (FEAT-013)
- [ ] Criar `src/ai.ts` com `generateDisplayName()`
- [ ] Chamar em background no `POST /api/assets` e `PUT /api/assets/:id`
- [ ] Frontend: usar `display_name ?? name` em todos os lugares
- [ ] Testar com 20 nomes de fundos CVM reais

### Smart Import (FEAT-014)
- [ ] Adicionar `analyzeImportRows()` em `src/ai.ts`
- [ ] Integrar no `POST /api/import` após parse
- [ ] UI: badges de confiança no step 2 do wizard
- [ ] Fallback silencioso se AI falhar

### Análise Contextual (FEAT-015)
- [ ] Criar `POST /api/ai/analyze`
- [ ] Implementar os 3 contextos (portfolio, filtered, asset)
- [ ] Testar prompt com dados reais de carteira
- [ ] Bottom sheet no frontend (Hoje, Carteira, Sheet B)
- [ ] Disclaimer obrigatório no UI
- [ ] Não renderizar botão quando não há ativos
