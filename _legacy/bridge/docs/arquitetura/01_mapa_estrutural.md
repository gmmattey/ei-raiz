# Mapa estrutural do projeto

## Classificacao das areas principais

### Codigo executavel real

- `backend/modules/score/*`
- `backend/modules/alerts/*`
- `backend/modules/notifications/*`

Observacao:

- e codigo real de dominio
- ainda sem entrypoint oficial de runtime

### Starter executavel mais avancado

- `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter/*`

Observacao:

- hoje e a area com backend mais completo do repositorio
- contem router, services, repositories e rotas
- recebeu a integracao da tela 8 via PR `#9`
- continua sendo starter, nao fronteira oficial consolidada

### Mock

- `apps/web/src/core/data/mock/local/*`
- `OLD/03_EXECUTION_PACK_MOCKS/mock/*`

### Prototipo e wireframe

- `apps/web/prototypes/*`
- `apps/web/wireframes/*`

### Contratos

- `packages/contracts/*.md`
- `services/api/openapi*.yaml`
- `docs/api/swagger.yaml`

### Documentacao

- `docs/*`
- `OLD/00_INDICE_E_STATUS/*`
- `OLD/01_PROMPTS_FRONTEND_CODEX/*`
- `OLD/02_PROMPTS_BACKEND_CLOUDFLARE_D1/*`
- `OLD/05_REFERENCIAS_ESTRATEGICAS/*`

### Legado e material historico

- `docs/00_migration/*`
- `OLD/banco_legado/*`
- `OLD/arquivos_soltos/*`
- `OLD/materiais_visuais/*`
- `OLD/codigo_solto/*`

## Leitura curta da estrutura real

O repositorio tem hoje uma arquitetura operacional em camadas concorrentes:

1. documentacao e estrategia
2. prototipos e mocks de front
3. modulos isolados de backend
4. um starter D1 mais avancado
5. contratos e schemas concorrentes

## Risco estrutural principal

A maior ambiguidade ainda e esta:

- `services/api` parece ser a casa oficial da API
- `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter` e, na pratica, a casa com backend mais vivo
- `backend/modules` concentra dominio reutilizavel, mas sem aplicacao integradora

Enquanto essa fronteira nao for fechada, o projeto continua vulneravel a implementacao no lugar errado.
