# Estado real do repositorio

## Veredito curto

O repositorio esta sincronizado com o GitHub, mas a base integrada ainda e heterogenea.

Hoje coexistem quatro camadas diferentes:

1. documentacao estrutural e de produto
2. prototipos HTML e mocks locais
3. starters tecnicos fora do fluxo principal
4. modulos TypeScript isolados de score, alertas e notificacoes

Isso significa que o repo esta rico em direcao e material de apoio, mas ainda nao esta consolidado como uma base unica e coerente de aplicacao executavel.

## Estado de sincronizacao

- `main` local alinhada ao GitHub no commit `10d0519`
- o working tree da sincronizacao ficou limpo; o estado local atual contem apenas documentos de auditoria ainda nao commitados
- backup externo criado antes do novo alinhamento local apos a PR `#9`:
  - `E:\Projetos\Esquilo.ia\_local_backups\Quebra-Nozes\pre_sync_after_pr9_20260402_000056`

## O que existe de fato na arvore

### 1. Estrutura historica isolada em `OLD/`

Nao ativo e legado relevante foram retirados da raiz e agrupados em `OLD/`.

Principais grupos:

- `OLD/00_INDICE_E_STATUS/`
- `OLD/01_PROMPTS_FRONTEND_CODEX/`
- `OLD/02_PROMPTS_BACKEND_CLOUDFLARE_D1/`
- `OLD/03_EXECUTION_PACK_MOCKS/`
- `OLD/05_REFERENCIAS_ESTRATEGICAS/`
- `OLD/06_VISUAL_BOARDS_LINKS/`
- `OLD/banco_legado/*`
- `OLD/arquivos_soltos/*`
- `OLD/materiais_visuais/*`
- `OLD/codigo_solto/*`

Conclusao: a raiz ficou restrita ao que e estruturalmente mais util para o projeto ativo. O historico relevante foi preservado sem continuar misturado com o fluxo principal.

### 2. Areas oficiais do repositorio

- `apps/`
- `services/`
- `packages/`
- `database/`
- `docs/`
- `tooling/`

Conclusao: a estrutura alvo existe, mas convive com um volume grande de material paralelo fora dela.

### 3. Evidencia de implementacao executavel

#### `apps/web`

Contagem atual:

- `7` arquivos `.html`
- `7` arquivos `.json`
- `9` arquivos `.md`

Nao ha `ts`, `tsx`, `js`, `package.json` ou entrypoint de app web.

Leitura real:

- `apps/web/prototypes/*.html` sao prototipos de interface
- `apps/web/wireframes/*.html` sao wireframes estaticos
- `apps/web/src/core/data/mock/local/*.json` sao mocks locais
- `apps/web/src/*` traz apenas documentacao de estrutura

Conclusao: o front integrado na `main` e hoje um acervo de prototipos, wireframes e mocks. Nao ha app web executavel integrado.

#### `services/api`

Contagem atual:

- `4` arquivos `.md`
- `2` arquivos `.yaml`

Leitura real:

- `services/api/openapi.yaml`
- `services/api/openapi_base.yaml`
- `services/api/*.md`

Nao ha handlers, router, servidor, worker ou package da API dentro de `services/api`.

Conclusao: a API oficial no caminho `services/api` ainda e contratual e documental, nao implementada.

#### `backend/`

Contagem atual:

- `10` arquivos `.ts`

Leitura real:

- `backend/modules/score/*`
- `backend/modules/alerts/*`
- `backend/modules/notifications/*`

Problema estrutural:

- nao existe `backend/package.json`
- nao existe `backend/tsconfig.json`
- nao existe `backend/index.ts`
- os modulos nao aparecem consumidos por nenhum entrypoint integrado

Conclusao: existe codigo TypeScript de dominio, mas isolado e sem runtime integrado definido.

#### `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter`

Leitura atual:

- `src/index.ts` registra rotas reais de health, auth, dashboard, portfolio, profile, analysis, history e imports
- a PR `#9` foi integrada e adicionou `GET /v1/onboarding/portfolio-entry`
- existem `16` arquivos em `src/lib`, `11` em `src/routes` e `11` em `src/repositories`

Limite importante:

- continua sendo starter fora da fronteira oficial `services/api`

Conclusao: esta e hoje a area com maior densidade de backend integrado no repositorio, embora continue posicionada como starter.

### 4. Arquivo solto com indicio de quebra

Existe `OLD/codigo_solto/score.routes.ts` como artefato arquivado.

Evidencia:

- importa `./score.service`
- esse arquivo nao existe na raiz
- a implementacao real de score esta em `backend/modules/score/score.service.ts`

Conclusao: `OLD/codigo_solto/score.routes.ts` foi corretamente isolado como codigo solto e, do jeito que esta, nao compila como arquivo isolado.

## Conflitos documentais e estruturais observados

### Schema duplicado e divergente

`OLD/banco_legado/01_schema.sql` e `database/d1/schema.sql` nao representam o mesmo modelo.

Evidencia:

- `OLD/banco_legado/01_schema.sql` traz auth, sessoes, recovery, planned orders, contributions e um modelo mais amplo
- `database/d1/schema.sql` traz um schema menor e focado em users, contexto, portfolios, imports, snapshots e analyses

Conclusao: ha duas fontes concorrentes de schema no mesmo repo.

### OpenAPI duplicada e divergente

`services/api/openapi.yaml` e `docs/api/swagger.yaml` nao descrevem a mesma API.

Evidencia:

- `services/api/openapi.yaml` esta centrado em `/v1/imports/*`
- `docs/api/swagger.yaml` traz `/score`, `/goal/simulate` e `/alerts`

Conclusao: ha duas linhas de contrato HTTP concorrentes.

### Starter tecnico fora da area oficial

`04_STARTER_BACKEND/` contem a maior massa de codigo de backend do repo, mas nao vive em `services/api` nem em `backend/`.

Conclusao: o codigo mais proximo de um backend executavel ainda esta fora da area oficial de servico.

## Diagnostico consolidado

- sincronizacao com GitHub: `completo`
- integridade do working tree apos sync: `completo`
- organizacao estrutural do repositorio: `parcial`
- unicidade de fontes de verdade para schema e API: `conflitado`
- existencia de aplicacao integrada real em web e API oficial: `sem evidencia suficiente`
