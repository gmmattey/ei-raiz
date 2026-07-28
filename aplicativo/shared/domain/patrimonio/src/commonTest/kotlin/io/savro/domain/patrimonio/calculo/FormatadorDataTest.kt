package io.savro.domain.patrimonio.calculo

import kotlin.test.Test
import kotlin.test.assertEquals

class FormatadorDataTest {

    @Test
    fun paraDataCurta_epocaZero_ehPrimeiroDeJaneiroDe1970() {
        assertEquals("01/01/1970", FormatadorData.paraDataCurta(0))
    }

    @Test
    fun paraDataCurta_datasConhecidas() {
        assertEquals("14/11/2023", FormatadorData.paraDataCurta(1_700_000_000_000))
        assertEquals("09/09/2001", FormatadorData.paraDataCurta(1_000_000_000_000))
        assertEquals("01/01/2021", FormatadorData.paraDataCurta(1_609_459_200_000))
    }
}
