import 'package:flutter/material.dart';

import '../app/app_theme.dart';

enum StatusChipTone { neutral, info, warning, danger, positive }

class StatusChip extends StatelessWidget {
  const StatusChip({
    super.key,
    required this.label,
    this.tone = StatusChipTone.neutral,
  });

  final String label;
  final StatusChipTone tone;

  @override
  Widget build(BuildContext context) {
    final palette = _resolveTone(tone);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: palette.background,
        border: Border.all(color: palette.border),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: AppTheme.tacticalLabel(
          size: 11,
          color: palette.foreground,
          weight: FontWeight.w700,
        ),
      ),
    );
  }

  _ChipPalette _resolveTone(StatusChipTone tone) {
    switch (tone) {
      case StatusChipTone.info:
        return const _ChipPalette(
          foreground: AppPalette.cobalt,
          border: Color(0x406A86FF),
          background: Color(0x186A86FF),
        );
      case StatusChipTone.warning:
        return const _ChipPalette(
          foreground: AppPalette.gold,
          border: Color(0x40F0B74A),
          background: Color(0x18F0B74A),
        );
      case StatusChipTone.danger:
        return const _ChipPalette(
          foreground: AppPalette.red,
          border: Color(0x40FF6C62),
          background: Color(0x18FF6C62),
        );
      case StatusChipTone.positive:
        return const _ChipPalette(
          foreground: AppPalette.green,
          border: Color(0x404FD38C),
          background: Color(0x184FD38C),
        );
      case StatusChipTone.neutral:
        return const _ChipPalette(
          foreground: AppPalette.textMuted,
          border: AppPalette.border,
          background: AppPalette.panelAlt,
        );
    }
  }
}

class _ChipPalette {
  const _ChipPalette({
    required this.foreground,
    required this.border,
    required this.background,
  });

  final Color foreground;
  final Color border;
  final Color background;
}
