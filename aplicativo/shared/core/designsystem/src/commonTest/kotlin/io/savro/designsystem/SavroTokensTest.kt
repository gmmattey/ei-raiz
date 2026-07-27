package io.savro.designsystem

import androidx.compose.ui.graphics.Color
import io.savro.designsystem.tema.SavroPrimitiveColor
import kotlin.math.pow
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class SavroTokensTest {
    @Test
    fun keepsTheReferenceBackgroundAndPrimaryTokens() {
        assertEquals(Color(0xFF07111F), SavroPrimitiveColor.Navy950)
        assertEquals(Color(0xFF4772F5), SavroPrimitiveColor.Blue500)
    }

    @Test
    fun keepsTheReferenceContentAndMutedTokens() {
        assertEquals(Color(0xFFF7F9FC), SavroPrimitiveColor.White)
        assertEquals(Color(0xFFA3AEC3), SavroPrimitiveColor.Slate300)
    }

    @Test
    fun primaryActionMeetsAaContrastWithPrimaryContent() {
        assertTrue(contrastRatio(SavroPrimitiveColor.White, SavroPrimitiveColor.Blue600) >= 4.5)
    }

    private fun contrastRatio(foreground: Color, background: Color): Double {
        val foregroundLuminance = relativeLuminance(foreground)
        val backgroundLuminance = relativeLuminance(background)
        return (maxOf(foregroundLuminance, backgroundLuminance) + 0.05) /
            (minOf(foregroundLuminance, backgroundLuminance) + 0.05)
    }

    private fun relativeLuminance(color: Color): Double = listOf(color.red, color.green, color.blue)
        .map { channel -> if (channel <= 0.03928f) channel / 12.92 else ((channel + 0.055f) / 1.055f).toDouble().pow(2.4) }
        .zip(listOf(0.2126, 0.7152, 0.0722))
        .sumOf { (channel, coefficient) -> channel * coefficient }
}
