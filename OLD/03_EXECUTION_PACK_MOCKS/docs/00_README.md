# Esquilo Invest - pacote de execução orientado a mínimo retrabalho

Este pacote foi montado para reduzir:
- retrabalho
- tempo gasto pelo Codex pensando o que fazer
- gasto de token com arquitetura desnecessária
- risco de inventar regra de negócio no susto

## Princípios centrais

1. **Mock local primeiro**
   - toda tela e fluxo devem nascer lendo contratos mockados locais
   - a UI deve ficar validada antes do plug real no backend
   - o backend real entra depois, sem refazer a interface

2. **Troca simples de fonte**
   - a aplicação deve trocar a fonte de dados por configuração
   - idealmente, subir para HML ou PRD deve significar trocar um único provider, adapter ou arquivo de configuração
   - não pode haver `if` espalhado em toda a aplicação para decidir ambiente

3. **Plug and play multiplataforma**
   - contratos pensados para app e web
   - mesma estrutura de payload para ambos
   - diferenças só na camada de apresentação, não no modelo central

4. **Complexidade por último**
   - primeiro shell, leitura, estados, contratos, mock e telas
   - depois persistência real
   - depois importação
   - depois histórico
   - depois análise
   - depois dados externos, otimizações e endurecimento

## Ordem sugerida de uso

1. `01_EXECUTION_PLAN.md`
2. `02_DEFINITION_OF_DONE.md`
3. `03_ENVIRONMENT_STRATEGY.md`
4. `04_FRONTEND_DATA_SOURCE_STRATEGY.md`
5. `05_PAYLOAD_EXAMPLES.md`
6. `06_IMPORT_RULES.md`
7. `07_MOCK_DATA_STRATEGY.md`
8. `08_DONT_DO_THIS.md`
9. `09_BACKLOG_DE_EXECUCAO_MINIMO.md`
10. `seed.sql`
11. pasta `mock/`

## Estrutura mock sugerida

- `mock/local/`
  - arquivos usados no desenvolvimento local
- `mock/hml/`
  - arquivos estáticos ou respostas simuladas para validação em homologação
- `mock/prd/`
  - normalmente vazia ou com placeholders de contrato, para referência apenas

## Ideia operacional

O front deve consumir uma interface única de dados, por exemplo:
- `DashboardDataSource`
- `PortfolioDataSource`
- `ProfileDataSource`
- `ImportDataSource`
- `HistoryDataSource`
- `AnalysisDataSource`

E depois ter implementações:
- local mock
- hml mock
- http real

Trocar ambiente = trocar a fábrica de data sources.
