package io.savro.domain.patrimonio

import io.savro.model.ItemPatrimonial
import io.savro.model.OrigemValor
import io.savro.model.TipoItemPatrimonial
import kotlin.test.Test
import kotlin.test.assertEquals

class FiltroItensPatrimoniaisTest {

    private fun item(
        id: String,
        nome: String,
        tipo: TipoItemPatrimonial = TipoItemPatrimonial.CONTA,
        arquivado: Boolean = false,
        instituicao: String? = null,
    ) = ItemPatrimonial(
        id = id,
        tipo = tipo,
        nome = nome,
        valorCentavos = 1,
        moeda = "BRL",
        instituicao = instituicao,
        observacao = null,
        quantidadeMilesimos = null,
        precoMedioCentavos = null,
        origem = OrigemValor.MANUAL,
        arquivado = arquivado,
        criadoEmEpocaMs = 1,
        atualizadoEmEpocaMs = 1,
    )

    @Test
    fun semFiltro_omiteArquivadosPorPadrao() {
        val itens = listOf(item("1", "Conta"), item("2", "Conta arquivada", arquivado = true))
        val resultado = FiltroItensPatrimoniais().aplicar(itens)
        assertEquals(listOf("1"), resultado.map { it.id })
    }

    @Test
    fun incluirArquivados_mostraTodos() {
        val itens = listOf(item("1", "Conta"), item("2", "Conta arquivada", arquivado = true))
        val resultado = FiltroItensPatrimoniais(incluirArquivados = true).aplicar(itens)
        assertEquals(setOf("1", "2"), resultado.map { it.id }.toSet())
    }

    @Test
    fun filtroPorTipo_retornaSoOTipoEscolhido() {
        val itens = listOf(
            item("1", "Conta", tipo = TipoItemPatrimonial.CONTA),
            item("2", "Ações", tipo = TipoItemPatrimonial.RENDA_VARIAVEL),
        )
        val resultado = FiltroItensPatrimoniais(tipos = setOf(TipoItemPatrimonial.RENDA_VARIAVEL)).aplicar(itens)
        assertEquals(listOf("2"), resultado.map { it.id })
    }

    @Test
    fun buscaPorTexto_casaNomeInstituicaoOuObservacao_semDiferenciarMaiusculas() {
        val itens = listOf(
            item("1", "Conta Nubank", instituicao = "Nubank"),
            item("2", "Poupança", instituicao = "Banco do Brasil"),
        )
        val resultado = FiltroItensPatrimoniais(texto = "nubank").aplicar(itens)
        assertEquals(listOf("1"), resultado.map { it.id })
    }
}
