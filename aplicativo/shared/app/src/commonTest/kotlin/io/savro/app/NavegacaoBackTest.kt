package io.savro.app

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

/**
 * Regra pura de back Android/gesto preditivo (issue #181) — sem depender de `BackHandler` nem de
 * infraestrutura de UI, testável em `commonTest` (roda em JVM e simulador iOS).
 */
class NavegacaoBackTest {

    @Test
    fun destino_lista_nao_consome_back() {
        assertNull(DestinoPatrimonio.Lista.aoVoltar())
    }

    @Test
    fun destino_detalhe_volta_para_lista() {
        assertEquals(DestinoPatrimonio.Lista, DestinoPatrimonio.Detalhe(itemId = "item-1").aoVoltar())
    }

    @Test
    fun destino_formulario_volta_para_lista() {
        assertEquals(DestinoPatrimonio.Lista, DestinoPatrimonio.Formulario(itemIdEmEdicao = null).aoVoltar())
        assertEquals(DestinoPatrimonio.Lista, DestinoPatrimonio.Formulario(itemIdEmEdicao = "item-1").aoVoltar())
    }

    @Test
    fun destino_ajuste_volta_para_lista() {
        assertEquals(DestinoPatrimonio.Lista, DestinoPatrimonio.Ajuste(itemId = "item-1").aoVoltar())
    }

    @Test
    fun aba_home_nao_consome_back() {
        assertNull(AbaPrincipal.HOME.aoVoltarNaLista())
    }

    @Test
    fun aba_patrimonio_volta_para_home() {
        assertEquals(AbaPrincipal.HOME, AbaPrincipal.PATRIMONIO.aoVoltarNaLista())
    }
}
