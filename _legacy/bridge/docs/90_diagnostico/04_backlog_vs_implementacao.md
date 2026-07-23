# Backlog versus implementacao real

## Regra desta matriz

- `completo`: existe evidencia objetiva de implementacao integrada na `main`
- `parcial`: existe evidencia parcial em codigo, prototipo ou starter, mas nao entrega completa integrada
- `conflitado`: ha duas ou mais fontes concorrentes ou a trilha integrada esta tecnicamente quebrada
- `desatualizado`: backlog/documentacao nao refletem o que a `main` ja integrou ou vice-versa
- `sem evidencia suficiente`: o item existe como intencao, mas sem evidencia pratica suficiente no codigo integrado

## Fato bruto do backlog

- issues abertas no GitHub: `233`
- issues fechadas no GitHub: `0`

Conclusao:

- o backlog do GitHub e grande e detalhado
- ele nao esta sendo refletido por fechamento de issues, mesmo com PRs merged recentes

## Matriz por frente

| Frente | Evidencia principal | Status | Leitura |
|---|---|---|---|
| Sincronizacao local com GitHub | `main` alinhada em `10d0519`; working tree atual contem apenas documentos locais de auditoria | completo | A base local foi estabilizada com sucesso e o diff atual nao altera comportamento de produto. |
| Documentacao de produto e regras | `docs/20_product/*`, `docs/product/*`, `docs/rules/*` | parcial | Ha cobertura boa de intencao, mas isso ainda excede a implementacao real. |
| App web executavel | `apps/web` contem `.html`, `.json`, `.md`, sem runtime | sem evidencia suficiente | Ha prototipos e mocks, nao um app integrado. |
| Home | `apps/web/prototypes/home_esquilo_v1.html`, `apps/web/wireframes/home_wireframe.html`, mocks locais | parcial | A tela existe em prototipo e mock, nao em aplicacao integrada. |
| Carteira | backlog e prototipos; sem app web real | sem evidencia suficiente | A cadeia de PRs sugere entrega de telas, mas a `main` integrada nao mostra app funcional em `apps/web`. |
| Holding detail | merge `#246`, docs e contratos de detalhe | parcial | A branch foi merged, mas a evidencia integrada continua sendo material de apoio, nao fluxo executavel em area oficial. |
| Historico | merge `#247`, `packages/contracts/history.md`, mocks e docs | parcial | Ha material consolidado, sem runtime oficial integrado. |
| Analysis / Radar | merge `#248`, `backend/modules/score/*`, `backend/modules/alerts/*` | parcial | Existe codigo de regra e alertas, mas sem encaixe oficial na API. |
| Onboarding / entrada de carteira | merge `#9`, rota `GET /v1/onboarding/portfolio-entry` no starter D1, docs e wireframe HTML | parcial | A tela 8 entrou na base, mas ainda dentro do starter e nao do caminho oficial `services/api` nem de um front integrado. |
| Importacao manual | merge `#249`, docs e contratos | parcial | A linha foi merged, mas a implementacao oficial continua fragmentada. |
| Import custom CSV | merge `#250`, `services/api/openapi.yaml` com templates | parcial | A intencao entrou no contrato e no historico de merges, mas nao na API executavel oficial. |
| Import B3 CSV | merge `#251`, docs e contratos | parcial | Mesmo padrao: trilha integrada no Git, sem servico oficial executavel. |
| Documento assistido / parsing | merge `#252`, PR aberta `#8` | conflitado | Parte da linha entrou na narrativa de importacao, mas o motor tecnico ainda esta fora da `main`. |
| Preview review | merge `#253`, contratos e OpenAPI de imports | parcial | A feature aparece na trilha de merge e nos contratos, mas nao em servico oficial executavel. |
| Imports center / detail / duplicate resolution | merges `#10`, `#11`, `#245` | parcial | Existe progresso de cadeia de telas, ainda sem consolidacao do front integrado. |
| API oficial em `services/api` | apenas `.yaml` e `.md` | sem evidencia suficiente | O backlog tecnico da API segue aberto e faz sentido: a area oficial ainda nao foi implementada. |
| Backend de score deterministico | `backend/modules/score/*` | parcial | O motor existe, mas sem runtime integrado; backlog `TEC-028` ainda nao pode ser tratado como completo. |
| Alertas | `backend/modules/alerts/*`, `docs/rules/alert_rules.md` | parcial | Regras existem em codigo, mas sem integracao completa com produto e persistencia. |
| Notificacoes Telegram | `backend/modules/notifications/*`, `docs/integrations/telegram_notifications.md` | parcial | Existe envio tecnico por Telegram, mas sem historico persistido nem encaixe oficial em runtime. |
| Persistencia D1 | `database/d1/schema.sql`, `database/seeds/seed_base.sql` | parcial | Ha schema e seed oficiais, mas convivem com schema paralelo mais amplo na raiz. |
| Schema oficial do dominio | `OLD/banco_legado/01_schema.sql` versus `database/d1/schema.sql` | conflitado | Duas referencias concorrentes impedem tratar o contrato de dados como fechado. |
| OpenAPI / contratos HTTP | `services/api/openapi.yaml` versus `docs/api/swagger.yaml` | conflitado | Existem duas APIs concorrentes dentro da `main`. |
| Package compartilhado de contratos | `packages/contracts/*.md` | parcial | Os contratos existem como Markdown, nao como tipos compartilhados executaveis. |
| Testes automatizados | `tooling/tests/README.md`, `OLD/tests/README.md` | sem evidencia suficiente | Nao ha testes automatizados integrados na `main`. |
| Operacao e observabilidade | docs e backlog, sem runtime consolidado | sem evidencia suficiente | Ainda nao ha evidencias fortes de pipeline operacional integrado. |
| Backlog GitHub | `233` abertas e `0` fechadas | desatualizado | O GitHub concentra a verdade de backlog, mas continua sem refletir fechamento mesmo apos o merge da PR `#9`. |

## Leitura consolidada

### O que esta mais perto de pronto

- sync local com GitHub
- documentacao de produto
- regras de score e alertas em codigo isolado
- schema e seed oficiais minimos em `database/d1`

### O que esta parcialmente construido

- cadeia de telas/importacao no historico de PRs
- score, alertas e notificacoes
- starters de backend
- contratos de importacao e analise

### O que esta claramente em conflito

- schema oficial do dominio
- contratos HTTP
- onboarding de entrada de carteira
- parsing assistido por arquivo versus base integrada

### O que continua sem evidencia suficiente

- app web executavel integrado
- API oficial executavel em `services/api`
- testes automatizados
- observabilidade e operacao integradas

## Veredito final do backlog versus codigo

O GitHub hoje e a melhor fonte de backlog, mas nao e um bom espelho de status real.

O codigo integrado mostra progresso tecnico em trilhas especificas, principalmente na cadeia `screen-*` e em modulos de score/alertas, mas esse progresso ainda nao esta consolidado como aplicacao integrada unica nem refletido por fechamento de issues.
