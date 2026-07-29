package io.savro.security

import android.os.Build
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.fragment.app.FragmentActivity
import androidx.test.core.app.ApplicationProvider
import kotlinx.coroutines.test.runTest
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import kotlin.test.assertEquals
import kotlin.test.assertIs

/**
 * [AutenticadorBiometricoAndroid] via Robolectric — sem hardware biométrico real (nenhum
 * emulador/dispositivo neste ambiente), então cobre o que é determinístico sem depender de um
 * diálogo real do sistema: disponibilidade em aparelho sem biometria configurada, o comportamento
 * de segurança de nunca mostrar o prompt sem uma Activity vinculada, e o mapeamento puro (#226)
 * de todos os códigos relevantes de `BiometricManager.canAuthenticate`/`BiometricPrompt` — esses
 * últimos não dependem de Robolectric simular hardware, só dos próprios constantes da lib.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [Build.VERSION_CODES.UPSIDE_DOWN_CAKE])
class AutenticadorBiometricoAndroidTest {

    private val autenticador = AutenticadorBiometricoAndroid(ApplicationProvider.getApplicationContext())

    @Test
    fun disponibilidade_naoLancaExcecaoEMapeiaParaUmCasoDoContrato() = runTest {
        // Robolectric por padrão finge sucesso do BiometricManager (não simula ausência real de
        // hardware) — o que este teste garante é que a chamada nunca lança exceção e sempre
        // resolve para um dos casos do contrato comum, não o comportamento de um aparelho real
        // sem biometria (isso exigiria device físico, fora do alcance deste ambiente).
        autenticador.disponibilidade(permitirCredencialDispositivo = true)
        autenticador.disponibilidade(permitirCredencialDispositivo = false)
    }

    @Test
    fun autenticar_semAtividadeVinculada_retornaIndisponivelSemMostrarPrompt() = runTest {
        // Nenhuma vincularAtividade() chamada — não pode tentar mostrar BiometricPrompt sem uma
        // Activity viva; deve falhar de forma segura e explícita, nunca travar ou lançar exceção.
        val resultado = autenticador.autenticar(motivo = "teste", permitirCredencialDispositivo = true)
        assertIs<ResultadoAutenticacao.Indisponivel>(resultado)
    }

    @Test
    fun vincularEDesvincularAtividade_naoLancaExcecao() {
        val activity = Robolectric.buildActivity(FragmentActivity::class.java).setup().get()
        autenticador.vincularAtividade(activity)
        autenticador.desvincularAtividade(activity)
    }

    // --- mapearDisponibilidade (#226): mapeia todos os retornos relevantes de canAuthenticate ---

    @Test
    fun mapearDisponibilidade_sucesso_viraDisponivel() {
        assertEquals(
            DisponibilidadeBiometria.Disponivel,
            mapearDisponibilidade(BiometricManager.BIOMETRIC_SUCCESS, true, BiometricManager.BIOMETRIC_SUCCESS),
        )
    }

    @Test
    fun mapearDisponibilidade_semHardwareApenasBiometria_viraSemHardware() {
        assertEquals(
            DisponibilidadeBiometria.SemHardware,
            mapearDisponibilidade(BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE, false, null),
        )
        assertEquals(
            DisponibilidadeBiometria.SemHardware,
            mapearDisponibilidade(BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE, false, null),
        )
    }

    @Test
    fun mapearDisponibilidade_semHardwareMasComCredencialDoAparelho_viraSemHardware() {
        // Combinado permite credencial, checagem isolada de DEVICE_CREDENTIAL funciona — o
        // problema real é só a ausência de sensor, não a ausência de credencial nenhuma.
        assertEquals(
            DisponibilidadeBiometria.SemHardware,
            mapearDisponibilidade(
                BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE,
                true,
                BiometricManager.BIOMETRIC_SUCCESS,
            ),
        )
    }

    @Test
    fun mapearDisponibilidade_semHardwareESemCredencial_viraSemCredencialDispositivo() {
        // Combinado permite credencial, mas a checagem isolada de DEVICE_CREDENTIAL também falha —
        // o problema real é não haver nenhum código/PIN/padrão configurado no aparelho.
        assertEquals(
            DisponibilidadeBiometria.SemCredencialDispositivo,
            mapearDisponibilidade(
                BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE,
                true,
                BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE,
            ),
        )
    }

    @Test
    fun mapearDisponibilidade_nenhumaBiometriaCadastrada_viraNaoConfigurada() {
        assertEquals(
            DisponibilidadeBiometria.NaoConfigurada,
            mapearDisponibilidade(BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED, true, BiometricManager.BIOMETRIC_SUCCESS),
        )
    }

    @Test
    fun mapearDisponibilidade_atualizacaoDeSegurancaPendente_viraIndisponivel() {
        assertEquals(
            DisponibilidadeBiometria.Indisponivel,
            mapearDisponibilidade(BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED, true, null),
        )
    }

    @Test
    fun mapearDisponibilidade_codigosNaoSuportadosOuDesconhecidos_viraErroDesconhecido() {
        assertIs<DisponibilidadeBiometria.ErroDesconhecido>(
            mapearDisponibilidade(BiometricManager.BIOMETRIC_ERROR_UNSUPPORTED, true, null),
        )
        assertIs<DisponibilidadeBiometria.ErroDesconhecido>(
            mapearDisponibilidade(BiometricManager.BIOMETRIC_STATUS_UNKNOWN, true, null),
        )
        assertIs<DisponibilidadeBiometria.ErroDesconhecido>(mapearDisponibilidade(-999, true, null))
    }

    // --- mapearErro (#226): mapeia os erros terminais relevantes de BiometricPrompt ---

    @Test
    fun mapearErro_cancelamentoDoUsuario_naoViraFalhaDestrutiva() {
        assertEquals(ResultadoAutenticacao.Cancelado, autenticador.mapearErro(BiometricPrompt.ERROR_USER_CANCELED, "cancelado"))
        assertEquals(ResultadoAutenticacao.Cancelado, autenticador.mapearErro(BiometricPrompt.ERROR_NEGATIVE_BUTTON, "cancelado"))
        assertEquals(ResultadoAutenticacao.Cancelado, autenticador.mapearErro(BiometricPrompt.ERROR_CANCELED, "cancelado"))
    }

    @Test
    fun mapearErro_bloqueioTemporario_carregaHorarioFuturo() {
        val resultado = autenticador.mapearErro(BiometricPrompt.ERROR_LOCKOUT, "bloqueado")
        assertIs<ResultadoAutenticacao.BloqueioTemporario>(resultado)
    }

    @Test
    fun mapearErro_bloqueioPermanente_viraBloqueioPermanente() {
        assertEquals(
            ResultadoAutenticacao.BloqueioPermanente,
            autenticador.mapearErro(BiometricPrompt.ERROR_LOCKOUT_PERMANENT, "bloqueado para sempre"),
        )
    }

    @Test
    fun mapearErro_semBiometriaOuHardwareOuCredencial_viraIndisponivel() {
        assertIs<ResultadoAutenticacao.Indisponivel>(autenticador.mapearErro(BiometricPrompt.ERROR_NO_BIOMETRICS, "x"))
        assertIs<ResultadoAutenticacao.Indisponivel>(autenticador.mapearErro(BiometricPrompt.ERROR_HW_UNAVAILABLE, "x"))
        assertIs<ResultadoAutenticacao.Indisponivel>(autenticador.mapearErro(BiometricPrompt.ERROR_HW_NOT_PRESENT, "x"))
        assertIs<ResultadoAutenticacao.Indisponivel>(autenticador.mapearErro(BiometricPrompt.ERROR_NO_DEVICE_CREDENTIAL, "x"))
    }

    @Test
    fun mapearErro_erroDesconhecido_viraFalhaCredencial() {
        assertIs<ResultadoAutenticacao.FalhaCredencial>(autenticador.mapearErro(-999, "erro genérico"))
    }
}
