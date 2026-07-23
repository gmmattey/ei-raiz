# Prompt 09 - Histórico

Você vai implementar a tela Histórico do app Flutter do Esquilo Invest.

Objetivo desta etapa:
mostrar a evolução da carteira e das recomendações ao longo do tempo.

A tela deve conter:
1. linha do tempo
2. snapshots da carteira
3. comparação antes/depois
4. eventos de importação
5. log de recomendações ao longo do tempo

Arquivos esperados:
- `lib/features/history/history_screen.dart`
- `lib/features/history/history_viewmodel.dart`
- `lib/features/history/widgets/history_timeline.dart`
- `lib/features/history/widgets/history_snapshot_card.dart`
- `lib/features/history/widgets/history_compare_panel.dart`
- `lib/features/history/widgets/history_recommendation_log.dart`

Regras:
- histórico deve ser legível
- não transformar a tela em despejo de eventos
- comparação precisa ser prática
- se não houver histórico, mostrar vazio útil e próximo passo
- viewmodel deve consolidar snapshots, timeline e diffs

Quero como saída:
- arquivos completos
- tela Histórico funcional
- estrutura pronta para conectar dados persistidos de snapshots
