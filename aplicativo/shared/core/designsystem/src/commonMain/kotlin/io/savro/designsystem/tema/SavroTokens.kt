package io.savro.designsystem.tema

import androidx.compose.material3.ColorScheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.savro.designsystem.recursos.Res
import io.savro.designsystem.recursos.inter_variable
import io.savro.designsystem.recursos.manrope_variable
import org.jetbrains.compose.resources.Font

/** Primitivos literais extraídos das referências visuais; não usar diretamente em componentes. */
internal object SavroPrimitiveColor {
    val Navy950 = Color(0xFF07111F)
    val Navy900 = Color(0xFF0D182A)
    val Navy800 = Color(0xFF13213A)
    val Navy700 = Color(0xFF192A49)
    val Blue500 = Color(0xFF4772F5)
    val Blue600 = Color(0xFF3A5FE0)
    val Blue400 = Color(0xFF5B84FF)
    val Blue700 = Color(0xFF2F55D6)
    val Sky400 = Color(0xFF5FA8FF)
    val Orange400 = Color(0xFFF5A23A)
    val Mint400 = Color(0xFF29D3B2)
    val Yellow400 = Color(0xFFF4C95D)
    val Rose400 = Color(0xFFF06B7A)
    val White = Color(0xFFF7F9FC)
    val Slate300 = Color(0xFFA3AEC3)
    val Slate400 = Color(0xFF7F8AA3)
    val White08 = Color(0x14FFFFFF)
}

internal object SavroPrimitiveSpace {
    val Space4 = 4.dp
    val Space8 = 8.dp
    val Space12 = 12.dp
    val Space16 = 16.dp
    val Space20 = 20.dp
    val Space24 = 24.dp
    val Space32 = 32.dp
    val Space40 = 40.dp
    val Space48 = 48.dp
    val Space56 = 56.dp
    val Space64 = 64.dp
}

/**
 * Métricas exclusivas do donut chart (`charts.html`: raio 54 / stroke 18) — não são espaçamento
 * genérico, por isso ficam fora de [SavroPrimitiveSpace], mas seguem o mesmo princípio de primitivo
 * literal isolado (auditoria #220, item 5).
 */
internal object SavroPrimitiveChart {
    val DonutRadius = 54.dp
    val DonutStroke = 18.dp
}

internal object SavroPrimitiveRadius {
    val Radius8 = 8.dp
    val Radius12 = 12.dp
    val Radius16 = 16.dp
    val Radius20 = 20.dp
}

internal object SavroPrimitiveElevation {
    val Level1 = 1.dp
    val Level3 = 3.dp
}

internal object SavroPrimitiveStroke {
    val Stroke2 = 2.dp
}

@Immutable
data class SavroSpacing(
    val xxs: Dp,
    val xs: Dp,
    val sm: Dp,
    val md: Dp,
    val lg: Dp,
    val xl: Dp,
    val xxl: Dp,
    val xxxl: Dp,
)

internal val DefaultSavroSpacing = SavroSpacing(
    xxs = SavroPrimitiveSpace.Space4,
    xs = SavroPrimitiveSpace.Space8,
    sm = SavroPrimitiveSpace.Space12,
    md = SavroPrimitiveSpace.Space16,
    lg = SavroPrimitiveSpace.Space20,
    xl = SavroPrimitiveSpace.Space24,
    xxl = SavroPrimitiveSpace.Space32,
    xxxl = SavroPrimitiveSpace.Space40,
)

@Immutable
data class SavroOpacity(val subdued: Float, val disabled: Float, val border: Float)

internal val DefaultSavroOpacity = SavroOpacity(subdued = 0.72f, disabled = 0.38f, border = 0.08f)

@Immutable
data class SavroElevations(val card: Dp, val floating: Dp)

internal val DefaultSavroElevations = SavroElevations(
    card = SavroPrimitiveElevation.Level1,
    floating = SavroPrimitiveElevation.Level3,
)

@Immutable
data class SavroComponentMetrics(
    val buttonMinHeight: Dp,
    val buttonLoadingIndicatorSize: Dp,
    val buttonLoadingIndicatorStroke: Dp,
    /** `buttons.html`: btn-icon 48x48 — reaproveita [SavroPrimitiveSpace.Space48], já usado no botão. */
    val iconButtonSize: Dp,
    /** `buttons.html`/`tokens.html`: FAB 56x56. */
    val fabSize: Dp,
    val donutRadius: Dp,
    val donutStrokeWidth: Dp,
    /** Borda de [io.savro.designsystem.componentes.SavroRadioOptionCard] — reaproveita Stroke2. */
    val outlineWidth: Dp,
)

internal val DefaultSavroComponentMetrics = SavroComponentMetrics(
    buttonMinHeight = SavroPrimitiveSpace.Space48,
    buttonLoadingIndicatorSize = SavroPrimitiveSpace.Space20,
    buttonLoadingIndicatorStroke = SavroPrimitiveStroke.Stroke2,
    iconButtonSize = SavroPrimitiveSpace.Space48,
    fabSize = SavroPrimitiveSpace.Space56,
    donutRadius = SavroPrimitiveChart.DonutRadius,
    donutStrokeWidth = SavroPrimitiveChart.DonutStroke,
    outlineWidth = SavroPrimitiveStroke.Stroke2,
)

