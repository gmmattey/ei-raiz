# Operational Sheet Headers

Planilha base:
- `data/spreadsheets/Esquilo_Invest_Operacional.xlsx`

Cabecalhos atuais por aba:

## Acoes
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
- `entrada`
- `qtd`
- `stop`

## Fundos
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
- `inicio`

## Previdencia
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
- `plano_fundo`
- `inicio`
- `total_aportado`

## PreOrdens
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
- `qtd`

## Aportes
- `mes_ano`
- `destino`
- `categoria`
- `plataforma`
- `valor`
- `acumulado`
- `status`

## Config
- `chave`
- `valor`
- `descricao`
- `atualizado_em`

## Dashboard_Visual
- `Bloco`
- `Valor`
- `Observacao`

## Export_Auxiliar
- `Tipo`
- `Referencia`
- `Valor`
- `Observacao`

Observacoes operacionais:
- `Sheet_Readers.gs` normaliza nomes removendo acentos, espacos e caracteres especiais
- alias como `qtd`, `entrada`, `stop`, `inicio`, `plano_fundo` e `total_aportado` ainda existem e precisam ser preservados
- as abas internas `_esquilo_market_cache` e `_esquilo_decision_history` sao criadas em runtime, nao fazem parte da base inicial do `.xlsx`
