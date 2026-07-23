# Prompt 06 - Importar

Você vai implementar a tela Importar do app Flutter do Esquilo Invest.

Objetivo desta etapa:
permitir que o usuário envie um CSV ou extrato e siga com confiança para uma revisão antes de salvar.

A tela deve conter:
1. entrada de arquivo
2. seleção de origem, quando necessário
3. instruções simples
4. status de upload e leitura
5. transição segura para preview

Arquivos esperados:
- `lib/features/import/import_screen.dart`
- `lib/features/import/import_controller.dart`
- `lib/features/import/widgets/import_file_picker.dart`
- `lib/features/import/widgets/import_source_selector.dart`

Regras:
- não fingir que importou se falhar
- tratar arquivo inválido com clareza
- tratar formato não reconhecido com clareza
- controller deve separar bem:
  - upload/entrada
  - leitura
  - parse inicial
  - navegação para preview
- não misturar regra pesada de normalização nesta tela

Quero como saída:
- arquivos completos
- controller funcionando
- tela Importar navegando corretamente para a preview
