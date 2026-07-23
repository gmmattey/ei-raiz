# Prompt 03 — Estruturar API base em Cloudflare Workers

Quero que você estruture a API base do Esquilo Invest em **Cloudflare Workers**, desacoplada do Apps Script.

## Missão

Definir a espinha dorsal da API HTTP do produto novo.

## Regras obrigatórias

- Não use Apps Script.
- Não use `doGet`, `doPost`, `google.script.run` nem equivalentes.
- Trate Cloudflare Worker como backend principal.
- Trate D1 como banco principal.
- Pode prever R2 para arquivos de importação.
- Organize o código para ser modular e sustentável.

## Rotas mínimas esperadas

Quero proposta concreta para rotas como:
- health
- dashboard/home
- portfolio
- holding detail
- import start
- import preview
- import commit
- profile/context
- history/snapshots
- analysis
- external references

Pode ajustar nomes, mas mantenha a lógica.

## O que eu quero como saída

Entregue:
1. estrutura de pastas sugerida para o Worker
2. rotas sugeridas
3. método HTTP por rota
4. responsabilidade de cada rota
5. contratos mínimos de request/response
6. padrão de envelope de resposta
7. estratégia de tratamento de erro
8. estratégia de autenticação inicial, mesmo que simples
9. estratégia de versionamento mínimo das rotas
10. arquivos iniciais sugeridos

## Importante

Quero saída prática, pensada para implementação.
