package io.savro.app

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import io.savro.app.recursos.Res
import io.savro.app.recursos.evidence_button_destructive
import io.savro.app.recursos.evidence_button_disabled
import io.savro.app.recursos.evidence_button_loading
import io.savro.app.recursos.evidence_button_normal
import io.savro.app.recursos.evidence_card_body
import io.savro.app.recursos.evidence_card_title
import io.savro.app.recursos.evidence_chip_selected
import io.savro.app.recursos.evidence_chip_unselected
import io.savro.app.recursos.evidence_field_error_label
import io.savro.app.recursos.evidence_field_error_support
import io.savro.app.recursos.evidence_field_label
import io.savro.app.recursos.evidence_hidden_description
import io.savro.app.recursos.evidence_loading
import io.savro.app.recursos.evidence_sensitive_value
import io.savro.app.recursos.evidence_state_empty
import io.savro.app.recursos.evidence_state_error
import io.savro.app.recursos.evidence_state_loading
import io.savro.app.recursos.evidence_state_message
import io.savro.app.recursos.evidence_state_offline
import io.savro.app.recursos.evidence_value
import io.savro.app.recursos.savro_bootstrap
import io.savro.designsystem.componentes.SavroButton
import io.savro.designsystem.componentes.SavroButtonStyle
import io.savro.designsystem.componentes.SavroCard
import io.savro.designsystem.componentes.SavroFilterChip
import io.savro.designsystem.componentes.SavroPrivacyMask
import io.savro.designsystem.componentes.SavroState
import io.savro.designsystem.componentes.SavroStatePanel
import io.savro.designsystem.componentes.SavroSurface
import io.savro.designsystem.componentes.SavroText
import io.savro.designsystem.componentes.SavroTextField
import io.savro.designsystem.componentes.SavroTextStyle
import io.savro.designsystem.tema.SavroTheme
import io.savro.designsystem.tema.SavroThemeTokens
import org.jetbrains.compose.resources.stringResource

/** Raiz compartilhada consumida pelo host Android (Activity) e pelo host iOS (UIViewController). */
@Composable
fun SavroApp() {
    SavroTheme {
        SavroBootstrap()
    }
}

@Composable
private fun SavroBootstrap() {
    SavroSurface {
        Column(
            modifier = Modifier
                .verticalScroll(rememberScrollState())
                .statusBarsPadding()
                .padding(SavroThemeTokens.spacing.md),
            verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.md),
        ) {
            SavroText(stringResource(Res.string.savro_bootstrap), style = SavroTextStyle.Headline)
            SavroCard(modifier = Modifier.fillMaxWidth()) {
                SavroText(stringResource(Res.string.evidence_card_title), style = SavroTextStyle.Title)
                SavroText(stringResource(Res.string.evidence_card_body))
            }
            SavroButton(stringResource(Res.string.evidence_button_normal), {}, loadingStateDescription = stringResource(Res.string.evidence_loading), modifier = Modifier.fillMaxWidth())
            SavroButton(stringResource(Res.string.evidence_button_disabled), {}, enabled = false, loadingStateDescription = stringResource(Res.string.evidence_loading), modifier = Modifier.fillMaxWidth())
            SavroButton(stringResource(Res.string.evidence_button_loading), {}, loading = true, loadingStateDescription = stringResource(Res.string.evidence_loading), modifier = Modifier.fillMaxWidth())
            SavroButton(stringResource(Res.string.evidence_button_destructive), {}, loadingStateDescription = stringResource(Res.string.evidence_loading), style = SavroButtonStyle.Destructive, modifier = Modifier.fillMaxWidth())
            SavroTextField(value = stringResource(Res.string.evidence_value), onValueChange = {}, label = stringResource(Res.string.evidence_field_label), modifier = Modifier.fillMaxWidth())
            SavroTextField(value = stringResource(Res.string.evidence_value), onValueChange = {}, label = stringResource(Res.string.evidence_field_error_label), supportingText = stringResource(Res.string.evidence_field_error_support), isError = true, modifier = Modifier.fillMaxWidth())
            SavroFilterChip(stringResource(Res.string.evidence_chip_selected), selected = true, onClick = {})
            SavroFilterChip(stringResource(Res.string.evidence_chip_unselected), selected = false, onClick = {})
            SavroStatePanel(SavroState.Loading, stringResource(Res.string.evidence_state_loading), stringResource(Res.string.evidence_state_message))
            SavroStatePanel(SavroState.Empty, stringResource(Res.string.evidence_state_empty), stringResource(Res.string.evidence_state_message))
            SavroStatePanel(SavroState.Error, stringResource(Res.string.evidence_state_error), stringResource(Res.string.evidence_state_message))
            SavroStatePanel(SavroState.Offline, stringResource(Res.string.evidence_state_offline), stringResource(Res.string.evidence_state_message))
            SavroPrivacyMask(isVisible = false, hiddenContentDescription = stringResource(Res.string.evidence_hidden_description), modifier = Modifier.fillMaxWidth()) { contentModifier ->
                SavroText(stringResource(Res.string.evidence_sensitive_value), modifier = contentModifier)
            }
        }
    }
}
