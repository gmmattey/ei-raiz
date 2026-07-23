# Prompt 02 - Home

Você vai implementar ou refatorar a Home do app Flutter do Esquilo Invest.

Objetivo desta etapa:
fazer a Home responder rapidamente três coisas:
- como a carteira está
- qual é o principal problema
- qual é a ação principal da rodada

Contexto importante:
- o app já possui payload consolidado vindo do backend
- já existem dados como summary, score, actionPlan, portfolioDecision, categorySnapshots, sourceWarning e updatedAt
- hoje a base existente tem blocos demais competindo entre si
- eu não quero uma home confusa
- eu quero uma home com hierarquia forte e leitura rápida

A Home final deve conter:
1. hero principal com:
   - patrimônio total
   - rentabilidade consolidada
   - status da carteira
2. bloco de problema principal
3. bloco de ação principal
4. score explicado em linguagem simples
5. distribuição por categoria e origem
6. insights curtos e secundários
7. estado de atualização e fonte, sem poluir a tela

Arquivos esperados ou ajustados:
- `lib/features/home/home_screen.dart`
- `lib/features/home/home_viewmodel.dart`
- `lib/features/home/widgets/home_hero.dart`
- `lib/features/home/widgets/home_primary_problem.dart`
- `lib/features/home/widgets/home_primary_action.dart`
- `lib/features/home/widgets/home_score_explainer.dart`
- `lib/features/home/widgets/home_distribution.dart`
- `lib/features/home/widgets/home_insights.dart`

Regras:
- não transformar a home em painel bagunçado
- reduzir ruído visual
- manter CTA principal claro
- nada de blocos brigando entre si
- usar o payload real já disponível
- se algum campo vier vazio, tratar com estado elegante
- não deixar mensagem técnica crua aparecendo
- manter compatibilidade com o que já existe de tema e estilo, mas melhorando hierarquia

Quero como saída:
- arquivos completos
- composição final da Home
- viewmodel para derivar a leitura da tela
- navegação a partir da Home para Carteira, Radar ou detalhe relevante quando fizer sentido
