# Prompt 02 — Gerar schema inicial do D1 com SQL real

Quero que você gere o **schema inicial implementável do Cloudflare D1** para o Esquilo Invest, considerando que a nova versão deve rodar em **Cloudflare Workers + D1** e que o **Apps Script será legado congelado**.

## Objetivo

Sua missão é produzir o arquivo SQL inicial do banco, com:
- `CREATE TABLE`
- tipos de coluna adequados para SQLite / D1
- chaves primárias
- chaves estrangeiras
- índices
- constraints mínimas
- colunas obrigatórias e opcionais bem definidas

## Regras obrigatórias

- Gere SQL real, não pseudocódigo.
- Use tipos compatíveis com SQLite / D1.
- Não use tipos inventados ou de Postgres que não façam sentido aqui.
- Não modele o banco copiando a planilha herdada.
- Modele o banco para o produto novo.
- O Apps Script só pode influenciar entendimento de domínio e mapeamento, não o desenho final.
- Pense em separação entre fotografia atual da carteira e histórico.
- Pense em importação, preview, normalização, deduplicação e rastreabilidade.
- Pense em contexto do usuário.
- Pense em recomendações e snapshots.
- Pense em extensibilidade para tipos de ativos diferentes.

## Entidades mínimas a considerar

Considere fortemente a existência de:
- users
- portfolios
- platforms
- asset_types
- assets
- portfolio_positions
- planned_orders
- portfolio_contributions
- user_financial_context
- portfolio_snapshots
- portfolio_snapshot_positions
- portfolio_analyses
- analysis_insights
- imports
- import_rows
- external_data_sources
- external_market_references
- operational_events

Você pode ajustar nomes e detalhes se houver motivo técnico forte, mas não reduza o modelo de forma burra.

## O que eu quero como saída

Entregue:
1. visão curta do racional do schema
2. SQL completo em bloco único
3. breve explicação das tabelas
4. breve explicação dos índices
5. pontos de atenção para carga inicial

## Critério de qualidade

O schema precisa:
- sustentar Home, Carteira, Importação, Histórico, Perfil e Radar
- permitir snapshot e comparação histórica
- permitir rastrear importações
- permitir análise e recomendação sem acoplar ao legado
- ser simples o bastante para nascer agora
- ser robusto o bastante para não precisar ser refeito já na próxima semana
