# Quanto. — Auditoria Funcional do Esquilo Invest

> **De:** Equipe de Consultoria Técnica
> **Para:** Luiz Giammattey — Fundador
> **Data:** 13 de junho de 2026
> **Classificação:** Confidencial — Uso Interno
> **Escopo:** Avaliação feature-a-feature do Esquilo Invest para decisão de quais funcionalidades trazer ao Quanto

---

## Premissa

Este documento complementa a [Auditoria de Migração](AUDITORIA_MIGRACAO_QUANTO.md). Enquanto o primeiro avaliou código e infraestrutura, este avalia **funcionalidades** — o que o Esquilo faz, quão bem faz, e o que vale trazer pro Quanto mesmo que vá além da spec v2.

A spec v2 é o **piso**, não o teto. Funcionalidades que agreguem valor real sem comprometer a simplicidade devem ser consideradas.

---

## Mapa de Funcionalidades

O Esquilo Invest tem **22 telas agrupadas em 8 domínios funcionais**, com **36 endpoints** e **3 cron jobs**. Cada funcionalidade foi avaliada pelo estado real do código (não pelo que o README diz).

### Legenda de Status

| Status | Significado |
|--------|-------------|
| FUNCIONAL | Implementação completa, testável, sem bugs bloqueantes |
| PARCIAL | Funciona em parte — features incompletas ou caminhos mortos |
| QUEBRADO | Compila mas falha em runtime ou produz resultado errado |
| STUB | Esqueleto sem implementação real (retorna vazio ou hardcoded) |

---

## 1. DOMÍNIO: Patrimônio (Core)

### 1.1 Dashboard / Resumo Patrimonial

| | |
|---|---|
| **O que faz** | Endpoint único (`GET /patrimonio/resumo`) retorna patrimônio bruto, líquido, dívida, score, alocação, top 5 ativos, e evolução 24 meses. Frontend exibe número-tese, gráfico de evolução (Recharts AreaChart), cards de alocação, top ativos. |
| **Status** | FUNCIONAL |
| **Backend** | `patrimonio.servico.ts`, `patrimonio.repositorio.ts`, view `vw_patrimonio_resumo` |
| **Frontend** | `Home.jsx` (920 linhas), `HomeMobile.jsx` (500 linhas) |
| **Qualidade código** | ALTA — agregação feita em SQL views, service layer leve, 4 queries paralelas com `Promise.all` |
| **Qualidade UX** | BOA — endpoint único = loading rápido; saudação por horário; cache 60s com localStorage |
| **Bugs** | Home desktop faz 5 chamadas API redundantes (o mobile faz 1). Sem impacto funcional. |

**Veredicto: TRAZER** — É o coração do Quanto. Mapeia diretamente à tela "Hoje".

**O que aproveitar:**
- Pattern de endpoint único com views SQL (copiar `vw_patrimonio_resumo`, adaptar)
- `fmt()` / `fmtPct()` — formatadores BRL e percentual (JS puro)
- `getSaudacao()` — saudação por horário (3 linhas)
- Cache com TTL em localStorage (81 linhas, JS puro)
- Pattern de 4 queries paralelas

---

### 1.2 CRUD de Ativos (Carteira)

| | |
|---|---|
| **O que faz** | Lista, cria, edita, deleta itens do patrimônio. 13 tipos suportados. Construção dinâmica de UPDATE (só campos alterados). Frontend com agrupamento por categoria, consolidação de duplicatas, filtros multi-eixo, gráfico donut. |
| **Status** | FUNCIONAL |
| **Backend** | ~100 linhas. Dynamic SET builder, pattern CRUD limpo |
| **Frontend** | `Carteira.jsx` (1110 linhas), `CarteiraMobile.jsx` (495 linhas) |
| **Qualidade código** | ALTA — builder dinâmico de UPDATE é elegante e seguro |
| **Qualidade UX** | BOA — categorias colapsáveis, donut chart, filtro por plataforma/status/busca |
| **Bugs** | Delete é hard delete (Quanto precisa soft delete). Validação mínima no create. |

**Veredicto: TRAZER** — Core do Quanto. Mapeia à tela "Carteira" e aos 4 endpoints CRUD.

