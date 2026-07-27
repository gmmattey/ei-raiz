package io.savro.designsystem

import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * `runComposeUiTest` detecta o ambiente Robolectric inspecionando `android.os.Build.FINGERPRINT`,
 * que só existe quando o teste roda sob `RobolectricTestRunner`. Sem essa anotação a JVM usa os
 * stubs vazios do `android.jar` e o teste falha com `NullPointerException` antes de compor nada.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
actual abstract class ComposeUiTestBase
