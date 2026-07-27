package io.savro.app

import androidx.compose.ui.window.ComposeUIViewController
import io.savro.security.GerenciadorCofre
import platform.UIKit.UIViewController

/**
 * Ponto de entrada do framework `SavroApp` consumido pelo host Xcode (`:iosApp`).
 * O host iOS não conhece regra de negócio — só embrulha esta view controller e encaminha
 * transições de ciclo de vida para [gerenciadorCofreParaCicloDeVida] (#118: bloqueio automático ao
 * sair/voltar do segundo plano).
 */
@Suppress("FunctionName")
fun SavroAppViewController(): UIViewController =
    ComposeUIViewController {
        SavroApp(
            gerenciador = ComposicaoCofreIOS.gerenciadorCofre,
            servicoPatrimonio = ComposicaoCofreIOS.servicoPatrimonio,
        )
    }

/**
 * Exposto para `iOSApp.swift` acompanhar `scenePhase` e chamar
 * `notificarAppEmSegundoPlano()`/`notificarAppEmPrimeiroPlano()` — Compose Multiplatform em
 * `commonMain` não tem acesso a notificações de ciclo de vida do `UIApplication` (only o host
 * Swift tem), então o encaminhamento de background/foreground nasce no lado Swift.
 */
@Suppress("FunctionName")
fun GerenciadorCofreParaCicloDeVida(): GerenciadorCofre = ComposicaoCofreIOS.gerenciadorCofre
