package io.savro.designsystem

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.runComposeUiTest
import io.savro.designsystem.componentes.SavroPrivacyText
import io.savro.designsystem.tema.SavroTheme
import kotlin.test.Test

/**
 * Variante de linha única/texto composto (issue #230) — usada onde o layout não é uma linha
 * rótulo/valor de duas colunas (ex.: cartão de item da lista de patrimônio,
 * `PatrimonioScreens.kt::ItemPatrimonialCard`).
 */
class SavroPrivacyTextCommonTest : ComposeUiTestBase() {
    @OptIn(ExperimentalTestApi::class)
    @Test
    fun oculto_naoExpoeOValorRealNoTextoNemNaSemantica() = runComposeUiTest {
        setContent {
            SavroTheme {
                SavroPrivacyText(prefixo = "Renda fixa", valorFormatado = "R$ 1.200,00", oculto = true)
            }
        }

        onNodeWithText("Renda fixa · R$ 1.200,00").assertDoesNotExist()
        onNodeWithContentDescription("Renda fixa · R$ 1.200,00").assertDoesNotExist()
        onNodeWithText("Renda fixa · ••••••").assertExists()
        onNodeWithContentDescription("Renda fixa · Valor oculto").assertExists()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun visivel_exibeOValorRealEADescricaoAcessivelCorreta() = runComposeUiTest {
        setContent {
            SavroTheme {
                SavroPrivacyText(prefixo = "Renda fixa", valorFormatado = "R$ 1.200,00", oculto = false)
            }
        }

        onNodeWithText("Renda fixa · R$ 1.200,00").assertExists()
        onNodeWithContentDescription("Renda fixa · R$ 1.200,00").assertExists()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun recomposicao_alternandoVisivelOcultoVisivel_nuncaVazaValorRealNoEstadoOculto() = runComposeUiTest {
        var oculto by mutableStateOf(true)
        setContent {
            SavroTheme {
                SavroPrivacyText(prefixo = "Renda fixa", valorFormatado = "R$ 1.200,00", oculto = oculto)
            }
        }

        onNodeWithText("Renda fixa · R$ 1.200,00").assertDoesNotExist()

        oculto = false
        waitForIdle()
        onNodeWithText("Renda fixa · R$ 1.200,00").assertExists()

        oculto = true
        waitForIdle()
        onNodeWithText("Renda fixa · R$ 1.200,00").assertDoesNotExist()
        onNodeWithText("Renda fixa · ••••••").assertExists()
    }
}
