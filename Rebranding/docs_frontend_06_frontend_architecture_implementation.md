# Arquitetura complementar de frontend para implementação

## 1. Objetivo deste documento

Este documento traduz a estrutura oficial da nova web em uma base implementável.

Ele define:

- páginas oficiais
- componentes oficiais
- contratos de dados entre frontend e backend
- backlog de implementação em ordem de execução

A função deste material é evitar três problemas comuns:

- começar pelo detalhe e errar a base
- reescrever front sem necessidade
- quebrar consistência entre desktop, webapp e mobile web

## 2. Escopo desta arquitetura

Esta arquitetura vale para a nova interface web hospedada no **Cloudflare Pages**, mantendo o backend atual o mais intacto possível.

Ela parte de quatro premissas:

1. a versão mobile não será alterada agora
2. o frontend web deve nascer coerente com a lógica do app Flutter
3. o backend atual continua sendo a principal fonte de dados
4. nenhuma função nova de produto será criada neste momento

## 3. Estratégia de implementação

A nova web deve ser construída em camadas.

### 3.1 Camada 1: Shell do produto

Define a estrutura comum de todas as páginas:

- header
- navegação principal
- container principal
- estados globais
- tema visual
- loading e erro globais

### 3.2 Camada 2: Páginas principais

Define as áreas do produto:

- início
- carteira
- radar
- base

### 3.3 Camada 3: Páginas de categoria

Detalha as áreas de carteira:

- ações
- fundos
- previdência

### 3.4 Camada 4: Componentes reutilizáveis

Define os blocos visuais e funcionais reaproveitados entre páginas.

### 3.5 Camada 5: Integração de dados

Define como o frontend consome os endpoints e monta o estado.

## 4. Páginas oficiais

## 4.1 Página Início

### Rota

`/`

### Objetivo

Ser a porta principal do produto.

### Responsabilidade

- mostrar patrimônio e status geral
- resumir composição da carteira
- destacar categorias
- mostrar direção atual
- levar o usuário para aprofundamento

### Seções da página

#### 1. Hero principal

Conteúdo:

- patrimônio total
- rentabilidade total
- score ou status
- data de atualização

#### 2. Resumo de alocação

Conteúdo:

- gráfico principal
- percentual por categoria
- legenda

#### 3. Cards de categoria

Conteúdo:

- ações
- fundos
- previdência

#### 4. Radar curto

Conteúdo:

- principal sinal
- principal ação sugerida
- justificativa curta

#### 5. Missão / foco atual

Conteúdo:

- prioridade
- ação principal
- impacto esperado

### Dependências de dados

- `summary`
- `score`
- `categorySnapshots`
- `messaging.primaryRecommendation`
- `messaging.executiveSummary`
- `actionPlan`
- `updatedAt`

## 4.2 Página Carteira

### Rota

`/carteira`

### Objetivo

Concentrar a visão consolidada da carteira e permitir aprofundamento por categoria.

### Responsabilidade

- mostrar resumo consolidado
- listar categorias
- destacar posições relevantes
- levar para detalhes

### Seções da página

#### 1. Resumo consolidado

- total da carteira
- distribuição por categoria
- total de posições
- distribuição por instituição

#### 2. Categorias

- ações
- fundos
- previdência

Cada categoria com:

- valor total
- participação
- rentabilidade
- status
- CTA de detalhamento

#### 3. Holdings mais relevantes

Lista resumida com os itens mais relevantes da carteira inteira.

#### 4. Ações rápidas

- abrir ações
- abrir fundos
- abrir previdência

### Dependências de dados

- `summary`
- `categorySnapshots`
- `categories`
- `actions`
- `investments`
- `previdencias`

## 4.3 Página Categoria: Ações

### Rota

`/carteira/acoes`

### Objetivo

Detalhar a carteira de ações sem poluir a página geral.

### Responsabilidade

- resumir a categoria
- listar ativos
- permitir filtros simples
- permitir detalhe sob demanda

### Seções da página

#### 1. Header da categoria

- nome
- valor total
- participação na carteira
- rentabilidade
- status

#### 2. Filtros simples

- por instituição
- por recomendação

#### 3. Lista de ativos

Cada ativo com:

- ticker
- nome
- instituição
- preço atual
- preço médio
- quantidade
- posição atual
- rentabilidade
- recomendação

#### 4. Detalhe do ativo

No desktop:

- drawer lateral ou expansão controlada

No mobile/webapp estreito:

- painel ou tela dedicada

### Dependências de dados

