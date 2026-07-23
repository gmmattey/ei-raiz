# Fusao Quanto + Esquilo — Mapa de Migracao

Atualizado em: 2026-06-19
Objetivo: deixar explicito o que sobrevive, o que entra do Esquilo e qual e o caminho de porte

## 1. Mapa de sobrevivencia do frontend

### O que sobrevive do frontend atual do Quanto

Estas partes permanecem como referencia funcional e comportamental:

- fluxo de auth atual (login, cadastro, recover)
- shell PWA atual
- tabs Hoje, Carteira, Bens, Historico e Importar
- tela de detalhe por ativo
- sheets de saldo, edicao, cadastro, aporte, venda, bem e analise
- dark mode
- ocultar valores
- comportamento offline
- fluxo de importacao atual

### O que sera extraido do frontend do Esquilo

| Area | Fonte principal no Esquilo | Uso na fusao |
| --- | --- | --- |
| App shell | `components/layout/AppLayout.jsx`, `MobileAppLayout.jsx` | reorganizar navegacao, espacamento e composicao |
| Page headers | `components/design-system/PageHeader.jsx` | padronizar topo de tela |
| Metric cards | `components/design-system/MetricCard.jsx` | reforcar leitura do Hoje |
| Carteira | `features/carteira/Carteira.jsx`, `AssetCategoryView.jsx`, `AssetCategoryMobile.jsx` | elevar agrupamento, leitura e densidade |
| Detalhe | `features/carteira/DetalheAtivo.jsx`, `DetalheAtivoMobile.jsx` | consolidar a tela mais rica |
| Historico | `features/historico/Historico.jsx` | melhorar leitura temporal |
| Importar | `features/importacao/Importar.jsx` | amadurecer wizard e estados de revisao |
| Estados vazios e skeletons | `components/feedback/*` | melhorar UX sem mudar regra de negocio |

### O que nao deve ser carregado do Esquilo

- duplicacao desktop/mobile como padrao
- simuladores e superficies de decisoes
- auth antiga
- roteamento/acoplamentos da arvore React antiga

## 2. Primeira tela a portar

A primeira tela a portar para a trilha nova sera **Hoje**.

### Motivos

- e a tese do produto em uma unica superficie
- usa o contrato mais canonicamente util do sistema
- permite validar branding, shell, performance e leitura consolidada
- depende pouco de mutacoes complexas
- ajuda a decidir os componentes base de `packages/ui`

### Dependencias para o porte de Hoje

- `AuthSession`
- `PortfolioSummary`
- `AllocationSlice`
- `FreshnessSummary`
- `QuoteHealth`
- `GrossWealthSummary`

## 3. Ordem de porte recomendada

1. app shell de `apps/web`
2. Hoje
3. Carteira
4. Detalhe do ativo
5. Historico
6. Bens
7. Importar

## 4. Caminho de migracao de `public/` para `apps/web`

| Origem atual | Destino alvo | Estrategia |
| --- | --- | --- |
| `public/index.html` | `apps/web/` | extrair shell e markup base sem religar assets ainda |
| `public/app.js` | `apps/web/` + `packages/ui` + `packages/domain` | quebrar por feature e helpers puros |
| `public/style.css` | `packages/ui` | separar tokens, shell, componentes e telas |
| `public/sw.js` | `apps/web/` | migrar por ultimo, apos shell novo estabilizar |

### Estado da migracao

O cutover de assets ja aconteceu:

- `apps/web` esta em producao
- `public/` permanece preservado como legado recuperavel
- `tests/cutover-smoke.spec.ts` continua existindo como evidencia do recorte pre-cutover

## 5. Caminho de migracao de `src/` para `apps/` e `packages/`

| Origem atual | Destino alvo | Estrategia |
| --- | --- | --- |
| `src/index.ts` | `apps/core-api/` | virar composicao fina sobre modulos por dominio |
| `src/auth.ts` | `apps/core-api/` + `packages/contracts` | manter runtime vivo e tipar sessao/claims |
| `src/cvm.ts` | `apps/ingestion-plane/` + `packages/domain` | separar pipeline de ingestao do resto da API |
| enums/DTOs inline | `packages/contracts` | primeira extracao segura |
| calculos e consolidacoes puras | `packages/domain` | reduzir acoplamento com Hono/D1 |

