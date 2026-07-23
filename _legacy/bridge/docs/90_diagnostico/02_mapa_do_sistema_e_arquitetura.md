# Mapa do sistema e leitura da arquitetura atual

## Mapa por area

### Produto e regras

Fontes principais:

- `docs/20_product/*`
- `docs/product/*`
- `docs/rules/*`
- `docs/30_data/*`

Papel real:

- descrevem a proposta do produto
- detalham regras de score, recomendacao, importacao e experiencia
- servem como principal fonte de intencao funcional

Status: `parcial`

Motivo: a camada de regra esta bem documentada, mas so uma parte pequena virou codigo integrado.

### Frontend

Fontes principais:

- `apps/web/prototypes/*.html`
- `apps/web/wireframes/*.html`
- `apps/web/src/core/data/mock/local/*.json`
- `apps/web/src/**/*.md`

Papel real:

- prototipos estaticos
- wireframes estaticos
- mocks de payload
- documentacao de estrutura desejada

Status: `parcial`

Motivo: existe material de UX e payload, mas nao existe app web integrado e executavel.

### API oficial

Fontes principais:

- `services/api/openapi.yaml`
- `services/api/openapi_base.yaml`
- `services/api/*.md`

Papel real:

- contratos e ordem de implementacao

Status: `sem evidencia suficiente`

Motivo: o caminho oficial da API ainda nao contem codigo executavel.

### Backend de dominio

Fontes principais:

- `backend/modules/score/*`
- `backend/modules/alerts/*`
- `backend/modules/notifications/*`

Papel real:

- motor deterministico de score
- regras de alerta
- envio de notificacao Telegram

Status: `parcial`

Motivo: ha codigo real, mas sem runtime integrado, sem pacote proprio e sem evidencia de consumo pela API oficial.

### Starters tecnicos

Fontes principais:

- `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter/*`
- `04_STARTER_BACKEND/esquilo_cloudflare_worker_starter/*`

Papel real:

- estruturas de referencia para Worker e D1
- contratos TypeScript
- rotas stub
- exemplos de schema e wrangler

Status: `parcial`

Motivo: ha codigo executavel potencial, mas ele esta fora da linha oficial `services/api` e parte dele diverge dos contratos atuais.

### Persistencia

Fontes principais:

- `database/d1/schema.sql`
- `database/seeds/seed_base.sql`
- `OLD/banco_legado/01_schema.sql`
- `OLD/banco_legado/02_indexes.sql`
- `OLD/banco_legado/03_compatibility_views.sql`

Papel real:

- existe uma linha oficial menor em `database/d1`
- existe uma linha paralela mais ampla na raiz

Status: `conflitado`

Motivo: duas referencias concorrentes de schema convivem no repo.

## Arquitetura alvo documentada

Pela documentacao central, a arquitetura alvo e:

- `apps/` consome
- `services/` entrega
- `packages/` compartilha
- `database/` persiste
- `docs/` explica

## Arquitetura atual real

Na pratica, a `main` hoje opera assim:

1. `docs/` concentra a maior parte da definicao do produto
2. `apps/web` concentra prototipos HTML, wireframes e mocks
3. `services/api` concentra contratos HTTP, nao runtime
4. `backend/modules` concentra codigo de regra de negocio sem app integrador
5. `04_STARTER_BACKEND/` concentra os esqueletos mais proximos de um backend executavel
6. a raiz foi limpa e o legado relevante foi isolado em `OLD/`

Conclusao: a arquitetura real ainda nao converge para a arquitetura alvo documentada.

## Inconsistencias importantes

### Inconsistencia 1: fronteira de backend indefinida

Hoje ha tres lugares diferentes com responsabilidade de backend:

- `services/api`
- `backend/`
- `04_STARTER_BACKEND/`

Impacto:

- nao esta claro qual diretorio deve receber implementacao oficial
- a PR `#9` ja foi integrada, mas o codigo entrou em `04_STARTER_BACKEND`, nao em `services/api` nem em `backend/`

### Inconsistencia 2: contratos HTTP fragmentados

Hoje convivem:

- `services/api/openapi.yaml`
- `docs/api/swagger.yaml`
- `04_STARTER_BACKEND/*/openapi.yaml`

Impacto:

- risco alto de implementar endpoints em cima da fonte errada

### Inconsistencia 3: dominio de score/alertas sem encaixe oficial

Evidencia:

- `backend/modules/score/*` implementa regra coerente com `docs/product/score_and_profile_rules.md`
- `backend/modules/alerts/*` implementa `fund_under_cdi`, `concentration_high` e `no_contribution`
- `backend/modules/notifications/telegram.service.ts` envia notificacao de verdade por Telegram API

Mas:

- nao ha runtime oficial que exponha esses modulos
- `OLD/codigo_solto/score.routes.ts` foi isolado por estar quebrado e deslocado

Impacto:

- ha logica de negocio parcialmente pronta, mas fora de encaixe operacional.

## Leitura final da arquitetura

- produto e regras: mais maduros que a implementacao
- backend de dominio: existe, mas esta solto
- API oficial: ainda contratual
- frontend oficial: ainda prototipado
- persistencia: com fontes concorrentes

Veredito: a base atual sustenta exploracao e consolidacao de conhecimento, mas ainda nao sustenta desenvolvimento seguro sem antes decidir qual trilha e oficial para backend, contratos e schema.
