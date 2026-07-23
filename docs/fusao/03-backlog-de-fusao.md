# Fusao Quanto + Esquilo — Backlog de Fusao

Atualizado em: 2026-06-19
Status: backlog de fusao concluido; segue como referencia historica

## 1. Regras do backlog

- Prioridade sempre favorece preservacao do runtime atual.
- Nada entra aqui se violar o anti-escopo do Quanto.
- `docs/fusao/` e a referencia do backlog; `fleet.json` nao entra no circuito.

## 2. Backlog prioritario

| ID | Prioridade | Dono-lente | Entregavel | Status |
| --- | --- | --- | --- | --- |
| FUS-001 | P0 | Renata + Thiago | base documental da fusao em `docs/fusao/` | concluido |
| FUS-002 | P0 | Thiago | estrutura paralela `apps/`, `packages/`, `infra/d1/`, `legacy/` | concluido |
| FUS-003 | P0 | Thiago + Carlos | contratos canonicos iniciais em `packages/contracts` | concluido |
| FUS-004 | P0 | Marina + Beatriz | app shell inicial em `apps/web` | concluido |
| FUS-005 | P0 | Marina | porte da tela Hoje para a nova trilha | concluido |
| FUS-006 | P0 | Carlos | extracao do dominio portfolio para `apps/core-api` mantendo `src/index.ts` como entrypoint | concluido |
| FUS-007 | P1 | Marina + Thiago | Carteira na nova trilha | concluido |
| FUS-008 | P1 | Marina + Carlos | Detalhe do ativo na nova trilha | concluido |
| FUS-009 | P1 | Gabriel + Carlos | desenho do modelo canonico de portfolio/import sem migracao destrutiva | concluido |
| FUS-010 | P1 | Carlos | extracao de cron/CVM/macro para `apps/ingestion-plane` | concluido |
| FUS-011 | P1 | Pedro | plano de regressao por paridade de migracao | concluido |
| FUS-014 | P1 | Marina | Historico na nova trilha | concluido |
| FUS-015 | P1 | Marina + Gabriel | Bens na nova trilha (leitura + criacao + edicao minima + arquivamento) | concluido |
| FUS-016 | P1 | Marina + Carlos | mutacoes minimas do detalhe na nova trilha (saldo manual + aporte) | concluido |
| FUS-017 | P1 | Marina + Carlos | lifecycle basico do detalhe na nova trilha (start/cancel sale flow) | concluido |
| FUS-018 | P1 | Marina + Carlos | edicao minima do detalhe e remocao de aporte na nova trilha | concluido |
| FUS-019 | P1 | Marina + Carlos | primeira fatia real de Importar na nova trilha (parser, revisao e persistencia) | concluido |
| FUS-020 | P1 | Marina + Carlos | soft delete de ativo no detalhe da nova trilha | concluido |
| FUS-021 | P1 | Marina + Carlos | cadastro minimo de ativo na nova trilha (manual + automatico) | concluido |
| FUS-022 | P1 | Marina + Carlos | ramo dedicado de fundo CVM no cadastro da nova trilha | concluido |
| FUS-012 | P2 | Marina + Beatriz | Importar na nova trilha | concluido |
| FUS-013 | P2 | Pedro | smoke de cutover entre `public/` e `apps/web` | concluido |

## 3. Primeira sprint real recomendada

### Sprint 1 — Canonical bootstrap

- FUS-003 — contratos canonicos iniciais
- FUS-004 — app shell inicial
- FUS-005 — tela Hoje portada
- FUS-011 — regressao minima de paridade para Hoje

### Definicao de pronto da Sprint 1

- `apps/web` existe com shell minimamente navegavel
- `packages/contracts` expõe o contrato de portfolio/auth/goods/history/detail
- `packages/ui` comeca a concentrar tokens e componentes base
- a nova Hoje consome o runtime atual sem alterar o comportamento do app vivo
- a trilha nova possui smoke automatizado proprio, sem trocar o ponteiro do Worker

## 4. Handoffs recomendados

### Trilha de arquitetura e docs

