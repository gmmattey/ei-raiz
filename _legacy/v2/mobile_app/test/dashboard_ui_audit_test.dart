import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_app/app/app_router.dart';
import 'package:mobile_app/app/app_theme.dart';
import 'package:mobile_app/models/backend_health.dart';
import 'package:mobile_app/features/dashboard/dashboard_screen.dart';
import 'package:mobile_app/models/dashboard_payload.dart';
import 'package:mobile_app/services/app_script_dashboard_service.dart';

void main() {
  testWidgets('dashboard shell keeps core Esquilo structure on mobile', (
    WidgetTester tester,
  ) async {
    tester.view.physicalSize = const Size(412, 915);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    final payload = _fixturePayload();
    final service = _FakeDashboardService(payload);

    await tester.pumpWidget(
      MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: AppTheme.themeData,
        onGenerateRoute: (RouteSettings settings) {
          switch (settings.name) {
            case AppRouter.dashboardRoute:
              return MaterialPageRoute<void>(
                builder: (_) => DashboardScreen(service: service),
                settings: settings,
              );
            default:
              return AppRouter.onGenerateRoute(settings);
          }
        },
        initialRoute: AppRouter.dashboardRoute,
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Patrimonio liquido'), findsOneWidget);
    expect(find.text('Categorias'), findsOneWidget);

    final logoImage = tester.widget<Image>(find.byType(Image).first);
    expect(logoImage.image, isA<AssetImage>());
    expect(
      (logoImage.image as AssetImage).assetName,
      'assets/brand/esquilo.png',
    );

    await tester.scrollUntilVisible(find.text('Portfolio scan'), 220);
    await tester.pumpAndSettle();
    expect(find.text('Portfolio scan'), findsOneWidget);
    await tester.scrollUntilVisible(find.text('Diretriz tatico_ia'), 160);
    await tester.pumpAndSettle();
    expect(find.text('Diretriz tatico_ia'), findsOneWidget);

    await tester.tap(find.text('Carteira'));
    await tester.pumpAndSettle();

    expect(find.text('Carteira completa'), findsOneWidget);
    expect(find.text('Acoes'), findsOneWidget);

    await tester.tap(find.text('Acoes').first);
    await tester.pumpAndSettle();

    expect(find.text('Composicao e posicoes do bloco'), findsOneWidget);
    expect(find.text('PETR4'), findsOneWidget);

    await tester.tap(find.text('PETR4'));
    await tester.pumpAndSettle();

    expect(find.text('Leitura inteligente'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.arrow_back_rounded));
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.arrow_back_rounded));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Radar'));
    await tester.pumpAndSettle();

    expect(find.text('Plano da rodada'), findsOneWidget);
    await tester.scrollUntilVisible(find.text('Esquilo IA'), 220);
    await tester.pumpAndSettle();
    expect(find.text('Esquilo IA'), findsOneWidget);
  });
}

class _FakeDashboardService extends AppScriptDashboardService {
  _FakeDashboardService(this.payload) : super();

  final DashboardPayload payload;

  @override
  bool get isConfigured => true;

  @override
  Future<DashboardPayload> fetchDashboard() async => payload;

  @override
  Future<String> fetchAiAnalysis() async => 'Leitura validada para a rodada.';

  @override
  Future<BackendHealth> fetchHealth() async => const BackendHealth(
    releaseName: 'Esquilo Invest',
    versionNumber: '2.0.0',
    updatedAt: null,
  );

  @override
  void dispose() {}
}