**O que aproveitar:**
- Dynamic SET builder para PATCH (`patrimonio.repositorio.ts` linhas 186-205)
- `consolidarAtivos()` — merge de tickers duplicados com média ponderada
- `TIPO_PARA_CATEGORIA` — mapeamento tipo → categoria
- `calcGanhoPerda()` / `calcGanhoPerdaPerc()` — cálculo de ganho/perda
- Pattern de categorias colapsáveis com contagem

---

### 1.3 Histórico Mensal (Snapshots)

| | |
|---|---|
| **O que faz** | Snapshots mensais do patrimônio com UPSERT idempotente. Frontend lista meses com variação absoluta e percentual, filtros de período (3m/6m/12m). |
| **Status** | FUNCIONAL |
| **Backend** | Job cron (`historico-mensal.job.ts`, 58 linhas), view `vw_patrimonio_evolucao_mensal` |
| **Frontend** | `Historico.jsx` (203 linhas) — tabela simples, sem gráfico |
| **Qualidade código** | ALTA — UPSERT limpo, idempotente, `ano_mes` derivado de ISO |
| **Qualidade UX** | MEDÍOCRE — só tabela, sem gráfico. Seção "eventos" sempre vazia. |
| **Bugs** | `rentabilidade_mes_pct` é sempre NULL (nunca computado). |

**Veredicto: TRAZER** — Core do Quanto. Mapeia à tela "Histórico". Melhorar com gráfico SVG.

**O que aproveitar:**
- UPSERT mensal (`ON CONFLICT(month) DO UPDATE`) — padrão SQL direto
- `formatarAnoMes()` — "2024-01" → "Jan/2024"
- Cálculo de evolução no período (valor final vs inicial, %)
- Filtros de período (3m/6m/12m)

---

### 1.4 Cotações BRAPI (Cron)

| | |
|---|---|
| **O que faz** | Job cron busca preços atualizados via BRAPI para todos os tickers ativos. UPSERT no cache com TTL de 5 min. Roteamento por tipo: ação/FII/ETF → BRAPI, fundo → CVM. |
| **Status** | FUNCIONAL |
| **Backend** | `mercado-atualizar.job.ts` (70 linhas) |
| **Qualidade código** | ALTA — `buscarPreco()` é função standalone (~15 linhas de fetch). UPSERT SQL correto. |
| **Bugs** | Fetch one-at-a-time (sem batching BRAPI). Fundos CVM declarados mas nunca buscados. |

**Veredicto: TRAZER** — Core do Quanto. Simplificar: só BRAPI, cache 15 min.

**O que aproveitar:**
- `buscarPreco()` — fetch BRAPI com parse de `regularMarketPrice` (~15 linhas)
- UPSERT SQL para `quotes_cache`
- Pattern de iteração sobre tickers ativos

---

### 1.5 Recálculo de Patrimônio (Cron)

| | |
|---|---|
| **O que faz** | Drena fila de recálculo. Para cada item, `valor_atual = quantidade * preço_mais_recente`. Fallback para `preco_medio` quando sem cotação. Status machine: pendente → processando → concluído/falhou. |
| **Status** | FUNCIONAL |
| **Backend** | `patrimonio-reconstruir.job.ts` (72 linhas) |
| **Qualidade código** | ALTA — queue pattern robusto, error tracking no DB |
| **Bugs** | Nenhum. Mas fila assíncrona é over-engineering para single-user. |

**Veredicto: ADAPTAR** — Quanto não precisa da fila. A lógica `valor = quantidade * preço` é trivial e pode rodar direto no cron ou inline no endpoint.

**O que aproveitar:**
- Lógica core: `valor_atual = quantidade * latest_price` com fallback
- Subquery para preço mais recente do cache

---

## 2. DOMÍNIO: Detalhe de Ativo

### 2.1 Página de Detalhe do Ativo

| | |
|---|---|
| **O que faz** | Página individual por ativo: gráfico SVG de evolução (sem biblioteca), benchmark vs CDI, métricas de rentabilidade, formulário de compra, timeline de eventos, exclusão com motivo obrigatório. |
| **Status** | PARCIAL — gráfico e benchmark funcionam. Formulário de compra/venda desabilitado. |
| **Frontend** | `DetalheAtivo.jsx` (750 linhas), `DetalheAtivoMobile.jsx` (295 linhas) |
| **Qualidade UX** | BOA — gráfico SVG é zero-dependência e portável. Benchmark vs CDI é informação valiosa. Exclusão com motivo é bom padrão. |
| **Bugs** | Botão de transferência/venda mostra toast "não disponível". |

