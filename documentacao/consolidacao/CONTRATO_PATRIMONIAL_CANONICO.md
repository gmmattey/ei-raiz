# Contrato patrimonial canônico

O Esquilo Wallet usa um único contrato para Home, Carteira, Histórico, Score e Vera. O catálogo público fica em `ativos`; a posição privada fica em `patrimonio_itens`; aportes e retiradas ficam em `patrimonio_aportes`.

## Valor de um item

1. Quando existem `quantidade` e cotação disponível, `valorAtualBrl = quantidade × precoAtualBrl`.
2. Sem cotação calculável, o valor confirmado manualmente em `patrimonio_itens.valor_atual_brl` é mantido.
3. Sem cotação nem valor manual, o estado é `indisponivel`; o produto não apresenta estimativa como dado atual.

## Frescor e origem

Cada item expõe `estadoValor`, `fonteCotacao`, `cotacaoAtualizadaEm`, `cotacaoReferenciaEm` e `cotacaoExpiraEm`.

- `cotacao`: valor calculado pela cotação, com fonte e datas explícitas.
- `manual`: último valor confirmado no item pelo usuário ou importação.
- `indisponivel`: não há base suficiente para valorar o item.

Para CVM, `cotacaoReferenciaEm` é a data da cota oficial; para BRAPI, ela é o instante de atualização da cotação. A expiração do cache é operacional e não substitui a data de referência do dado.

## Regras de vínculo

Fundos e previdência podem informar CNPJ. O backend normaliza o CNPJ, reutiliza ou cria o instrumento em `ativos` e o associa ao item patrimonial. A ingestão CVM consulta somente CNPJs de itens ativos vinculados dessa forma.

Não há tabela paralela para catálogo, posição, cotação ou frescor.
