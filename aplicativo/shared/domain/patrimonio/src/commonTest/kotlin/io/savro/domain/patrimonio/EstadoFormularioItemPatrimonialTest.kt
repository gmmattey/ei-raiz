package io.savro.domain.patrimonio

import io.savro.model.TipoItemPatrimonial
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class EstadoFormularioItemPatrimonialTest {

    @Test
    fun semTipo_soMostraCampoDeTipo() {
        val estado = EstadoFormularioItemPatrimonial()
        assertEquals(setOf(CampoFormularioItem.TIPO), estado.camposVisiveis())
    }

    @Test
    fun contaCorrente_naoMostraQuantidadeNemPrecoMedio() {
        val estado = EstadoFormularioItemPatrimonial(tipo = TipoItemPatrimonial.CONTA)
        assertFalse(CampoFormularioItem.QUANTIDADE in estado.camposVisiveis())
        assertFalse(CampoFormularioItem.PRECO_MEDIO in estado.camposVisiveis())
    }

    @Test
    fun rendaVariavel_mostraQuantidadeEPrecoMedioComoNaoObrigatorios() {
        val estado = EstadoFormularioItemPatrimonial(tipo = TipoItemPatrimonial.RENDA_VARIAVEL)
        assertTrue(CampoFormularioItem.QUANTIDADE in estado.camposVisiveis())
        assertTrue(CampoFormularioItem.PRECO_MEDIO in estado.camposVisiveis())
        assertFalse(CampoFormularioItem.QUANTIDADE in estado.camposObrigatorios())
        assertFalse(CampoFormularioItem.PRECO_MEDIO in estado.camposObrigatorios())
    }

    // Issue #119: "preservar formulário durante transições previstas de Android e iOS" — a base
    // testável em commonMain é essa serialização/restauração ser idempotente e sem perda de dado.
    @Test
    fun rascunho_serializarERestaurar_reproduzOMesmoEstado() {
        val original = EstadoFormularioItemPatrimonial(
            itemIdEmEdicao = "item-42",
            tipo = TipoItemPatrimonial.RENDA_VARIAVEL,
            nome = "Tesouro Selic",
            valorTexto = "1.234,56",
            moeda = "BRL",
            instituicao = "Corretora X",
            observacao = "Reserva de emergência",
            quantidadeTexto = "10",
            precoMedioTexto = "100,00",
        )

        val restaurado = RascunhoFormularioItem.restaurar(RascunhoFormularioItem.serializar(original))

        assertEquals(original, restaurado)
    }

    @Test
    fun rascunho_comCaracteresEspeciais_naoQuebraOParser() {
        val original = EstadoFormularioItemPatrimonial(
            nome = "Nota: contém : dois pontos e \"aspas\"",
            observacao = "linha 1\nlinha 2",
        )
        val restaurado = RascunhoFormularioItem.restaurar(RascunhoFormularioItem.serializar(original))
        assertEquals(original, restaurado)
    }

    @Test
    fun rascunho_estadoVazio_serializaParaStringVazia() {
        assertEquals("", RascunhoFormularioItem.serializar(EstadoFormularioItemPatrimonial()))
        assertEquals(EstadoFormularioItemPatrimonial(), RascunhoFormularioItem.restaurar(""))
    }
}
