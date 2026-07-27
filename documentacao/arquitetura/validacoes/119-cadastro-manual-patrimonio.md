# 119 — Cadastro manual e manutenção de itens patrimoniais

Registro de decisões tomadas na implementação da issue #119, sobre a fundação de persistência
cifrada da #180 (`6423288`) e do cofre da #211/#118 (`1e97b09`).

## Taxonomia de tipos

`TipoItemPatrimonial` (schema v3) substitui os cinco valores mínimos da #180
(`CONTA`/`INVESTIMENTO`/`IMOVEL`/`VEICULO`/`OUTRO`, documentados ali como "suficiente para provar
persistência cifrada ponta a ponta", não como taxonomia final) pelos sete tipos do MVP1: `CONTA`,
`RENDA_VARIAVEL`, `RENDA_FIXA`, `CRIPTO`, `BEM`, `DIVIDA`, `OUTRO`. `INVESTIMENTO -> RENDA_VARIAVEL`
e `IMOVEL`/`VEICULO -> BEM` são remapeados por migration (`MIGRATION_2_3` no Android,
equivalente em `RepositorioItensPatrimoniaisSQLCipher.aplicarSchemaEMigrations` no iOS) — nenhum
dado existente é perdido.

## Convenção monetária

`Long` em centavos, nunca `Double` — convenção já estabelecida por `valorCentavos` na #180, mantida
e estendida a `precoMedioCentavos`. `quantidadeMilesimos` usa a mesma técnica (inteiro escalado,
aqui por 1000 — 3 casas decimais) para quantidade fracionária de cotas/ações, apesar de não ser
valor monetário, pelo mesmo motivo: nenhum cálculo patrimonial passa por ponto flutuante.
Conversão texto digitado <-> inteiro escalado fica em `ConversorMonetario`
(`shared/domain/patrimonio`), sem `Double`/`Float` em nenhum ponto.

## Convenção de dívidas

`DIVIDA` usa `valorCentavos` negativo ou zero — sinal, não uma coluna/flag separada — para que o
cálculo futuro de patrimônio líquido (fora do escopo desta issue) seja só a soma de
`valorCentavos` de todos os itens não arquivados, sem lógica condicional por tipo. Os demais tipos
exigem valor >= 0. `ValidadorItemPatrimonial` aplica essa regra na criação, edição e ajuste manual
de valor.

## Ajuste manual de valor e origem

Novo agregado `AjusteValorItem` (tabela `ajustes_valor_item`, FK `ON DELETE CASCADE` para
`itens_patrimoniais`) é um histórico append-only: cada ajuste grava valor anterior, valor novo,
origem e data — nunca é editado nem removido. `RepositorioItensPatrimoniais.registrarAjusteDeValor`
grava o novo valor no item **e** o registro histórico atomicamente (mesma transação); a issue exige
que "falha ao salvar não crie item parcial" e isso vale igualmente para o ajuste.

`OrigemValor` só tem `MANUAL` hoje — existe como enum explícito (não um literal implícito
espalhado pelo código) para o dia em que #124/#125 (catálogo/cotação) introduzirem outra origem.

## Estado de formulário e preservação de lifecycle

Regras de formulário (campos obrigatórios por tipo, validação, resumo revisável) vivem 100% em
`commonMain` (`EstadoFormularioItemPatrimonial`, `ValidadorItemPatrimonial`,
`ResumoItemPatrimonial`). Preservação de formulário em background/retorno usa
`RascunhoFormularioItem.serializar`/`restaurar` (formato "length-prefixed", sem caractere
delimitador que colida com texto digitado) através de `rememberSaveable` em
`shared/app/PatrimonioScreens.kt`.

`rememberSaveable` em Compose Multiplatform depende do host registrar um `SaveableStateRegistry`
que sobreviva à transição de lifecycle relevante — Android já resolve isso via
`ComponentActivity`/`SavedStateRegistry` nativos. A garantia equivalente para cenas iOS (o app
volta do background ou o sistema recria o `UIViewController`) é responsabilidade do adapter
`iosMain`, entregue por Igor nesta issue — ver PR para o que foi validado no runner macOS.

## Estado reativo compartilhado (Home/Patrimônio)

`ServicoPatrimonio` (`shared/domain/patrimonio`) expõe `itens: StateFlow<List<ItemPatrimonial>>` e
recarrega a partir do repositório ao final de toda operação de escrita. Home e Patrimônio (#120,
fora do escopo aqui) observam a mesma instância — nenhuma tela precisa de um evento explícito de
"recarregar". A tela de patrimônio implementada nesta issue (`TelaPatrimonio` em
`shared/app/PatrimonioScreens.kt`) já consome esse padrão como primeiro caso real.

## Fora do escopo desta issue (confirmado)

CSV/XLSX/OFX (#199), catálogo e cotações (#124/#125), integração bancária/Open Finance/B3, múltiplas
carteiras, Home definitiva com gráficos (#120) — nada disso foi implementado.
