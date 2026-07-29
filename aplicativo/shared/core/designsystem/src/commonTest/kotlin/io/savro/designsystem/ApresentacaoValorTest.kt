package io.savro.designsystem

import io.savro.designsystem.componentes.ApresentacaoValor
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse

/**
 * Move de `:shared:domain:patrimonio` para `:shared:core:designsystem` na #230 (unificação da
 * máscara de valores) — a função em si não muda, só o módulo dono. Cobre positivos, negativos,
 * zero, valores grandes e a alternância visível→oculto→visível, além dos 4 casos originais.
 */
class ApresentacaoValorTest {

    @Test
    fun texto_visivel_retornaOValorFormatadoSemAlteracao() {
        assertEquals("R$ 1.234,56", ApresentacaoValor.texto("R$ 1.234,56", oculto = false))
    }

    @Test
    fun texto_oculto_nuncaContemNenhumDigitoDoValorReal() {
        val mascarado = ApresentacaoValor.texto("R$ 1.234,56", oculto = true)
        assertFalse(mascarado.any { it.isDigit() })
        assertEquals(ApresentacaoValor.MASCARA, mascarado)
    }

    @Test
    fun descricaoAcessibilidade_oculto_nuncaExpoeOValorAoLeitorDeTela() {
        val descricao = ApresentacaoValor.descricaoAcessibilidade("R$ 999.999,99", oculto = true)
        assertFalse(descricao.any { it.isDigit() })
        assertEquals(ApresentacaoValor.DESCRICAO_ACESSIBILIDADE_OCULTO, descricao)
    }

    @Test
    fun descricaoAcessibilidade_visivel_retornaOValorReal() {
        assertEquals("R$ 10,00", ApresentacaoValor.descricaoAcessibilidade("R$ 10,00", oculto = false))
    }

    @Test
    fun texto_oculto_valorNegativo_nuncaContemDigito() {
        val mascarado = ApresentacaoValor.texto("-R$ 500,00", oculto = true)
        assertFalse(mascarado.any { it.isDigit() })
        assertEquals(ApresentacaoValor.MASCARA, mascarado)
    }

    @Test
    fun texto_oculto_zero_nuncaContemDigito() {
        val mascarado = ApresentacaoValor.texto("R$ 0,00", oculto = true)
        assertFalse(mascarado.any { it.isDigit() })
        assertEquals(ApresentacaoValor.MASCARA, mascarado)
    }

    @Test
    fun texto_oculto_valorGrande_nuncaContemDigito() {
        val mascarado = ApresentacaoValor.texto("R$ 999.999.999,99", oculto = true)
        assertFalse(mascarado.any { it.isDigit() })
        assertEquals(ApresentacaoValor.MASCARA, mascarado)
    }

    @Test
    fun texto_visivel_negativoZeroEGrande_preservaFormatacaoExata() {
        assertEquals("-R$ 500,00", ApresentacaoValor.texto("-R$ 500,00", oculto = false))
        assertEquals("R$ 0,00", ApresentacaoValor.texto("R$ 0,00", oculto = false))
        assertEquals("R$ 999.999.999,99", ApresentacaoValor.texto("R$ 999.999.999,99", oculto = false))
    }

    @Test
    fun alternancia_visivelOcultoVisivel_semVazamentoENuncaPerdeOValorOriginal() {
        val valorReal = "R$ 42.000,17"

        assertEquals(valorReal, ApresentacaoValor.texto(valorReal, oculto = false))
        assertEquals(ApresentacaoValor.MASCARA, ApresentacaoValor.texto(valorReal, oculto = true))
        assertEquals(valorReal, ApresentacaoValor.texto(valorReal, oculto = false))

        assertEquals(valorReal, ApresentacaoValor.descricaoAcessibilidade(valorReal, oculto = false))
        assertEquals(
            ApresentacaoValor.DESCRICAO_ACESSIBILIDADE_OCULTO,
            ApresentacaoValor.descricaoAcessibilidade(valorReal, oculto = true),
        )
        assertEquals(valorReal, ApresentacaoValor.descricaoAcessibilidade(valorReal, oculto = false))
    }
}