**Veredicto: CONSIDERAR (v2+)** — Não está na spec v2 mas é uma evolução natural. O gráfico SVG é o artefato visual mais valioso de todo o codebase.

**O que aproveitar:**
- `GraficoEvolucao` — gráfico SVG polyline sem dependência, portável direto para Vanilla JS
- Pattern de benchmark vs CDI (retorno do ativo vs taxa livre de risco)
- Exclusão com motivo obrigatório (mínimo 5 caracteres)

---

## 3. DOMÍNIO: Insights & Score Financeiro

### 3.1 Score de Saúde Financeira

| | |
|---|---|
| **O que faz** | Score 0-100 baseado em 4 pilares ponderados: Disciplina (30%, taxa de poupança vs meta 20%), Proteção (25%, meses de reserva vs meta 6), Diversificação (25%, nº de classes vs meta 5), Endividamento (20%, dívida/patrimônio). Gauge semicírculo SVG. 5 faixas: crítico/baixo/médio/bom/excelente. |
| **Status** | PARCIAL — cálculo existe como função pura (`calculos/score.ts`, 75 linhas), gauge SVG funciona, mas **nunca é executado** no backend (nenhum trigger chama `calcularScore()`). |
| **Frontend** | `Insights.jsx` (565 linhas), `ScoreSemiCircle.jsx` (79 linhas, SVG puro) |
| **Qualidade código** | ALTA — `score.ts` é função pura, testável, sem I/O |
| **Qualidade UX** | BOA — semicircle gauge é visual atrativo. Insight cards com severidade. Transparência de dados (mostra cobertura %). |
| **Bugs** | Vera AI integration é NO-OP stub. Score nunca é computado no backend. |

**Veredicto: CONSIDERAR (v2+)** — O score é uma feature premium que dá profundidade ao app. A implementação de cálculo já existe e é limpa. Requer dados que Quanto não coleta hoje (renda mensal, reserva de emergência).

**O que aproveitar se incluir:**
- `calculos/score.ts` — copiar inteiro (75 linhas, função pura)
- `ScoreSemiCircle.jsx` — gauge SVG portável (79 linhas)
- Sistema de faixas com cores (`BADGE_SCORE`)
- Insight cards com severidade (alerta/oportunidade/positivo)

---

## 4. DOMÍNIO: Aportes (Contribuições)

### 4.1 Tracking de Aportes

| | |
|---|---|
| **O que faz** | Registrar aportes/retiradas mensais com valor, data e observação. Meta mensal de aporte configurável. Resumo dos últimos 6 meses. CRUD completo com delete. |
| **Status** | FUNCIONAL |
| **Backend** | ~50 linhas, CRUD limpo com FK para patrimônio_itens |
| **Frontend** | `Aportes.jsx` (313 linhas) — form com masking de moeda, resumo 6m |
| **Qualidade UX** | BOA — form com máscara BRL, validação inline, feedback contextual |
| **Bugs** | `removerAporte` não verifica existência. Sem paginação (hardcoded 200). |

**Veredicto: NÃO TRAZER (v1)** — Anti-escopo da spec v2. Quanto não rastreia aportes individuais; o campo `invested` no ativo já guarda o total aplicado.

**O que aproveitar se mudar de ideia:**
- `parseCurrencyInput()` / `formatCurrencyInput()` — masking de input BRL (útil em qualquer form)

---

## 5. DOMÍNIO: Importação

### 5.1 Import de Planilha XLSX

| | |
|---|---|
| **O que faz** | Wizard 3 etapas (upload → processamento → revisão → confirmar). Drag-and-drop. Parse XLSX com SheetJS (lazy loaded). Preview com badges de status (ok/conflito/erro). Sugestões contextuais de correção. Template XLSX estilizado com validação de dropdown. 6 parsers por tipo de ativo. |
| **Status** | FUNCIONAL (frontend), STUB (backend — apenas armazena rows crus, sem processar) |
| **Frontend** | `Importar.jsx` (598 linhas), `importacaoParser.ts` (409 linhas), `importacaoTemplate.ts` (697 linhas) |
| **Qualidade código** | Parser: ALTA. Template: ALTA. Backend: BAIXA (skeleton sem cérebro) |
| **Qualidade UX** | EXCELENTE — a melhor UX do codebase inteiro. Wizard limpo, badges claros, sugestões de erro acionáveis, template profissional com data validation. |
| **Bugs** | Backend nunca processa os itens importados (status fica 'pendente' para sempre). |

