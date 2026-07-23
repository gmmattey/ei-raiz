# Backend oficial e fronteira de transicao

## Decisao desta fase

- stack oficial do produto novo: Cloudflare Workers + D1 + R2
- runtime oficial da fase atual: `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter`
- destino estrutural oficial do backend: `services/api`
- schema oficial do dominio: `database/d1/schema.sql`
- contratos compartilhados oficiais: `packages/contracts/`
- contrato HTTP oficial da fase: `services/api/openapi.yaml`
- legado autorizado apenas como referencia: `docs/00_migration/*` e `OLD/*`

## O que esta resolvido com esta decisao

- o repositorio para de tratar `services/api`, `backend/` e `04_STARTER_BACKEND/` como tres candidatos iguais a backend oficial
- o starter atual deixa de ser "codigo paralelo" e passa a ser a base executavel oficial da transicao
- `services/api` deixa de ser lido como backend implementado hoje e passa a ser lido como casa final e contrato oficial
- `database/d1/schema.sql` vira a fonte unica para decisao de modelo relacional
- `packages/contracts` vira a casa oficial dos contratos compartilhados, mesmo antes de estar materializado como pacote TypeScript

## Regra pratica por area

### `services/api`

Papel oficial:

- casa final do backend executavel
- casa oficial do contrato HTTP
- referencia de rotas e fronteiras por dominio

Regra:

- nova rota ou mudanca relevante de API deve nascer alinhada aqui
- enquanto o runtime nao for absorvido para esta pasta, a implementacao executavel continua no starter
- nao criar outra arvore de backend fora desta trilha

### `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter`

Papel oficial nesta fase:

- base executavel real do backend novo
- ambiente de transicao para Worker, rotas, services e repositories

Regra:

- toda implementacao nova de backend que precise rodar agora parte daqui
- o starter nao e mais tratado como demo descartavel
- o starter tambem nao passa a ser destino final de arquitetura
- qualquer evolucao aqui precisa respeitar contrato oficial em `services/api` e schema oficial em `database/d1`

### `database/d1`

Papel oficial:

- fonte unica de schema do dominio
- casa de seeds e futuras migrations

Regra:

- decisao de tabela, coluna, relacao e indice nasce primeiro aqui
- se o schema do starter divergir, prevalece `database/d1/schema.sql`
- nao usar schema em `OLD/` como base de implementacao nova

### `packages/contracts`

Papel oficial:

- casa de payloads compartilhados entre web, mobile e backend
- casa do envelope HTTP e de estruturas comuns de resposta

Regra:

- contrato compartilhado novo deve ser definido aqui antes de se espalhar em tela ou rota
- `src/types/contracts.ts` dentro do starter e adaptador temporario de runtime, nao fonte permanente de verdade

### `backend/modules`

Papel oficial:

- area de regras isoladas e reaproveitaveis de dominio

Regra:

- nao receber novas rotas, novo router nem virar backend paralelo
- so pode ser usado como modulo reaproveitavel ou candidato a absorcao futura

## Dominios obrigatorios do MVP

Os dominios abaixo precisam permanecer dentro da mesma arquitetura Cloudflare + D1:

- `health` e envelope HTTP
- `profile/context`
- `dashboard/home`
- `portfolio` e `holding detail`
- `history/snapshots`
- `imports start/preview/conflicts/detail/commit`
- `analysis`
- `operational events`

Observacao:

- `auth` existe hoje no starter como modulo operacional, mas nao deve comandar a arquitetura do MVP
- a espinha do produto continua sendo consolidar, traduzir e orientar a carteira do usuario

## Ordem oficial de implementacao

Toda entrega nova deve seguir esta ordem:

1. contrato compartilhado
2. contrato HTTP
3. schema e dado persistido
4. repository
5. service
6. route
7. consumo no front

Regra:

- nao inverter dado e contrato com UI
- nao subir endpoint com stub estrutural se a base persistida ainda nao estiver coerente

## Fronteira com o legado

O legado fica limitado a tres papeis:

- referencia historica de produto
- apoio de migracao e mapeamento
- comparacao de comportamento quando houver duvida

O legado nao pode:

- definir runtime
- impor schema novo
- virar dependencia operacional do backend novo

## Riscos abertos que continuam explicitos

- `database/d1/schema.sql` e `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter/schema.sql` divergem hoje
- `services/api` ainda nao contem runtime executavel
- `packages/contracts` ainda nao esta materializado como pacote TypeScript consumido pelo starter
- existe OpenAPI concorrente fora da trilha oficial e ela nao deve orientar implementacao nova

## Regra de execucao a partir desta issue

- nao criar novo backend em pasta paralela
- nao abrir nova fonte de schema
- nao abrir novo contrato HTTP fora de `services/api`
- nao marcar issue tecnica de API como pronta sem evidencia no starter executavel ou na futura absorcao em `services/api`
- toda divergencia entre starter, schema e contrato oficial deve ser registrada, nao escondida
