# Prompt 03 - Carteira

Você vai implementar ou refatorar a tela Carteira do app Flutter do Esquilo Invest.

Objetivo desta etapa:
dar leitura útil da carteira inteira por relevância, categoria e contexto, sem parecer planilha mal vestida.

Contexto importante:
- já existem holdings vindas do payload principal
- hoje o app já tem blocos como ações, fundos e previdência
- também já existem ordens sugeridas e alguma leitura de contexto
- preciso transformar isso numa tela de carteira realmente navegável e útil

A tela Carteira deve conter:
1. lista principal de holdings ordenada por relevância prática
2. agrupamento por categoria
3. filtros úteis:
   - categoria
   - plataforma/origem
   - nível de atenção
   - peso na carteira
4. ordens sugeridas, se existirem
5. comparações ou resumos rápidos quando o payload permitir
6. navegação para detalhe do ativo

Arquivos esperados ou ajustados:
- `lib/features/portfolio/portfolio_screen.dart`
- `lib/features/portfolio/portfolio_viewmodel.dart`
- `lib/features/portfolio/portfolio_filters_store.dart`
- `lib/features/portfolio/widgets/portfolio_filters_bar.dart`
- `lib/features/portfolio/widgets/portfolio_group_section.dart`
- `lib/features/portfolio/widgets/portfolio_holding_tile.dart`
- `lib/features/portfolio/widgets/portfolio_orders_card.dart`

Regras:
- não encher a tela de elementos decorativos
- filtro tem que servir para alguma coisa
- agrupamento tem que facilitar leitura
- tile de ativo precisa permitir leitura rápida
- não quebrar as categorias já existentes
- tratar listas vazias, filtro vazio e dados parciais com elegância
- não deixar lógica pesada dentro do widget principal

Quero como saída:
- arquivos completos
- viewmodel ou store de filtros funcionando
- tela Carteira navegando corretamente para detalhe do ativo
