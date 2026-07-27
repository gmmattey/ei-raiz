package io.savro.security

import android.os.Build
import androidx.fragment.app.FragmentActivity
import androidx.test.core.app.ApplicationProvider
import kotlinx.coroutines.test.runTest
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import kotlin.test.assertIs

/**
 * [AutenticadorBiometricoAndroid] via Robolectric — sem hardware biométrico real (nenhum
 * emulador/dispositivo neste ambiente), então cobre o que é determinístico sem depender de um
 * diálogo real do sistema: disponibilidade em aparelho sem biometria configurada, e o
 * comportamento de segurança de nunca mostrar o prompt sem uma Activity vinculada.
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
        autenticador.disponibilidade()
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
}
