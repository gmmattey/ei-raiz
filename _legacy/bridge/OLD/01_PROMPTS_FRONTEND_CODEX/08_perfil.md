# Prompt 08 - Perfil

Você vai implementar ou refatorar a tela Perfil do app Flutter do Esquilo Invest.

Objetivo desta etapa:
permitir revisão do contexto do usuário, transparência sobre o app e controle de privacidade visual.

A tela deve conter:
1. bloco de contexto financeiro
2. bloco de saúde do app/backend
3. bloco de fontes de dados
4. modo ghost para mascarar valores sensíveis
5. bloco Sobre com proposta do produto

Arquivos esperados:
- `lib/features/profile/profile_screen.dart`
- `lib/features/profile/profile_viewmodel.dart`
- `lib/features/profile/widgets/profile_context_card.dart`
- `lib/features/profile/widgets/profile_health_card.dart`
- `lib/features/profile/widgets/profile_sources_card.dart`
- `lib/features/profile/widgets/profile_privacy_card.dart`
- `lib/features/profile/widgets/about_card.dart`

Regras:
- contexto deve ser editável
- health não pode parecer painel técnico interno
- ghost mode deve ser simples e consistente
- tela Sobre deve ser curta, clara e útil
- não poluir a tela com detalhes irrelevantes
- tratar saúde indisponível e fonte parcial com elegância

Quero como saída:
- arquivos completos
- tela Perfil funcional
- ghost mode aplicado aos valores exibidos nessa tela e pronto para reuso
