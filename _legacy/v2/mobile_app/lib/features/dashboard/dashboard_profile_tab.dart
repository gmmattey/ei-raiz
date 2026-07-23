import 'package:flutter/material.dart';

import '../../app/app_theme.dart';
import '../../core/config/app_environment.dart';
import '../../core/utils/app_formatters.dart';
import '../../models/backend_health.dart';
import '../../models/dashboard_payload.dart';
import '../../widgets/status_chip.dart';
import '../../widgets/tactical_card.dart';
import 'dashboard_presentation.dart';

class DashboardProfileTab extends StatelessWidget {
  const DashboardProfileTab({
    super.key,
    required this.payload,
    required this.backendHealth,
    required this.onRefresh,
  });

  final DashboardPayload payload;
  final BackendHealth? backendHealth;
  final Future<void> Function() onRefresh;

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
            title: 'Perfil operacional',
            subtitle: 'Nivel e enquadramento vindos do backend.',
            accent: AppPalette.brand,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  compactText(payload.profile.level, fallback: 'Perfil sem nivel'),
                  style: AppTheme.hudStyle(size: 18),
                ),
                const SizedBox(height: 6),
                Text(
                  compactText(payload.profile.squad, fallback: 'Squad nao informado'),
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppPalette.textPrimary,
                  ),
                ),
                const SizedBox(height: 12),
                StatusChip(
                  label: 'Score ${payload.profile.levelScore}',
                  tone: toneForText(payload.profile.level),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          TacticalCard(
            title: 'Saude do app',
            subtitle: 'Build local, backend e fonte de dados ativa.',
            accent: AppPalette.cobalt,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                _ProfileLine(
                  label: 'App mobile',
                  value: AppEnvironment.releaseLabel,
                ),
                _ProfileLine(
                  label: 'Backend',
                  value: backendHealth == null
                      ? 'Saude nao lida'
                      : '${backendHealth!.releaseName} v${backendHealth!.versionNumber}',
                ),
                _ProfileLine(
                  label: 'Fonte',
                  value: payload.dataSourceLabel,
                ),
                _ProfileLine(
                  label: 'Ultima leitura',
                  value: formatUpdatedAt(payload.updatedAt),
                ),
                if (payload.sourceWarning.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppPalette.gold.withValues(alpha: 0.10),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(
                          color: AppPalette.gold.withValues(alpha: 0.30),
                        ),
                      ),
                      child: Text(
                        payload.sourceWarning,
                        style: AppTheme.mono(size: 12),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          TacticalCard(
            title: 'Capacidades operacionais',
            subtitle: 'O que o backend declara disponivel hoje.',
            accent: AppPalette.gold,
            child: Wrap(
              spacing: 10,
              runSpacing: 10,
              children: <Widget>[
                _CapabilityChip(
                  label: 'Criar',
                  enabled: payload.operations.canCreate,
                ),
                _CapabilityChip(
                  label: 'Atualizar',
                  enabled: payload.operations.canUpdate,
                ),
                _CapabilityChip(
                  label: 'Mudar status',
                  enabled: payload.operations.canChangeStatus,
                ),
                _CapabilityChip(
                  label: 'Excluir',
                  enabled: payload.operations.canDelete,
                ),
                _CapabilityChip(
                  label: 'Execucao financeira',
                  enabled: payload.operations.financialExecutionEnabled,
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          TacticalCard(
            title: 'Perfis de dados',
            subtitle: 'Origem e natureza de cada macrobloco.',
            accent: AppPalette.teal,
            child: Column(
              children: payload.dataProfiles.all
                  .map(
                    (SourceDescriptor item) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Container(
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
                            Text(item.label, style: AppTheme.hudStyle(size: 13)),
                            const SizedBox(height: 6),
                            Text(
                              item.sourceType,
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppPalette.textMuted,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              item.description,
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppPalette.textPrimary,
                                height: 1.4,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileLine extends StatelessWidget {
  const _ProfileLine({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppPalette.textMuted,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppPalette.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CapabilityChip extends StatelessWidget {
  const _CapabilityChip({required this.label, required this.enabled});

  final String label;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return StatusChip(
      label: enabled ? '$label disponivel' : '$label bloqueado',
      tone: enabled ? StatusChipTone.positive : StatusChipTone.warning,
    );
  }
}
