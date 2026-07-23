# Fusao Quanto + Esquilo — Inventario do Schema Real

Atualizado em: 2026-06-19
Uso: foto operacional do schema vivo considerado na fusao

## 1. Regra canonica desta fase

O schema real do Quanto nesta fase **nao** e apenas `schema.sql`.

A leitura correta para runtime, testes e cutover readiness e:

1. `schema.sql`
2. `migrations/004_asset_contributions.sql`
3. `migrations/005_goods.sql`
4. `migrations/006_macro_cache.sql`
5. `migrations/007_display_name.sql`
6. `migrations/008_users_recovery_fields.sql`
7. `migrations/009_assets_add_fii.sql`
8. `migrations/010_asset_contributions_qty.sql`
9. `migrations/011_assets_sold_and_lifecycle.sql`
10. `migrations/012_operation_logs.sql`

## 2. Tabelas vivas apos `schema.sql + migrations/004..012`

| Tabela | Origem | Papel vivo |
| --- | --- | --- |
| `users` | `schema.sql` + `008` | auth, cadastro, recover com `cpf` e `birth_date` |
| `assets` | `schema.sql` + `007` + `009` + `011` | posicoes do usuario, com `display_name`, `FII`, `quote_source`, `sold` e lifecycle |
| `quotes_cache` | `schema.sql` | cache de cotacao BRAPI e quota CVM |
| `cvm_funds_cache` | `schema.sql` | cadastro pesquisavel de fundos CVM |
| `snapshots` | `schema.sql` | historico mensal |
| `asset_contributions` | `004` + `010` + `011` | aportes por ativo, incluindo `qty` |
| `goods` | `005` | bens ativos e arquivados |
| `macro_cache` | `006` | benchmarks CDI, SELIC e IPCA |
| `asset_lifecycle_events` | `011` | trilha de saida/cancelamento/venda |
| `operation_logs` | `012` | rastreabilidade minima de import batch e cron |

## 3. Views SQL vivas

| View | Origem final | Papel vivo |
| --- | --- | --- |
| `vw_portfolio_summary` | `schema.sql`, reescrita em `009` e `011` | total investido, total aberto e ganho |
| `vw_allocation_by_institution` | `schema.sql`, reescrita em `009` e `011` | agregacao por instituicao |
| `vw_allocation_by_class` | `schema.sql`, reescrita em `009` e `011` | agregacao por classe |
| `vw_freshness` | `schema.sql`, reescrita em `009` e `011` | frescor de saldos manuais |

## 4. Campos estruturais que nao podem ser esquecidos

### `users`

- `cpf`
- `birth_date`

### `assets`

- `display_name`
- `quote_source`
- `status` com `sold`

### `asset_contributions`

- `qty`

### `goods`

- `type`
- `estimated_value`
- `property_type`
- `vehicle_type`
- `is_financed`
- `status`

### `macro_cache`

- `slug`
- `value`
- `reference_date`
- `fetched_at`

### `asset_lifecycle_events`

- `event_type`
- `event_at`
- `gross_amount`
- `qty_snapshot`
- `note`

### `operation_logs`

- `operation_type`
- `status`
- `trigger_source`
- `summary_json`
- `error_message`

## 5. Evidencia operacional desta sessao

O inventario acima foi validado contra:

- `schema.sql`
- `migrations/004..012`
- `tests/helpers.ts`, que reconstroi o banco local com `schema.sql` + migrations
- `npm test` verde (`90/90`) em 2026-06-19

## 6. Decisao

Qualquer trabalho futuro de migracao, paridade ou cutover deve assumir este inventario como a foto real do runtime atual.

Se houver divergencia entre descricao antiga e codigo:

- vence `schema.sql + migrations/004..012`
- vence a suite verde
- vence o runtime vivo observado em `src/index.ts`
