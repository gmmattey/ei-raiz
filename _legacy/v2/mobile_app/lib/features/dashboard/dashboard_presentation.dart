import 'package:flutter/material.dart';

import '../../app/app_theme.dart';
import '../../widgets/status_chip.dart';

Color categoryAccent(String key) => AppPalette.categoryColor(key);

IconData categoryIcon(String key) {
  switch (key) {
    case 'acoes':
      return Icons.show_chart_rounded;
    case 'fundos':
      return Icons.account_balance_wallet_rounded;
    case 'previdencia':
      return Icons.verified_user_rounded;
    default:
      return Icons.hub_rounded;
  }
}

String categoryLabel(String key) {
  switch (key) {
    case 'acoes':
      return 'Acoes';
    case 'fundos':
      return 'Fundos';
    case 'previdencia':
      return 'Previdencia';
    default:
      return 'Carteira';
  }
}

StatusChipTone toneForText(String value) {
  final normalized = value.toLowerCase();
  if (normalized.contains('crit') || normalized.contains('erro')) {
    return StatusChipTone.danger;
  }
  if (normalized.contains('aten') ||
      normalized.contains('media') ||
      normalized.contains('revis') ||
      normalized.contains('curta') ||
      normalized.contains('reduz')) {
    return StatusChipTone.warning;
  }
  if (normalized.contains('+') ||
      normalized.contains('forte') ||
      normalized.contains('saud') ||
      normalized.contains('oportunidade') ||
      normalized.contains('elite')) {
    return StatusChipTone.positive;
  }
  if (normalized.contains('segur') ||
      normalized.contains('control') ||
      normalized.contains('ok') ||
      normalized.contains('manter')) {
    return StatusChipTone.info;
  }
  return StatusChipTone.neutral;
}
