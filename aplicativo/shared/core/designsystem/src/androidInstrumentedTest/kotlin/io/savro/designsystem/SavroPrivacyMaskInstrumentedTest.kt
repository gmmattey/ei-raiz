package io.savro.designsystem

import androidx.compose.material3.Text
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import io.savro.designsystem.componentes.SavroPrivacyMask
import io.savro.designsystem.tema.SavroTheme
import org.junit.Rule
import org.junit.Test

class SavroPrivacyMaskInstrumentedTest {
    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun removesSensitiveContentFromTheSemanticsTreeWhenHidden() {
        composeRule.setContent {
            SavroTheme {
                SavroPrivacyMask(
                    isVisible = false,
                    hiddenContentDescription = "Conteúdo oculto",
                ) {
                    Text("R$ 9.999,99")
                }
            }
        }

        composeRule.onNodeWithText("Conteúdo oculto").assertExists()
        composeRule.onNodeWithText("R$ 9.999,99").assertDoesNotExist()
    }
}
