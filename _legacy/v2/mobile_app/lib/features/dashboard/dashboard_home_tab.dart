import 'package:flutter/material.dart';

import '../../app/app_theme.dart';
import '../../core/utils/app_formatters.dart';
import '../../models/dashboard_payload.dart';
import '../../widgets/allocation_ring.dart';
import '../../widgets/status_chip.dart';
import '../../widgets/tactical_card.dart';
import 'dashboard_presentation.dart';

class DashboardHomeTab extends StatelessWidget {
  const DashboardHomeTab({
    super.key,
    required this.payload,
    required this.onRefresh,
    required this.onOpenCategory,
    required this.onOpenPortfolio,
    required this.onOpenRadar,
  });

  final DashboardPayload payload;
  final Future<void> Function() onRefresh;
  final void Function(String categoryKey) onOpenCategory;
  final VoidCallback onOpenPortfolio;
  final VoidCallback onOpenRadar;

  @override
  Widget build(BuildContext context) {
    final categories = payload.categorySnapshots.where((CategorySnapshot item) {
      return item.shareRaw > 0;
    }).toList();

    return RefreshIndicator(
      onRefresh: onRefresh,
      color: AppPalette.brand,
      backgroundColor: AppPalette.panel,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
        children: <Widget>[
          _HeroPanel(payload: payload, categories: categories),
          const SizedBox(height: 16),
          Text('Categorias', style: AppTheme.hudStyle(size: 14)),
          const SizedBox(height: 12),
          Row(
            children: categories
                .map(
                  (CategorySnapshot snapshot) => Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(right: 10),
                      child: _CategoryActionCard(
                        snapshot: snapshot,
                        onTap: () => onOpenCategory(snapshot.key),
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 12),
          _WideShortcutCard(
            title: 'Radar IA',
            subtitle: payload.actionPlan.actionLabel.isEmpty
                ? 'Central inteligente da carteira.'
                : payload.actionPlan.actionLabel,
            caption: payload.actionPlan.justification.isEmpty
                ? compactText(payload.generalAdvice)
                : payload.actionPlan.justification,
            icon: Icons.auto_awesome_rounded,
            accent: AppPalette.brand,
            onTap: onOpenRadar,
          ),
          const SizedBox(height: 16),
          TacticalCard(
            title: 'Portfolio scan',
            subtitle: 'Leitura curta da rodada atual.',
            accent: AppPalette.cobalt,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: _scanLines()
                  .map(
                    (String line) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Text(
                        '> $line',
                        style: AppTheme.mono(
                          size: 12,
                          color: AppPalette.textPrimary,
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: 14),
          TacticalCard(
            title: 'Diretriz tatico_ia',
            subtitle: payload.portfolioDecision.status.isEmpty
                ? 'Sem alerta prioritario.'
                : payload.portfolioDecision.status,
            accent: AppPalette.gold,
            trailing: StatusChip(
              label: payload.actionPlan.priority.isEmpty
                  ? 'Em observacao'
                  : payload.actionPlan.priority,
              tone: toneForText(payload.actionPlan.priority),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  payload.actionPlan.actionLabel.isEmpty
                      ? compactText(payload.messaging.primaryRecommendation.title)
                      : payload.actionPlan.actionLabel,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppPalette.textPrimary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  payload.actionPlan.justification.isEmpty
                      ? compactText(payload.messaging.primaryRecommendation.reason)
                      : payload.actionPlan.justification,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppPalette.textPrimary,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  children: <Widget>[
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: () => onOpenCategory(
                          payload.portfolioDecision.categoryKey.isEmpty
                              ? categories.first.key
                              : payload.portfolioDecision.categoryKey,
                        ),
                        icon: const Icon(Icons.north_east_rounded),
                        label: const Text('Abrir foco'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: onOpenPortfolio,
                        icon: const Icon(Icons.account_balance_wallet_rounded),
                        label: const Text('Ver carteira'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<String> _scanLines() {
    final insights = <String>[];

    if (payload.mobileHome.insights.isNotEmpty) {
      insights.addAll(
        payload.mobileHome.insights.map((MobileInsightSnapshot item) => item.body),
      );
    }

    if (payload.primaryAlert.text.isNotEmpty) {
      insights.add(payload.primaryAlert.text);
    }

    if (payload.orders.buy != null) {
      insights.add(
        'Compra sugerida em ${payload.orders.buy!.symbol} por ${payload.orders.buy!.value}.',
      );
    }

    if (payload.orders.sell != null) {
      insights.add(
        'Reducao sugerida em ${payload.orders.sell!.symbol} por ${payload.orders.sell!.value}.',
      );
    }

    if (payload.sourceWarning.isNotEmpty) {
      insights.add('Fonte atual: ${payload.dataSourceLabel}.');
    }

    return insights.take(3).toList();
  }
}

class _HeroPanel extends StatelessWidget {
  const _HeroPanel({required this.payload, required this.categories});

  final DashboardPayload payload;
  final List<CategorySnapshot> categories;

  @override
  Widget build(BuildContext context) {
    final segments = categories
        .map(
          (CategorySnapshot item) => AllocationRingSegment(
            label: item.label,
            weight: item.shareRaw,
            color: categoryAccent(item.key),
          ),
        )
        .toList();

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: AppPalette.border),
        gradient: const LinearGradient(
          colors: <Color>[AppPalette.panel, AppPalette.backgroundAlt],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: const <BoxShadow>[
          BoxShadow(
            color: AppPalette.shadow,
            blurRadius: 32,
            offset: Offset(0, 16),
          ),
        ],
      ),
      child: Column(
        children: <Widget>[
          Text(
            'Patrimonio liquido',
            style: AppTheme.tacticalLabel(
              size: 12,
              color: AppPalette.textMuted,
              weight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            payload.summary.totalLabel,
            textAlign: TextAlign.center,
            style: AppTheme.hudStyle(size: 26, color: AppPalette.brandStrong),
          ),
          const SizedBox(height: 6),
          Text(
            '${formatPercentValue(payload.summary.totalPerformanceRaw)} geral',
            style: AppTheme.tacticalLabel(
              size: 14,
              color: payload.summary.totalPerformanceRaw >= 0
                  ? AppPalette.green
                  : AppPalette.red,
              weight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 22),
          AllocationRing(
            segments: segments,
            centerLabel: formatPercentValue(payload.summary.totalPerformanceRaw),
            centerSupportLabel: 'Rentabilidade total',
          ),
          const SizedBox(height: 18),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            alignment: WrapAlignment.center,
            children: categories
                .map(
                  (CategorySnapshot snapshot) => _CategoryLegendPill(
                    snapshot: snapshot,
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 18),
          Row(
            children: <Widget>[
              Expanded(
                child: _MiniSignal(
                  label: 'Status',
                  value: compactText(
                    payload.portfolioDecision.status,
                    fallback: payload.score.status,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _MiniSignal(
                  label: 'Atualizacao',
                  value: formatUpdatedAt(payload.updatedAt),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CategoryActionCard extends StatelessWidget {
  const _CategoryActionCard({required this.snapshot, required this.onTap});

  final CategorySnapshot snapshot;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final accent = categoryAccent(snapshot.key);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Ink(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
        decoration: BoxDecoration(
          color: AppPalette.panel,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: accent.withValues(alpha: 0.32)),
        ),
        child: Column(
          children: <Widget>[
            Container(
              width: 54,
              height: 54,
              decoration: BoxDecoration(
                color: accent.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(categoryIcon(snapshot.key), color: accent, size: 28),
            ),
            const SizedBox(height: 10),
            Text(
              snapshot.label,
              textAlign: TextAlign.center,
              style: AppTheme.tacticalLabel(
                size: 12,
                color: AppPalette.textPrimary,
                weight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              snapshot.performanceLabel,
              style: AppTheme.tacticalLabel(
                size: 12,
                color: accent,
                weight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _WideShortcutCard extends StatelessWidget {
  const _WideShortcutCard({
    required this.title,
    required this.subtitle,
    required this.caption,
    required this.icon,
    required this.accent,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final String caption;
  final IconData icon;
  final Color accent;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(28),
      child: Ink(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppPalette.panel,
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: AppPalette.border),
        ),
        child: Row(
          children: <Widget>[
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: accent.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(icon, color: accent),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(title, style: AppTheme.hudStyle(size: 14)),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppPalette.textPrimary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    caption,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppPalette.textMuted,
                      height: 1.35,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: AppPalette.textMuted),
          ],
        ),
      ),
    );
  }
}

class _CategoryLegendPill extends StatelessWidget {
  const _CategoryLegendPill({required this.snapshot});

  final CategorySnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    final accent = categoryAccent(snapshot.key);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppPalette.panelSoft,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppPalette.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(color: accent, shape: BoxShape.circle),
          ),
          const SizedBox(width: 8),
          Text(
            '${snapshot.label} ${snapshot.shareLabel}',
            style: AppTheme.tacticalLabel(
              size: 12,
              color: AppPalette.textPrimary,
              weight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _MiniSignal extends StatelessWidget {
  const _MiniSignal({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppPalette.panelSoft,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppPalette.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppPalette.textMuted,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: AppTheme.tacticalLabel(
              size: 13,
              color: AppPalette.textPrimary,
              weight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
