# Codex execução

## Como o Codex deve trabalhar neste repositório

### Regra 1
Executar por blocos pequenos.
Não tentar fazer tudo de uma vez.

### Regra 2
Usar os mocks primeiro.
Só depois plugar backend real.

### Regra 3
Respeitar a estrutura do repositório.
- `apps/` consome
- `services/` entrega
- `packages/` compartilha
- `database/` persiste

## Ordem recomendada
1. shell e router
2. data source factory
3. estados globais
4. home mock
5. carteira mock
6. detalhe mock
7. onboarding e perfil
8. importação mockada
9. backend real de leitura
10. importação real
11. análise real

## O que o Codex não deve fazer
- espalhar fetch pela UI
- criar componente gigante sem reuso
- acoplar regra de negócio na tela
- inventar novos contratos sem alinhar com `packages/contracts`
- prender a base nova ao Apps Script

## Critério de qualidade
- código plug and play
- ambiente local e real trocando por provider
- arquivos com nomes curtos
- leitura boa para humano
- pouca magia escondida
