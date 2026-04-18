# Módulo ADM de Configuração (F0.1 / #51)

## Estrutura

- `configuracoes_produto`: JSON tipado por chave (`score.v1`).
- `feature_flags`: chave booleana para ativação/desativação.
- `configuracoes_menu`: ordem, visibilidade, label e path de navegação.

## Endpoints

- `GET /api/app/config`
  - uso do produto (menus + flags + score config efetiva).
- `GET /api/admin/config`
  - leitura administrativa.
- `PUT /api/admin/config/score`
  - atualiza `score.v1`.
- `PUT /api/admin/config/flags`
  - atualiza feature flags.
- `PUT /api/admin/config/menus`
  - atualiza menu navegável.

Todos os endpoints `/api/admin/*` exigem header `x-admin-token` igual a `ADMIN_TOKEN`.

## Fallbacks

- Sem migração aplicada, o sistema usa defaults em memória e não quebra navegação/score.
- Score continua determinístico mesmo sem configuração persistida.

## Uso real aplicado

- Score Único lê pesos, thresholds e penalidades de `score.v1`.
- Header web lê menus configuráveis de `/api/app/config`.
- Flags ficam disponíveis para rollout gradual.
