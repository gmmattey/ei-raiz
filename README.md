# Quebra Nozes

Base de transição para a nova geração do Esquilo Invest, criada para separar o produto da estrutura legada em Google Apps Script e orientar a migração para Cloudflare e D1.

## Papel deste repositório

Este projeto reúne arquitetura, contratos, protótipos e componentes que servem de ponte entre o legado e a implementação moderna. Ele ainda não representa um produto totalmente integrado.

## Estado real

- `apps/web` concentra protótipos, wireframes, mocks e scaffolding inicial.
- `apps/mobile` contém apenas documentação de intenção.
- `services/api` é principalmente documental e contratual.
- `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter` é o runtime de backend ativo.
- `backend/modules` contém regras de domínio que ainda precisam ser absorvidas pelo runtime oficial.

## Estrutura

```text
apps/           Interfaces e aplicações
services/       Serviços, integrações e contratos de API
packages/       Core, contratos e UI compartilhada
backend/        Regras de domínio em processo de consolidação
database/       Banco, migrations e seeds
tooling/        Automações e utilitários
assets/         Recursos estáticos
docs/           Documentação viva e histórico
OLD/            Legado isolado e materiais não ativos
```

## Leitura recomendada

1. `docs/README.md`
2. `docs/90_diagnostico/README.md`
3. `docs/arquitetura/README.md`
4. `docs/backlog_real/README.md`
5. `docs/fluxos/README.md`
6. `docs/00_migration/from_esquilo_invest_2_0_phase2.md`

## Regra de evolução

O legado fornece contexto, mas não deve ser copiado sem revisão. Código novo deve priorizar uma arquitetura Cloudflare-native, contratos claros e um único runtime oficial por responsabilidade.

## Como executar o backend atual

Consulte `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter/ENVIRONMENTS.md`.

## Status

Repositório de migração e consolidação. Antes de implementar algo novo, confirme em qual base a funcionalidade definitiva deve viver.