# Prompt 08 — Contexto do usuário e Perfil

Quero que você defina a modelagem e a API do contexto do usuário no Esquilo Invest novo.

## Missão

Sustentar:
- perfil financeiro
- objetivo
- horizonte
- renda
- tolerância a risco
- plataformas usadas
- valor disponível para investir
- preferências de exibição, como modo ghost

## Regras obrigatórias

- Não dependa de autenticação Google do legado.
- Pode deixar autenticação futura preparada, mas não empurre o problema.
- Separe dados do usuário de dados da carteira.
- O contexto do usuário precisa alimentar a camada analítica.

## O que eu quero como saída

Entregue:
1. modelo de dados do contexto do usuário
2. endpoints necessários
3. payload de leitura do Perfil
4. payload de atualização do Perfil
5. regras mínimas de validação
6. relação entre contexto e recomendação
7. campos futuros que podem nascer nulos
8. estratégia simples de autenticação inicial

## Critério

Quero algo que ajude o produto de verdade, não cadastro perfumado.
