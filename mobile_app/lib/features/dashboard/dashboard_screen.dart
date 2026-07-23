import 'package:flutter/material.dart';

import '../../app/app_router.dart';
import '../../app/app_theme.dart';
import '../../core/config/app_environment.dart';
import '../../models/dashboard_payload.dart';
import '../../services/app_script_dashboard_service.dart';
import '../dashboard/category_detail_screen.dart';
import '../dashboard/dashboard_home_tab.dart';
import '../dashboard/dashboard_intelligence_tab.dart';
import '../dashboard/dashboard_portfolio_tab.dart';
import '../dashboard/dashboard_profile_tab.dart';
import '../dashboard/dashboard_controller.dart';
import '../dashboard/holding_detail_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key, this.service});

  final AppScriptDashboardService? service;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late final DashboardController _controller;
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    _controller = DashboardController(
      widget.service ?? AppScriptDashboardService(),
    );
    _controller.loadDashboard();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (BuildContext context, Widget? child) {
        final payload = _controller.dashboard;

        return Scaffold(
          extendBody: true,
          body: _ShellBackground(
            child: SafeArea(
              bottom: false,
              child: Column(
                children: <Widget>[
                  _HeaderBar(
                    isLoading: _controller.isLoading,
                    onRefresh: _controller.loadDashboard,
                  ),
                  if (_controller.dashboardErrorMessage != null && payload != null)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                      child: _InlineWarning(
                        message: _userFacingDashboardMessage(
                          _controller.dashboardErrorMessage!,
                          isConfigured: true,
                        ),
                      ),
                    ),
                  Expanded(
                    child: payload == null
                        ? _DashboardStateView(
                            isLoading: _controller.isLoading,
                            isConfigured: _controller.isConfigured,
                            message: _userFacingDashboardMessage(
                              _controller.dashboardErrorMessage,
                              isConfigured: _controller.isConfigured,
                            ),
                            onRefresh: _controller.loadDashboard,
                          )
                        : IndexedStack(
                            index: _selectedIndex,
                            children: <Widget>[
                              DashboardHomeTab(
                                payload: payload,
                                onRefresh: _controller.loadDashboard,
                                onOpenCategory: (String key) =>
                                    _openCategory(context, payload, key),
                                onOpenPortfolio: () => _setNavigationIndex(1),
                                onOpenRadar: () => _setNavigationIndex(2),
                              ),
                              DashboardPortfolioTab(
                                payload: payload,
                                onRefresh: _controller.loadDashboard,
                                onOpenCategory: (String key) =>
                                    _openCategory(context, payload, key),
                                onOpenHolding: (PortfolioHolding holding) =>
                                    _openHolding(context, payload, holding),
                                onOpenRadar: () => _setNavigationIndex(2),
                              ),
                              DashboardIntelligenceTab(
                                payload: payload,
                                aiAnalysis: _controller.aiAnalysis,
                                aiErrorMessage: _controller.aiErrorMessage,
                                isAiLoading: _controller.isAiLoading,
                                onRefresh: _controller.loadDashboard,
                                onLoadAi: _controller.refreshAiAnalysis,
                                onOpenCategory: (String key) =>
                                    _openCategory(context, payload, key),
                                onOpenTicker: (String ticker) =>
                                    _openTicker(context, payload, ticker),
                              ),
                              DashboardProfileTab(
                                payload: payload,
                                backendHealth: _controller.backendHealth,
                                onRefresh: _controller.loadDashboard,
                              ),
                            ],
                          ),
                  ),
                ],
              ),
            ),
          ),
          bottomNavigationBar: _BottomDock(
            selectedIndex: _selectedIndex,
            onSelected: _setNavigationIndex,
          ),
        );
      },
    );
  }

  void _openCategory(
    BuildContext context,
    DashboardPayload payload,
    String categoryKey,
  ) {
    final snapshot = payload.snapshotFor(categoryKey);
    if (snapshot == null) return;

    Navigator.of(context).pushNamed(
      AppRouter.categoryDetailRoute,
      arguments: CategoryDetailArgs(
        snapshot: snapshot,
        health: payload.healthFor(categoryKey),
        holdings: payload.holdingsFor(categoryKey),
        ranking: payload.assetRanking,
      ),
    );
  }

  void _openHolding(
    BuildContext context,
    DashboardPayload payload,
    PortfolioHolding holding,
  ) {
    Navigator.of(context).pushNamed(
      AppRouter.holdingDetailRoute,
      arguments: HoldingDetailArgs(
        holding: holding,
        snapshot: payload.snapshotFor(holding.categoryKey),
        health: payload.healthFor(holding.categoryKey),
        ranking: payload.rankingForTicker(holding.id),
      ),
    );
  }

  void _openTicker(
    BuildContext context,
    DashboardPayload payload,
    String ticker,
  ) {
    final normalized = ticker.trim().toLowerCase();
    if (normalized.isEmpty) {
      _setNavigationIndex(1);
      return;
    }

    for (final holdings in payload.holdingsByCategory.values) {
      for (final holding in holdings) {
        if (holding.id.trim().toLowerCase() == normalized) {
          _openHolding(context, payload, holding);
          return;
        }
      }
    }

    _setNavigationIndex(1);
  }

  void _setNavigationIndex(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }
}

class _HeaderBar extends StatelessWidget {
  const _HeaderBar({required this.isLoading, required this.onRefresh});

