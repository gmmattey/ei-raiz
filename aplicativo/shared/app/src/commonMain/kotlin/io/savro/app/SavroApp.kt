package io.savro.app

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import io.savro.designsystem.componentes.SavroState
import io.savro.designsystem.componentes.SavroStatePanel
import io.savro.designsystem.componentes.SavroSurface
import io.savro.designsystem.tema.SavroTheme
import io.savro.domain.patrimonio.ServicoPatrimonio
import io.savro.security.GerenciadorCofre
import org.jetbrains.compose.resources.stringResource
import io.savro.app.recursos.Res
import io.savro.app.recursos.cofre_verificando

/**
 * Raiz compartilhada consumida pelo host Android (Activity) e pelo host iOS (UIViewController).
 * [gerenciador] já vem construído pelo host com as implementações nativas do cofre (#118) —
 * `:shared:app` não conhece Keystore, Keychain, BiometricPrompt nem LAContext, só o contrato
 * comum de `:shared:core:security`. [servicoPatrimonio] (issue #119) compartilha a mesma conexão
 * de banco já aberta pelo cofre.
 */
@Composable
fun SavroApp(gerenciador: GerenciadorCofre, servicoPatrimonio: ServicoPatrimonio) {
    SavroTheme {
        var verificandoOnboarding by remember { mutableStateOf(true) }
        var onboardingConcluido by remember { mutableStateOf(false) }

        LaunchedEffect(gerenciador) {
            onboardingConcluido = gerenciador.onboardingConcluido()
            verificandoOnboarding = false
            if (onboardingConcluido) gerenciador.iniciar()
        }

        SavroSurface {
            when {
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
                else -> TelaCofre(gerenciador, servicoPatrimonio)
            }
        }
    }
}
