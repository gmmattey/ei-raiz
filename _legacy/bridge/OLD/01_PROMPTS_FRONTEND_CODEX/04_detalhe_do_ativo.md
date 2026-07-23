# Prompt 04 - Detalhe do ativo

Você vai implementar ou refatorar a tela de detalhe do ativo do app Flutter do Esquilo Invest.

Objetivo desta etapa:
explicar de forma útil o papel, peso, risco e direção de cada ativo.

Contexto importante:
- já existe base parcial de detalhe do ativo
- já existem dados como holding, ranking, contexto da categoria, source profile e smart recommendation
- não quero uma tela que só repita números
- quero uma tela que ajude o usuário a entender aquele ativo dentro da carteira

A tela deve conter:
1. cabeçalho com nome, subtítulo e recomendação
2. métricas principais
3. leitura inteligente do ativo
4. score e motivos, quando existirem
5. contexto da categoria
6. CTA para abrir plataforma ou referência externa, quando existir
7. fallback elegante quando algum bloco não existir

Arquivos esperados ou ajustados:
- `lib/features/holding/holding_detail_screen.dart`
- `lib/features/holding/holding_detail_viewmodel.dart`
- `lib/features/holding/widgets/holding_metrics_grid.dart`
- `lib/features/holding/widgets/holding_ai_read.dart`
- `lib/features/holding/widgets/holding_category_context.dart`
- `lib/features/holding/widgets/holding_external_cta.dart`

Regras:
- nada de tela verborrágica
- cada bloco deve responder uma pergunta real do usuário
- evitar repetir informação em vários lugares
- manter navegação de volta estável
- não exibir link externo sem validação mínima
- tratar ausência de ranking, score ou contexto sem quebrar a UX

Quero como saída:
- arquivos completos
- tela funcional
- viewmodel consolidando os dados necessários
