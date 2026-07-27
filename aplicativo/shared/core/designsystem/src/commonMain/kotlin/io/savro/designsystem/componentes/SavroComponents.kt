package io.savro.designsystem.componentes

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.input.VisualTransformation
import io.savro.designsystem.tema.SavroThemeTokens

enum class SavroButtonStyle { Primary, Secondary, Destructive }
enum class SavroCardTone { Standard, Error, Offline, Hidden }
enum class SavroTextStyle { Display, Headline, Title, Body, BodySmall, Label }

/**
 * Texto do design system. Existe para que `:shared:app` nunca precise importar Material 3
 * diretamente — a fronteira exigida pela ADR-002.
 */
@Composable
fun SavroText(
    text: String,
    modifier: Modifier = Modifier,
    style: SavroTextStyle = SavroTextStyle.Body,
) {
    val textStyle = when (style) {
        SavroTextStyle.Display -> MaterialTheme.typography.displaySmall
        SavroTextStyle.Headline -> MaterialTheme.typography.headlineSmall
        SavroTextStyle.Title -> MaterialTheme.typography.titleMedium
        SavroTextStyle.Body -> MaterialTheme.typography.bodyMedium
        SavroTextStyle.BodySmall -> MaterialTheme.typography.bodySmall
        SavroTextStyle.Label -> MaterialTheme.typography.labelMedium
    }
    Text(text = text, modifier = modifier, style = textStyle)
}

@Composable
fun SavroSurface(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    Surface(
        modifier = modifier,
        color = MaterialTheme.colorScheme.background,
        contentColor = MaterialTheme.colorScheme.onBackground,
        content = content,
    )
}

@Composable
fun SavroCard(
    modifier: Modifier = Modifier,
    contentPadding: PaddingValues = PaddingValues(SavroThemeTokens.spacing.md),
    tone: SavroCardTone = SavroCardTone.Standard,
    content: @Composable ColumnScope.() -> Unit,
) {
    val containerColor = when (tone) {
        SavroCardTone.Standard -> MaterialTheme.colorScheme.surface
        SavroCardTone.Error -> MaterialTheme.colorScheme.errorContainer
        SavroCardTone.Offline -> MaterialTheme.colorScheme.secondaryContainer
        SavroCardTone.Hidden -> MaterialTheme.colorScheme.surfaceVariant
    }
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = containerColor),
        elevation = CardDefaults.cardElevation(defaultElevation = SavroThemeTokens.elevations.card),
        shape = MaterialTheme.shapes.medium,
    ) {
        Column(modifier = Modifier.padding(contentPadding), content = content)
    }
}

@Composable
fun SavroButton(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    loading: Boolean = false,
    loadingStateDescription: String,
    style: SavroButtonStyle = SavroButtonStyle.Primary,
) {
    val effectiveEnabled = enabled && !loading
    val colors = when (style) {
        SavroButtonStyle.Primary -> ButtonDefaults.buttonColors()
        SavroButtonStyle.Secondary -> ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.secondaryContainer,
            contentColor = MaterialTheme.colorScheme.onSecondaryContainer,
        )
        SavroButtonStyle.Destructive -> ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.error,
            contentColor = MaterialTheme.colorScheme.onError,
        )
    }
    val loadingColor = when (style) {
        SavroButtonStyle.Primary -> MaterialTheme.colorScheme.onPrimary
        SavroButtonStyle.Secondary -> MaterialTheme.colorScheme.onSecondaryContainer
        SavroButtonStyle.Destructive -> MaterialTheme.colorScheme.onError
    }

    Button(
        onClick = onClick,
        modifier = modifier
            .heightIn(min = SavroThemeTokens.components.buttonMinHeight)
            .semantics { if (loading) stateDescription = loadingStateDescription },
        enabled = effectiveEnabled,
        colors = colors,
        shape = MaterialTheme.shapes.small,
    ) {
        if (loading) {
            CircularProgressIndicator(
                modifier = Modifier.size(SavroThemeTokens.components.buttonLoadingIndicatorSize),
                color = loadingColor,
                strokeWidth = SavroThemeTokens.components.buttonLoadingIndicatorStroke,
            )
        } else {
            Text(text = label, style = MaterialTheme.typography.labelLarge)
        }
    }
}

@Composable
fun SavroTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    supportingText: String? = null,
    isError: Boolean = false,
    enabled: Boolean = true,
    visualTransformation: VisualTransformation = VisualTransformation.None,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier,
        enabled = enabled,
        isError = isError,
        label = { Text(text = label, style = MaterialTheme.typography.labelMedium) },
        placeholder = placeholder?.let { { Text(text = it, style = MaterialTheme.typography.bodyMedium) } },
        supportingText = supportingText?.let { { Text(text = it, style = MaterialTheme.typography.bodySmall) } },
        visualTransformation = visualTransformation,
        shape = MaterialTheme.shapes.small,
    )
}

@Composable
fun SavroFilterChip(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        modifier = modifier,
        enabled = enabled,
        label = { Text(text = label, style = MaterialTheme.typography.labelMedium) },
    )
}

@Composable
fun SavroDivider(modifier: Modifier = Modifier) {
    HorizontalDivider(modifier = modifier, color = MaterialTheme.colorScheme.outlineVariant)
}

enum class SavroState { Loading, Empty, Error, Offline, Hidden }

@Composable
fun SavroPrivacyMask(
    isVisible: Boolean,
    hiddenContentDescription: String,
    modifier: Modifier = Modifier,
    content: @Composable (Modifier) -> Unit,
) {
    if (isVisible) {
        content(modifier)
    } else {
        Surface(
            modifier = modifier,
            color = MaterialTheme.colorScheme.surfaceVariant,
            contentColor = MaterialTheme.colorScheme.onSurfaceVariant,
        ) {
            Text(text = hiddenContentDescription, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
fun SavroStatePanel(
    state: SavroState,
    title: String,
    message: String,
    modifier: Modifier = Modifier,
    action: (@Composable () -> Unit)? = null,
) {
    val tone = when (state) {
        SavroState.Error -> SavroCardTone.Error
        SavroState.Offline -> SavroCardTone.Offline
        SavroState.Hidden -> SavroCardTone.Hidden
        SavroState.Loading, SavroState.Empty -> SavroCardTone.Standard
    }
    SavroCard(modifier = modifier.fillMaxWidth(), tone = tone) {
        Column(
            horizontalAlignment = Alignment.Start,
            verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(SavroThemeTokens.spacing.sm),
        ) {
            if (state == SavroState.Loading) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            }
            Text(text = title, style = MaterialTheme.typography.titleMedium)
            Text(text = message, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            action?.invoke()
        }
    }
}
