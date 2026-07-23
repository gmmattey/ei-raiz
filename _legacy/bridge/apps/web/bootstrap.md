# Bootstrap inicial do app web

## Primeiros blocos
1. shell
2. router
3. data source factory
4. estados globais
5. Home mock

## Data source factory
A UI não escolhe o dado na mão.
Ela recebe providers por ambiente:
- local
- hml
- prd

## Regra
- mock primeiro
- http real depois
- nenhum componente importa JSON direto
- nenhum componente chama fetch direto

## Pastas sugeridas
- `apps/web/src/app/`
- `apps/web/src/features/home/`
- `apps/web/src/features/portfolio/`
- `apps/web/src/features/profile/`
- `apps/web/src/features/import/`
- `apps/web/src/core/data/`
- `apps/web/src/core/router/`
- `apps/web/src/widgets/`

## Meta
O web precisa conseguir subir com mocks antes de encostar no backend real.