## 6. Dominios canonicos que nascem primeiro

### Onda 1

- `auth`
- `portfolio`
- `market`
- `goods`
- `history`

### Onda 2

- `lifecycle`
- `import`
- `analysis`

### Onda 3

- `admin`
- `audit`
- `telemetry`

## 7. Mapa de dados atual -> alvo

### Base atual viva

- `users`
- `assets`
- `quotes_cache`
- `cvm_funds_cache`
- `snapshots`
- `asset_contributions`
- `goods`
- `macro_cache`
- `asset_lifecycle_events`

### Direcao alvo

O modelo final deve separar melhor:

- catalogo de mercado
- posicao do usuario
- movimento do usuario
- artefato bruto de importacao
- leitura agregada por tela

Mas essa separacao **nao nasce nesta sessao**.
Nesta sessao so fica decidido o caminho, sem remodelacao destrutiva.

## 8. O que fica decidido sobre contratos e tela

| Tema | Decisao |
| --- | --- |
| Base de leitura inicial | contrato de `/api/portfolio` |
| Primeira tela | Hoje |
| Primeiros componentes de UI | shell, page header, metric card, donut/allocation, freshness card |
| Primeiros helpers de dominio | formatacao, alocacao, agrupamento, quote health, gross wealth |
| Primeiros adapters de backend | auth, portfolio, goods, history, asset detail, detail mutations |
| Estrategia de preview | servir `apps/web` em paralelo e apontar a API por `?apiBase=` |
| Fonte canonica de schema desta fase | `schema.sql` + `migrations/004..011` |

## 9. Regras de seguranca da migracao

- Sem mover arquivo ativo do runtime nesta fase.
- Sem rewiring adicional de `wrangler.toml` alem do que ja foi promovido para `apps/web` sem novo ciclo de validacao.
- Sem reescrever `src/index.ts` ou `public/app.js` nesta sessao.
- Sem atualizar `fleet.json` salvo pedido explicito.

## 10. Resultado entregue nesta sessao

Esta sessao passa a deixar a trilha nova em andamento real:

1. `packages/contracts` nasce com auth, portfolio, history, funds, goods e detail
2. `packages/ui` nasce com tokens, shell e componentes leves sem build
3. `apps/web` ganha shell proprio, login minimo e primeira versao funcional de `Hoje`
4. a validacao segue paralela, sem religar assets do Worker

## 11. Resultado entregue na continuidade desta trilha

Na continuidade imediata:

