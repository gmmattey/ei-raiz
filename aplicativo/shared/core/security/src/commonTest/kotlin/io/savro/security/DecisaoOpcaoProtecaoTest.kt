package io.savro.security

import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/** Cobre a decisão pura de UX (#226) sem nenhuma dependência de Compose/plataforma. */
class DecisaoOpcaoProtecaoTest {

    @Test
    fun habilitada_somenteQuandoDisponivel() {
        assertTrue(DecisaoOpcaoProtecao.habilitada(DisponibilidadeBiometria.Disponivel))

        assertFalse(DecisaoOpcaoProtecao.habilitada(DisponibilidadeBiometria.SemHardware))
        assertFalse(DecisaoOpcaoProtecao.habilitada(DisponibilidadeBiometria.NaoConfigurada))
        assertFalse(DecisaoOpcaoProtecao.habilitada(DisponibilidadeBiometria.SemCredencialDispositivo))
        assertFalse(DecisaoOpcaoProtecao.habilitada(DisponibilidadeBiometria.BloqueadaPermanentemente))
        assertFalse(DecisaoOpcaoProtecao.habilitada(DisponibilidadeBiometria.Indisponivel))
        assertFalse(DecisaoOpcaoProtecao.habilitada(DisponibilidadeBiometria.BloqueadaTemporariamente()))
        assertFalse(DecisaoOpcaoProtecao.habilitada(DisponibilidadeBiometria.ErroDesconhecido("x")))
    }

    @Test
    fun permiteTentarNovamente_falsoParaMotivosQueNaoMudamSozinhos() {
        assertFalse(DecisaoOpcaoProtecao.permiteTentarNovamente(DisponibilidadeBiometria.SemHardware))
        assertFalse(DecisaoOpcaoProtecao.permiteTentarNovamente(DisponibilidadeBiometria.NaoConfigurada))
        assertFalse(DecisaoOpcaoProtecao.permiteTentarNovamente(DisponibilidadeBiometria.SemCredencialDispositivo))
        assertFalse(DecisaoOpcaoProtecao.permiteTentarNovamente(DisponibilidadeBiometria.BloqueadaPermanentemente))
    }

    @Test
    fun permiteTentarNovamente_verdadeiroParaMotivosTransitorios() {
        assertTrue(DecisaoOpcaoProtecao.permiteTentarNovamente(DisponibilidadeBiometria.Disponivel))
        assertTrue(DecisaoOpcaoProtecao.permiteTentarNovamente(DisponibilidadeBiometria.Indisponivel))
        assertTrue(DecisaoOpcaoProtecao.permiteTentarNovamente(DisponibilidadeBiometria.BloqueadaTemporariamente()))
        assertTrue(DecisaoOpcaoProtecao.permiteTentarNovamente(DisponibilidadeBiometria.ErroDesconhecido("x")))
    }

    @Test
    fun permiteContinuarSemProtecao_verdadeiroParaTudoMenosDisponivel() {
        assertFalse(DecisaoOpcaoProtecao.permiteContinuarSemProtecao(DisponibilidadeBiometria.Disponivel))

        assertTrue(DecisaoOpcaoProtecao.permiteContinuarSemProtecao(DisponibilidadeBiometria.SemHardware))
        assertTrue(DecisaoOpcaoProtecao.permiteContinuarSemProtecao(DisponibilidadeBiometria.NaoConfigurada))
        assertTrue(DecisaoOpcaoProtecao.permiteContinuarSemProtecao(DisponibilidadeBiometria.SemCredencialDispositivo))
        assertTrue(DecisaoOpcaoProtecao.permiteContinuarSemProtecao(DisponibilidadeBiometria.BloqueadaPermanentemente))
        assertTrue(DecisaoOpcaoProtecao.permiteContinuarSemProtecao(DisponibilidadeBiometria.Indisponivel))
        assertTrue(DecisaoOpcaoProtecao.permiteContinuarSemProtecao(DisponibilidadeBiometria.BloqueadaTemporariamente()))
        assertTrue(DecisaoOpcaoProtecao.permiteContinuarSemProtecao(DisponibilidadeBiometria.ErroDesconhecido("x")))
    }
}
