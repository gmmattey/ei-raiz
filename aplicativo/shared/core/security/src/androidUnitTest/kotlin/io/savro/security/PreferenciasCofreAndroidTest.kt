package io.savro.security

import android.os.Build
import androidx.test.core.app.ApplicationProvider
import kotlinx.coroutines.test.runTest
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/**
 * [PreferenciasCofreAndroid] real (SharedPreferences via Robolectric) — #118. Cobre o mesmo
 * comportamento já testado com fake em `GerenciadorCofreTest`, agora contra a implementação real
 * de plataforma, sem exigir dispositivo/emulador.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [Build.VERSION_CODES.UPSIDE_DOWN_CAKE])
class PreferenciasCofreAndroidTest {

    private val preferencias = PreferenciasCofreAndroid(ApplicationProvider.getApplicationContext())

    @Test
    fun onboarding_comecaNaoConcluidoEPersisteAposMarcar() = runTest {
        assertFalse(preferencias.onboardingConcluido())
        preferencias.marcarOnboardingConcluido()
        assertTrue(preferencias.onboardingConcluido())
    }

    @Test
    fun politicaProtecao_comecaNenhumaEPersisteAtivacao() = runTest {
        assertEquals(PoliticaProtecao.Nenhuma, preferencias.politicaProtecao())

        preferencias.definirPoliticaProtecao(PoliticaProtecao.Ativada(permitirCredencialDispositivo = false))
        assertEquals(PoliticaProtecao.Ativada(false), preferencias.politicaProtecao())

        preferencias.definirPoliticaProtecao(PoliticaProtecao.Nenhuma)
        assertEquals(PoliticaProtecao.Nenhuma, preferencias.politicaProtecao())
    }

    @Test
    fun timeoutInatividade_usaPadraoAteSerDefinido() = runTest {
        assertEquals(PreferenciasCofrePadrao.TIMEOUT_INATIVIDADE_MS_PADRAO, preferencias.timeoutInatividadeMs())
        preferencias.definirTimeoutInatividadeMs(5_000L)
        assertEquals(5_000L, preferencias.timeoutInatividadeMs())
    }

    @Test
    fun chaveInvalidada_persisteAposMarcada() = runTest {
        assertFalse(preferencias.chaveInvalidadaPersistida())
        preferencias.marcarChaveInvalidadaPersistida()
        assertTrue(preferencias.chaveInvalidadaPersistida())
    }
}
