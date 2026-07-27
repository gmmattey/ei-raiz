package io.savro.designsystem.tema

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes

private val SavroShapes = Shapes(
    extraSmall = RoundedCornerShape(SavroPrimitiveRadius.Radius8),
    small = RoundedCornerShape(SavroPrimitiveRadius.Radius12),
    medium = RoundedCornerShape(SavroPrimitiveRadius.Radius16),
    large = RoundedCornerShape(SavroPrimitiveRadius.Radius20),
)

private val LocalSavroSpacing = staticCompositionLocalOf { DefaultSavroSpacing }
private val LocalSavroOpacity = staticCompositionLocalOf { DefaultSavroOpacity }
private val LocalSavroElevations = staticCompositionLocalOf { DefaultSavroElevations }
private val LocalSavroGradients = staticCompositionLocalOf { DefaultSavroGradients }
private val LocalSavroSemanticColors = staticCompositionLocalOf { DefaultSavroSemanticColors }
private val LocalSavroComponentMetrics = staticCompositionLocalOf { DefaultSavroComponentMetrics }

@Composable
fun SavroTheme(content: @Composable () -> Unit) {
    CompositionLocalProvider(
        LocalSavroSpacing provides DefaultSavroSpacing,
        LocalSavroOpacity provides DefaultSavroOpacity,
        LocalSavroElevations provides DefaultSavroElevations,
        LocalSavroGradients provides DefaultSavroGradients,
        LocalSavroSemanticColors provides DefaultSavroSemanticColors,
        LocalSavroComponentMetrics provides DefaultSavroComponentMetrics,
    ) {
        MaterialTheme(
            colorScheme = SavroDarkColorScheme,
            typography = savroTypography(),
            shapes = SavroShapes,
            content = content,
        )
    }
}

object SavroThemeTokens {
    val spacing: SavroSpacing
        @Composable @ReadOnlyComposable get() = LocalSavroSpacing.current
    val opacity: SavroOpacity
        @Composable @ReadOnlyComposable get() = LocalSavroOpacity.current
    val elevations: SavroElevations
        @Composable @ReadOnlyComposable get() = LocalSavroElevations.current
    val gradients: SavroGradients
        @Composable @ReadOnlyComposable get() = LocalSavroGradients.current
    val colors: SavroSemanticColors
        @Composable @ReadOnlyComposable get() = LocalSavroSemanticColors.current
    val components: SavroComponentMetrics
        @Composable @ReadOnlyComposable get() = LocalSavroComponentMetrics.current
}
