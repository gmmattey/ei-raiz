package io.savro.domain.patrimonio.calculo

import io.savro.model.ItemPatrimonial
import io.savro.model.TipoItemPatrimonial

/**
 * Totais de uma única moeda (issue #120: "patrimônio bruto", "dívidas", "patrimônio líquido").
 *
 * ## Convenção de sinal
 * [dividasCentavos] é sempre >= 0 (valor absoluto) — [ItemPatrimonial.valorCentavos] de um item
 * `DIVIDA` já é negativo no modelo (ver `ItemPatrimonial`), mas exibir "-R$ -500" duplicaria o
 * sinal. A tela mostra [dividasCentavos] junto de um rótulo ("Dívidas") que já comunica o sentido
 * negativo — nunca um segundo sinal de menos.
 *
 * [liquidoCentavos] = [brutoCentavos] - [dividasCentavos], que é exatamente a soma direta de
 * `valorCentavos` de todos os itens não arquivados desta moeda (a convenção de sinal do modelo
 * garante isso sem lógica condicional por tipo).
 */
data class TotalPorMoeda(
    val moeda: String,
    val brutoCentavos: Long,
    val dividasCentavos: Long,
    val liquidoCentavos: Long,
)

/**
 * Resumo consolidado de patrimônio (issue #120). [totaisPorMoeda] tem no máximo 1 entrada quando
 * [consolidavel] é `true`; quando há mais de uma moeda entre os itens não arquivados, cada moeda
 * aparece separada e [consolidavel] é `false` — nunca somamos moedas diferentes silenciosamente
 * como se fossem equivalentes (regra obrigatória da #120).
 */
data class ResumoPatrimonio(
    val totaisPorMoeda: List<TotalPorMoeda>,
    val consolidavel: Boolean,
) {
    companion object {
        val VAZIO = ResumoPatrimonio(totaisPorMoeda = emptyList(), consolidavel = true)
    }
}

/** Uma fatia da distribuição por classe de uma moeda. [percentualBasisPoints] é 0..10000 (1 casa == 100 = 1%). */
data class FatiaDistribuicao(
    val tipo: TipoItemPatrimonial,
    val valorCentavos: Long,
    val percentualBasisPoints: Int,
)

/** Distribuição por classe (issue #120: "distribuição básica por classe") de uma única moeda. */
data class DistribuicaoPorClasse(
    val moeda: String,
    val fatias: List<FatiaDistribuicao>,
)

/**
 * Motor de cálculo único de patrimônio — Home, Patrimônio e Detalhe usam exatamente estas funções
 * (issue #120: "todas as telas usam os mesmos cálculos e contratos compartilhados"). Funções
 * puras, sem I/O: recebem a lista de itens já carregada do banco local (única fonte de verdade) e
 * nunca usam `Double`/`Float` em nenhum valor monetário.
 *
 * `LIMITE_DIAS_DESATUALIZADO` (issue #120: "itens que precisam de atualização") é um corte
 * arbitrário mas explícito: item cujo `atualizadoEmEpocaMs` é mais antigo que isso entra na lista
 * de pendências da Home. Não existe cotação automática no MVP1 (fora de escopo) — esta é a única
 * forma de sinalizar "isso pode estar desatualizado".
 */
object CalculoPatrimonio {

    const val LIMITE_DIAS_DESATUALIZADO: Long = 90L
    private const val MS_POR_DIA: Long = 24L * 60L * 60L * 1000L
    private const val BASIS_POINTS_TOTAL: Int = 10_000

    /** Patrimônio bruto, dívidas e líquido — sempre sobre itens não arquivados, agrupados por moeda. */
    fun resumo(itens: List<ItemPatrimonial>): ResumoPatrimonio {
        val ativos = itens.filterNot { it.arquivado }
        if (ativos.isEmpty()) return ResumoPatrimonio.VAZIO

        val totais = ativos.groupBy { it.moeda }
            .toList()
            .sortedBy { (moeda, _) -> moeda }
            .map { (moeda, itensDaMoeda) ->
                val bruto = itensDaMoeda.filter { it.tipo != TipoItemPatrimonial.DIVIDA }.sumOf { it.valorCentavos }
                val liquido = itensDaMoeda.sumOf { it.valorCentavos }
                TotalPorMoeda(moeda = moeda, brutoCentavos = bruto, dividasCentavos = bruto - liquido, liquidoCentavos = liquido)
            }

        return ResumoPatrimonio(totaisPorMoeda = totais, consolidavel = totais.size <= 1)
    }

