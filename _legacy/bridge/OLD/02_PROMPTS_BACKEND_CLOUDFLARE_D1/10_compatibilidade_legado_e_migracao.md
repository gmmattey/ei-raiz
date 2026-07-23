# Prompt 10 — Plano de migração e compatibilidade com o legado

Quero que você proponha uma estratégia de migração do Esquilo Invest para Cloudflare + D1, tratando o Apps Script como legado congelado.

## Missão

Definir como migrar sem:
- travar o produto
- misturar responsabilidades
- manter dependência eterna do legado

## Regras obrigatórias

- O Apps Script não deve ser backend da nova versão.
- O máximo aceitável é convivência temporária para comparação, validação ou leitura de dados durante a transição.
- Não proponha arquitetura híbrida eterna.
- A meta final é independência total do runtime Google.

## O que eu quero como saída

Entregue:
1. princípios da migração
2. o que fica no legado e para de evoluir
3. o que nasce já no Cloudflare
4. ordem sugerida de migração
5. como validar equivalência funcional do dashboard
6. como tratar importações na transição
7. como tratar dados históricos na transição
8. riscos da migração
9. critérios de desligamento final do Apps Script

## Importante

Quero plano de migração pragmático, sem fantasia e sem apego ao legado.
