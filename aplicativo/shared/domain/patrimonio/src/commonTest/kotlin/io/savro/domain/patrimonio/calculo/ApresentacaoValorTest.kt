package io.savro.domain.patrimonio.calculo

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse

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
}
