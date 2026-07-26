package io.savro.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.Text
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.foundation.verticalScroll
import io.savro.designsystem.componentes.SavroButton
import io.savro.designsystem.componentes.SavroButtonStyle
import io.savro.designsystem.componentes.SavroCard
import io.savro.designsystem.componentes.SavroFilterChip
import io.savro.designsystem.componentes.SavroPrivacyMask
import io.savro.designsystem.componentes.SavroState
import io.savro.designsystem.componentes.SavroStatePanel
import io.savro.designsystem.componentes.SavroSurface
import io.savro.designsystem.componentes.SavroTextField
import io.savro.designsystem.tema.SavroTheme
import io.savro.designsystem.tema.SavroThemeTokens

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SavroTheme {
                SavroBootstrap()
            }
        }
    }
}

@Composable
private fun SavroBootstrap() {
    SavroSurface {
        Column(
            modifier = androidx.compose.ui.Modifier
                .verticalScroll(rememberScrollState())
                .statusBarsPadding()
                .padding(SavroThemeTokens.spacing.md),
            verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.md),
        ) {
            Text(text = stringResource(R.string.savro_bootstrap), style = androidx.compose.material3.MaterialTheme.typography.headlineSmall)
            SavroCard(modifier = androidx.compose.ui.Modifier.fillMaxWidth()) {
                Text(text = stringResource(R.string.evidence_card_title), style = androidx.compose.material3.MaterialTheme.typography.titleMedium)
                Text(text = stringResource(R.string.evidence_card_body), style = androidx.compose.material3.MaterialTheme.typography.bodyMedium)
            }
            SavroButton(stringResource(R.string.evidence_button_normal), {}, loadingStateDescription = stringResource(R.string.evidence_loading), modifier = androidx.compose.ui.Modifier.fillMaxWidth())
            SavroButton(stringResource(R.string.evidence_button_disabled), {}, enabled = false, loadingStateDescription = stringResource(R.string.evidence_loading), modifier = androidx.compose.ui.Modifier.fillMaxWidth())
            SavroButton(stringResource(R.string.evidence_button_loading), {}, loading = true, loadingStateDescription = stringResource(R.string.evidence_loading), modifier = androidx.compose.ui.Modifier.fillMaxWidth())
            SavroButton(stringResource(R.string.evidence_button_destructive), {}, loadingStateDescription = stringResource(R.string.evidence_loading), style = SavroButtonStyle.Destructive, modifier = androidx.compose.ui.Modifier.fillMaxWidth())
            SavroTextField(value = stringResource(R.string.evidence_value), onValueChange = {}, label = stringResource(R.string.evidence_field_label), modifier = androidx.compose.ui.Modifier.fillMaxWidth())
            SavroTextField(value = stringResource(R.string.evidence_value), onValueChange = {}, label = stringResource(R.string.evidence_field_error_label), supportingText = stringResource(R.string.evidence_field_error_support), isError = true, modifier = androidx.compose.ui.Modifier.fillMaxWidth())
            SavroFilterChip(stringResource(R.string.evidence_chip_selected), selected = true, onClick = {})
            SavroFilterChip(stringResource(R.string.evidence_chip_unselected), selected = false, onClick = {})
            SavroStatePanel(SavroState.Loading, stringResource(R.string.evidence_state_loading), stringResource(R.string.evidence_state_message))
            SavroStatePanel(SavroState.Empty, stringResource(R.string.evidence_state_empty), stringResource(R.string.evidence_state_message))
            SavroStatePanel(SavroState.Error, stringResource(R.string.evidence_state_error), stringResource(R.string.evidence_state_message))
            SavroStatePanel(SavroState.Offline, stringResource(R.string.evidence_state_offline), stringResource(R.string.evidence_state_message))
            SavroPrivacyMask(isVisible = false, hiddenContentDescription = stringResource(R.string.evidence_hidden_description), modifier = androidx.compose.ui.Modifier.fillMaxWidth()) { contentModifier ->
                Text(text = stringResource(R.string.evidence_sensitive_value), modifier = contentModifier)
            }
        }
    }
}

@Preview
@Composable
private fun SavroBootstrapPreview() {
    SavroTheme {
        SavroBootstrap()
    }
}
