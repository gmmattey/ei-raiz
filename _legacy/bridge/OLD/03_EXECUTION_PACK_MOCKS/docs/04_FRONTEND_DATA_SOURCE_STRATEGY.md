# Estratégia de data source no frontend

## Meta

Web e app devem consumir a mesma semântica de dados.

## Estrutura recomendada

Criar interfaces como:
- `DashboardDataSource`
- `PortfolioDataSource`
- `ProfileDataSource`
- `ImportDataSource`
- `HistoryDataSource`
- `AnalysisDataSource`

## Implementações

### local mock
Lê arquivos JSON locais.

### hml mock
Lê arquivos JSON de homologação ou um adapter mock remoto.

### http real
Chama API real em Cloudflare.

## Benefício

A UI conversa com a interface.
Não conversa direto com fetch e nem com JSON cru.

## Exemplo conceitual

`HomeScreen` chama `dashboardDataSource.getHome()`

Tanto faz se por baixo:
- lê `mock/local/dashboard_home.json`
- lê `mock/hml/dashboard_home.json`
- ou chama `GET /v1/dashboard/home`

## Regra obrigatória

A resposta entregue para a UI deve ter a mesma forma.
