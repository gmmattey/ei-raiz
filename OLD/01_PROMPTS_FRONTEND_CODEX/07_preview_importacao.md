# Prompt 07 - Preview da importação

Você vai implementar a tela de preview da importação do app Flutter do Esquilo Invest.

Objetivo desta etapa:
mostrar exatamente o que o app entendeu do arquivo antes de salvar qualquer coisa.

A tela deve conter:
1. resumo da leitura
2. lista dos itens lidos e normalizados
3. alertas de conflito
4. duplicações identificadas
5. itens inválidos ou incompletos
6. CTA para confirmar e salvar
7. opção para voltar e corrigir

Arquivos esperados:
- `lib/features/import/import_preview_screen.dart`
- `lib/features/import/import_preview_viewmodel.dart`
- `lib/features/import/widgets/import_preview_list.dart`
- `lib/features/import/widgets/import_conflict_panel.dart`

Regras:
- não esconder conflito importante
- não maquiar dado ruim
- a tela tem que deixar claro o que entra e o que não entra
- separar bem itens válidos, inválidos e duplicados
- viewmodel deve receber dados já parseados e organizar visualização
- salvar deve ser ação explícita do usuário

Quero como saída:
- arquivos completos
- preview clara e revisável
- integração com confirmação final de salvar a carteira atualizada