**Veredicto: CONSIDERAR (v2+)** — A UX é excepcional, mas o backend é um stub. Para Quanto, seria necessário reescrever o backend de processamento do zero. O parser XLSX é world-class e vale preservar no repo Esquilo como referência.

**O que aproveitar se incluir:**
- `importacaoParser.ts` — 6 parsers por tipo de ativo com header detection flexível
- `identificarAba()` — matching de nome de aba (trata acentos, emoji, variações)
- Tipo helpers: `toStr()`, `toNum()`, `toInt()`, `toDate()` (coerção robusta)
- Pattern de wizard 3 etapas com contagem de status

---

## 6. DOMÍNIO: Simuladores de Decisão

### 6.1 Simulador de Imóvel (Comprar vs Alugar)

| | |
|---|---|
| **O que faz** | Compara cenários: comprar imóvel (financiamento + custos) vs alugar + investir a diferença. Premissas de mercado configuráveis (juros, IPCA, valorização). Resultado com diagnóstico e impacto no score. |
| **Status** | FUNCIONAL (frontend calcula tudo, backend só armazena resultado) |
| **Frontend** | `PropertySimulator.jsx` |
| **Qualidade UX** | BOA — wizard stepper no mobile, premissas editáveis, comparação A vs B visual |

### 6.2 Simulador de Carro (Comprar vs Investir)

| | |
|---|---|
| **O que faz** | Simulação de compra de veículo com integração FIPE (cascata marca → modelo → ano → preço). Compara custo total de propriedade vs investir o valor. |
| **Status** | FUNCIONAL (com integração FIPE real) |
| **Bugs** | `fipe.ts` no backend retorna objetos vazios (integração FIPE é apenas no frontend). |

### 6.3 Simulador Reserva vs Financiar

| | |
|---|---|
| **O que faz** | Usa reserva de emergência para uma compra vs financiar e manter a reserva. |
| **Status** | FUNCIONAL |

### 6.4 Simulador Gastar vs Investir

| | |
|---|---|
| **O que faz** | Mostra quanto um gasto de hoje custaria em valor futuro se investido. |
| **Status** | FUNCIONAL |

### 6.5 Simulador Livre

| | |
|---|---|
| **O que faz** | Comparação aberta entre dois cenários definidos pelo usuário. |
| **Status** | QUEBRADO — funções `calcular` e `salvar` referenciadas mas nunca definidas. Botões crasham com ReferenceError. |

**Veredicto global simuladores: NÃO TRAZER (v1)** — Complexidade alta (5 telas + componentes compartilhados), anti-escopo. O FreeSimulator está quebrado. A lógica de cálculo vive toda no frontend (backend é storage puro).

**O que aproveitar se mudar de ideia:**
- Componentes compartilhados: `DecisionSimulatorLayout`, `ScenarioComparisonCard`, `DecisionDiagnosisCard`
- `usePremissasMercado()` — premissas de mercado com defaults (taxas, juros, inflação)
- Pattern wizard mobile (`SimuladorWizard`)

---

## 7. DOMÍNIO: Perfil & Configurações

### 7.1 Perfil de Risco

| | |
|---|---|
| **O que faz** | Mostra perfil de investidor (conservador/moderado/arrojado) com alocação-alvo por perfil. Compara alocação atual vs alvos. Identifica maior desvio. |
| **Status** | FUNCIONAL |
| **Qualidade UX** | BOA — barra de alocação com marcador de alvo e desvio % |
| **Bugs** | Nenhum encontrado |

**Veredicto: NÃO TRAZER (v1)** — Quanto não faz rebalanceamento.

### 7.2 Contexto Financeiro

| | |
|---|---|
| **O que faz** | Coleta renda mensal por 8 categorias (CLT, PJ, autônomo, etc.). Define meta de aporte. |
| **Status** | FUNCIONAL |
| **Bugs** | Nenhum |

**Veredicto: NÃO TRAZER** — Não aplicável para single-user sem score.

### 7.3 Perfil do Usuário

| | |
|---|---|
| **O que faz** | Editor de perfil com 6 abas. Integração FIPE para veículos. Questionário de maturidade financeira. |
| **Status** | PARCIAL — 3 de 6 abas (patrimônio externo, dívidas, plataformas) **não salvam dados** (estado local não persiste à API) |
| **Qualidade UX** | MEDÍOCRE — abas que silenciosamente perdem dados são UX destrutiva |
| **Bugs** | Duplicata de options no SelectField. 3 abas não persistem. |

