# App (headless)

Esta pasta define a cola minima do `apps/web` sem assumir framework.

## O que existe aqui
- `AppShell` "headless" (router + estado global + wiring de data sources)
- rotas base coerentes com `docs/20_product/telas_e_servicos.md`
- regra de entrada (primeiro acesso) baseada em `screenState` da Home

## Regra desta fase
Enquanto o `apps/web` nao for um projeto Node real, este codigo existe para:
- evitar convencoes paralelas
- deixar claro o contrato de navegacao e estado
- permitir plugar telas por modulo sem espalhar fetch/JSON
