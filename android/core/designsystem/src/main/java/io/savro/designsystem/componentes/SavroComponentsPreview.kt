package io.savro.designsystem.componentes

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.sp
import io.savro.designsystem.tema.SavroTheme
import io.savro.designsystem.tema.SavroThemeTokens

@Preview
@Composable
private fun ButtonVariantsPreview() = SavroPreview {
    Column(verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm)) {
        SavroButton(label = "Padrão", onClick = {}, loadingStateDescription = "", modifier = Modifier.fillMaxWidth())
        SavroButton(label = "Desabilitado", onClick = {}, enabled = false, loadingStateDescription = "", modifier = Modifier.fillMaxWidth())
        SavroButton(label = "Carregando", onClick = {}, loading = true, loadingStateDescription = "Carregando", modifier = Modifier.fillMaxWidth())
        SavroButton(label = "Erro", onClick = {}, loadingStateDescription = "", style = SavroButtonStyle.Destructive, modifier = Modifier.fillMaxWidth())
    }
}

@Preview(fontScale = 1.3f)
@Composable
private fun AccessibleTextPreview() = SavroPreview {
    SavroTextField(
        value = "",
        onValueChange = {},
        label = "Rótulo ampliado",
        supportingText = "Texto de suporte escalável",
        modifier = Modifier.fillMaxWidth(),
    )
}

@Preview
@Composable
private fun StateVariantsPreview() = SavroPreview {
    Column(verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm)) {
        SavroState.entries.forEach { state ->
            SavroStatePanel(state = state, title = state.name, message = "Prévia técnica do estado")
        }
    }
}

@Composable
private fun SavroPreview(content: @Composable () -> Unit) {
    SavroTheme {
        SavroSurface {
            Column(modifier = Modifier.padding(SavroThemeTokens.spacing.md), content = { content() })
        }
    }
}