**Veredicto: NÃO TRAZER** — Single-user, sem perfil.

### 7.4 Configurações

| | |
|---|---|
| **O que faz** | Página de configurações com identidade, segurança, privacidade. |
| **Status** | STUB — todos os items são display-only sem handlers. "2 aparelhos ativos" é hardcoded. |

**Veredicto: NÃO TRAZER** — Completamente não-funcional.

---

## 8. DOMÍNIO: IA (Vera)

### 8.1 Assistente IA Financeiro

| | |
|---|---|
| **O que faz** | Chatbot com Cloudflare Workers AI (Llama 3.1 8B). Recebe mensagem, retorna resposta. |
| **Status** | FUNCIONAL (minimamente) — stateless, sem memória, sem contexto de carteira |
| **Backend** | ~30 linhas. System prompt de 1 frase. Sem RAG. Sem histórico de conversa. |
| **Qualidade** | BAIXA — implementação mínima que não agrega valor real |

**Veredicto: NÃO TRAZER (v1)** — Se IA for considerada futuramente, precisa ser reescrita do zero com RAG + contexto de carteira.

---

## 9. FEATURES CROSS-CUTTING (Transversais)

### 9.1 Ocultar Valores (ocultarValores)

| | |
|---|---|
| **O que faz** | Toggle global que substitui todos os valores monetários por "--------". Persistido em localStorage. Default: valores ocultos. |
| **Status** | FUNCIONAL — aplicado consistentemente em TODAS as telas sem exceção |
| **Qualidade UX** | EXCELENTE — privacidade ao usar o app em público. Default-hidden é decisão inteligente. |

**Veredicto: TRAZER** — Feature trivial de implementar (1 flag + 1 função `maskValue()`) com impacto alto em privacidade. Perfeita para PWA que se abre em qualquer lugar.

**O que aproveitar:**
- Pattern: `ocultarValores ? '--------' : fmt(valor)` em todo render de valor
- Default: valores ocultos (toggle para mostrar, não para esconder)
- Persistência em localStorage

---

### 9.2 Dark Mode

| | |
|---|---|
| **O que faz** | Tema escuro com CSS custom properties. Mobile segue preferência do sistema em real-time. Desktop persiste em localStorage, default dark. |
| **Status** | FUNCIONAL |
| **Qualidade UX** | BOA — split mobile/desktop é inteligente |
| **Bugs** | CSS do dark mode usa ~50 linhas de `!important` hackeado sobre Tailwind |

**Veredicto: TRAZER** — Quanto já usa CSS variables (--ink, --paper). Precisa apenas: detecção `prefers-color-scheme`, toggle de classe `dark`, swap das variáveis.

**O que aproveitar:**
- `matchMedia('(prefers-color-scheme: dark)')` com listener de mudança
- Pattern: classe `dark` no `<html>` + variáveis alternativas
- Persistência de preferência

---

### 9.3 Gráficos SVG Puros

| | |
|---|---|
| **O que faz** | Dois componentes de gráfico sem biblioteca: `GraficoEvolucao` (line chart com gradient fill) e `ScoreSemiCircle` (gauge semicírculo com cor por faixa). |
| **Status** | FUNCIONAL |
| **Qualidade** | ALTA — zero dependência, portável direto para Vanilla JS |

**Veredicto: TRAZER** — Quanto precisa de gráficos (evolução no Histórico, alocação no Hoje). Estes são exatamente o que serve: SVG puro, sem biblioteca, leve.

**O que aproveitar:**
- `GraficoEvolucao` — line chart SVG com polyline + gradient fill
- `ScoreSemiCircle` — gauge semicírculo SVG (se/quando score for incluído)
- Pattern de ViewBox responsivo

---

### 9.4 Formatadores e Utilitários

| | |
|---|---|
| **O que faz** | Conjunto de funções puras de formatação: moeda BRL, percentual com sinal, data pt-BR, ano-mês, masking de input monetário, saudação por horário. |
| **Status** | FUNCIONAL — todas as funções são puras e corretas |

**Veredicto: TRAZER** — Fundação para qualquer tela do Quanto.

