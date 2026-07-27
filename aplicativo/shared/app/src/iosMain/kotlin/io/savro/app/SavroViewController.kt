package io.savro.app

import androidx.compose.ui.window.ComposeUIViewController
import platform.UIKit.UIViewController

/**
 * Ponto de entrada do framework `SavroApp` consumido pelo host Xcode (`:iosApp`).
 * O host iOS não conhece regra de negócio — só embrulha esta view controller.
 */
@Suppress("FunctionName")
fun SavroAppViewController(): UIViewController = ComposeUIViewController { SavroApp() }
