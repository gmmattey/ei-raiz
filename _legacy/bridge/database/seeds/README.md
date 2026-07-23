# Seeds

Esta pasta vai receber seeds de teste e cenários do produto.

Exemplos:
- carteira equilibrada
- carteira concentrada
- sem carteira
- importação com conflito
- fundos e previdência

## Como aplicar (local)

Ordem recomendada:

1. aplicar schema oficial: `database/d1/schema.sql`
2. aplicar seed base: `database/seeds/seed_base.sql`
3. aplicar cenarios extras (opcional):
   - `database/seeds/seed_import_scenario.sql`
   - `database/seeds/seed_onboarding_no_context.sql`

## Credenciais seed

- senha seed (para login): `Senha123!`
- usuarios seed (CPF / email):
  - balanced: `11122233344` / `balanced@example.com`
  - concentrated: `55566677788` / `concentrated@example.com`
  - empty: `99988877766` / `empty@example.com`
  - import: `12345678901` / `import@example.com`
  - onboarding (sem contexto): `10101010101` / `onboarding@example.com`

## Acesso rapido via cookie (sem login)

As rotas do backend exigem cookie `esquilo_session`. Para facilitar teste local, as seeds criam sessoes com tokens conhecidos.

- `Cookie: esquilo_session=seed_balanced_token_v1`
- `Cookie: esquilo_session=seed_concentrated_token_v1`
- `Cookie: esquilo_session=seed_empty_token_v1`
- `Cookie: esquilo_session=seed_import_token_v1`
- `Cookie: esquilo_session=seed_onboarding_token_v1`