| Função | O que faz | Linhas |
|--------|-----------|--------|
| `fmt(n)` | Número → "R$ 1.234" (sem decimais) | 3 |
| `fmtPct(n)` | Número → "+12,5%" (com sinal) | 3 |
| `getSaudacao()` | Hora → "Bom dia" / "Boa tarde" / "Boa noite" | 5 |
| `formatarAnoMes(s)` | "2024-01" → "Jan/2024" | 4 |
| `parseCurrencyInput(s)` | "1.234,56" → 1234.56 | 8 |
| `formatCurrencyInput(n)` | 1234.56 → "1.234,56" | 5 |
| Cache localStorage + TTL | Get/set com expiração, prefix namespace, bulk invalidation | 81 |

---

### 9.5 Cache com Revalidação

| | |
|---|---|
| **O que faz** | Pattern "cache first, then revalidate": mostra dados do localStorage imediatamente, busca fresh data em background, atualiza se diferente. TTL de 60s para dados de patrimônio. |
| **Status** | FUNCIONAL |
| **Qualidade** | ALTA — melhor padrão possível para PWA |

**Veredicto: TRAZER** — Fundamental para a experiência offline-first do Quanto.

---

## 10. DATABASE: Views SQL Valiosas

As views do Esquilo contêm lógica de agregação testada que roda nativamente em D1/SQLite:

| View | O que computa | Quanto relevance |
|------|---------------|------------------|
| `vw_patrimonio_resumo` | Soma bruto/líquido/dívida, último score, aportes do mês, rentabilidade mensal | ALTA — adaptar para `GET /api/portfolio` |
| `vw_patrimonio_posicoes` | JOIN itens + catálogo + cache de cotação, cálculo de rentabilidade inline | MÉDIA — pattern de JOIN útil |
| `vw_patrimonio_alocacao` | GROUP BY tipo/classe com SUM, excluindo dívida | ALTA — exatamente o que Quanto precisa por instituição/classe |
| `vw_patrimonio_evolucao_mensal` | Passthrough com ORDER BY do histórico mensal | BAIXA — trivial demais para ser view |

**Bug encontrado:** `vw_patrimonio_score_historico` usa `MAX(faixa)` que retorna máximo lexicográfico (texto), não a faixa do maior score. "médio" > "excelente" em ordem alfabética. Bug semântico.

---

## 11. Cálculos Puros (Módulos Standalone)

| Módulo | O que faz | Linhas | Quanto |
|--------|-----------|--------|--------|
| `calculos/alocacao.ts` | Calcula peso % de cada item sobre o total. Função pura. | 15 | COPIAR — direto para alocação no Hoje |
| `calculos/rentabilidade.ts` | Retorno simples % e variação mês-a-mês. Funções puras. | 12 | DISPONÍVEL — Quanto mostra "ganho sobre aplicado" |
| `calculos/score.ts` | Score 0-100, 4 pilares ponderados, 5 faixas. Função pura, sem I/O. | 75 | ARQUIVAR — melhor código do Esquilo, guardar para v2+ |

---

## 12. Consolidação: O Que Trazer

### Tier 1 — TRAZER (já está na spec v2 ou é trivial)

| Feature | Esforço | Impacto | Origem |
|---------|---------|---------|--------|
| Dashboard patrimonial (endpoint + views SQL) | Baixo | Core | Patrimônio Resumo |
| CRUD de ativos (dynamic UPDATE, soft delete) | Baixo | Core | Patrimônio Itens |
| Histórico mensal (cron + UPSERT) | Baixo | Core | Histórico Mensal |
| Cotações BRAPI (fetch + cache) | Baixo | Core | Mercado Atualizar Job |
| Ocultar valores | Mínimo | Alto | Cross-cutting |
| Dark mode (system preference) | Mínimo | Médio | Cross-cutting |
| Formatadores (fmt, fmtPct, saudação, data) | Mínimo | Base | Utilitários |
| Cache localStorage + revalidação | Baixo | Alto (PWA) | Cross-cutting |
| Gráfico SVG evolução (zero-dep) | Baixo | Alto (visual) | DetalheAtivo |
| View SQL de alocação (GROUP BY) | Mínimo | Médio | Database |

### Tier 2 — CONSIDERAR (agrega valor, esforço moderado)

