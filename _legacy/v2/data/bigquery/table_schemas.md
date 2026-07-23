# BigQuery Table Schemas

Origem operacional:
- runtime de sync: `apps_script/integrations/BigQuery_Sync.gs`
- projeto: `esquilo-invest`
- dataset: `esquilo_invest`

Mapeamento de abas para tabelas:
- `Acoes` -> `acoes`
- `Fundos` -> `fundos`
- `Previdencia` -> `previdencia`
- `PreOrdens` -> `pre_ordens`
- `Aportes` -> `aportes`
- `Config` -> `app_config`

Abas ignoradas pelo sync:
- `Capa`
- `Dashboard`
- `Configuracoes`
- `Menu`
- `Dashboard_Visual`
- `Export_Auxiliar`
- `_esquilo_decision_history`
- `_esquilo_market_cache`

Colunas obrigatorias por tabela:

## acoes
- `tipo`
- `ativo`
- `plataforma`
- `status`
- `situacao`
- `data_entrada`
- `quantidade`
- `preco_medio`
- `cotacao_atual`
- `valor_investido`
- `valor_atual`
- `stop_loss`
- `alvo`
- `rentabilidade`
- `observacao`
- `atualizado_em`

## fundos
- `fundo`
- `plataforma`
- `categoria`
- `estrategia`
- `status`
- `situacao`
- `data_inicio`
- `valor_investido`
- `valor_atual`
- `rentabilidade`
- `observacao`
- `atualizado_em`

## previdencia
- `plano`
- `plataforma`
- `tipo`
- `estrategia`
- `status`
- `situacao`
- `data_inicio`
- `valor_investido`
- `valor_atual`
- `rentabilidade`
- `observacao`
- `atualizado_em`

## pre_ordens
- `tipo`
- `ativo`
- `plataforma`
- `tipo_ordem`
- `quantidade`
- `preco_alvo`
- `validade`
- `valor_potencial`
- `cotacao_atual`
- `status`
- `observacao`

## aportes
- `mes_ano`
- `destino`
- `categoria`
- `plataforma`
- `valor`
- `acumulado`
- `status`

## app_config
- `chave`
- `valor`
- `descricao`
- `atualizado_em`

Observacoes operacionais:
- o sync usa a planilha ativa, nao a abertura standalone por ID
- o contrato e guiado por cabecalho exato
- qualquer mudanca de cabecalho deve ser refletida antes no sync e na planilha
