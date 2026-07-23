import 'package:flutter/material.dart';

import '../app/app_theme.dart';

class TacticalCard extends StatelessWidget {
  const TacticalCard({
    super.key,
    required this.title,
    required this.child,
    this.subtitle,
    this.trailing,
    this.accent = AppPalette.brand,
  });

  final String title;
  final String? subtitle;
  final Widget child;
  final Widget? trailing;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppPalette.border),
        gradient: LinearGradient(
          colors: <Color>[
            accent.withValues(alpha: 0.12),
            AppPalette.panel,
            AppPalette.backgroundAlt,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: const <BoxShadow>[
          BoxShadow(
            color: AppPalette.shadow,
            blurRadius: 24,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(title, style: AppTheme.hudStyle(size: 16)),
                    if (subtitle != null &&
                        subtitle!.trim().isNotEmpty) ...<Widget>[
                      const SizedBox(height: 6),
                      Text(
                        subtitle!,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppPalette.textMuted,
                          height: 1.35,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              trailing ?? const SizedBox.shrink(),
            ],
          ),
          const SizedBox(height: 18),
          child,
        ],
      ),
    );
  }
}