- Renata fecha recorte
- Thiago valida arquitetura
- Carlos confirma implicacoes no runtime

### Trilha de UI

- Beatriz define o re-skin do material herdado
- Marina implementa shell e Hoje
- Pedro valida paridade

### Trilha de dados

- Carlos estabiliza contratos vivos
- Gabriel revisa impacto em modelo e reconciliacao
- Pedro confirma regressao segura

## 5. Itens explicitos para nao puxar agora

- split real de deploy entre Worker principal e ingestion-plane
- migracao de banco para modelo final mais rico
- reescrita total do import
- reativacao de admin/decisoes/telemetria do Esquilo
- qualquer troca de framework no frontend sem necessidade comprovada

## 6. Debitos e riscos a tratar no backlog

| Risco | Acao recomendada |
| --- | --- |
| `src/index.ts` segue grande e com varios dominios misturados | extrair por contrato e dominio, sem mudar a entrypoint primeiro |
| `src/index.ts` ainda concentra backend vivo relevante | continuar a extracao modular so quando houver ganho claro de manutencao e cobertura |
| `schema.sql` nao e a foto completa do runtime sem migrations | consolidar inventario canonico de schema e views |
| `public/` concentra shell, feature code e styling | quebrar em componentes/tokens/helpers ao portar Hoje |

## 7. Indicadores de progresso da fusao

Vamos considerar que a fusao esta realmente avancando quando:

- a nova trilha em `apps/` e `packages/` deixa de ser vazia
- Hoje, Carteira, Historico, Bens com leitura e mutacoes minimas, a primeira fatia de Importar e o primeiro detalhe mutavel com lifecycle tiverem cobertura funcional minima fora de `public/`
- `src/index.ts` perder peso por extracao, sem regressao
- `docs/fusao/` refletir decisoes reais, nao aspiracoes vagas

Observacao de andamento:

- as primeiras extracoes seguras de backend ja aconteceram em `apps/core-api/auth.ts`, `apps/core-api/routes/goods.ts`, `apps/core-api/routes/portfolio.ts`, `apps/core-api/routes/assets-detail.ts`, `apps/core-api/routes/assets-mutations.ts` e nos helpers `runtime/*`, `market/*`, `ai/*`
- `apps/core-api` agora tambem concentra `routes/public.ts`, `routes/assets-create.ts`, `routes/history.ts`, `routes/import.ts` e `routes/ai-analysis.ts`, com `src/index.ts` reduzido a composicao e scheduler
- `apps/ingestion-plane` deixou de ser scaffold: `cvm.ts`, `brapi.ts`, `macro.ts` e `snapshots.ts` ja concentram a implementacao real de ingestao/cron, preservando `src/cvm.ts` como adapter e `src/index.ts` como wiring do scheduler
- `operation_logs` entrou no schema e no runtime para rastrear import batch e execucoes de cron sem quebrar o monolito atual
- `FUS-009` foi fechado em `packages/domain/portfolio-import.ts` e `docs/fusao/05-modelo-canonico-portfolio-import.md`, formalizando o gap entre batch import vivo e criacao direta de fundos CVM sem migracao destrutiva
- `FUS-007` e `FUS-008` foram fechados com cobertura Playwright na trilha nova, sem rewiring do runtime vivo: `Carteira` preserva agrupamento/filtros/statuses e `Detalhe` preserva grafico/aportes/analise com degradacao segura
- `FUS-012` foi fechado com o wizard novo cobrindo upload, parser local, revisao com alertas nao bloqueantes, remocao de linhas, resumo, classificacao por AI degradavel e persistencia no runtime vivo com cobertura Playwright
- `FUS-013` foi fechado com `tests/cutover-smoke.spec.ts`, comparando `public/` e `apps/web` contra o mesmo runtime vivo sem trocar ponteiro de assets
- o eixo de readiness de cutover ganhou cobertura explicita de scheduler, coexistencia de PWA e saneamento do secret versionado, levando o checklist real para o patamar de pre-cutover controlado
- com o backlog oficial e o cutover fechados, o proximo recorte recomendado sai do eixo “fusao” e entra em design evolution + estabilizacao pos-cutover
