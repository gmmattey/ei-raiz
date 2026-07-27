package io.savro.domain.patrimonio

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class ConversorMonetarioTest {

    @Test
    fun paraCentavos_aceitaVirgulaComoDecimal() {
        assertEquals(123_456L, ConversorMonetario.paraCentavos("1234,56"))
    }

    @Test
    fun paraCentavos_aceitaPontoComoDecimal() {
        assertEquals(123_456L, ConversorMonetario.paraCentavos("1234.56"))
    }

    @Test
    fun paraCentavos_aceitaSomenteInteiro() {
        assertEquals(100_000L, ConversorMonetario.paraCentavos("1000"))
    }

    @Test
    fun paraCentavos_aceitaSeparadorDeMilharENegativo() {
        assertEquals(-1_234_567L, ConversorMonetario.paraCentavos("-12.345,67"))
    }

    @Test
    fun paraCentavos_textoVazio_retornaNulo() {
        assertNull(ConversorMonetario.paraCentavos(""))
        assertNull(ConversorMonetario.paraCentavos("   "))
    }

    @Test
    fun paraCentavos_semDigitos_retornaNulo() {
        assertNull(ConversorMonetario.paraCentavos(",-."))
    }

    @Test
    fun centavosParaTexto_eDeVoltaSaoConsistentes() {
        val original = 1_234_567L
        val texto = ConversorMonetario.centavosParaTexto(original)
        assertEquals("12345.67", texto)
        assertEquals(original, ConversorMonetario.paraCentavos(texto))
    }

    @Test
    fun paraQuantidadeMilesimos_aceitaTresCasasDecimais() {
        assertEquals(1_500L, ConversorMonetario.paraQuantidadeMilesimos("1,5"))
        assertEquals(1_234L, ConversorMonetario.paraQuantidadeMilesimos("1,234"))
    }
}
