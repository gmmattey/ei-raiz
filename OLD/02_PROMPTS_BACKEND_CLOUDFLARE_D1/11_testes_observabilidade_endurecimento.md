# Prompt 11 — Testes, observabilidade e endurecimento do backend novo

Quero que você detalhe a camada mínima de qualidade e confiabilidade para o backend novo do Esquilo Invest em Cloudflare + D1.

## Missão

Definir:
- testes mínimos
- logs úteis
- observabilidade básica
- proteção de segredos
- endurecimento dos contratos
- critérios para considerar o backend minimamente confiável

## Regras obrigatórias

- Não trate isso como luxo de fase futura.
- Não dependa do ambiente Google.
- Trate Cloudflare como produção real.
- Pense em falha de importação, inconsistência de análise, erro de fonte externa e quebra de contrato da API.

## O que eu quero como saída

Entregue:
1. matriz mínima de testes
2. testes por camada
3. logs mínimos por fluxo
4. eventos operacionais relevantes
5. pontos de observabilidade
6. estratégia para segredos
7. política mínima de erro
8. contrato mínimo de health check
9. critérios mínimos para go live técnico

## Saída esperada

Quero um plano que o Codex consiga transformar em estrutura concreta, não um manifesto abstrato.
