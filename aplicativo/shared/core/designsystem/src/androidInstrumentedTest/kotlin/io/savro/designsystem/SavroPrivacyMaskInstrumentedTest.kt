package io.savro.designsystem

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import io.savro.designsystem.componentes.SavroPrivacyMask
import io.savro.designsystem.componentes.SavroPrivacyText
import io.savro.designsystem.tema.SavroTheme
import org.junit.Rule
import org.junit.Test

/**
 * Equivalente instrumentado (device/AVD real) de `SavroPrivacyMaskCommonTest`/
 * `SavroPrivacyTextCommonTest` — confirma via árvore de semântica real do Compose UI Test que o
 * leitor de tela não encontra o valor real quando oculto (issue #230).
 */
class SavroPrivacyMaskInstrumentedTest {
    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun savroPrivacyMask_oculto_removeOValorRealDaArvoreDeSemantica() {
        composeRule.setContent {
            SavroTheme {
                SavroPrivacyMask(rotulo = "Patrimônio líquido", valorFormatado = "R$ 9.999,99", oculto = true)
            }
        }

        composeRule.onNodeWithText("R$ 9.999,99").assertDoesNotExist()
        composeRule.onNodeWithContentDescription("Patrimônio líquido: R$ 9.999,99").assertDoesNotExist()
        composeRule.onNodeWithText("••••••").assertExists()
        composeRule.onNodeWithContentDescription("Valor oculto").assertExists()
    }

    @Test
    fun savroPrivacyText_oculto_removeOValorRealDaArvoreDeSemantica() {
        composeRule.setContent {
            SavroTheme {
                SavroPrivacyText(prefixo = "Renda fixa", valorFormatado = "R$ 1.200,00", oculto = true)
            }
        }

        composeRule.onNodeWithText("Renda fixa · R$ 1.200,00").assertDoesNotExist()
        composeRule.onNodeWithContentDescription("Renda fixa · R$ 1.200,00").assertDoesNotExist()
        composeRule.onNodeWithText("Renda fixa · ••••••").assertExists()
        composeRule.onNodeWithContentDescription("Renda fixa · Valor oculto").assertExists()
    }
}