- `summary.acoes`
- `summary.acoesRaw`
- `summary.acoesPerformanceRaw`
- `categories.actions`
- `actions`
- `assetRanking`
- `orders`

## 4.4 Página Categoria: Fundos

### Rota

`/carteira/fundos`

### Objetivo

Detalhar a carteira de fundos com leitura simples.

### Responsabilidade

- resumir a categoria
- listar fundos
- permitir filtro por instituição
- abrir detalhe sob demanda

### Seções da página

#### 1. Header da categoria

- nome
- valor total
- participação
- rentabilidade
- status

#### 2. Filtro simples

- por instituição

#### 3. Lista de fundos

Cada item com:

- nome
- instituição
- classificação
- estratégia ou classe
- benchmark
- saldo atual
- participação
- rentabilidade
- recomendação

#### 4. Detalhe do fundo

- classificação
- estratégia
- benchmark
- liquidez
- taxa
- observação
- link externo, quando existir

### Dependências de dados

- `summary.fundos`
- `summary.fundosRaw`
- `summary.fundosPerformanceRaw`
- `categories.funds`
- `investments`
- `fundosTop`

## 4.5 Página Categoria: Previdência

### Rota

`/carteira/previdencia`

### Objetivo

Detalhar previdência com clareza e baixa complexidade.

### Responsabilidade

- resumir a categoria
- listar planos
- permitir filtro por instituição
- abrir detalhe sob demanda

### Seções da página

#### 1. Header da categoria

- nome
- valor total
- participação
- rentabilidade
- status

#### 2. Filtro simples

- por instituição

#### 3. Lista de planos

Cada item com:

- nome
- instituição
- classificação ou plano
- perfil
- saldo atual
- participação
- rentabilidade
- recomendação

#### 4. Detalhe do plano

- perfil
- plano
- liquidez/carência
- taxa
- observação

### Dependências de dados

- `summary.previdencia`
- `summary.previdenciaRaw`
- `summary.previdenciaPerformanceRaw`
- `categories.previdencia`
- `previdencias`
- `previdenciaInfo`

## 4.6 Página Radar

### Rota

`/radar`

### Objetivo

Centralizar interpretação e direção.

### Responsabilidade

- mostrar leitura principal
- organizar sinais importantes
- exibir leitura da IA ou fallback local
- apontar próxima ação

### Seções da página

#### 1. Hero de leitura

- status da carteira
- score
- leitura principal

#### 2. Sinais importantes

- maior concentração
- principal risco
- melhor desempenho
- principal pressão

#### 3. Análise da IA

- análise remota
- fallback local
- status da análise
- botão de atualização

#### 4. Próxima ação

- prioridade
- ação principal
- justificativa
- impacto

### Dependências de dados

- `score`
- `actionPlan`
- `messaging.primaryRecommendation`
- `messaging.executiveSummary`
- `aiAnalysis`
- `strategyAnalysis`
- `analysis`
- `generalAdvice`
- `actions`
- `investments`
- `previdencias`
- `categories`

## 4.7 Página Base

### Rota

`/base`

### Objetivo

Exibir contexto operacional, perfil e saúde da integração.

### Responsabilidade

- mostrar contexto da base
- exibir status técnico de forma amigável
- concentrar mensagens de fallback e fonte de dados

### Seções da página

#### 1. Perfil / contexto

- squad
- nível
- build/versionamento

#### 2. Base de dados

- fonte atual
- saúde da integração
- timestamp de atualização

#### 3. Estado da operação

- mensagens de fallback
- ambiente
- status útil para suporte

### Dependências de dados

- `profile`
- `updatedAt`
- `dataSource`
- `sourceWarning`
- `backendHealth`
- `operations`

## 5. Componentes oficiais

## 5.1 Componentes de shell

### `AppShell`

Responsável por:

- estrutura base da página
- header
- navegação
- área de conteúdo

### `TopBar`

Responsável por:

- marca
- atualização manual
- estado global discreto

### `BottomNav`

Responsável por:

- navegação mobile/webapp estreito
- início
- carteira
- radar
- base

### `PageContainer`

Responsável por:

- largura máxima
- padding responsivo
- respiro entre seções

## 5.2 Componentes de estado

### `LoadingState`

Usado para:

- carregamento global
- carregamento local de seção

### `EmptyState`

Usado para:

- ausência de dados em lista
- ausência de categoria
- ausência de análise

### `ErrorState`

Usado para:

- falha ao carregar dashboard
- falha ao atualizar IA
- falha parcial de integração

### `InlineWarning`

