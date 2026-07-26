package io.savro.designsystem.tema

import androidx.compose.material3.ColorScheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.savro.designsystem.R

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
    val Space64 = 64.dp
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
data class SavroGradients(val primary: Brush)

internal val DefaultSavroGradients = SavroGradients(
    primary = Brush.linearGradient(
        colors = listOf(SavroPrimitiveColor.Blue400, SavroPrimitiveColor.Blue500, SavroPrimitiveColor.Blue700),
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
)

internal val DefaultSavroSemanticColors = SavroSemanticColors(
    backgroundSecondary = SavroPrimitiveColor.Navy900,
    contentMuted = SavroPrimitiveColor.Slate400,
    success = SavroPrimitiveColor.Mint400,
    warning = SavroPrimitiveColor.Yellow400,
    info = SavroPrimitiveColor.Sky400,
)

private val Manrope = FontFamily(
    Font(R.font.manrope_variable, FontWeight.Normal),
    Font(R.font.manrope_variable, FontWeight.SemiBold),
    Font(R.font.manrope_variable, FontWeight.Bold),
)
private val Inter = FontFamily(
    Font(R.font.inter_variable, FontWeight.Normal),
    Font(R.font.inter_variable, FontWeight.Medium),
    Font(R.font.inter_variable, FontWeight.SemiBold),
)

internal val SavroTypography = Typography(
    displaySmall = TextStyle(fontFamily = Manrope, fontWeight = FontWeight.Bold, fontSize = 32.sp, lineHeight = 40.sp),
    headlineSmall = TextStyle(fontFamily = Manrope, fontWeight = FontWeight.SemiBold, fontSize = 24.sp, lineHeight = 32.sp),
    titleLarge = TextStyle(fontFamily = Manrope, fontWeight = FontWeight.SemiBold, fontSize = 20.sp, lineHeight = 28.sp),
    titleMedium = TextStyle(fontFamily = Manrope, fontWeight = FontWeight.SemiBold, fontSize = 16.sp, lineHeight = 24.sp),
    bodyLarge = TextStyle(fontFamily = Inter, fontWeight = FontWeight.Normal, fontSize = 16.sp, lineHeight = 24.sp),
    bodyMedium = TextStyle(fontFamily = Inter, fontWeight = FontWeight.Normal, fontSize = 14.sp, lineHeight = 20.sp),
    bodySmall = TextStyle(fontFamily = Inter, fontWeight = FontWeight.Normal, fontSize = 12.sp, lineHeight = 16.sp),
    labelLarge = TextStyle(fontFamily = Inter, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, lineHeight = 20.sp),
    labelMedium = TextStyle(fontFamily = Inter, fontWeight = FontWeight.Medium, fontSize = 12.sp, lineHeight = 16.sp),
)
