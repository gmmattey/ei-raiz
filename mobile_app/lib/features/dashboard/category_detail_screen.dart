import 'package:flutter/material.dart';

import '../../app/app_router.dart';
import '../../app/app_theme.dart';
import '../../core/utils/app_formatters.dart';
import '../../models/dashboard_payload.dart';
import '../../widgets/status_chip.dart';
import '../../widgets/tactical_card.dart';
import 'dashboard_presentation.dart';
import 'holding_detail_screen.dart';

class CategoryDetailArgs {
  const CategoryDetailArgs({
    required this.snapshot,
    required this.health,
    required this.holdings,
    required this.ranking,
  });

  final CategorySnapshot snapshot;
  final CategoryHealth? health;
  final List<PortfolioHolding> holdings;
  final AssetRanking ranking;
}

class CategoryDetailScreen extends StatelessWidget {
  const CategoryDetailScreen({super.key, required this.args});

  final CategoryDetailArgs args;

  @override
  Widget build(BuildContext context) {
    final accent = categoryAccent(args.snapshot.key);

    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: <Color>[AppPalette.background, AppPalette.backgroundAlt],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
            children: <Widget>[
              Row(
                children: <Widget>[
                  IconButton.filledTonal(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.arrow_back_rounded),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          args.snapshot.label,
                          style: AppTheme.hudStyle(size: 18),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Composicao e posicoes do bloco',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppPalette.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                  StatusChip(
                    label: args.health?.status ?? args.snapshot.status,
                    tone: toneForText(args.health?.status ?? args.snapshot.status),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              TacticalCard(
                title: args.snapshot.totalLabel,
                subtitle: 'Participacao atual: ${args.snapshot.shareLabel}',
                accent: accent,
                trailing: StatusChip(
                  label: args.snapshot.performanceLabel,
                  tone: toneForText(args.snapshot.performanceLabel),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: <Widget>[
                        StatusChip(
                          label: args.health?.risk ?? 'Sem leitura',
                          tone: toneForText(args.health?.risk ?? ''),
                        ),
                        StatusChip(
                          label: args.health?.recommendation ??
                              args.snapshot.recommendation,
                          tone: toneForText(
                            args.health?.recommendation ??
                                args.snapshot.recommendation,
                          ),
                        ),
                        StatusChip(
                          label: '${args.holdings.length} itens',
                          tone: StatusChipTone.neutral,
                        ),
                      ],
                    ),
                    if ((args.health?.primaryMessage ?? '').isNotEmpty) ...<Widget>[
                      const SizedBox(height: 14),
                      Text(
                        args.health!.primaryMessage,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppPalette.textMuted,
                          height: 1.45,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 14),
              if (args.holdings.isEmpty)
                const _EmptyHoldingsState()
              else
                ...args.holdings.map(
                  (PortfolioHolding holding) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _HoldingCard(
                      holding: holding,
                      ranking: args.ranking.itemByTicker(holding.id),
                      onTap: () => Navigator.of(context).pushNamed(
                        AppRouter.holdingDetailRoute,
                        arguments: HoldingDetailArgs(
                          holding: holding,
                          snapshot: args.snapshot,
                          health: args.health,
                          ranking: args.ranking.itemByTicker(holding.id),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HoldingCard extends StatelessWidget {
  const _HoldingCard({
    required this.holding,
    required this.ranking,
    required this.onTap,
  });

  final PortfolioHolding holding;
  final RankedAsset? ranking;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final accent = categoryAccent(holding.categoryKey);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(22),
      child: Ink(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppPalette.panel,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: AppPalette.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: accent.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(
                    categoryIcon(holding.categoryKey),
                    color: accent,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(holding.title, style: AppTheme.hudStyle(size: 14)),
                      const SizedBox(height: 4),
                      Text(
                        holding.subtitle.isEmpty
                            ? compactText(holding.observation)
                            : holding.subtitle,
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
            const SizedBox(height: 14),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: <Widget>[
                StatusChip(
                  label: holding.currentValueLabel,
                  tone: StatusChipTone.info,
                ),
                if (holding.performanceLabel.isNotEmpty)
                  StatusChip(
                    label: holding.performanceLabel,
                    tone: toneForText(holding.performanceLabel),
                  ),
                if ((ranking?.score ?? 0) > 0)
                  StatusChip(
                    label: 'Score ${ranking!.score}',
                    tone: toneForText(ranking!.status),
                  ),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: <Widget>[
                Expanded(
                  child: Text(
                    <String>[
                      if (holding.institution.isNotEmpty) holding.institution,
                      if (holding.categoryShareLabel.isNotEmpty)
                        holding.categoryShareLabel,
                    ].join(' | '),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppPalette.textMuted,
                    ),
                  ),
                ),
                Text(
                  formatPercentValue(holding.performanceRaw),
                  style: AppTheme.tacticalLabel(
                    size: 14,
                    color: toneForText(holding.performanceLabel) ==
                            StatusChipTone.danger
                        ? AppPalette.red
                        : accent,
                    weight: FontWeight.w700,
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

class _EmptyHoldingsState extends StatelessWidget {
  const _EmptyHoldingsState();

  @override
  Widget build(BuildContext context) {
    return TacticalCard(
      title: 'Sem posicoes nesta rodada',
      subtitle: 'Quando o backend devolver itens, eles aparecem aqui.',
      accent: AppPalette.gold,
      child: Text(
        'Nenhum ativo desta categoria esta disponivel na leitura atual.',
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
          color: AppPalette.textMuted,
        ),
      ),
    );
  }
}
