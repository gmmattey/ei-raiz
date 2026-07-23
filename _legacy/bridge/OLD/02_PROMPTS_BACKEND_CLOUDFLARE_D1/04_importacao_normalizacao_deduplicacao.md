# Prompt 04 — Pipeline de importação, normalização e deduplicação

Quero que você desenhe e detalhe o pipeline de importação do Esquilo Invest para o backend novo em Cloudflare.

## Missão

Projetar e detalhar o fluxo de:
- upload de arquivo
- registro de importação
- parse
- leitura por origem
- normalização
- deduplicação
- preview
- confirmação do usuário
- persistência final em posições e snapshots

## Regras obrigatórias

- O fluxo deve ser próprio do backend novo.
- Não dependa de Apps Script nem de planilha operacional.
- O legado pode servir como referência de cabeçalhos e semântica, não como motor da importação.
- O sistema precisa guardar rastreabilidade.
- O usuário precisa conseguir ver preview antes de salvar.
- O sistema precisa conseguir sinalizar conflito, item inválido e duplicidade.

## O que eu quero como saída

Entregue:
1. fluxo completo da importação
2. estados do import job
3. estratégia de upload e armazenamento bruto
4. estratégia de parse por origem
5. estratégia de normalização de campos
6. estratégia de resolução de plataformas
7. estratégia de resolução de tipos de ativos
8. estratégia de deduplicação
9. formato do preview
10. formato do commit da importação
11. tabelas envolvidas
12. serviços e funções sugeridas
13. principais erros e como tratá-los

## Saída esperada

Quero algo que o Codex consiga transformar em:
- handler
- service
- parser
- repositório
- payload de preview
