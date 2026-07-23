# Prompt 12 - Estados de UX compartilhados

Você vai criar os widgets e padrões compartilhados de UX do app Flutter do Esquilo Invest.

Objetivo desta etapa:
garantir que loading, erro, vazio, retry e ghost mode sejam consistentes no app inteiro.

Arquivos esperados:
- `lib/widgets/loading_skeleton.dart`
- `lib/widgets/error_state.dart`
- `lib/widgets/empty_state.dart`
- `lib/widgets/ghost_value.dart`
- `lib/widgets/retry_banner.dart`

Regras:
- nada de mensagem técnica crua para usuário
- loading não pode dar pulo de layout grotesco
- empty state precisa orientar próximo passo
- error state precisa permitir retry quando fizer sentido
- ghost value precisa ser simples e reaproveitável
- widgets devem aceitar customização mínima sem virar framework interno desnecessário

Quero como saída:
- arquivos completos
- widgets reutilizáveis
- exemplos mínimos de uso nos comentários ou em chamadas reais, se necessário
