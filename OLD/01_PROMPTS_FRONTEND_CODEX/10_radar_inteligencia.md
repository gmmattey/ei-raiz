# Prompt 10 - Radar / Inteligência

Você vai implementar ou refatorar a tela Radar do app Flutter do Esquilo Invest.

Objetivo desta etapa:
deixar a camada analítica mais profunda fora da Home, sem virar bagunça.

A tela deve conter:
1. plano da rodada
2. alertas inteligentes
3. ranking de ativos
4. histórico tático ou de decisão
5. leitura complementar da IA

Arquivos esperados:
- `lib/features/radar/radar_screen.dart`
- `lib/features/radar/radar_viewmodel.dart`
- `lib/features/radar/widgets/radar_plan_card.dart`
- `lib/features/radar/widgets/radar_alerts_list.dart`
- `lib/features/radar/widgets/radar_ranking_list.dart`
- `lib/features/radar/widgets/radar_ai_panel.dart`

Regras:
- tela deve aprofundar, não repetir a Home
- ranking tem que ser legível
- alertas têm que estar organizados
- IA precisa ter estado de loading, indisponível e pronta
- não deixar widget principal carregado demais
- viewmodel deve montar estado a partir de actionPlan, intelligentAlerts, assetRanking, decisionHistory e ai-analysis

Quero como saída:
- arquivos completos
- tela Radar funcional
- integração com leitura IA sem UX quebrada
