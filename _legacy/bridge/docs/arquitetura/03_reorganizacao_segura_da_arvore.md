# Reorganizacao segura da arvore

## Objetivo desta fase

Organizar o projeto sem quebrar caminho de codigo, sem mover pasta critica no escuro e sem apagar material util.

## O que pode ser tratado como organizado agora

### Oficial por uso de leitura e auditoria

- `docs/README.md`
- `docs/90_diagnostico/*`
- `docs/arquitetura/*`
- `docs/backlog_real/*`
- `docs/fluxos/*`

### Oficial por fronteira planejada

- `apps/`
- `services/`
- `packages/`
- `database/`
- `tooling/`

### Real por evidencia tecnica, mas ainda nao oficial como fronteira final

- `backend/modules/*`
- `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter/*`

### Legado, historico ou material de apoio

- `OLD/00_INDICE_E_STATUS/*`
- `OLD/01_PROMPTS_FRONTEND_CODEX/*`
- `OLD/02_PROMPTS_BACKEND_CLOUDFLARE_D1/*`
- `OLD/03_EXECUTION_PACK_MOCKS/*`
- `OLD/05_REFERENCIAS_ESTRATEGICAS/*`
- `OLD/06_VISUAL_BOARDS_LINKS/*`
- `OLD/banco_legado/*`
- `OLD/arquivos_soltos/*`
- `OLD/materiais_visuais/*`
- `OLD/codigo_solto/*`

## O que nao deve ser movido ainda

- `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter/*`
- `backend/modules/*`
- `database/d1/*`
- `services/api/*`

Motivo:

- essas areas participam dos conflitos de fronteira mais sensiveis do repo
- mover agora esconderia o problema em vez de resolvelo
- a decisao correta depende de fechar antes a fonte oficial de backend, schema e contrato HTTP

## Organizacao segura aplicada nesta fase

1. documentacao centralizada por funcao
2. classificacao explicita de cada area
3. rastreabilidade entre backlog, PR e codigo
4. preservacao do legado sem misturar isso com "codigo pronto"

## Reorganizacao fisica recomendada so depois

### Etapa 1

Definir oficialmente:

- backend principal
- schema principal
- contrato HTTP principal

### Etapa 2

Depois da decisao acima:

- migrar ou absorver starters escolhidos
- aposentar pastas paralelas com registro de destino
- remover arquivos soltos quebrados ou duplicados

## Veredito

Nesta fase, a forma segura de organizar o projeto e por clareza documental e classificacao de fronteiras.

Mover codigo agora seria prematuro.