1. `Carteira` entrou em andamento real dentro de `apps/web`
2. a tela nova ja cobre agrupamento por instituicao/classe, busca local, chips de filtro, faixa empilhada e secao de resgates
3. `Carteira` ja preserva agrupamento, filtros e statuses criticos na trilha nova; o app vivo continua como referencia de runtime, nao como dependencia de UX para esse recorte
4. `Historico` ganhou tela dedicada em `apps/web`, sustentada apenas por `GET /api/history`
5. `Bens` ganhou leitura dedicada via `GET /api/goods`, cadastro minimo seguro via `POST /api/goods` e edicao/arquivamento inicial via `PUT`/`DELETE /api/goods/:id`
6. `Detalhe do ativo` passou a abrir a partir de `Carteira` e resolve leitura profunda via `GET /api/assets/:id/detail`
7. a trilha nova ja consegue atualizar saldo manual e registrar aporte direto do `Detalhe`, sem reusar sheets do legado
8. o `Detalhe` novo ja cobre lifecycle basico de ativos elegiveis: iniciar saida, cancelar saida e concluir venda
9. o `Detalhe` novo ja permite editar nome do ativo e remover aporte, mantendo o runtime vivo como fonte de verdade
10. `Importar` na trilha nova ja cobre upload, parser local, revisao com alertas nao bloqueantes, remocao de linhas, resumo e persistencia via `POST /api/import`, mantendo `POST /api/import/analyze` como enriquecimento degradavel
11. o `Detalhe` novo ja permite arquivar ativo via soft delete do runtime vivo, fechando mais uma mutacao critica fora do legado
12. a `Carteira` nova ja inclui cadastro minimo de ativo via `POST /api/assets` para ativos automaticos, manuais e fundo CVM com busca em `GET /api/funds/search`
13. o historico de cotacao do detalhe aceita degradacao controlada quando o provider nao entrega serie, sem quebrar a tela
14. `Bens` agora ja cobre leitura dedicada, criacao, edicao, arquivamento, metadados ricos e preservacao do patrimonio bruto sobre o contrato vivo; o que resta nesta area e polimento de UX, nao um gap funcional central
15. `apps/core-api` deixou de ser apenas scaffold: `auth`, `portfolio`, `goods`, `detail/history`, o bloco coeso de mutacoes do detalhe/ativo e os primeiros helpers compartilhados de runtime/market/AI ja sairam do inline, com `src/index.ts` atuando como composicao via registradores de rota e middleware
16. `apps/ingestion-plane/cvm.ts` passou a concentrar a implementacao real do pipeline CVM, enquanto `src/cvm.ts` virou adapter fino para preservar o runtime vivo e a suite atual
17. `apps/ingestion-plane/brapi.ts`, `macro.ts` e `snapshots.ts` passaram a concentrar refresh de cotacoes, benchmarks e snapshots, deixando o scheduler do Worker atual como wiring fino
18. `packages/domain/portfolio-import.ts` passou a formalizar o modelo canonico de portfolio/import e a separacao entre linhas compativeis com `POST /api/import` e linhas que ainda exigem `POST /api/assets`
19. `apps/core-api` absorveu os endpoints vivos restantes de `public`, `assets create`, `history`, `snapshot`, `import` e `ai analysis`, deixando `src/index.ts` praticamente como composicao do backend e wiring de scheduler
20. o `Detalhe` novo agora tambem preserva leitura contextual de AI por `POST /api/ai/analyze`, com fallback seguro quando a AI do runtime nao estiver disponivel
21. com grafico, aportes, lifecycle, edicao minima, arquivamento e analise contextual presentes em `apps/web`, `FUS-008` pode ser tratado como fechado nesta fase, sem implicar cutover
22. o smoke seguro entre `public/` e `apps/web` agora existe como regressao automatizada sem rewiring de runtime, comparando leitura de Hoje, Historico, Carteira e Detalhe contra o mesmo backend vivo
23. `apps/web` agora registra `sw.js` proprio e usa cache local para `portfolio`, `history`, `goods` e `detail`, permitindo recarga offline com ultimo estado valido salvo
24. o cutover geral foi concluido; o que resta agora e estabilizacao pos-cutover, observabilidade e design evolution
25. `packages/contracts` deixou de ser apenas catalogo passivo: enums e DTOs canonicos de `portfolio`, `goods`, `detail` e `import` agora passaram a ser consumidos diretamente por `apps/core-api`
26. o gate oficial de tipos passou a incluir `apps/**/*.ts`, colocando `apps/core-api` e `apps/ingestion-plane` dentro do mesmo `npm run typecheck` usado para validar a base viva
27. `packages/domain` deixou de conter apenas `portfolio-import`: calculos puros de ganho, agregacao de bens e patrimonio bruto agora tambem sao reutilizados por rotas extraidas de `apps/core-api`
28. a validacao automatizada da trilha nova agora cobre tambem cross-cutting de `dark mode` e `ocultar valores` em `mobile` e `desktop`, sem rewiring do runtime principal
29. `wrangler.toml` deixou de versionar `JWT_SECRET`; o secret passou a depender de ambiente real e o harness local injeta `.dev.vars` temporario para preservar o runtime vivo sem hardcode
30. `operation_logs` entrou como trilha minima de auditoria para `import_batch` e para os cron jobs extraidos, sem criar superficie nova para o usuario final
31. o wiring oficial dos quatro crons do Worker agora possui cobertura dedicada em `tests/scheduler.spec.ts`, reforcando readiness de ingestao sem cutover de deploy
