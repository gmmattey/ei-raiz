# Documentação

Este é o mapa principal da documentação do `Quebra_Nozes`.

## Ordem de leitura recomendada

### 0. Setup rápido (rodar sem pedir token no chat)
- `00_setup/secrets.md`

### 1. Entender a origem
- `00_migration/from_esquilo_invest_2_0_phase2.md`

### 2. Entender o produto novo
- `20_product/visao_do_produto.md`
- `20_product/mvp_e_fases.md`
- `20_product/jornada_principal.md`
- `20_product/o_que_manter_do_legado.md`

### 3. Entender a forma técnica nova
- `10_target_architecture/backend_oficial_e_fronteira_de_transicao.md`
- `10_target_architecture/stack_e_pastas.md`
- `10_target_architecture/api_e_dados.md`
- `10_target_architecture/front_e_componentes.md`

### 4. Entender dados, contratos e persistência
- `30_data/contratos_e_fontes.md`
- `30_data/regras_de_dados.md`

### 5. Entender prompts e execução com IA / Codex
- `40_prompts/codex_execucao.md`
- `40_prompts/ia_analise.md`

### 6. Entender stories e recortes de entrega
- `50_stories/00_index.md`

### 7. Entender estado real e auditoria
- `90_diagnostico/README.md`

### 8. Entender a arquitetura consolidada desta fase
- `arquitetura/README.md`

### 9. Entender backlog real e auditoria do GitHub
- `backlog_real/README.md`

### 10. Entender fluxos consolidados
- `fluxos/README.md`

### 11. Entender como organizar a arvore sem risco
- `arquitetura/03_reorganizacao_segura_da_arvore.md`

## Regra de organizacao
- material ativo fica nas pastas oficiais do projeto
- material historico ou fora do fluxo atual fica em `../OLD/`

## Regra da documentação
- nomes curtos
- papel claro por pasta
- nada de documento gigante que mistura tudo
- índice curto + arquivos separados

## Trilha executavel (backend novo)

Objetivo: reduzir ambiguidade e retrabalho. Esta trilha é a fonte de verdade de como o backend deve ser operado e evoluido agora.

Fontes oficiais desta fase:

- runtime executavel (transicao): `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter`
- destino estrutural (backend novo): `services/api`
- schema oficial D1: `database/d1/schema.sql`
- seeds: `database/seeds/*`
- contratos (por enquanto como docs, nao como pacote): `packages/contracts/*`

Ordem recomendada de execucao (para nao quebrar o sistema):

1. Arquitetura e fronteira de transicao: `docs/10_target_architecture/` (evita “backend paralelo”).
2. Dados: schema D1 (`database/d1/schema.sql`) antes de qualquer seed.
3. Operacao: `docs/infrastructure/` (runbook, envs, secrets) antes de tentar deploy.
4. Base do backend: roteamento/envelope HTTP + camada D1 + eventos operacionais.
5. Seeds: cenarios que permitem validar rotas/telas sem depender de prod.

Decisao importante (para evitar retrabalho):

- `packages/contracts` **nao vira package TypeScript agora**. O repo ainda nao esta como monorepo/workspaces e `apps/web`/`apps/mobile` ainda nao sao projetos Node. Vamos converter para package quando houver consumidores reais.
