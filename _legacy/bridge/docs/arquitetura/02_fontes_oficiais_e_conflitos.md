# Fontes oficiais e conflitos

## Fontes que hoje funcionam como referencia pratica

### Backlog oficial

- GitHub Issues

### Base integrada oficial

- `main` no GitHub

### Diagnostico oficial desta fase

- `docs/90_diagnostico/*`
- `docs/10_target_architecture/backend_oficial_e_fronteira_de_transicao.md`

## Decisoes fechadas nesta fase

### API

- contrato HTTP oficial: `services/api/openapi.yaml`
- `docs/api/swagger.yaml` nao orienta implementacao nova
- `services/api` continua sendo a casa final da API, mesmo antes da absorcao do runtime

### Schema

- schema oficial do dominio: `database/d1/schema.sql`
- `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter/schema.sql` fica subordinado a ele
- `OLD/banco_legado/01_schema.sql` fica limitado a referencia historica

### Backend

- runtime oficial da fase atual: `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter`
- destino estrutural oficial: `services/api`
- `backend/modules` fica restrito a modulo reutilizavel, nao a backend paralelo

### Contratos compartilhados

- casa oficial: `packages/contracts`
- `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter/src/types/contracts.ts` fica como adaptador temporario de runtime

## Conflitos ainda abertos

- o schema oficial e o schema do starter ainda divergem
- `services/api` ainda nao contem runtime executavel
- os contratos compartilhados ainda nao estao materializados como pacote TypeScript

## Regra desta fase

- usar o contrato oficial, o schema oficial e o runtime oficial de transicao como linha unica de execucao
- nao criar novas fontes concorrentes para API, banco ou backend
