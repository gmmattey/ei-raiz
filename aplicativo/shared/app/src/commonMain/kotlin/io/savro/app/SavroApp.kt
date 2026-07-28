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
 * Usa o SVG de marca já existente em `documentacao/marca/assets-savro/savro-icone-white.svg`
 * (copiado para `composeResources/drawable`); não é uma tela do cofre/desbloqueio, é a peça de
 * marca antes de qualquer verificação (#220, item 6).
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