DashboardPayload _fixturePayload() {
  return DashboardPayload.fromJson(<String, dynamic>{
    'summary': <String, dynamic>{
      'total': 'R\$ 100.000,00',
      'totalRaw': 100000,
      'totalInvestidoRaw': 90000,
      'totalPerformanceRaw': 0.12,
      'acoes': 'R\$ 40.000,00',
      'acoesRaw': 40000,
      'acoesInvestidoRaw': 35000,
      'acoesPerformanceRaw': 0.14,
      'fundos': 'R\$ 35.000,00',
      'fundosRaw': 35000,
      'fundosInvestidoRaw': 32000,
      'fundosPerformanceRaw': 0.10,
      'previdencia': 'R\$ 25.000,00',
      'previdenciaRaw': 25000,
      'previdenciaInvestidoRaw': 23000,
      'previdenciaPerformanceRaw': 0.08,
      'preOrdens': 'R\$ 2.000,00',
    },
    'score': <String, dynamic>{
      'score': 82,
      'status': 'Seguro',
      'explanation': 'Carteira equilibrada para a rodada.',
      'breakdown': <String, dynamic>{
        'capitalPoints': 20,
        'categoryPoints': 21,
        'institutionPoints': 19,
        'healthPoints': 22,
      },
    },
    'messaging': <String, dynamic>{
      'executiveSummary': <String, dynamic>{
        'statusText': 'Carteira equilibrada no ciclo atual.',
        'performanceText': '+12,0% no round',
        'scoreStatusText': 'Leitura segura',
      },
      'primaryRecommendation': <String, dynamic>{
        'title': 'Manter plano',
        'reason': 'Sem desvios criticos nas macroclasses.',
        'impact': 'Mantem a consistencia do portifolio.',
        'actionText': 'Seguir monitoramento',
        'asset': 'PETR4',
      },
      'supportNotes': <String, dynamic>{
        'scoreNote': 'Score sustentado pela diversificacao atual.',
        'squadTip': 'Revisar concentracao mensalmente.',
      },
      'alertsSummary': <String, dynamic>{
        'headline': 'Sem alertas graves.',
        'lines': <String>['Acoes sob controle', 'Fundos estaveis'],
      },
    },
    'actionPlan': <String, dynamic>{
      'acao_principal': 'Manter plano',
      'prioridade': 'Baixa',
      'justificativa': 'Carteira aderente ao perfil e sem pressao critica.',
      'impacto': 'Mantem a consistencia do portifolio.',
      'alternativas': <String>['Seguir monitoramento', 'Rever concentracao mensal'],
      'context': <String, dynamic>{
        'urgency': 'Baixa',
        'focusCategory': 'Acoes',
        'priorityReason': 'Sem desvio critico',
        'topRiskAsset': 'PETR4',
        'topOpportunityAsset': 'ITSA4',
      },
    },
    'portfolioDecision': <String, dynamic>{
      'actionText': 'Manter posicoes e revisar concentracao.',
      'focusCategoryLabel': 'Acoes',
      'urgency': 'Baixa',
      'status': 'Controlado',
      'criticalPoint': 'Nenhum ponto critico',
      'categoryKey': 'acoes',
      'issueKind': 'monitoramento',
    },
    'categorySnapshots': <Map<String, dynamic>>[
      <String, dynamic>{
        'key': 'acoes',
        'label': 'Acoes',
        'totalLabel': 'R\$ 40.000,00',
        'totalRaw': 40000,
        'shareLabel': '40,0%',
        'shareRaw': 0.4,
        'performanceLabel': '+14,0%',
        'performanceRaw': 0.14,
        'status': 'Seguro',
        'recommendation': 'Manter',
        'color': '#F59E0B',
        'sourceType': 'cotacao-mercado',
        'trend': 'up',
      },
      <String, dynamic>{
        'key': 'fundos',
        'label': 'Fundos',
        'totalLabel': 'R\$ 35.000,00',
        'totalRaw': 35000,
        'shareLabel': '35,0%',
        'shareRaw': 0.35,
        'performanceLabel': '+10,0%',
        'performanceRaw': 0.10,
        'status': 'Seguro',
        'recommendation': 'Manter',
        'color': '#38BDF8',
        'sourceType': 'registro-fundo',
        'trend': 'up',
      },
      <String, dynamic>{
        'key': 'previdencia',
        'label': 'Previdencia',
        'totalLabel': 'R\$ 25.000,00',
        'totalRaw': 25000,
        'shareLabel': '25,0%',
        'shareRaw': 0.25,
        'performanceLabel': '+8,0%',
        'performanceRaw': 0.08,
        'status': 'Seguro',
        'recommendation': 'Manter',
        'color': '#6EE7B7',
        'sourceType': 'registro-plano',
        'trend': 'up',
      },
    ],
    'alert': <String, dynamic>{'symbol': 'PETR4', 'text': 'Monitorar concentracao'},
    'alerts': <Map<String, dynamic>>[
      <String, dynamic>{'type': 'Atencao', 'message': 'Sem alerta grave', 'asset': 'PETR4'},
    ],
    'orders': <String, dynamic>{
      'buy': <String, dynamic>{'symbol': 'PETR4', 'value': 'R\$ 500,00'},
      'sell': null,
    },
    'fundosTop': <Map<String, dynamic>>[
      <String, dynamic>{'name': 'KNSC11', 'value': 'R\$ 35.000,00'},
    ],
    'previdenciaInfo': <String, dynamic>{
      'platform': 'XP',
      'platformValue': 'R\$ 25.000,00',
      'topPlan': 'Plano XP',
      'topPlanValue': 'R\$ 25.000,00',
    },
    'tip': '',
    'profile': <String, dynamic>{
      'squad': 'Squad Moderado',
      'level': 'Elite',
      'levelScore': 82,
    },
    'categories': <String, dynamic>{
      'actions': <String, dynamic>{
        'label': 'Acoes',
        'status': 'Seguro',
        'risk': 'Controlado',
        'recommendation': 'Manter',
        'primaryIssue': <String, dynamic>{
          'asset': 'PETR4',
          'message': 'Acompanhamento em linha com o plano.',
        },
      },
      'funds': <String, dynamic>{
        'label': 'Fundos',
        'status': 'Seguro',
        'risk': 'Controlado',
        'recommendation': 'Manter',
        'primaryIssue': <String, dynamic>{
          'asset': 'KNSC11',
          'message': 'Fundos aderentes ao mandato atual.',
        },
      },
      'previdencia': <String, dynamic>{
        'label': 'Previdencia',
        'status': 'Seguro',
        'risk': 'Controlado',
        'recommendation': 'Manter',
        'primaryIssue': <String, dynamic>{
          'asset': 'Plano XP',
          'message': 'Previdencia dentro da faixa planejada.',
        },
      },
    },
    'actions': <Map<String, dynamic>>[
      <String, dynamic>{
        'ticker': 'PETR4',
        'name': 'Petrobras',
        'institution': 'XP',
        'institutionIcon': '',
        'observation': 'Ativo defensivo',
        'entryLabel': '2026-02-06',
        'positionValue': 'R\$ 20.000,00',
        'rendimentoPct': '+18,0%',
        'rent': 0.18,
        'valorAtualRaw': 20000,
        'valorInvestidoRaw': 17000,
        'portfolioShareLabel': '20,0%',
        'portfolioShareRaw': 0.2,
        'categoryShareLabel': '50,0%',
        'categoryShareRaw': 0.5,
        'recommendation': 'Manter',
        'statusLabel': 'Comprado',
        'currentPrice': 'R\$ 36,00',
        'currentPriceRaw': 36,
        'avgPrice': 'PM R\$ 30,00',
        'avgPriceRaw': 30,
        'qty': '400 cotas',
        'qtyRaw': 400,
        'chartUrl': 'https://example.com',
        'assetScore': <String, dynamic>{
          'score': 84,
          'status': 'Forte',
          'motivos': <String>['Peso sob controle'],
        },
        'smartRecommendation': <String, dynamic>{
          'action': 'Manter',
          'title': 'PETR4 segue forte',
          'reason': 'Ativo em linha com o plano',
          'impact': 'Mantem consistencia',
        },
      },
      <String, dynamic>{
        'ticker': 'ITSA4',
        'name': 'Itausa',
        'institution': 'BTG',
        'institutionIcon': '',
        'observation': 'Ativo financeiro',
        'entryLabel': '2026-02-06',
        'positionValue': 'R\$ 20.000,00',
        'rendimentoPct': '+10,0%',
        'rent': 0.10,
        'valorAtualRaw': 20000,
        'valorInvestidoRaw': 18000,
        'portfolioShareLabel': '20,0%',
        'portfolioShareRaw': 0.2,
        'categoryShareLabel': '50,0%',
        'categoryShareRaw': 0.5,
        'recommendation': 'Manter',
        'statusLabel': 'Comprado',
        'currentPrice': 'R\$ 10,00',
        'currentPriceRaw': 10,
        'avgPrice': 'PM R\$ 9,20',
        'avgPriceRaw': 9.2,
        'qty': '2000 cotas',
        'qtyRaw': 2000,
        'chartUrl': 'https://example.com',
        'assetScore': <String, dynamic>{
          'score': 76,
          'status': 'Ok',
          'motivos': <String>['Diversificacao sob controle'],
        },
        'smartRecommendation': <String, dynamic>{
          'action': 'Monitorar',
          'title': 'ITSA4 pede acompanhamento',
          'reason': 'Leitura neutra',
          'impact': 'Ajustar somente se o quadro mudar',
        },
      },
    ],
    'investments': <Map<String, dynamic>>[
      <String, dynamic>{
        'name': 'KNSC11',
        'classification': 'FII Papel',
        'strategy': 'Renda',
        'institution': 'XP',
        'valorAtual': 'R\$ 35.000,00',
        'performanceLabel': '+10,0%',
        'rentPct': '+10,0%',
        'rentRaw': 0.10,
        'portfolioShareLabel': '35,0%',
        'portfolioShareRaw': 0.35,
        'recommendation': 'Manter',
        'statusLabel': 'Ativo',
        'benchmark': 'IFIX',
        'profileLabel': 'Moderado',
        'sourceProfile': <String, dynamic>{
          'key': 'fundos',
          'label': 'Fundos',
          'sourceType': 'registro-fundo',
          'description': 'Fundos usam payload normalizado.',
        },
        'detailUrl': 'https://example.com',
      },
    ],
    'previdencias': <Map<String, dynamic>>[
      <String, dynamic>{
        'name': 'Plano XP',
        'classification': 'Previdencia',
        'profileLabel': 'Longo prazo',
        'institution': 'XP',
        'valorAtual': 'R\$ 25.000,00',
        'performanceLabel': '+8,0%',
        'rentPct': '+8,0%',
        'rentRaw': 0.08,
        'portfolioShareLabel': '25,0%',
        'portfolioShareRaw': 0.25,
        'recommendation': 'Manter',
        'statusLabel': 'Ativo',
        'sourceProfile': <String, dynamic>{
          'key': 'previdencia',
          'label': 'Previdencia',
          'sourceType': 'registro-plano',
          'description': 'Previdencia usa modelagem propria.',
        },
        'detailUrl': 'https://example.com',
      },
    ],
    'decisionHistory': <Map<String, dynamic>>[
      <String, dynamic>{
        'data': '2026-03-28T01:00:00.000Z',
        'acao': 'Manter plano',
        'ativo': 'PETR4',
        'contexto': 'Tudo em linha',
        'status': 'pendente',
        'outcome': <String, dynamic>{
          'label': 'Em observacao',
          'summary': 'Sem mudancas relevantes',
        },
      },
    ],
    'intelligentAlerts': <Map<String, dynamic>>[
      <String, dynamic>{
        'key': 'focus-acoes',
        'type': 'Atencao',
        'title': 'Acoes em foco',
        'message': 'O bloco de acoes segue pedindo acompanhamento.',
        'asset': 'PETR4',
      },
    ],
    'assetRanking': <String, dynamic>{
      'items': <Map<String, dynamic>>[
        <String, dynamic>{
          'ticker': 'PETR4',
          'name': 'Petrobras',
          'score': 84,
          'status': 'Forte',
          'motivos': <String>['Peso sob controle'],
          'recommendation': 'Manter',
          'smartRecommendation': <String, dynamic>{
            'action': 'Manter',
            'title': 'PETR4 segue forte',
            'reason': 'Ativo em linha com o plano',
            'impact': 'Mantem consistencia',
          },
          'riskPriority': 1,
          'riskLabel': 'Controlado',
          'marketSignal': 'neutral',
          'marketContext': <String, dynamic>{'hasExternalData': false},
          'portfolioShare': 0.2,
          'categoryShare': 0.5,
          'impactWeight': 0.5,
          'opportunityScore': 88,
          'rent': 0.18,
        },
      ],
      'topOpportunity': <String, dynamic>{
        'ticker': 'PETR4',
        'name': 'Petrobras',
        'score': 84,
        'status': 'Forte',
        'motivos': <String>['Peso sob controle'],
        'recommendation': 'Manter',
        'smartRecommendation': <String, dynamic>{
          'action': 'Manter',
          'title': 'PETR4 segue forte',
          'reason': 'Ativo em linha com o plano',
          'impact': 'Mantem consistencia',
        },
        'riskPriority': 1,
        'riskLabel': 'Controlado',
        'marketSignal': 'neutral',
        'marketContext': <String, dynamic>{'hasExternalData': false},
        'portfolioShare': 0.2,
        'categoryShare': 0.5,
        'impactWeight': 0.5,
        'opportunityScore': 88,
        'rent': 0.18,
      },
      'topRisk': <String, dynamic>{
        'ticker': 'ITSA4',
        'name': 'Itausa',
        'score': 76,
        'status': 'Ok',
        'motivos': <String>['Diversificacao sob controle'],
        'recommendation': 'Monitorar',
        'smartRecommendation': <String, dynamic>{
          'action': 'Monitorar',
          'title': 'ITSA4 pede acompanhamento',
          'reason': 'Leitura neutra',
          'impact': 'Ajustar somente se o quadro mudar',
        },
        'riskPriority': 1,
        'riskLabel': 'Controlado',
        'marketSignal': 'neutral',
        'marketContext': <String, dynamic>{'hasExternalData': false},
        'portfolioShare': 0.2,
        'categoryShare': 0.5,
        'impactWeight': 0.5,
        'opportunityScore': 78,
        'rent': 0.10,
      },
    },
    'dataProfiles': <String, dynamic>{
      'actions': <String, dynamic>{
        'key': 'acoes',
        'label': 'Acoes',
        'sourceType': 'cotacao-mercado',
        'description': 'Acoes usam enriquecimento de mercado.',
      },
      'funds': <String, dynamic>{
        'key': 'fundos',
        'label': 'Fundos',
        'sourceType': 'registro-fundo',
        'description': 'Fundos usam payload normalizado.',
      },
      'previdencia': <String, dynamic>{
        'key': 'previdencia',
        'label': 'Previdencia',
        'sourceType': 'registro-plano',
        'description': 'Previdencia usa modelagem propria.',
      },
    },
    'operations': <String, dynamic>{
      'canChangeStatus': true,
      'canDelete': true,
      'canUpdate': true,
      'canCreate': true,
      'financialExecutionEnabled': false,
    },
    'mobileHome': <String, dynamic>{
      'total': <String, dynamic>{'label': 'R\$ 100.000,00', 'raw': 100000},
      'variation': <String, dynamic>{
        'label': '+12,0%',
        'raw': 0.12,
        'isPositive': true,
      },
      'status': <String, dynamic>{
        'label': 'Estavel',
        'summary': 'Carteira equilibrada',
        'detail': 'Sem alertas graves',
      },
      'update': <String, dynamic>{
        'label': 'Atualizado na ultima leitura',
        'updatedAt': '2026-03-28T01:00:00.000Z',
        'sourceLabel': 'Base operacional secundaria',
      },
      'risk': <String, dynamic>{
        'label': 'Baixo',
        'focusLabel': 'Acoes',
        'focusKey': 'acoes',
        'shareLabel': '40,0%',
        'reason': 'Acompanhamento em linha com o plano.',
        'meterValue': 0.3,
      },
      'distribution': <Map<String, dynamic>>[
        <String, dynamic>{
          'key': 'acoes',
          'label': 'Acoes',
          'valueLabel': 'R\$ 40.000,00',
          'shareLabel': '40,0%',
          'performanceLabel': '+14,0%',
          'statusLabel': 'Seguro',
          'color': '#F59E0B',
        },
      ],
      'recommendation': <String, dynamic>{
        'title': 'Manter plano em Acoes',
        'reason': 'Sem desvios criticos',
        'primaryActionLabel': 'Abrir Acoes',
        'secondaryActionLabel': 'Ver carteira',
        'focusCategoryKey': 'acoes',
        'secondaryCategoryKey': 'fundos',
      },
      'score': <String, dynamic>{
        'valueLabel': '82/100',
        'valueRaw': 82,
        'statusLabel': 'Seguro',
        'summary': 'Carteira equilibrada',
        'problem': 'Principal ponto de atencao: Nenhum ponto critico.',
      },
      'insights': <Map<String, dynamic>>[
        <String, dynamic>{'title': 'Maior peso hoje', 'body': 'Acoes representam 40,0%.'},
      ],
    },
    'dataSource': 'spreadsheet-fallback',
    'sourceWarning': '',
    'generalAdvice': 'Carteira em linha com o plano atual.',
    'updatedAt': '2026-03-28T01:00:00.000Z',
  });
}
