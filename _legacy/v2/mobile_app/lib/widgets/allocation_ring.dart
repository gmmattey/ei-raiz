import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../app/app_theme.dart';
import '../core/utils/app_formatters.dart';

class AllocationRingSegment {
  const AllocationRingSegment({
    required this.label,
    required this.weight,
    required this.color,
  });

  final String label;
  final double weight;
  final Color color;
}

class AllocationRing extends StatelessWidget {
  const AllocationRing({
    super.key,
    required this.segments,
    required this.centerLabel,
    required this.centerSupportLabel,
    this.size = 220,
  });

  final List<AllocationRingSegment> segments;
  final String centerLabel;
  final String centerSupportLabel;
  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: <Widget>[
          CustomPaint(
            size: Size.square(size),
            painter: _AllocationRingPainter(segments),
          ),
          Container(
            width: size * 0.56,
            height: size * 0.56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: <Color>[AppPalette.background, AppPalette.panel],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              border: Border.all(color: AppPalette.border),
              boxShadow: const <BoxShadow>[
                BoxShadow(
                  color: AppPalette.shadow,
                  blurRadius: 18,
                  offset: Offset(0, 10),
                ),
              ],
            ),
            padding: const EdgeInsets.all(16),
            child: LayoutBuilder(
              builder: (BuildContext context, BoxConstraints constraints) {
                return Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: <Widget>[
                    Flexible(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          centerSupportLabel,
                          textAlign: TextAlign.center,
                          style: AppTheme.tacticalLabel(
                            size: 11,
                            color: AppPalette.textMuted,
                            weight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Flexible(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          centerLabel,
                          textAlign: TextAlign.center,
                          style: AppTheme.hudStyle(
                            size: 22,
                            color: _ringCenterColor(segments),
                          ),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Color _ringCenterColor(List<AllocationRingSegment> items) {
    if (items.isEmpty) return AppPalette.brand;
    final sorted = <AllocationRingSegment>[...items]
      ..sort((a, b) => b.weight.compareTo(a.weight));
    return sorted.first.color;
  }
}

class _AllocationRingPainter extends CustomPainter {
  _AllocationRingPainter(this.segments);

  final List<AllocationRingSegment> segments;

  @override
  void paint(Canvas canvas, Size size) {
    final strokeWidth = size.width * 0.14;
    final rect = Rect.fromLTWH(
      strokeWidth / 2,
      strokeWidth / 2,
      size.width - strokeWidth,
      size.height - strokeWidth,
    );

    final basePaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round
      ..color = AppPalette.panelSoft;

    canvas.drawArc(rect, 0, math.pi * 2, false, basePaint);

    if (segments.isEmpty) {
      return;
    }

    final totalShare = segments.fold<double>(
      0,
      (double total, AllocationRingSegment segment) =>
          total + clampUnit(segment.weight),
    );
    final effectiveTotal = totalShare <= 0 ? 1 : totalShare;
    const gap = 0.06;
    final availableSweep = math.max(
      0.0,
      (math.pi * 2) - (gap * segments.length),
    );
    var startAngle = -math.pi / 2;

    for (final segment in segments) {
      final sweep = availableSweep * (clampUnit(segment.weight) / effectiveTotal);
      final glowPaint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth + 4
        ..strokeCap = StrokeCap.round
        ..color = segment.color.withValues(alpha: 0.18)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8);
      final paint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round
        ..color = segment.color;

      canvas.drawArc(rect, startAngle, sweep, false, glowPaint);
      canvas.drawArc(rect, startAngle, sweep, false, paint);
      startAngle += sweep + gap;
    }
  }

  @override
  bool shouldRepaint(covariant _AllocationRingPainter oldDelegate) {
    return oldDelegate.segments != segments;
  }
}
