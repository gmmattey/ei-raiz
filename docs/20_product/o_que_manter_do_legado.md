# O que manter do legado

O projeto novo não deve herdar a arquitetura antiga.
Mas ele deve preservar o que faz sentido do produto.

## Manter

### Propósito
- consolidar a carteira
- traduzir o cenário
- orientar o próximo passo

### Blocos de valor
- home com leitura principal
- carteira por categoria e por ativo
- detalhe do ativo
- score e alertas
- plano de ação curto
- leitura por IA
- histórico básico

### Linguagem
- objetiva
- humana
- simples
- sem corporativês vazio

### Segurança funcional
- não executar ordens
- não prometer retorno
- não se vender como corretora

### Pistas úteis de origem
- categorias principais: ações, fundos, previdência, aportes, pré-ordens
- importância do contexto do usuário
- uso de preview antes de persistir importação

## Não manter

### Arquitetura
- Apps Script como base nova
- `google.script.run`
- HTML acoplado ao backend
- dependência estrutural de planilha

### Bagunça operacional
- arquivos legados misturados na raiz
- stubs velhos como se fossem fluxo real
- documentação espalhada sem papel claro

## Regra final

O legado serve para dizer:
- o que o produto é
- o que o produto já aprendeu
- o que não deve ser perdido

O legado não serve para dizer:
- como o projeto novo deve ser implementado
