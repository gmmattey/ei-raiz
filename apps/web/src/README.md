# Web src

## Estrutura inicial sugerida
- `app/`
- `core/data/`
- `core/router/`
- `features/home/`
- `features/portfolio/`
- `features/profile/`
- `features/import/`
- `features/history/`
- `features/radar/`
- `widgets/`

## Regra
- `core/data` decide provider
- `features` monta tela por domínio
- `widgets` guarda componentes reutilizáveis
## Bootstrap (MVP)
1. shell/router/estado global minimo (`src/app`, `src/core/router`, `src/core/state`)
2. data sources por ambiente (`src/core/data`)
3. telas evoluem por modulo, consumindo data sources (sem `fetch` direto e sem JSON direto)
