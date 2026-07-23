# Prompt 09 — Dados externos, benchmark e cache

Quero que você desenhe a camada de dados externos do Esquilo Invest para a nova arquitetura Cloudflare.

## Missão

Sustentar:
- referências de mercado
- benchmark como CDI
- cotações e comparações
- fonte e hora da atualização
- fallback quando a fonte externa falhar

## Regras obrigatórias

- Não use `GOOGLEFINANCE`.
- Não use cache de aba de planilha.
- O backend novo precisa ter política própria de atualização e cache.
- O produto não pode quebrar quando um dado externo falha.
- Os dados externos não podem contaminar a carteira com informação sem origem.

## O que eu quero como saída

Entregue:
1. modelo para external_data_sources
2. modelo para external_market_references
3. estratégia de atualização
4. estratégia de cache
5. estratégia de invalidação
6. estratégia de fallback
7. payload esperado para UI
8. diferenças entre dado operacional interno e referência externa
9. riscos de consistência
10. como evitar comparação enganosa

## Saída esperada

Quero proposta que vire service e tabelas auxiliares.