@Immutable
data class SavroGradients(val primary: Brush, val iconButton: Brush)

internal val DefaultSavroGradients = SavroGradients(
    primary = Brush.linearGradient(
        colors = listOf(SavroPrimitiveColor.Blue400, SavroPrimitiveColor.Blue500, SavroPrimitiveColor.Blue700),
    ),
    // `buttons.html`: btn-icon usa gradient escuro dedicado (#1c3157→#111f38) — reaproveita os
    // primitivos navy já existentes (Navy700/Navy900) em vez de literais hex novos (auditoria #220).
    iconButton = Brush.linearGradient(
        colors = listOf(SavroPrimitiveColor.Navy700, SavroPrimitiveColor.Navy900),
    ),
)

internal val SavroDarkColorScheme: ColorScheme = darkColorScheme(
    primary = SavroPrimitiveColor.Blue600,
    onPrimary = SavroPrimitiveColor.White,
    primaryContainer = SavroPrimitiveColor.Blue700,
    onPrimaryContainer = SavroPrimitiveColor.White,
    secondary = SavroPrimitiveColor.Sky400,
    onSecondary = SavroPrimitiveColor.Navy950,
    secondaryContainer = SavroPrimitiveColor.Navy700,
    onSecondaryContainer = SavroPrimitiveColor.White,
    tertiary = SavroPrimitiveColor.Orange400,
    onTertiary = SavroPrimitiveColor.Navy950,
    error = SavroPrimitiveColor.Rose400,
    onError = SavroPrimitiveColor.Navy950,
    errorContainer = SavroPrimitiveColor.Navy700,
    onErrorContainer = SavroPrimitiveColor.Rose400,
    background = SavroPrimitiveColor.Navy950,
    onBackground = SavroPrimitiveColor.White,
    surface = SavroPrimitiveColor.Navy800,
    onSurface = SavroPrimitiveColor.White,
    surfaceVariant = SavroPrimitiveColor.Navy700,
    onSurfaceVariant = SavroPrimitiveColor.Slate300,
    outline = SavroPrimitiveColor.White08,
    outlineVariant = SavroPrimitiveColor.White08,
)

@Immutable
data class SavroSemanticColors(
    val backgroundSecondary: Color,
    val contentMuted: Color,
    val success: Color,
    val warning: Color,
    val info: Color,
    /** `overlays.html`/tela 05: banner de aviso (`rgba(244,201,93,.1)` — Yellow400 a 10% de opacidade). */
    val warningBackground: Color,
)

internal val DefaultSavroSemanticColors = SavroSemanticColors(
    backgroundSecondary = SavroPrimitiveColor.Navy900,
    contentMuted = SavroPrimitiveColor.Slate400,
    success = SavroPrimitiveColor.Mint400,
    warning = SavroPrimitiveColor.Yellow400,
    info = SavroPrimitiveColor.Sky400,
    warningBackground = SavroPrimitiveColor.Yellow400.copy(alpha = 0.1f),
)

/**
 * As fontes são carregadas por `compose.resources`, cuja API de fonte é @Composable — por isso
 * a tipografia deixou de ser um `val` de nível superior e virou função composable.
 */
@Composable
private fun manropeFamily() = FontFamily(
    Font(Res.font.manrope_variable, FontWeight.Normal),
    Font(Res.font.manrope_variable, FontWeight.SemiBold),
    Font(Res.font.manrope_variable, FontWeight.Bold),
)

@Composable
private fun interFamily() = FontFamily(
    Font(Res.font.inter_variable, FontWeight.Normal),
    Font(Res.font.inter_variable, FontWeight.Medium),
    Font(Res.font.inter_variable, FontWeight.SemiBold),
)

@Composable
internal fun savroTypography(): Typography {
    val manrope = manropeFamily()
    val inter = interFamily()
    return Typography(
        displaySmall = TextStyle(fontFamily = manrope, fontWeight = FontWeight.Bold, fontSize = 32.sp, lineHeight = 40.sp),
        headlineSmall = TextStyle(fontFamily = manrope, fontWeight = FontWeight.SemiBold, fontSize = 24.sp, lineHeight = 32.sp),
        titleLarge = TextStyle(fontFamily = manrope, fontWeight = FontWeight.SemiBold, fontSize = 20.sp, lineHeight = 28.sp),
        titleMedium = TextStyle(fontFamily = manrope, fontWeight = FontWeight.SemiBold, fontSize = 16.sp, lineHeight = 24.sp),
        bodyLarge = TextStyle(fontFamily = inter, fontWeight = FontWeight.Normal, fontSize = 16.sp, lineHeight = 24.sp),
        bodyMedium = TextStyle(fontFamily = inter, fontWeight = FontWeight.Normal, fontSize = 14.sp, lineHeight = 20.sp),
        bodySmall = TextStyle(fontFamily = inter, fontWeight = FontWeight.Normal, fontSize = 12.sp, lineHeight = 16.sp),
        labelLarge = TextStyle(fontFamily = inter, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, lineHeight = 20.sp),
        labelMedium = TextStyle(fontFamily = inter, fontWeight = FontWeight.Medium, fontSize = 12.sp, lineHeight = 16.sp),
    )
}
