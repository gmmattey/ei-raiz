package io.savro.app

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import io.savro.backup.ServicoBackup
import io.savro.designsystem.componentes.SavroState
import io.savro.designsystem.componentes.SavroStatePanel
import io.savro.designsystem.componentes.SavroSurface
import io.savro.designsystem.tema.SavroThemeTokens
import io.savro.designsystem.tema.SavroTheme
import io.savro.domain.patrimonio.ServicoPatrimonio
import io.savro.security.GerenciadorCofre
import kotlinx.coroutines.delay
import org.jetbrains.compose.resources.painterResource
import org.jetbrains.compose.resources.stringResource
import io.savro.app.recursos.Res
import io.savro.app.recursos.cofre_verificando
import io.savro.app.recursos.savro_icone

/** Duração do splash (protótipo tela 01: "~1.2s, sem chamada de rede") — #220, item 6. */
private const val DURACAO_SPLASH_MS = 1200L

/**
 * Raiz compartilhada consumida pelo host Android (Activity) e pelo host iOS (UIViewController).
 * [gerenciador] já vem construído pelo host com as implementações nativas do cofre (#118) —
 * `:shared:app` não conhece Keystore, Keychain, BiometricPrompt nem LAContext, só o contrato
 * comum de `:shared:core:security`. [servicoPatrimonio] (issue #119) e [servicoBackup] (issue
 * #121) compartilham a mesma conexão de banco já aberta pelo cofre.
 */
@Composable
fun SavroApp(
    gerenciador: GerenciadorCofre,
    servicoPatrimonio: ServicoPatrimonio,
    servicoBackup: ServicoBackup,
) {
    SavroTheme {
        var mostrarSplash by remember { mutableStateOf(true) }
        var verificandoOnboarding by remember { mutableStateOf(true) }
        var onboardingConcluido by remember { mutableStateOf(false) }

        LaunchedEffect(Unit) {
            delay(DURACAO_SPLASH_MS)
            mostrarSplash = false
        }

        LaunchedEffect(gerenciador) {
            onboardingConcluido = gerenciador.onboardingConcluido()
            verificandoOnboarding = false
            if (onboardingConcluido) gerenciador.iniciar()
        }

        SavroSurface {
            when {
                mostrarSplash -> TelaSplash()
                verificandoOnboarding -> SavroStatePanel(
                    state = SavroState.Loading,
                    title = stringResource(Res.string.cofre_verificando),
                    message = "",
                )
                !onboardingConcluido -> TelaOnboarding(
                    gerenciador = gerenciador,
                    aoConcluir = {
                        onboardingConcluido = true
                        gerenciador.iniciar()
                    },
                )
                else -> TelaCofre(gerenciador, servicoPatrimonio, servicoBackup)
            }
        }
    }
}

/**
 * Abertura do app (protótipo tela 01) — ícone + wordmark, sem rede, sem estado de cofre ainda.
 * Usa a marca em `documentacao/marca/assets-savro/savro-icone-white.svg`, convertida para vetor
 * Android (`composeResources/drawable/savro_icone.xml`, mesmo path de dados do SVG original) —
 * Compose Multiplatform só decodifica `.svg` via Skia (iOS/Desktop); no target Android isso
 * derrubava o app com `IllegalStateException: Android platform doesn't support SVG format` em
 * toda abertura (#246). O formato `.xml` (subconjunto de Android VectorDrawable) é suportado nos
 * três alvos pelo próprio parser do Compose Multiplatform, sem depender de decoder de plataforma
 * nem de dependência nova (ex. coil-svg). Não é uma tela do cofre/desbloqueio, é a peça de marca
 * antes de qualquer verificação (#220, item 6).
 */
@Composable
private fun TelaSplash() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        androidx.compose.foundation.Image(
            painter = painterResource(Res.drawable.savro_icone),
            contentDescription = null,
            modifier = Modifier.size(SavroThemeTokens.spacing.xxxl * 2),
        )
    }
}