    /**
     * Distribuição por classe sobre o patrimônio bruto (itens não arquivados, não-dívida) de cada
     * moeda presente. Dívidas não entram na distribuição de classes — já aparecem separadas em
     * [resumo]; misturar as duas quebraria a leitura de "como o patrimônio positivo está
     * distribuído". Uma [DistribuicaoPorClasse] por moeda, na mesma ordem de [resumo].
     *
     * Arredondamento: percentuais em pontos-base inteiros (0..10000), calculados com divisão
     * inteira e o resíduo distribuído pelo método do maior resto — a soma das fatias de uma moeda
     * é sempre exatamente 10000 (nunca 9999/10001 por erro de arredondamento acumulado), sem usar
     * `Double` em nenhum passo.
     */
    fun distribuicaoPorClasse(itens: List<ItemPatrimonial>): List<DistribuicaoPorClasse> {
        val ativos = itens.filterNot { it.arquivado }.filter { it.tipo != TipoItemPatrimonial.DIVIDA }
        return ativos.groupBy { it.moeda }
            .toList()
            .sortedBy { (moeda, _) -> moeda }
            .mapNotNull { (moeda, itensDaMoeda) -> distribuicaoDeUmaMoeda(moeda, itensDaMoeda) }
    }

    private fun distribuicaoDeUmaMoeda(moeda: String, itensDaMoeda: List<ItemPatrimonial>): DistribuicaoPorClasse? {
        val totalPorTipo = itensDaMoeda
            .groupBy { it.tipo }
            .toList()
            .sortedBy { (tipo, _) -> tipo.name }
            .associate { (tipo, itensDoTipo) -> tipo to itensDoTipo.sumOf { it.valorCentavos } }
            .filterValues { it > 0 }

        val somaTotal = totalPorTipo.values.sum()
        if (somaTotal <= 0) return null

        val fatiasComResto: List<FatiaComResto> = totalPorTipo.map { (tipo, valor) ->
            val basisPointsExatos = valor * BASIS_POINTS_TOTAL
            val piso = basisPointsExatos / somaTotal
            val resto = basisPointsExatos - piso * somaTotal
            FatiaComResto(tipo = tipo, valor = valor, pisoBasisPoints = piso, resto = resto)
        }

        val faltam = (BASIS_POINTS_TOTAL - fatiasComResto.sumOf { it.pisoBasisPoints }).toInt()
        val basisPointsFinais = fatiasComResto.associate { it.tipo to it.pisoBasisPoints }.toMutableMap()
        fatiasComResto.sortedByDescending { it.resto }.take(faltam).forEach { fatiaComResto ->
            basisPointsFinais[fatiaComResto.tipo] = basisPointsFinais.getValue(fatiaComResto.tipo) + 1
        }

        val fatias = totalPorTipo.map { (tipo, valor) ->
            FatiaDistribuicao(tipo = tipo, valorCentavos = valor, percentualBasisPoints = basisPointsFinais.getValue(tipo).toInt())
        }.sortedByDescending { it.valorCentavos }

        return DistribuicaoPorClasse(moeda = moeda, fatias = fatias)
    }

    private data class FatiaComResto(
        val tipo: TipoItemPatrimonial,
        val valor: Long,
        val pisoBasisPoints: Long,
        val resto: Long,
    )

    /** Itens não arquivados cuja última atualização passou de [LIMITE_DIAS_DESATUALIZADO] dias. */
    fun itensQuePrecisamAtualizacao(itens: List<ItemPatrimonial>, agoraEpocaMs: Long): List<ItemPatrimonial> {
        val limiteEpocaMs = agoraEpocaMs - (LIMITE_DIAS_DESATUALIZADO * MS_POR_DIA)
        return itens.filterNot { it.arquivado }.filter { it.atualizadoEmEpocaMs < limiteEpocaMs }
    }

    /** Data da atualização mais recente entre os itens não arquivados, ou `null` sem nenhum item. */
    fun dataUltimaAtualizacao(itens: List<ItemPatrimonial>): Long? =
        itens.filterNot { it.arquivado }.maxOfOrNull { it.atualizadoEmEpocaMs }
}
