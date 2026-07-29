package io.savro.designsystem

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.runComposeUiTest
import io.savro.designsystem.componentes.SavroPrivacyMask
import io.savro.designsystem.tema.SavroTheme
import kotlin.test.Test

/**
 * Componente canônico único de ocultação de valores (issue #230 — substitui as três
 * implementações locais que existiam em `HomeScreens.kt`/`DetalheScreens.kt` e o wrapper genérico
 * anterior, sem consumidor em produção). Roda nos dois source sets de teste (`androidUnitTest` via
 * Robolectric neste ambiente e `iosTest` via XCTest em host macOS) a partir de uma única
 * implementação em `commonTest`.
 */
class SavroPrivacyMaskCommonTest : ComposeUiTestBase() {
    @OptIn(ExperimentalTestApi::class)
    @Test
    fun oculto_naoExpoeOValorRealNoTextoNemNaSemantica() = runComposeUiTest {
        setContent {
            SavroTheme {
                SavroPrivacyMask(rotulo = "Patrimônio líquido", valorFormatado = "R$ 9.999,99", oculto = true)
            }
        }

        onNodeWithText("R$ 9.999,99").assertDoesNotExist()
        onNodeWithContentDescription("Patrimônio líquido: R$ 9.999,99").assertDoesNotExist()
        onNodeWithText("••••••").assertExists()
        onNodeWithContentDescription("Valor oculto").assertExists()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun visivel_exibeOValorRealEADescricaoAcessivelCorreta() = runComposeUiTest {
        setContent {
            SavroTheme {
                SavroPrivacyMask(rotulo = "Patrimônio líquido", valorFormatado = "R$ 9.999,99", oculto = false)
            }
        }

        onNodeWithText("R$ 9.999,99").assertExists()
        onNodeWithContentDescription("Patrimônio líquido: R$ 9.999,99").assertExists()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun destaque_naoAlteraOComportamentoDeOcultacao() = runComposeUiTest {
        setContent {
            SavroTheme {
                SavroPrivacyMask(rotulo = "Patrimônio líquido", valorFormatado = "R$ 9.999,99", oculto = true, destaque = true)
            }
        }

        onNodeWithText("R$ 9.999,99").assertDoesNotExist()
        onNodeWithText("••••••").assertExists()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun recomposicao_alternandoVisivelOcultoVisivel_nuncaVazaValorRealNoEstadoOculto() = runComposeUiTest {
        var oculto by mutableStateOf(true)
        setContent {
            SavroTheme {
                SavroPrivacyMask(rotulo = "Patrimônio líquido", valorFormatado = "R$ 9.999,99", oculto = oculto)
            }
        }

        onNodeWithText("R$ 9.999,99").assertDoesNotExist()

        oculto = false
        waitForIdle()
        onNodeWithText("R$ 9.999,99").assertExists()

        oculto = true
        waitForIdle()
        onNodeWithText("R$ 9.999,99").assertDoesNotExist()
        onNodeWithText("••••••").assertExists()
    }
}
