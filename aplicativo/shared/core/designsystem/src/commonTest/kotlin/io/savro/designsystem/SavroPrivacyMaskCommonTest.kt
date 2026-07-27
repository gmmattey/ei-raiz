package io.savro.designsystem

import androidx.compose.material3.Text
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.runComposeUiTest
import io.savro.designsystem.componentes.SavroPrivacyMask
import io.savro.designsystem.tema.SavroTheme
import kotlin.test.Test

/**
 * Equivalente comum de `SavroPrivacyMaskInstrumentedTest` (androidInstrumentedTest). Cobre o
 * mesmo estado semântico — conteúdo sensível removido da árvore de semântica quando oculto — mas
 * roda nos dois source sets de teste (`androidUnitTest` via Robolectric, `iosTest` via XCTest em
 * host macOS) a partir de uma única implementação em `commonTest`.
 */
class SavroPrivacyMaskCommonTest : ComposeUiTestBase() {
    @OptIn(ExperimentalTestApi::class)
    @Test
    fun removesSensitiveContentFromTheSemanticsTreeWhenHidden() = runComposeUiTest {
        setContent {
            SavroTheme {
                SavroPrivacyMask(
                    isVisible = false,
                    hiddenContentDescription = "Conteúdo oculto",
                ) {
                    Text("R$ 9.999,99")
                }
            }
        }

        onNodeWithText("Conteúdo oculto").assertExists()
        onNodeWithText("R$ 9.999,99").assertDoesNotExist()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun showsSensitiveContentInTheSemanticsTreeWhenVisible() = runComposeUiTest {
        setContent {
            SavroTheme {
                SavroPrivacyMask(
                    isVisible = true,
                    hiddenContentDescription = "Conteúdo oculto",
                ) { contentModifier ->
                    Text("R$ 9.999,99", modifier = contentModifier)
                }
            }
        }

        onNodeWithText("R$ 9.999,99").assertExists()
    }
}
