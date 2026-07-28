package io.savro.model

/**
 * Tipos patrimoniais suportados no MVP1 (#119). Os cinco valores originais da #180
 * (`CONTA`/`INVESTIMENTO`/`IMOVEL`/`VEICULO`/`OUTRO` — schema mínimo "suficiente para provar
 * persistência cifrada ponta a ponta") são substituídos pela taxonomia real definida na issue.
 * `INVESTIMENTO` vira `RENDA_VARIAVEL`; `IMOVEL`/`VEICULO` viram `BEM` (ver migration de schema
 * `MIGRATION_2_3`/equivalente iOS, que remapeia dados já persistidos).
 */
enum class TipoItemPatrimonial {
    CONTA,
    RENDA_VARIAVEL,
    RENDA_FIXA,
    CRIPTO,
    BEM,
    DIVIDA,
    OUTRO,
}

/**
 * Origem do valor de um item ou de um [AjusteValorItem]. MVP1 só cadastra manualmente (#119 é
 * "cadastro manual"; catálogo/cotação automática é #124/#125, fora de escopo). O tipo existe para
 * que a origem seja um dado explícito e auditável desde já, não um valor implícito assumido em
 * todo lugar que precisar dele.
 */
enum class OrigemValor {
    MANUAL,
}

/**
 * Item patrimonial persistido no cofre local (#119, sobre o schema de persistência da #180).
 *
 * ## Convenção monetária
 * Valores monetários usam `Long` em centavos (nunca `Double`) — convenção herdada de `valorCentavos`,
 * já estabelecida pela #180. `precoMedioCentavos` segue a mesma convenção. `quantidadeMilesimos`
 * representa quantidade (ex.: número de cotas/ações, inclusive fracionário) como `Long` escalado
 * por 1000 (3 casas decimais) — não é valor monetário, mas usa a mesma técnica de escalonamento
 * inteiro pelo mesmo motivo: evitar ponto flutuante em qualquer dado que participe de cálculo
 * patrimonial. `quantidadeMilesimos * precoMedioCentavos / 1000` nunca é a fonte de verdade do
 * valor do item — `valorCentavos` é; os dois campos opcionais são só registro informativo (issue
 * #119: "o usuário pode controlar o item apenas pelo valor atual").
 *
 * ## Convenção de dívidas
 * `DIVIDA` usa `valorCentavos` negativo ou zero — sinal negativo, não uma flag separada — para que
 * a soma direta de `valorCentavos` de todos os itens não arquivados já seja o patrimônio líquido,
 * sem lógica condicional por tipo no cálculo futuro (fora do escopo desta issue, mas a convenção
 * é definida aqui para não quebrar quem vier a implementá-lo). Os demais tipos usam valor >= 0.
 * [io.savro.domain.patrimonio.ValidadorItemPatrimonial] aplica essa regra na criação/edição.
 *
 * ## Arquivamento e origem
 * `arquivado` remove o item da visão padrão de Home/Patrimônio sem excluí-lo (issue: "arquivar" é
 * operação distinta de "excluir"). `origem` e `atualizadoEmEpocaMs` juntos respondem "de onde veio
 * e quando foi a última vez que esse valor mudou" — obrigatório pela issue ("manter origem manual
 * e data da última atualização em cada item/ajuste").
 */
data class ItemPatrimonial(
    val id: String,
    val tipo: TipoItemPatrimonial,
    val nome: String,
    val valorCentavos: Long,
    val moeda: String,
    val instituicao: String?,
    val observacao: String?,
    val quantidadeMilesimos: Long?,
    val precoMedioCentavos: Long?,
    val origem: OrigemValor,
    val arquivado: Boolean,
    val criadoEmEpocaMs: Long,
    val atualizadoEmEpocaMs: Long,
)

/**
 * Registro histórico de um ajuste manual de valor (issue #119: "registrar ajuste manual de valor
 * preservando data e origem"). Cada ajuste é imutável e append-only — nunca é editado nem
 * removido; só o item aponta seu `valorCentavos`/`atualizadoEmEpocaMs` atuais para o ajuste mais
 * recente. `valorCentavosAnterior` permite reconstruir a linha do tempo de valor de um item sem
 * depender de nenhum outro registro.
 */
data class AjusteValorItem(
    val id: String,
    val itemId: String,
    val valorCentavosAnterior: Long,
    val valorCentavosNovo: Long,
    val origem: OrigemValor,
    val dataEpocaMs: Long,
)

/** Metadados técnicos do banco local — não é um relatório de patrimônio, é estado de infra. */
data class MetadadosBancoLocal(
    val versaoEsquema: Int,
    val totalDeItens: Int,
)

/**
 * Os 5 tipos de evento da "linha do tempo básica" (issue #120). Cada evento é imutável e
 * append-only, no mesmo espírito de [AjusteValorItem] — nunca editado nem removido, exceto por
 * cascata quando o item em si é excluído (exclusão não é um evento rastreado: "excluir" apaga o
 * item e todo o seu histórico, não é uma alteração a exibir na linha do tempo de algo que deixou
 * de existir).
 */
enum class TipoEventoTimeline {
    ITEM_CRIADO,
    VALOR_AJUSTADO,
    ITEM_EDITADO,
    ITEM_ARQUIVADO,
    ITEM_REATIVADO,
}

/**
 * Registro de um evento da linha do tempo básica de um item patrimonial (issue #120). `itemNome`
 * é um instantâneo do nome no momento do evento (não uma referência viva) — preserva o histórico
 * mesmo que o item seja renomeado depois, sem exigir join em toda leitura da timeline.
 */
data class EventoTimelineItem(
    val id: String,
    val itemId: String,
    val itemNome: String,
    val tipo: TipoEventoTimeline,
    val dataEpocaMs: Long,
)
