import 'package:flutter/material.dart';

import '../../app/app_theme.dart';
import '../../core/utils/app_formatters.dart';
import '../../models/dashboard_payload.dart';
import '../../widgets/status_chip.dart';
import '../../widgets/tactical_card.dart';
import 'dashboard_presentation.dart';

class DashboardIntelligenceTab extends StatelessWidget {
  const DashboardIntelligenceTab({
    super.key,
    required this.payload,
    required this.aiAnalysis,
    required this.aiErrorMessage,
    required this.isAiLoading,
    required this.onRefresh,
    required this.onLoadAi,
    required this.onOpenCategory,
    required this.onOpenTicker,
  });

  final DashboardPayload payload;
  final String? aiAnalysis;
  final String? aiErrorMessage;
  final bool isAiLoading;
  final Future<void> Function() onRefresh;
  final Future<void> Function() onLoadAi;
  final void Function(String categoryKey) onOpenCategory;
  final void Function(String ticker) onOpenTicker;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      color: AppPalette.brand,
      backgroundColor: AppPalette.panel,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
        children: <Widget>[
          TacticalCard(
            title: 'Plano da rodada',
            subtitle: 'Direcao prioritaria vinda do backend.',
            accent: AppPalette.brand,
            trailing: StatusChip(
              label: payload.actionPlan.priority.isEmpty
                  ? 'Monitorar'
                  : payload.actionPlan.priority,
              tone: toneForText(payload.actionPlan.priority),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  compactText(payload.actionPlan.actionLabel),
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: AppPalette.textPrimary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  compactText(payload.actionPlan.justification),
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppPalette.textPrimary,
                    height: 1.45,
                  ),
                ),
                if (payload.actionPlan.impact.isNotEmpty) ...<Widget>[
                  const SizedBox(height: 10),
                  Text(
                    payload.actionPlan.impact,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppPalette.textMuted,
                      height: 1.4,
                    ),
                  ),
                ],
                if (payload.actionPlan.alternatives.isNotEmpty) ...<Widget>[
                  const SizedBox(height: 14),
                  ...payload.actionPlan.alternatives.map(
                    (String item) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text(
                        '- $item',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppPalette.textMuted,
                        ),
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 14),
                Row(
                  children: <Widget>[
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: () => onOpenCategory(
                          payload.portfolioDecision.categoryKey.isEmpty
                              ? 'acoes'
                              : payload.portfolioDecision.categoryKey,
                        ),
                        icon: const Icon(Icons.track_changes_rounded),
                        label: const Text('Abrir foco'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => onOpenTicker(
                          payload.portfolioDecision.criticalPoint,
                        ),
                        icon: const Icon(Icons.search_rounded),
                        label: const Text('Ver ativo'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          TacticalCard(
            title: 'Alertas inteligentes',
            subtitle: 'Sinais e oportunidades da rodada.',
            accent: AppPalette.gold,
            child: Column(
              children: payload.intelligentAlerts.isEmpty
                  ? <Widget>[
                      Text(
                        'Nenhum alerta inteligente disponivel nesta leitura.',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppPalette.textMuted,
                        ),
                      ),
                    ]
                  : payload.intelligentAlerts
                        .map(
                          (IntelligentAlert alert) => Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: _AlertTile(alert: alert),
                          ),
                        )
                        .toList(),
            ),
          ),
          const SizedBox(height: 14),
          TacticalCard(
            title: 'Ranking de ativos',
            subtitle: 'Melhores leituras e pontos de atencao.',
            accent: AppPalette.cobalt,
            child: Column(
              children: payload.assetRanking.items
                  .map(
                    (RankedAsset item) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _RankingTile(
                        item: item,
                        onTap: () => onOpenTicker(item.ticker),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: 14),
          TacticalCard(
            title: 'Historico de decisao',
            subtitle: 'Registro do motor tatico.',
            accent: AppPalette.teal,
            child: Column(
              children: payload.decisionHistory.isEmpty
                  ? <Widget>[
                      Text(
                        'Sem historico registrado nesta rodada.',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppPalette.textMuted,
                        ),
                      ),
                    ]
                  : payload.decisionHistory
                        .map(
                          (DecisionRecord item) => Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: _DecisionTile(item: item),
                          ),
                        )
                        .toList(),
            ),
          ),
          const SizedBox(height: 14),
          TacticalCard(
            title: 'Esquilo IA',
            subtitle: 'Leitura remota complementar do mesmo contexto da carteira.',
            accent: AppPalette.brand,
            trailing: StatusChip(
              label: isAiLoading
                  ? 'Lendo'
                  : aiAnalysis != null
                  ? 'Pronto'
                  : aiErrorMessage == null
                  ? 'Disponivel'
                  : 'Indisponivel',
              tone: isAiLoading
                  ? StatusChipTone.warning
                  : aiAnalysis != null
                  ? StatusChipTone.positive
                  : aiErrorMessage == null
                  ? StatusChipTone.info
                  : StatusChipTone.danger,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppPalette.panelSoft,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppPalette.border),
                  ),
                  child: Text(
                    aiAnalysis ??
                        aiErrorMessage ??
                        'A leitura complementar pode ser consultada sob demanda quando o backend responder a Esquilo IA.',
                    style: aiAnalysis == null
                        ? AppTheme.mono(size: 12, color: AppPalette.textMuted)
                        : Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppPalette.textPrimary,
                              height: 1.5,
                            ),
                  ),
                ),
                const SizedBox(height: 14),
                FilledButton.tonalIcon(
                  onPressed: isAiLoading ? null : onLoadAi,
                  icon: const Icon(Icons.auto_awesome_rounded),
                  label: Text(isAiLoading ? 'Consultando...' : 'Atualizar leitura'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AlertTile extends StatelessWidget {
  const _AlertTile({required this.alert});

  final IntelligentAlert alert;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppPalette.panelSoft,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppPalette.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: categoryAccent('acoes').withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              alert.type.toLowerCase().contains('oportun')
                  ? Icons.flash_on_rounded
                  : Icons.priority_high_rounded,
              color: alert.type.toLowerCase().contains('oportun')
                  ? AppPalette.green
                  : AppPalette.gold,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(alert.title, style: AppTheme.hudStyle(size: 13)),
                const SizedBox(height: 4),
                Text(
                  alert.message,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppPalette.textMuted,
                    height: 1.4,
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

class _RankingTile extends StatelessWidget {
  const _RankingTile({required this.item, required this.onTap});

  final RankedAsset item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Ink(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppPalette.panelSoft,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppPalette.border),
        ),
        child: Row(
          children: <Widget>[
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(item.ticker, style: AppTheme.hudStyle(size: 13)),
                  const SizedBox(height: 4),
                  Text(
                    item.name,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppPalette.textMuted,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: <Widget>[
                StatusChip(
                  label: 'Score ${item.score}',
                  tone: toneForText(item.status),
                ),
                const SizedBox(height: 6),
                Text(
                  formatPercentValue(item.rent),
                  style: AppTheme.tacticalLabel(
                    size: 13,
                    color: item.rent >= 0 ? AppPalette.green : AppPalette.red,
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

class _DecisionTile extends StatelessWidget {
  const _DecisionTile({required this.item});

  final DecisionRecord item;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppPalette.panelSoft,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppPalette.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: Text(item.action, style: AppTheme.hudStyle(size: 13)),
              ),
              StatusChip(
                label: compactText(item.status),
                tone: toneForText(item.status),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            '${compactText(item.asset)} | ${formatUpdatedAt(item.date)}',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppPalette.textMuted,
            ),
          ),
          if (item.context.isNotEmpty) ...<Widget>[
            const SizedBox(height: 8),
            Text(
              item.context,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppPalette.textPrimary,
                height: 1.4,
              ),
            ),
          ],
          if (item.outcome.summary.isNotEmpty) ...<Widget>[
            const SizedBox(height: 8),
            Text(
              '${item.outcome.label}: ${item.outcome.summary}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppPalette.textMuted,
                height: 1.4,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
