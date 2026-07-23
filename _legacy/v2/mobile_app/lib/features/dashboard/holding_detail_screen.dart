import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../app/app_theme.dart';
import '../../core/utils/app_formatters.dart';
import '../../models/dashboard_payload.dart';
import '../../widgets/status_chip.dart';
import '../../widgets/tactical_card.dart';
import 'dashboard_presentation.dart';

class HoldingDetailArgs {
  const HoldingDetailArgs({
    required this.holding,
    required this.snapshot,
    required this.health,
    this.ranking,
  });

  final PortfolioHolding holding;
  final CategorySnapshot? snapshot;
  final CategoryHealth? health;
  final RankedAsset? ranking;
}

class HoldingDetailScreen extends StatelessWidget {
  const HoldingDetailScreen({super.key, required this.args});

  final HoldingDetailArgs args;

  @override
  Widget build(BuildContext context) {
    final accent = categoryAccent(args.holding.categoryKey);

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
                          args.holding.title,
                          style: AppTheme.hudStyle(size: 18),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          args.holding.subtitle.isEmpty
                              ? categoryLabel(args.holding.categoryKey)
                              : args.holding.subtitle,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppPalette.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                  StatusChip(
                    label: args.holding.recommendation,
                    tone: toneForText(args.holding.recommendation),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              TacticalCard(
                title: args.holding.currentValueLabel,
                subtitle: 'Posicao atual no bloco ${categoryLabel(args.holding.categoryKey)}',
                accent: accent,
                trailing: StatusChip(
                  label: args.holding.shareLabel.isEmpty
                      ? args.holding.categoryShareLabel
                      : args.holding.shareLabel,
                  tone: StatusChipTone.info,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: <Widget>[
                        if (args.holding.performanceLabel.isNotEmpty)
                          StatusChip(
                            label: args.holding.performanceLabel,
                            tone: toneForText(args.holding.performanceLabel),
                          ),
                        StatusChip(
                          label: args.holding.statusLabel,
                          tone: toneForText(args.holding.statusLabel),
                        ),
                        if (args.holding.tagLabel.isNotEmpty)
                          StatusChip(
                            label: args.holding.tagLabel,
                            tone: StatusChipTone.neutral,
                          ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    _MetricGrid(
                      items: <_MetricItem>[
                        _MetricItem(
                          label: 'Instituicao',
                          value: compactText(args.holding.institution),
                        ),
                        _MetricItem(
                          label: 'Participacao no bloco',
                          value: compactText(
                            args.holding.categoryShareLabel,
                            fallback: 'Sem leitura',
                          ),
                        ),
                        _MetricItem(
                          label: 'Entrada',
                          value: compactText(args.holding.entryLabel),
                        ),
                        _MetricItem(
                          label: 'Stop',
                          value: args.holding.stopRaw <= 0
                              ? 'Nao informado'
                              : args.holding.stopRaw.toStringAsFixed(2).replaceAll(
                                  '.',
                                  ',',
                                ),
                        ),
                      ],
                    ),
                    if (args.holding.observation.isNotEmpty) ...<Widget>[
                      const SizedBox(height: 14),
                      Text(
                        args.holding.observation,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppPalette.textPrimary,
                          height: 1.45,
                        ),
                      ),
                    ],
                    if (args.holding.hasDetailUrl) ...<Widget>[
                      const SizedBox(height: 16),
                      FilledButton.icon(
                        onPressed: () => _openExternalLink(context),
                        icon: const Icon(Icons.open_in_new_rounded),
                        label: const Text('Abrir referencia externa'),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 14),
              TacticalCard(
                title: 'Leitura inteligente',
                subtitle: 'O que o backend ja decidiu sobre este ativo.',
                accent: AppPalette.cobalt,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    if (!args.holding.smartRecommendation.isEmpty)
                      _InsightBlock(
                        title: compactText(
                          args.holding.smartRecommendation.title,
                          fallback: 'Sem titulo adicional',
                        ),
                        body: <String>[
                          args.holding.smartRecommendation.reason,
                          args.holding.smartRecommendation.impact,
                        ].where((line) => line.trim().isNotEmpty).join('\n'),
                      ),
                    if (args.ranking != null) ...<Widget>[
                      const SizedBox(height: 12),
                      _MetricGrid(
                        items: <_MetricItem>[
                          _MetricItem(
                            label: 'Score',
                            value: formatRatioLabel(args.ranking!.score.toDouble()),
                          ),
                          _MetricItem(
                            label: 'Status',
                            value: compactText(args.ranking!.status),
                          ),
                          _MetricItem(
                            label: 'Oportunidade',
                            value: formatRatioLabel(
                              args.ranking!.opportunityScore.toDouble(),
                            ),
                          ),
                          _MetricItem(
                            label: 'Rentabilidade',
                            value: formatPercentValue(args.ranking!.rent),
                          ),
                        ],
                      ),
                      if (args.ranking!.motives.isNotEmpty) ...<Widget>[
                        const SizedBox(height: 12),
                        ...args.ranking!.motives.map(
                          (String item) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: <Widget>[
                                const Padding(
                                  padding: EdgeInsets.only(top: 5),
                                  child: Icon(
                                    Icons.circle,
                                    size: 7,
                                    color: AppPalette.brand,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    item,
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(
                                          color: AppPalette.textMuted,
                                          height: 1.4,
                                        ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ] else if (args.holding.assetScore.score > 0) ...<Widget>[
                      const SizedBox(height: 12),
                      _MetricGrid(
                        items: <_MetricItem>[
                          _MetricItem(
                            label: 'Score',
                            value: formatRatioLabel(args.holding.assetScore.score.toDouble()),
                          ),
                          _MetricItem(
                            label: 'Status',
                            value: compactText(args.holding.assetScore.status),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 14),
              TacticalCard(
                title: 'Contexto de categoria',
                subtitle: 'Relacao deste ativo com o bloco principal.',
                accent: AppPalette.teal,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: <Widget>[
                        if (args.snapshot != null)
                          StatusChip(
                            label: args.snapshot!.shareLabel,
                            tone: StatusChipTone.info,
                          ),
                        if (args.snapshot != null)
                          StatusChip(
                            label: args.snapshot!.performanceLabel,
                            tone: toneForText(args.snapshot!.performanceLabel),
                          ),
                        if (args.health != null)
                          StatusChip(
                            label: args.health!.risk,
                            tone: toneForText(args.health!.risk),
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
                    if (!args.holding.sourceProfile.isEmpty) ...<Widget>[
                      const SizedBox(height: 14),
                      Text(
                        args.holding.sourceProfile.description,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppPalette.textMuted,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _openExternalLink(BuildContext context) async {
    final uri = Uri.tryParse(args.holding.detailUrl);
    if (uri == null) return;

    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Nao foi possivel abrir o link externo.')),
      );
    }
  }
}

class _MetricGrid extends StatelessWidget {
  const _MetricGrid({required this.items});

  final List<_MetricItem> items;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: items
          .map(
            (_MetricItem item) => SizedBox(
              width: 150,
              child: Container(
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
                      item.label,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppPalette.textMuted,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      item.value,
                      style: AppTheme.tacticalLabel(
                        size: 14,
                        color: AppPalette.textPrimary,
                        weight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}

class _InsightBlock extends StatelessWidget {
  const _InsightBlock({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppPalette.panelSoft,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppPalette.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(title, style: AppTheme.hudStyle(size: 14)),
          if (body.trim().isNotEmpty) ...<Widget>[
            const SizedBox(height: 8),
            Text(
              body,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppPalette.textMuted,
                height: 1.45,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _MetricItem {
  const _MetricItem({required this.label, required this.value});

  final String label;
  final String value;
}
