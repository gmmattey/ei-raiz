package io.savro.domain.patrimonio

import io.savro.model.ItemPatrimonial
import io.savro.model.OrigemValor
import io.savro.model.TipoItemPatrimonial
import kotlin.test.Test
import kotlin.test.assertEquals

class OrdenacaoItensPatrimoniaisTest {

    private fun item(nome: String, valorCentavos: Long): ItemPatrimonial = ItemPatrimonial(
        id = nome,
        tipo = TipoItemPatrimonial.CONTA,
        nome = nome,
        valorCentavos = valorCentavos,
        moeda = "BRL",
        instituicao = null,
        observacao = null,
        quantidadeMilesimos = null,
        precoMedioCentavos = null,
        origem = OrigemValor.MANUAL,
        arquivado = false,
        criadoEmEpocaMs = 0,
        atualizadoEmEpocaMs = 0,
    )

    private val itens = listOf(item("Zebra", 500), item("Ações", 100_000), item("banco", 10))

    @Test
    fun ordenaPorNomeAscendenteIgnorandoCaixa() {
        val resultado = itens.ordenarPor(OrdenacaoItensPatrimoniais.NOME_ASC).map { it.nome }
        assertEquals(listOf("Ações", "banco", "Zebra"), resultado)
    }

    @Test
    fun ordenaPorNomeDescendente() {
        val resultado = itens.ordenarPor(OrdenacaoItensPatrimoniais.NOME_DESC).map { it.nome }
        assertEquals(listOf("Zebra", "banco", "Ações"), resultado)
    }

    @Test
    fun ordenaPorValorAscendente() {
        val resultado = itens.ordenarPor(OrdenacaoItensPatrimoniais.VALOR_ASC).map { it.valorCentavos }
        assertEquals(listOf(10L, 500L, 100_000L), resultado)
    }

    @Test
    fun ordenaPorValorDescendente() {
        val resultado = itens.ordenarPor(OrdenacaoItensPatrimoniais.VALOR_DESC).map { it.valorCentavos }
        assertEquals(listOf(100_000L, 500L, 10L), resultado)
    }
}
