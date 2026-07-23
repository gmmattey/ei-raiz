import 'package:flutter/material.dart';

Color colorFromHex(String value, {Color fallback = const Color(0xFF68D8FF)}) {
  final normalized = value.replaceAll('#', '').trim();
  if (normalized.length != 6 && normalized.length != 8) {
    return fallback;
  }

  final buffer = StringBuffer();
  if (normalized.length == 6) {
    buffer.write('ff');
  }
  buffer.write(normalized);

  final parsed = int.tryParse(buffer.toString(), radix: 16);
  return parsed == null ? fallback : Color(parsed);
}

double clampUnit(double value) => value.clamp(0.0, 1.0);

String formatUpdatedAt(DateTime? value) {
  if (value == null) return 'Sem sincronizacao';
  final local = value.toLocal();
  final hour = local.hour.toString().padLeft(2, '0');
  final minute = local.minute.toString().padLeft(2, '0');
  final day = local.day.toString().padLeft(2, '0');
  final month = local.month.toString().padLeft(2, '0');
  return '$day/$month $hour:$minute';
}

String formatPercentValue(
  double value, {
  bool signed = true,
  int fractionDigits = 1,
}) {
  final normalized = (value * 100).toStringAsFixed(fractionDigits)
      .replaceAll('.', ',');
  if (!signed) return '$normalized%';
  if (value > 0) return '+$normalized%';
  if (value < 0) return '$normalized%';
  return '0,0%';
}

String formatRatioLabel(double value, {int max = 100}) {
  final safeValue = value.round().clamp(0, max);
  return '$safeValue/$max';
}

String compactText(String value, {String fallback = 'Sem leitura'}) {
  final trimmed = value.trim();
  return trimmed.isEmpty ? fallback : trimmed;
}
