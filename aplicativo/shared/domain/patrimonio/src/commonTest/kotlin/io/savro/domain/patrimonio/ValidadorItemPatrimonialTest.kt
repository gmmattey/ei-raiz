package io.savro.domain.patrimonio

import io.savro.common.Resultado
import io.savro.model.TipoItemPatrimonial
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertTrue

class ValidadorItemPatrimonialTest {

    private fun estadoValido(
        tipo: TipoItemPatrimonial = TipoItemPatrimonial.CONTA,
        valorTexto: String = "1000,00",
    ) = EstadoFormularioItemPatrimonial(tipo = tipo, nome = "Conta corrente", valorTexto = valorTexto, moeda = "BRL")

    @Test
    fun estadoValido_retornaSucesso() {
        val resultado = ValidadorItemPatrimonial.validar(estadoValido())
        assertIs<Resultado.Sucesso<ItemPatrimonialValidado>>(resultado)
        assertEquals(100_000L, resultado.valor.valorCentavos)
    }

    @Test
    fun nomeEmBranco_retornaNomeObrigatorio() {
        val resultado = ValidadorItemPatrimonial.validar(estadoValido().copy(nome = "  "))
        assertIs<Resultado.Falha<List<ErroValidacaoItem>>>(resultado)
        assertTrue(ErroValidacaoItem.NomeObrigatorio in resultado.erro)
    }

    @Test
    fun semTipo_retornaFalha() {
        val resultado = ValidadorItemPatrimonial.validar(estadoValido().copy(tipo = null))
        assertIs<Resultado.Falha<List<ErroValidacaoItem>>>(resultado)
    }

    @Test
    fun valorEmBranco_retornaValorObrigatorio() {
        val resultado = ValidadorItemPatrimonial.validar(estadoValido(valorTexto = ""))
        assertIs<Resultado.Falha<List<ErroValidacaoItem>>>(resultado)
        assertTrue(ErroValidacaoItem.ValorObrigatorio in resultado.erro)
    }

    @Test
    fun moedaInvalida_retornaMoedaInvalida() {
        val resultado = ValidadorItemPatrimonial.validar(estadoValido().copy(moeda = "R$"))
        assertIs<Resultado.Falha<List<ErroValidacaoItem>>>(resultado)
        assertTrue(ErroValidacaoItem.MoedaInvalida in resultado.erro)
    }

    @Test
    fun divida_comValorPositivo_retornaErroDeSinal() {
        val resultado = ValidadorItemPatrimonial.validar(
            estadoValido(tipo = TipoItemPatrimonial.DIVIDA, valorTexto = "500,00"),
        )
        assertIs<Resultado.Falha<List<ErroValidacaoItem>>>(resultado)
        assertTrue(ErroValidacaoItem.ValorDeDividaDeveSerNegativoOuZero in resultado.erro)
    }

    @Test
    fun divida_comValorNegativo_ehValida() {
        val resultado = ValidadorItemPatrimonial.validar(
            estadoValido(tipo = TipoItemPatrimonial.DIVIDA, valorTexto = "-500,00"),
        )
        assertIs<Resultado.Sucesso<ItemPatrimonialValidado>>(resultado)
        assertEquals(-50_000L, resultado.valor.valorCentavos)
    }

    @Test
    fun tipoNaoDivida_comValorNegativo_retornaErro() {
        val resultado = ValidadorItemPatrimonial.validar(estadoValido(valorTexto = "-1,00"))
        assertIs<Resultado.Falha<List<ErroValidacaoItem>>>(resultado)
        assertTrue(resultado.erro.any { it is ErroValidacaoItem.ValorNaoPodeSerNegativo })
    }

    @Test
    fun rendaVariavel_semQuantidadeNemPrecoMedio_ehValida() {
        val resultado = ValidadorItemPatrimonial.validar(estadoValido(tipo = TipoItemPatrimonial.RENDA_VARIAVEL))
        assertIs<Resultado.Sucesso<ItemPatrimonialValidado>>(resultado)
    }

    @Test
    fun rendaVariavel_comQuantidadeEPrecoMedio_calculaCamposOpcionais() {
        val estado = estadoValido(tipo = TipoItemPatrimonial.RENDA_VARIAVEL).copy(
            quantidadeTexto = "10",
            precoMedioTexto = "25,50",
        )
        val resultado = ValidadorItemPatrimonial.validar(estado)
        assertIs<Resultado.Sucesso<ItemPatrimonialValidado>>(resultado)
        assertEquals(10_000L, resultado.valor.quantidadeMilesimos)
        assertEquals(2_550L, resultado.valor.precoMedioCentavos)
    }

    @Test
    fun quantidadeInformada_foraDeRendaVariavel_retornaErroDeContexto() {
        val estado = estadoValido(tipo = TipoItemPatrimonial.CONTA).copy(quantidadeTexto = "10")
        val resultado = ValidadorItemPatrimonial.validar(estado)
        assertIs<Resultado.Falha<List<ErroValidacaoItem>>>(resultado)
        assertTrue(ErroValidacaoItem.QuantidadeOuPrecoMedioForaDeContexto in resultado.erro)
    }

    @Test
    fun resumo_formataItemValidadoParaRevisao() {
        val resultado = ValidadorItemPatrimonial.validar(estadoValido())
        assertIs<Resultado.Sucesso<ItemPatrimonialValidado>>(resultado)
        val resumo = ResumoItemPatrimonial.de(resultado.valor)
        assertEquals("1000.00", resumo.valorFormatado)
        assertEquals("Conta corrente", resumo.nome)
    }
}
