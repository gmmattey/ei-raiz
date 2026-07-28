package io.savro.designsystem

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.runComposeUiTest
import androidx.compose.ui.unit.Dp
import io.savro.designsystem.componentes.SavroBottomNavItem
import io.savro.designsystem.componentes.SavroBottomNavScaffold
import io.savro.designsystem.componentes.SavroIcon
import io.savro.designsystem.tema.SavroTheme
import kotlin.test.Test
import kotlin.test.assertTrue

/**
 * Regressão da correção pós-#220/PR #224: `SavroBottomNavigation` sobrepunha conteúdo rolável
 * (overlay manual, workaround do bug do modifier `weight()` neste ambiente). `SavroBottomNavScaffold`
 * resolve isso via `Scaffold` — este teste garante que o `contentPadding` repassado ao conteúdo
 * sempre reserva espaço inferior real (> 0), nunca zero, para que uma regressão futura (ex.:
 * remover o `bottomBar` do `Scaffold`, ou parar de repassar o padding) quebre o build antes de
 * chegar em produção.
 */
class SavroBottomNavScaffoldCommonTest : ComposeUiTestBase() {
    @OptIn(ExperimentalTestApi::class)
    @Test
    fun contentPaddingReservaEspacoInferiorCompativelComABottomNav() = runComposeUiTest {
        var paddingRecebido: PaddingValues? = null

        setContent {
            SavroTheme {
                SavroBottomNavScaffold(
                    items = listOf(
                        SavroBottomNavItem(icon = SavroIcon.Home, label = "Início", selected = true, onClick = {}),
                        SavroBottomNavItem(icon = SavroIcon.Patrimonio, label = "Patrimônio", selected = false, onClick = {}),
                        SavroBottomNavItem(icon = SavroIcon.Ajustes, label = "Ajustes", selected = false, onClick = {}),
                    ),
                ) { contentPadding ->
                    paddingRecebido = contentPadding
                }
            }
        }

        waitForIdle()

        val inferior: Dp = requireNotNull(paddingRecebido) { "conteúdo nunca recebeu contentPadding" }
            .calculateBottomPadding()
        assertTrue(
            inferior.value > 0f,
            "contentPadding inferior deveria refletir a altura real da bottom nav (encontrado: $inferior)",
        )
    }
}