Usado para:

- avisos não bloqueantes
- fallback de fonte
- problemas transitórios

## 5.3 Componentes de informação

### `HeroSummaryCard`

Usado para:

- patrimônio total
- score/status
- rentabilidade
- atualização

### `AllocationChart`

Usado para:

- gráfico principal da carteira
- leitura visual por categoria

### `CategoryCard`

Usado para:

- ações
- fundos
- previdência

Conteúdo mínimo:

- label
- participação
- total
- rentabilidade
- status

### `SignalCard`

Usado para:

- radar curto
- principal risco
- melhor desempenho
- pressão principal

### `MissionCard`

Usado para:

- prioridade
- ação principal
- justificativa
- impacto

### `StatusChip`

Usado para:

- status de categoria
- prioridade
- recomendação

## 5.4 Componentes de lista e detalhe

### `HoldingList`

Lista genérica de posições.

Varia por tipo:

- ações
- fundos
- previdência

### `HoldingRow`

Linha resumida da lista.

### `HoldingDetailPanel`

Detalhe sob demanda.

No desktop:

- lateral ou expansão controlada

No mobile:

- full screen panel ou sheet

### `FilterBar`

Filtros simples.

### `MetricRow`

Linha compacta de métrica e valor.

### `SectionHeader`

Título e suporte da seção.

## 5.5 Componentes específicos por área

### Home

- `HomeHero`
- `HomeCategoryGrid`
- `HomeRadarPreview`
- `HomeMissionPanel`

### Carteira

- `PortfolioOverview`
- `PortfolioCategoryList`
- `PortfolioHighlights`

### Radar

- `RadarHero`
- `RadarSignalsGrid`
- `AiAnalysisPanel`
- `NextActionPanel`

### Base

- `ProfilePanel`
- `HealthPanel`
- `DataSourcePanel`

## 6. Contratos de dados

## 6.1 Princípio geral

O frontend deve consumir o backend em um modelo de **payload central**.

Sempre que possível, usar um endpoint principal de dashboard e derivar a UI dali.

Isso evita:

- múltiplas chamadas desnecessárias
- inconsistência de estado
- renderização quebrada entre páginas

## 6.2 Endpoint principal recomendado

### `GET /dashboard`

Pode ser uma abstração do endpoint real do Apps Script.

Se o backend continuar no Apps Script, o cliente web pode traduzir isso internamente para a URL real do Web App.

### Payload mínimo esperado

```json
{
  "summary": {
    "total": "R$ 100.000,00",
    "totalRaw": 100000,
    "totalPerformanceRaw": 0.12,
    "acoes": "R$ 30.000,00",
    "acoesRaw": 30000,
    "acoesPerformanceRaw": 0.08,
    "fundos": "R$ 40.000,00",
    "fundosRaw": 40000,
    "fundosPerformanceRaw": 0.10,
    "previdencia": "R$ 30.000,00",
    "previdenciaRaw": 30000,
    "previdenciaPerformanceRaw": 0.15
  },
  "score": {
    "score": 78,
    "status": "Em observação",
    "explanation": "...",
    "breakdown": {
      "capitalPoints": 20,
      "categoryPoints": 18,
      "institutionPoints": 20,
      "healthPoints": 20
    }
  },
  "profile": {
    "squad": "Alpha",
    "level": 3
  },
  "categorySnapshots": [],
  "categories": {
    "actions": {},
    "funds": {},
    "previdencia": {}
  },
  "actions": [],
  "investments": [],
  "previdencias": [],
  "assetRanking": {},
  "orders": {},
  "actionPlan": {},
  "messaging": {
    "executiveSummary": {},
    "primaryRecommendation": {},
    "alertsSummary": {}
  },
  "dataSource": "bigquery",
  "sourceWarning": "",
  "updatedAt": "2026-03-29T12:00:00Z"
}
```

## 6.3 Contratos derivados por área

## 6.3.1 Contrato de Category Snapshot

```json
{
  "key": "acoes",
  "label": "Ações",
  "totalRaw": 30000,
  "totalLabel": "R$ 30.000,00",
  "shareRaw": 0.30,
  "shareLabel": "30,0%",
  "performanceRaw": 0.08,
  "performanceLabel": "+8,0%",
  "color": "#ff6a1f",
  "trend": "positive"
}
```

## 6.3.2 Contrato de categoria detalhada

```json
{
  "status": "Atenção",
  "recommendation": "Revisar",
  "portfolioShare": 0.30,
  "risk": "Moderado",
  "primaryIssue": {
    "asset": "PETR4",
    "message": "Concentração relevante em uma única posição"
  }
}
```

