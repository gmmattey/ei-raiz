import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

abstract final class AppPalette {
  static const Color background = Color(0xFF06070B);
  static const Color backgroundAlt = Color(0xFF0D1018);
  static const Color panel = Color(0xFF121621);
  static const Color panelAlt = Color(0xFF181E2B);
  static const Color panelSoft = Color(0xFF1F2635);
  static const Color border = Color(0x22F8E7D8);
  static const Color textPrimary = Color(0xFFF7F0E8);
  static const Color textMuted = Color(0xFF9CA6BA);
  static const Color brand = Color(0xFFFF6A1F);
  static const Color brandStrong = Color(0xFFFF7F32);
  static const Color brandSoft = Color(0x33FF6A1F);
  static const Color cobalt = Color(0xFF6A86FF);
  static const Color teal = Color(0xFF62D3C7);
  static const Color gold = Color(0xFFF0B74A);
  static const Color green = Color(0xFF4FD38C);
  static const Color red = Color(0xFFFF6C62);
  static const Color shadow = Color(0x6603070D);

  static Color categoryColor(String key) {
    switch (key) {
      case 'acoes':
        return brand;
      case 'fundos':
        return cobalt;
      case 'previdencia':
        return teal;
      default:
        return gold;
    }
  }
}

class AppTheme {
  static ThemeData get themeData {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: const ColorScheme.dark(
        primary: AppPalette.brand,
        secondary: AppPalette.cobalt,
        surface: AppPalette.panel,
        error: AppPalette.red,
      ),
    );

    final textTheme = GoogleFonts.interTextTheme(base.textTheme).apply(
      bodyColor: AppPalette.textPrimary,
      displayColor: AppPalette.textPrimary,
    );

    return base.copyWith(
      scaffoldBackgroundColor: AppPalette.background,
      cardColor: AppPalette.panel,
      splashFactory: InkSparkle.splashFactory,
      textTheme: textTheme,
      dividerColor: AppPalette.border,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppPalette.brand,
          foregroundColor: AppPalette.textPrimary,
          textStyle: GoogleFonts.orbitron(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.4,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppPalette.textPrimary,
          side: const BorderSide(color: AppPalette.border),
          textStyle: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
        ),
      ),
      chipTheme: base.chipTheme.copyWith(
        side: const BorderSide(color: AppPalette.border),
        backgroundColor: AppPalette.panelAlt,
      ),
    );
  }

  static TextStyle hudStyle({
    double size = 16,
    FontWeight weight = FontWeight.w700,
    Color color = AppPalette.textPrimary,
  }) {
    return GoogleFonts.orbitron(
      fontSize: size,
      fontWeight: weight,
      color: color,
      letterSpacing: 0.25,
    );
  }

  static TextStyle tacticalLabel({
    double size = 12,
    FontWeight weight = FontWeight.w700,
    Color color = AppPalette.textMuted,
  }) {
    return GoogleFonts.inter(
      fontSize: size,
      fontWeight: weight,
      color: color,
      letterSpacing: 0.2,
    );
  }

  static TextStyle mono({
    double size = 12,
    FontWeight weight = FontWeight.w500,
    Color color = AppPalette.textMuted,
    double height = 1.35,
  }) {
    return GoogleFonts.firaCode(
      fontSize: size,
      fontWeight: weight,
      color: color,
      height: height,
    );
  }
}