| Feature | Esforço | Impacto | Pré-requisito | Risco |
|---------|---------|---------|---------------|-------|
| Detalhe do ativo (drill-down) | Médio | Médio | Tela adicional | +1 tela, +1 endpoint |
| Gráfico SVG alocação (donut/barras) | Baixo | Visual | Nenhum | Nenhum |
| Benchmark vs CDI | Baixo | Informativo | Cotação do CDI | Fonte de dados CDI |
| Score financeiro (4 pilares) | Médio | Alto | Dados de renda e reserva | Coleta de dados extras |
| Gauge semicírculo SVG | Baixo | Visual (se score incluído) | Score | Nenhum |
| Masking de input monetário | Mínimo | UX nos forms | Nenhum | Nenhum |

### Tier 3 — NÃO TRAZER (v1)

| Feature | Razão | Estado no Esquilo |
|---------|-------|-------------------|
| Aportes / contribuições | Anti-escopo. `invested` no ativo já cobre. | Funcional |
| Import XLSX | Complexidade alta. Backend é stub. | Frontend excelente, backend stub |
| 5 Simuladores | Complexidade muito alta. 1 quebrado. | 4 funcionais, 1 quebrado |
| Vera IA | Implementação rasa demais. Sem contexto/memória. | Funcional mas inútil |
| Perfil de risco / rebalanceamento | Anti-escopo. | Funcional |
| Contexto financeiro | Sem score, não serve. | Funcional |
| Perfil do usuário (6 abas) | Single-user. 3 abas não persistem. | Parcial |
| Configurações | 100% stub. | Stub |
| Painel admin | Single-user. | Funcional mas irrelevante |
| Telemetria | Single-user. | Funcional mas irrelevante |
| CVM fundos ingestão | Anti-escopo. Manual balance. | Funcional |
| Busca de ativos (catálogo) | Quanto não tem catálogo. | Funcional |

---

## 13. Recomendação Final

### O Quanto v1 deve ter:

**3 telas + 3 sheets** (como na spec v2), **mais** estas features do Esquilo que são triviais de incluir:

1. **Ocultar valores** — 1 flag + 1 função. Privacidade em público.
2. **Dark mode** — Quanto já tem CSS variables. Só precisa do toggle.
3. **Gráfico SVG de evolução** — Zero dependência. Substitui a tabela sem graça do Histórico.
4. **Cache first, then revalidate** — Pattern fundamental para PWA offline-first.
5. **Masking de input BRL** — UX melhor nos forms de saldo.

### O Quanto v2 pode ganhar:

1. **Detalhe do ativo** (tela 4) — drill-down com gráfico SVG e benchmark
2. **Score financeiro** — se o usuário quiser informar renda/reserva
3. **Gauge SVG** — visual premium para o score

### O Quanto definitivamente NÃO precisa de:

- Nada do domínio de decisões/simuladores (complexo, 1 quebrado)
- Nada de import (backend stub, complexidade alta)
- Nada de IA (implementação rasa)
- Nada de multi-user (auth, perfil, admin, telemetria)

---

## 14. Inventário de Código Reaproveitável (Atualizado)

Com a auditoria funcional, o reuso sobe de ~800 para **~1.400 linhas** de lógica pura:

| Categoria | Linhas | Arquivos |
|-----------|--------|----------|
| Views SQL (resumo, alocação, posições) | ~150 | 1 (schema) |
| Cron jobs (cotações, snapshot, recálculo) | ~180 | 3 |
| Backend CRUD (repositório, serviço) | ~200 | 2 |
| Cálculos puros (alocação, rentabilidade) | ~30 | 2 |
| Formatadores JS (moeda, data, %) | ~50 | 4 |
| Cache localStorage + TTL | ~80 | 1 |
| Gráfico SVG evolução | ~120 | 1 |
| Gráfico SVG gauge | ~80 | 1 |
| Consolidação de ativos | ~90 | 1 |
| Gain/loss + tipo mapping | ~60 | 2 |
| Cross-cutting (dark mode, ocultar) | ~40 | 2 |
| Input masking (BRL) | ~20 | 1 |
| **Total** | **~1.400** | **21 arquivos** |

De ~52.000 linhas → ~1.400 aproveitáveis = **2,7% de reuso** (vs 1,5% na auditoria anterior).

A diferença vem das features transversais e visuais que a auditoria anterior classificou como "descartar" por serem React, mas cuja **lógica** é pura e portável.

---

*Documento gerado em 13/06/2026. Complementa a Auditoria de Migração. Baseado em análise funcional completa de 22 telas, 36 endpoints e 3 cron jobs do Esquilo Invest.*
