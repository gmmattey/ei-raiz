package io.savro.app

import androidx.compose.ui.window.ComposeUIViewController
import io.savro.security.GerenciadorCofre
import platform.UIKit.UIViewController

/**
 * Ponto de entrada do framework `SavroApp` consumido pelo host Xcode (`:iosApp`).
 * O host iOS não conhece regra de negócio — só embrulha esta view controller e encaminha
 * transições de ciclo de vida para [gerenciadorCofreParaCicloDeVida] (#118: bloqueio automático ao
 * sair/voltar do segundo plano).
 *
 * ## Preservação de rascunho de formulário em background/retorno (#119, investigação de Igor)
 * `TelaFormularioItem` (`PatrimonioScreens.kt`) usa `rememberSaveable` com `RascunhoFormularioItem`
 * como Saver. Isso **não precisa de adapter nativo adicional aqui**: o `UIViewController` retornado
 * por `ComposeUIViewController` — e o `SaveableStateRegistry` que ele cria internamente — só é
 * criado uma vez, na primeira chamada a esta função, e vive enquanto o processo do app viver.
 * `ContentView.swift` mantém `ComposeView()` na mesma posição estrutural da `ZStack` em qualquer
 * fase de `scenePhase` (só o overlay de proteção de snapshot entra/sai ao lado dela) — o SwiftUI
 * nunca invalida a identidade de `ComposeView`, então nunca chama `makeUIViewController` de novo, e
 * este `UIViewController` nunca é recriado por background→foreground nem por qualquer transição de
 * cena comum. Ou seja: o mesmo processo Compose Multiplatform que já sobrevive à composição de
 * `TelaFormularioItem` ser removida/recolocada (ex.: cofre relockar em #118 e o usuário reabrir o
 * formulário depois de desbloquear) também sobrevive à app ir para segundo plano e voltar.
 *
 * O que isso **não** cobre — e nenhum adapter em `iosMain` cobriria sozinho, porque é limitação de
 * `commonMain`, não de plataforma: o `SaveableStateRegistry` do Compose Multiplatform em iOS é só
 * em memória (ao contrário do `Bundle`/`SavedStateRegistry` do Android, que o próprio SO persiste
 * em disco). Se o sistema operacional finalizar o processo em segundo plano (pressão de memória) ou
 * o usuário forçar o fechamento do app, um relançamento é um processo novo — `rememberSaveable`
 * nunca chega a restaurar nada porque nada foi persistido. Isso não é lacuna exclusiva do iOS: no
 * Android o mesmo cenário de morte de processo em segundo plano (não a rotação normal, que já era
 * coberta) também perderia o estado se `destino`/rascunho não estivessem em `rememberSaveable`.
 * `TelaPatrimonio.destino` (`PatrimonioScreens.kt`) foi corrigido para `rememberSaveable` depois
 * desta investigação — restam cobertas as transições normais de lifecycle (background/retorno,
 * rotação, recomposição). Persistência em disco sobrevivendo a **qualquer** morte de processo (o
 * SO descartando o app inteiro por pressão de memória) é decisão de arquitetura maior, fora do
 * escopo desta issue, registrada como risco pendente.
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