## 6.3.3 Contrato de ação

```json
{
  "ticker": "PETR4",
  "name": "Petrobras PN",
  "institution": "XP",
  "avgPrice": "R$ 35,00",
  "currentPrice": "R$ 38,00",
  "qty": "100",
  "positionValue": "R$ 3.800,00",
  "valorAtualRaw": 3800,
  "valorInvestidoRaw": 3500,
  "rent": 0.0857,
  "rendimentoPct": "+8,6%",
  "rendimentoAbs": "+R$ 300,00",
  "recommendation": "Manter",
  "portfolioShareRaw": 0.038,
  "urlDetalhe": "https://...",
  "marketData": {
    "dailyChangePct": 0.01,
    "monthlyChangePct": 0.03,
    "sector": "Petróleo"
  }
}
```

## 6.3.4 Contrato de fundo

```json
{
  "name": "Fundo XP Macro",
  "institution": "XP",
  "classification": "Multimercado",
  "strategy": "Macro",
  "benchmark": "CDI",
  "startedAt": "2025-01-01",
  "valorAtual": "R$ 10.000,00",
  "valorAtualRaw": 10000,
  "portfolioShareRaw": 0.10,
  "portfolioShareLabel": "10,0%",
  "rentRaw": 0.09,
  "rentPct": "+9,0%",
  "performanceRaw": 0.09,
  "performanceLabel": "+9,0%",
  "recommendation": "Manter",
  "feeLabel": "1,5% a.a.",
  "liquidityLabel": "D+30",
  "cotizationLabel": "D+1",
  "riskLabel": "Moderado",
  "observation": "...",
  "urlDetalhe": "https://..."
}
```

## 6.3.5 Contrato de previdência

```json
{
  "name": "TIM Prev",
  "institution": "TIM",
  "classification": "PGBL",
  "profileLabel": "Moderado",
  "startedAt": "2024-01-01",
  "valorAtual": "R$ 12.000,00",
  "valorAtualRaw": 12000,
  "portfolioShareRaw": 0.12,
  "portfolioShareLabel": "12,0%",
  "rentRaw": 0.11,
  "rentPct": "+11,0%",
  "performanceRaw": 0.11,
  "performanceLabel": "+11,0%",
  "recommendation": "Manter",
  "feeLabel": "1,0% a.a.",
  "liquidityLabel": "Longo prazo",
  "observation": "..."
}
```

## 6.3.6 Contrato de action plan

```json
{
  "priority": "Alta",
  "acao_principal": "Revisar concentração em ações",
  "justificativa": "A carteira está concentrada acima do desejado em poucos ativos.",
  "impacto": "Redução de risco específico"
}
```

## 6.3.7 Contrato de análise de IA

### `GET /ai-analysis`

Resposta mínima:

```json
{
  "text": "Leitura da carteira...",
  "status": "ok",
  "source": "remote"
}
```

Ou, em falha:

```json
{
  "text": "",
  "status": "error",
  "message": "Provider indisponível"
}
```

## 6.3.8 Contrato de snapshot parcial de ações

### `GET /actions-snapshot`

Resposta mínima:

```json
{
  "summary": {
    "acoes": "R$ 30.500,00",
    "acoesRaw": 30500,
    "totalRaw": 100500
  },
  "actions": [],
  "orders": {},
  "assetRanking": {},
  "updatedAt": "2026-03-29T12:00:00Z",
  "dataSource": "bigquery",
  "sourceWarning": ""
}
```

## 7. Organização de estado no frontend

## 7.1 Estado global recomendado

```js
state = {
  dashboard: null,
  loading: false,
  error: null,
  ai: {
    text: '',
    loading: false,
    error: null,
    source: 'local'
  },
  filters: {
    actionsInstitution: '',
    actionsRecommendation: '',
    fundsInstitution: '',
    previdenciaInstitution: ''
  },
  ui: {
    activeSection: 'home',
    activeCategory: '',
    selectedHoldingId: ''
  }
}
```

## 7.2 Regras do estado

- o dashboard principal deve ser carregado uma vez e reutilizado
- filtros são responsabilidade do frontend
- análise da IA pode ser carregada sob demanda
- snapshot parcial de ações é opcional e incremental

## 8. Backlog de implementação em ordem de execução

## 8.1 Fase 0 - preparação

### Item 0.1

Criar estrutura base do projeto frontend no Cloudflare Pages.

### Item 0.2