  final bool isLoading;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
      child: Row(
        children: <Widget>[
          Container(
            width: 44,
            height: 44,
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              color: AppPalette.panelSoft,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppPalette.border),
            ),
            child: Image.asset('assets/brand/esquilo.png', fit: BoxFit.contain),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text.rich(
                  TextSpan(
                    children: <InlineSpan>[
                      TextSpan(
                        text: 'Esquilo ',
                        style: AppTheme.hudStyle(size: 16),
                      ),
                      TextSpan(
                        text: 'Invest',
                        style: AppTheme.hudStyle(
                          size: 16,
                          weight: FontWeight.w400,
                          color: AppPalette.textPrimary.withValues(alpha: 0.88),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Base operacional  .  v${AppEnvironment.version}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppPalette.textMuted,
                  ),
                ),
              ],
            ),
          ),
          IconButton.filledTonal(
            onPressed: isLoading ? null : onRefresh,
            icon: isLoading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
    );
  }
}

class _BottomDock extends StatelessWidget {
  const _BottomDock({required this.selectedIndex, required this.onSelected});

  final int selectedIndex;
  final void Function(int index) onSelected;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: AppPalette.panel.withValues(alpha: 0.98),
            borderRadius: BorderRadius.circular(30),
            border: Border.all(color: AppPalette.border),
            boxShadow: const <BoxShadow>[
              BoxShadow(
                color: AppPalette.shadow,
                blurRadius: 30,
                offset: Offset(0, 12),
              ),
            ],
          ),
          child: Row(
            children: <Widget>[
              _DockItem(
                label: 'Inicio',
                icon: Icons.home_rounded,
                selected: selectedIndex == 0,
                onTap: () => onSelected(0),
              ),
              _DockItem(
                label: 'Carteira',
                icon: Icons.account_balance_wallet_rounded,
                selected: selectedIndex == 1,
                onTap: () => onSelected(1),
              ),
              _DockItem(
                label: 'Radar',
                icon: Icons.auto_graph_rounded,
                selected: selectedIndex == 2,
                onTap: () => onSelected(2),
              ),
              _DockItem(
                label: 'Base',
                icon: Icons.tune_rounded,
                selected: selectedIndex == 3,
                onTap: () => onSelected(3),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DockItem extends StatelessWidget {
  const _DockItem({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = selected ? AppPalette.brand : AppPalette.textMuted;

    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              Icon(icon, color: color),
              const SizedBox(height: 4),
              Text(
                label,
                style: AppTheme.tacticalLabel(
                  size: 12,
                  color: color,
                  weight: selected ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DashboardStateView extends StatelessWidget {
  const _DashboardStateView({
    required this.isLoading,
    required this.isConfigured,
    required this.message,
    required this.onRefresh,
  });

  final bool isLoading;
  final bool isConfigured;
  final String message;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
      children: <Widget>[
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: AppPalette.panel,
            borderRadius: BorderRadius.circular(30),
            border: Border.all(color: AppPalette.border),
          ),
          child: Column(
            children: <Widget>[
              const SizedBox(height: 12),
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: AppPalette.panelSoft,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Icon(
                  isLoading ? Icons.sync_rounded : Icons.wifi_tethering_error_rounded,
                  color: AppPalette.brand,
                  size: 32,
                ),
              ),
              const SizedBox(height: 18),
              Text(
                isLoading
                    ? 'Carregando carteira'
                    : isConfigured
                    ? 'Atualizacao indisponivel'
                    : 'Ambiente sem conexao',
                style: AppTheme.hudStyle(size: 18),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 10),
              Text(
                message,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppPalette.textMuted,
                  height: 1.45,
                ),
              ),
              const SizedBox(height: 18),
              FilledButton.icon(
                onPressed: isLoading ? null : onRefresh,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Tentar novamente'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _InlineWarning extends StatelessWidget {
  const _InlineWarning({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppPalette.gold.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppPalette.gold.withValues(alpha: 0.28)),
      ),
      child: Text(
        message,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          color: AppPalette.textPrimary,
        ),
      ),
    );
  }
}

class _ShellBackground extends StatelessWidget {
  const _ShellBackground({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: <Color>[AppPalette.background, AppPalette.backgroundAlt],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: Stack(
        children: <Widget>[
          Positioned(
            top: -40,
            left: -30,
            child: Container(
              width: 180,
              height: 180,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                boxShadow: <BoxShadow>[
                  BoxShadow(
                    color: Color(0x22FF6A1F),
                    blurRadius: 90,
                    spreadRadius: 20,
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            top: 120,
            right: -40,
            child: Container(
              width: 160,
              height: 160,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                boxShadow: <BoxShadow>[
                  BoxShadow(
                    color: Color(0x186A86FF),
                    blurRadius: 90,
                    spreadRadius: 18,
                  ),
                ],
              ),
            ),
          ),
          child,
        ],
      ),
    );
  }
}

String _userFacingDashboardMessage(
  String? rawMessage, {
  required bool isConfigured,
}) {
  final normalized = (rawMessage ?? '').toLowerCase();

  if (!isConfigured) {
    return 'A carteira ainda nao esta pronta para leitura neste ambiente.';
  }

  if (normalized.contains('token') ||
      normalized.contains('http') ||
      normalized.contains('json') ||
      normalized.contains('google') ||
      normalized.contains('auth') ||
      normalized.contains('html')) {
    return 'Nao foi possivel atualizar sua carteira agora. Tente novamente em alguns instantes.';
  }

  return 'A carteira nao foi atualizada nesta tentativa. Tente novamente em alguns instantes.';
}
