package io.savro.domain.patrimonio.calculo

import io.savro.model.ItemPatrimonial
import io.savro.model.OrigemValor
import io.savro.model.TipoItemPatrimonial
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class CalculoPatrimonioTest {

    private fun item(
        id: String,
        tipo: TipoItemPatrimonial,
        valorCentavos: Long,
        moeda: String = "BRL",
        arquivado: Boolean = false,
        atualizadoEmEpocaMs: Long = 0,
    ): ItemPatrimonial = ItemPatrimonial(
        id = id,
        tipo = tipo,
        nome = "Item $id",
        valorCentavos = valorCentavos,
        moeda = moeda,
        instituicao = null,
        observacao = null,
        quantidadeMilesimos = null,
        precoMedioCentavos = null,
        origem = OrigemValor.MANUAL,
        arquivado = arquivado,
        criadoEmEpocaMs = 0,
        atualizadoEmEpocaMs = atualizadoEmEpocaMs,
    )

    @Test
    fun resumo_semItens_retornaZeradoEConsolidavel() {
        val resumo = CalculoPatrimonio.resumo(emptyList())
        assertEquals(ResumoPatrimonio.VAZIO, resumo)
        assertTrue(resumo.consolidavel)
        assertTrue(resumo.totaisPorMoeda.isEmpty())
    }

    @Test
    fun resumo_calculaBrutoDividasELiquidoDeUmaUnicaMoeda() {
        val itens = listOf(
            item("conta", TipoItemPatrimonial.CONTA, 100_000),
            item("acoes", TipoItemPatrimonial.RENDA_VARIAVEL, 50_000),
            item("divida", TipoItemPatrimonial.DIVIDA, -30_000),
        )
        val resumo = CalculoPatrimonio.resumo(itens)

        assertTrue(resumo.consolidavel)
        val total = resumo.totaisPorMoeda.single()
        assertEquals("BRL", total.moeda)
        assertEquals(150_000L, total.brutoCentavos)
        // dívida é sempre exibida como valor absoluto — nunca "-R$ -300,00" (duplicação de sinal).
        assertEquals(30_000L, total.dividasCentavos)
        assertEquals(120_000L, total.liquidoCentavos)
    }

    @Test
    fun resumo_itemArquivado_naoEntraEmNenhumTotal() {
        val itens = listOf(
            item("ativo", TipoItemPatrimonial.CONTA, 100_000),
            item("arquivado", TipoItemPatrimonial.CONTA, 999_999, arquivado = true),
        )
        val total = CalculoPatrimonio.resumo(itens).totaisPorMoeda.single()
        assertEquals(100_000L, total.brutoCentavos)
        assertEquals(100_000L, total.liquidoCentavos)
    }

    @Test
    fun resumo_somenteDividas_liquidoNegativoEBrutoZero() {
        val itens = listOf(item("divida", TipoItemPatrimonial.DIVIDA, -50_000))
        val total = CalculoPatrimonio.resumo(itens).totaisPorMoeda.single()
        assertEquals(0L, total.brutoCentavos)
        assertEquals(50_000L, total.dividasCentavos)
        assertEquals(-50_000L, total.liquidoCentavos)
    }

    @Test
    fun resumo_multiplasMoedas_naoConsolidaSilenciosamente() {
        val itens = listOf(
            item("conta-brl", TipoItemPatrimonial.CONTA, 100_000, moeda = "BRL"),
            item("conta-usd", TipoItemPatrimonial.CONTA, 20_000, moeda = "USD"),
        )
        val resumo = CalculoPatrimonio.resumo(itens)

        assertEquals(false, resumo.consolidavel)
        assertEquals(2, resumo.totaisPorMoeda.size)
        assertEquals(100_000L, resumo.totaisPorMoeda.single { it.moeda == "BRL" }.brutoCentavos)
        assertEquals(20_000L, resumo.totaisPorMoeda.single { it.moeda == "USD" }.brutoCentavos)
    }

    @Test
    fun resumo_multiplasDividas_somaTodasAsDividas() {
        val itens = listOf(
            item("conta", TipoItemPatrimonial.CONTA, 200_000),
            item("divida-cartao", TipoItemPatrimonial.DIVIDA, -30_000),
            item("divida-financiamento", TipoItemPatrimonial.DIVIDA, -70_000),
        )
        val total = CalculoPatrimonio.resumo(itens).totaisPorMoeda.single()

        assertEquals(200_000L, total.brutoCentavos)
        assertEquals(100_000L, total.dividasCentavos)
        assertEquals(100_000L, total.liquidoCentavos)
    }

    @Test
    fun resumo_brutoIgualADividas_liquidoExatamenteZero() {
        val itens = listOf(
            item("conta", TipoItemPatrimonial.CONTA, 50_000),
            item("divida", TipoItemPatrimonial.DIVIDA, -50_000),
        )
        val total = CalculoPatrimonio.resumo(itens).totaisPorMoeda.single()

        assertEquals(50_000L, total.brutoCentavos)
        assertEquals(50_000L, total.dividasCentavos)
        assertEquals(0L, total.liquidoCentavos)
    }

    @Test
    fun resumo_itemComValorZero_entraNoBrutoSemAlterarLiquido() {
        val itens = listOf(
            item("conta", TipoItemPatrimonial.CONTA, 100_000),
            item("zerado", TipoItemPatrimonial.OUTRO, 0),
        )
        val total = CalculoPatrimonio.resumo(itens).totaisPorMoeda.single()

        assertEquals(100_000L, total.brutoCentavos)
        assertEquals(0L, total.dividasCentavos)
        assertEquals(100_000L, total.liquidoCentavos)
    }

    @Test
    fun resumo_valoresGrandes_somaSemOverflowSilencioso() {
        // R$ 999.999.999,99 por item — ordem de grandeza muito acima de qualquer patrimônio real,
        // usada só para provar que a soma de poucos itens grandes não estoura silenciosamente
        // dentro da faixa em que este app opera (Long tem margem folgada até ~R$ 92 quatrilhões).
        val valorGrandeCentavos = 99_999_999_999L
        val itens = listOf(
            item("bem-a", TipoItemPatrimonial.BEM, valorGrandeCentavos),
            item("bem-b", TipoItemPatrimonial.BEM, valorGrandeCentavos),
            item("divida-grande", TipoItemPatrimonial.DIVIDA, -valorGrandeCentavos),
        )
        val total = CalculoPatrimonio.resumo(itens).totaisPorMoeda.single()

        assertEquals(valorGrandeCentavos * 2, total.brutoCentavos)
        assertEquals(valorGrandeCentavos, total.dividasCentavos)
        assertEquals(valorGrandeCentavos, total.liquidoCentavos)
    }

    @Test
    fun distribuicaoPorClasse_somaExatamente10000BasisPointsApesarDeDivisaoNaoExata() {
        // 3 itens de 1000 centavos cada => 1/3 exato não existe em base 10 — testa o método do
        // maior resto sem nunca usar Double.
        val itens = listOf(
            item("a", TipoItemPatrimonial.CONTA, 1_000),
            item("b", TipoItemPatrimonial.RENDA_FIXA, 1_000),
            item("c", TipoItemPatrimonial.CRIPTO, 1_000),
        )
        val distribuicao = CalculoPatrimonio.distribuicaoPorClasse(itens).single()
        assertEquals(10_000, distribuicao.fatias.sumOf { it.percentualBasisPoints })
        assertEquals(3, distribuicao.fatias.size)
    }

    @Test
    fun distribuicaoPorClasse_ignoraDividasEItensArquivados() {
        val itens = listOf(
            item("conta", TipoItemPatrimonial.CONTA, 100_000),
            item("divida", TipoItemPatrimonial.DIVIDA, -50_000),
            item("arquivado", TipoItemPatrimonial.CRIPTO, 999_999, arquivado = true),
        )
        val distribuicao = CalculoPatrimonio.distribuicaoPorClasse(itens).single()
        assertEquals(1, distribuicao.fatias.size)
        assertEquals(TipoItemPatrimonial.CONTA, distribuicao.fatias.single().tipo)
        assertEquals(10_000, distribuicao.fatias.single().percentualBasisPoints)
    }

    @Test
    fun distribuicaoPorClasse_semItensPositivos_retornaListaVazia() {
        assertTrue(CalculoPatrimonio.distribuicaoPorClasse(emptyList()).isEmpty())
        assertTrue(
            CalculoPatrimonio.distribuicaoPorClasse(listOf(item("divida", TipoItemPatrimonial.DIVIDA, -1_000))).isEmpty(),
        )
    }

    @Test
    fun distribuicaoPorClasse_itemComValorZero_naoGeraFatiaPropria() {
        val itens = listOf(
            item("conta", TipoItemPatrimonial.CONTA, 100_000),
            item("zerado", TipoItemPatrimonial.OUTRO, 0),
        )
        val distribuicao = CalculoPatrimonio.distribuicaoPorClasse(itens).single()
        assertEquals(1, distribuicao.fatias.size)
        assertEquals(TipoItemPatrimonial.CONTA, distribuicao.fatias.single().tipo)
    }

    @Test
    fun distribuicaoPorClasse_multiplasMoedas_umaDistribuicaoIndependentePorMoeda() {
        val itens = listOf(
            item("conta-brl", TipoItemPatrimonial.CONTA, 100_000, moeda = "BRL"),
            item("cripto-brl", TipoItemPatrimonial.CRIPTO, 100_000, moeda = "BRL"),
            item("conta-usd", TipoItemPatrimonial.CONTA, 50_000, moeda = "USD"),
        )
        val distribuicoes = CalculoPatrimonio.distribuicaoPorClasse(itens)

        assertEquals(2, distribuicoes.size)
        val brl = distribuicoes.single { it.moeda == "BRL" }
        assertEquals(2, brl.fatias.size)
        assertEquals(10_000, brl.fatias.sumOf { it.percentualBasisPoints })

        val usd = distribuicoes.single { it.moeda == "USD" }
        assertEquals(1, usd.fatias.size)
        assertEquals(10_000, usd.fatias.single().percentualBasisPoints)
    }

    @Test
    fun itensQuePrecisamAtualizacao_filtraPeloLimiteDeDiasEIgnoraArquivados() {
        val umDiaEmMs = 24L * 60 * 60 * 1000
        val agora = 1_000L * umDiaEmMs
        val limiteEmMs = CalculoPatrimonio.LIMITE_DIAS_DESATUALIZADO * umDiaEmMs

        val itens = listOf(
            item("recente", TipoItemPatrimonial.CONTA, 1, atualizadoEmEpocaMs = agora),
            item("antigo", TipoItemPatrimonial.CONTA, 1, atualizadoEmEpocaMs = agora - limiteEmMs - umDiaEmMs),
            item("antigoArquivado", TipoItemPatrimonial.CONTA, 1, atualizadoEmEpocaMs = 0, arquivado = true),
        )

        val pendentes = CalculoPatrimonio.itensQuePrecisamAtualizacao(itens, agoraEpocaMs = agora)
        assertEquals(listOf("antigo"), pendentes.map { it.id })
    }

    @Test
    fun dataUltimaAtualizacao_semItens_retornaNull() {
        assertEquals(null, CalculoPatrimonio.dataUltimaAtualizacao(emptyList()))
    }

    @Test
    fun dataUltimaAtualizacao_ignoraArquivadosERetornaAMaisRecente() {
        val itens = listOf(
            item("antigo", TipoItemPatrimonial.CONTA, 1, atualizadoEmEpocaMs = 100),
            item("recente", TipoItemPatrimonial.CONTA, 1, atualizadoEmEpocaMs = 500),
            item("arquivadoMaisRecente", TipoItemPatrimonial.CONTA, 1, atualizadoEmEpocaMs = 999, arquivado = true),
        )
        assertEquals(500L, CalculoPatrimonio.dataUltimaAtualizacao(itens))
    }
}
