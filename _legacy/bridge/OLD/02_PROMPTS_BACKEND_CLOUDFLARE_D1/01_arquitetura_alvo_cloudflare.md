# Prompt 01 — Arquitetura alvo do backend em Cloudflare

Quero que você proponha a arquitetura alvo do backend do Esquilo Invest para **Cloudflare Workers + Cloudflare D1 + R2**, considerando que o **Apps Script deve virar legado congelado e não deve ser usado pela nova versão**.

## Missão

Desenhar a arquitetura alvo da nova camada backend, com foco em:
- API HTTP em Cloudflare Workers
- persistência relacional em D1
- armazenamento de arquivos brutos em R2
- separação entre ingestão, leitura operacional, análise, histórico e contexto do usuário
- convivência temporária com o legado apenas como referência e eventual fonte de comparação, nunca como dependência de runtime

## Regras obrigatórias

- Não proponha manter Apps Script como backend ativo da nova versão.
- Não proponha Google Sheets como fallback do novo produto.
- Não proponha BigQuery como dependência obrigatória de runtime da nova versão.
- Pode citar o legado apenas como fonte de migração e validação.
- Estruture a arquitetura pensando em produto real e sustentável, não em gambiarra de transição permanente.

## Fontes conceituais já conhecidas

Considere que o domínio do produto envolve:
- usuário e contexto financeiro
- carteiras
- posições correntes
- importações de CSV/extrato
- preview de importação
- normalização
- deduplicação
- snapshots de carteira
- histórico de recomendações
- análise da carteira
- comparações externas como benchmark e cotações
- eventos operacionais

## O que eu quero como saída

Entregue:
1. arquitetura alvo em blocos
2. responsabilidades de cada bloco
3. fluxo fim a fim de leitura do app
4. fluxo fim a fim de importação
5. fluxo fim a fim de geração de snapshot
6. fluxo fim a fim de análise e recomendação
7. responsabilidades do Worker
8. responsabilidades do D1
9. responsabilidades do R2
10. riscos de arquitetura
11. decisões recomendadas
12. antipatters que devem ser evitados

## Formato de saída

Quero:
- texto direto
- sem enrolação
- com blocos claros
- com proposta concreta
- se precisar escolher entre opções, escolha uma e justifique