Definir organização de arquivos e módulos JS.

### Item 0.3

Criar camada de configuração para URL do backend.

### Item 0.4

Criar cliente HTTP base com `fetch`.

## 8.2 Fase 1 - shell do produto

### Item 1.1

Implementar tema base:

- tokens
- cores
- tipografia
- espaçamento
- estados visuais

### Item 1.2

Implementar `AppShell`.

### Item 1.3

Implementar `TopBar`.

### Item 1.4

Implementar `BottomNav` responsiva.

### Item 1.5

Implementar `PageContainer`.

### Item 1.6

Implementar estados globais:

- loading
- empty
- error
- warning

## 8.3 Fase 2 - integração principal

### Item 2.1

Integrar endpoint principal do dashboard.

### Item 2.2

Mapear payload para o estado interno do frontend.

### Item 2.3

Implementar tratativa global de erro e fallback.

### Item 2.4

Implementar atualização manual do dashboard.

## 8.4 Fase 3 - página Início

### Item 3.1

Implementar `HeroSummaryCard`.

### Item 3.2

Implementar `AllocationChart`.

### Item 3.3

Implementar `CategoryCard`.

### Item 3.4

Implementar `HomeRadarPreview`.

### Item 3.5

Implementar `MissionCard`.

### Item 3.6

Montar página `/`.

## 8.5 Fase 4 - página Carteira

### Item 4.1

Implementar `PortfolioOverview`.

### Item 4.2

Implementar `PortfolioCategoryList`.

### Item 4.3

Implementar bloco de holdings relevantes.

### Item 4.4

Montar página `/carteira`.

## 8.6 Fase 5 - páginas de categoria

### Item 5.1

Implementar `FilterBar`.

### Item 5.2

Implementar `HoldingList` genérica.

### Item 5.3

Implementar `HoldingDetailPanel`.

### Item 5.4

Montar `/carteira/acoes`.

### Item 5.5

Montar `/carteira/fundos`.

### Item 5.6

Montar `/carteira/previdencia`.

## 8.7 Fase 6 - página Radar

### Item 6.1

Implementar `RadarHero`.

### Item 6.2

Implementar `RadarSignalsGrid`.

### Item 6.3

Implementar `AiAnalysisPanel`.

### Item 6.4

Integrar endpoint de análise remota.

### Item 6.5

Implementar fallback local.

### Item 6.6

Montar página `/radar`.

## 8.8 Fase 7 - página Base

### Item 7.1

Implementar `ProfilePanel`.

### Item 7.2

Implementar `HealthPanel`.

### Item 7.3

Implementar `DataSourcePanel`.

### Item 7.4

Montar página `/base`.

## 8.9 Fase 8 - responsividade real

### Item 8.1

Refinar breakpoints.

### Item 8.2

Ajustar navegação desktop vs mobile.

### Item 8.3

Ajustar listas para mobile web.

### Item 8.4

Ajustar abertura de detalhes por canal.

## 8.10 Fase 9 - refinamento e consistência

### Item 9.1

Eliminar duplicidade visual.

### Item 9.2

Ajustar textos e microcopy.

### Item 9.3

Consolidar design tokens.

### Item 9.4

Revisar consistência entre páginas.

## 9. Ordem oficial de prioridade

A ordem oficial é:

1. shell
2. integração principal
3. início
4. carteira
5. categorias
6. radar
7. base
8. responsividade fina
9. refinamento

Essa ordem existe por um motivo simples:

- primeiro nasce o produto
- depois nasce a profundidade

Fazer o contrário é pedir para o projeto virar remendo.

## 10. Critérios de aceite desta arquitetura

Esta arquitetura estará corretamente implementada quando:

- a nova web tiver navegação própria clara
- a home estiver limpa e orientativa
- a carteira estiver separada por fluxo
- as categorias tiverem páginas próprias
- o radar estiver desacoplado da home
- a base estiver isolada do fluxo principal
- o frontend consumir o backend atual com mínimo atrito
- desktop, webapp e mobile web parecerem o mesmo produto

## 11. Decisão final de implementação

A nova web no Cloudflare Pages deve ser implementada como uma **camada de produto organizada por páginas**, não como uma simples cópia do dashboard atual em arquivo único.

O reaproveitamento deve ser inteligente:

- reaproveitar lógica e contrato de dados
- refazer a casca de navegação e hierarquia
- preservar o backend
- melhorar a experiência

Essa é a forma certa de ganhar URL melhor, experiência melhor e produto mais maduro sem explodir o escopo.

