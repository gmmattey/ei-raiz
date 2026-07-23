import 'package:flutter/material.dart';

import '../../app/app_theme.dart';
import '../../core/utils/app_formatters.dart';
import '../../models/dashboard_payload.dart';
import '../../widgets/status_chip.dart';
import '../../widgets/tactical_card.dart';
import 'dashboard_presentation.dart';

class DashboardPortfolioTab extends StatelessWidget {
  const DashboardPortfolioTab({
    super.key,
    required this.payload,
    required this.onRefresh,
    required this.onOpenCategory,
    required this.onOpenHolding,
    required this.onOpenRadar,
  });

  final DashboardPayload payload;
  final Future<void> Function() onRefresh;
  final void Function(String categoryKey) onOpenCategory;
  final void Function(PortfolioHolding holding) onOpenHolding;
  final VoidCallback onOpenRadar;

  @override
  Widget build(BuildContext context) {
    final holdings = <PortfolioHolding>[
      ...payload.actions,
      ...payload.investments,
      ...payload.previdencias,
    ]..sort(
        (PortfolioHolding a, PortfolioHolding b) =>
            b.currentValueRaw.compareTo(a.currentValueRaw),
      );

    return RefreshIndicator(
      onRefresh: onRefresh,
      color: AppPalette.brand,
      backgroundColor: AppPalette.panel,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
        children: <Widget>[
          TacticalCard(
            title: 'Carteira completa',
            subtitle: 'Leitura consolidada por blocos e posicoes.',
            accent: AppPalette.brand,
            child: Column(
              children: payload.categorySnapshots
                  .map(
                    (CategorySnapshot snapshot) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _CategoryPortfolioTile(
                        snapshot: snapshot,
                        health: payload.healthFor(snapshot.key),
                        holdingCount: payload.holdingsFor(snapshot.key).length,
                        onTap: () => onOpenCategory(snapshot.key),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: 14),
          if (payload.orders.hasSuggestions)
            TacticalCard(
              title: 'Ordens sugeridas',
              subtitle: 'Sugestoes que o backend ja disponibiliza hoje.',
              accent: AppPalette.gold,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  if (payload.orders.buy != null)
                    _OrderTile(
                      label: 'Compra sugerida',
                      symbol: payload.orders.buy!.symbol,
                      value: payload.orders.buy!.value,
                      accent: AppPalette.green,
                    ),
                  if (payload.orders.sell != null) ...<Widget>[
                    if (payload.orders.buy != null) const SizedBox(height: 10),
                    _OrderTile(
                      label: 'Reducao sugerida',
                      symbol: payload.orders.sell!.symbol,
                      value: payload.orders.sell!.value,
                      accent: AppPalette.red,
                    ),
                  ],
                  const SizedBox(height: 14),
                  OutlinedButton.icon(
                    onPressed: onOpenRadar,
                    icon: const Icon(Icons.auto_graph_rounded),
                    label: const Text('Abrir radar completo'),
                  ),
                ],
              ),
            ),
          if (payload.orders.hasSuggestions) const SizedBox(height: 14),
          TacticalCard(
            title: 'Maiores posicoes',
            subtitle: 'Entradas reais vindas do backend e prontas para detalhe.',
            accent: AppPalette.cobalt,
            child: Column(
              children: holdings
                  .take(6)
                  .map(
                    (PortfolioHolding holding) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _HoldingPreviewTile(
                        holding: holding,
                        onTap: () => onOpenHolding(holding),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: <Widget>[
              Expanded(
                child: TacticalCard(
                  title: 'Top fundos',
                  subtitle: 'Maiores pesos do bloco.',
                  accent: AppPalette.cobalt,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: payload.topFunds.isEmpty
                        ? <Widget>[
                            Text(
                              'Sem destaque nesta leitura.',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppPalette.textMuted,
                              ),
                            ),
                          ]
                        : payload.topFunds
                              .map(
                                (TopFundEntry item) => Padding(
                                  padding: const EdgeInsets.only(bottom: 10),
                                  child: Text(
                                    '${item.name}  ${item.value}',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(
                                          color: AppPalette.textPrimary,
                                          height: 1.4,
                                        ),
                                  ),
                                ),
                              )
                              .toList(),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: TacticalCard(
                  title: 'Previdencia',
                  subtitle: 'Resumo operacional do bloco.',
                  accent: AppPalette.teal,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        compactText(
                          payload.previdenciaInfo.platform,
                          fallback: 'Plataforma nao informada',
                        ),
                        style: AppTheme.tacticalLabel(
                          size: 14,
                          color: AppPalette.textPrimary,
                          weight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        compactText(
                          payload.previdenciaInfo.platformValue,
                          fallback: 'Sem valor',
                        ),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppPalette.textMuted,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        compactText(
                          payload.previdenciaInfo.topPlan,
                          fallback: 'Sem plano lider',
                        ),
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppPalette.textPrimary,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        compactText(
                          payload.previdenciaInfo.topPlanValue,
                          fallback: 'Sem valor',
                        ),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppPalette.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CategoryPortfolioTile extends StatelessWidget {
  const _CategoryPortfolioTile({
    required this.snapshot,
    required this.health,
    required this.holdingCount,
    required this.onTap,
  });

  final CategorySnapshot snapshot;
  final CategoryHealth? health;
  final int holdingCount;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final accent = categoryAccent(snapshot.key);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(22),
      child: Ink(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppPalette.panelSoft,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: AppPalette.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: accent.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(categoryIcon(snapshot.key), color: accent),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(snapshot.label, style: AppTheme.hudStyle(size: 14)),
                      const SizedBox(height: 4),
                      Text(
                        '$holdingCount itens | ${snapshot.totalLabel}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppPalette.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.chevron_right_rounded,
                  color: AppPalette.textMuted,
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: <Widget>[
                StatusChip(label: snapshot.shareLabel, tone: StatusChipTone.info),
                StatusChip(
                  label: health?.status ?? snapshot.status,
                  tone: toneForText(health?.status ?? snapshot.status),
                ),
                StatusChip(
                  label: snapshot.performanceLabel,
                  tone: toneForText(snapshot.performanceLabel),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _HoldingPreviewTile extends StatelessWidget {
  const _HoldingPreviewTile({required this.holding, required this.onTap});

  final PortfolioHolding holding;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Ink(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppPalette.panelSoft,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppPalette.border),
        ),
        child: Row(
          children: <Widget>[
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(holding.title, style: AppTheme.hudStyle(size: 13)),
                  const SizedBox(height: 4),
                  Text(
                    holding.currentValueLabel,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppPalette.textMuted,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: <Widget>[
                Text(
                  holding.performanceLabel,
                  style: AppTheme.tacticalLabel(
                    size: 13,
                    color: toneForText(holding.performanceLabel) ==
                            StatusChipTone.danger
                        ? AppPalette.red
                        : categoryAccent(holding.categoryKey),
                    weight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  compactText(holding.shareLabel),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppPalette.textMuted,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _OrderTile extends StatelessWidget {
  const _OrderTile({
    required this.label,
    required this.symbol,
    required this.value,
    required this.accent,
  });

  final String label;
  final String symbol;
  final String value;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: accent.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: accent.withValues(alpha: 0.24)),
      ),
      child: Row(
        children: <Widget>[
          Icon(Icons.swap_vert_circle_rounded, color: accent),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppPalette.textMuted,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '$symbol  $value',
                  style: AppTheme.tacticalLabel(
                    size: 14,
                    color: AppPalette.textPrimary,
                    weight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
