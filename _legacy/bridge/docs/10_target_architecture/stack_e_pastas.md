# Stack e pastas

## Stack alvo
- frontend web desacoplado
- backend novo em Cloudflare
- banco em D1
- contratos claros entre front e back
- mocks locais para acelerar desenvolvimento

## Estrutura sugerida

```text
.
|-- docs
|   |-- 00_migration
|   |-- 10_target_architecture
|   |-- 20_product
|   |-- 30_data
|   |-- 40_prompts
|   `-- 50_stories
|-- apps
|   |-- web
|   `-- mobile
|-- services
|   |-- api
|   `-- jobs
|-- packages
|   |-- contracts
|   |-- core
|   `-- ui
|-- database
|   |-- d1
|   `-- seeds
|-- scripts
|-- tests
`-- assets
```

## Regra
- `apps/` consome
- `services/` entrega
- `packages/` compartilha
- `database/` persiste
- `docs/` explica
