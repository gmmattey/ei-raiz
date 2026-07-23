# Prompt 05 - Onboarding

Você vai implementar o fluxo de onboarding do app Flutter do Esquilo Invest.

Objetivo desta etapa:
coletar o contexto inicial do usuário sem parecer cadastro chato de banco.

O fluxo deve captar:
- renda ou faixa de renda
- objetivo financeiro
- horizonte
- tolerância a risco
- plataformas usadas
- confirmação final do contexto

Etapas esperadas:
1. boas-vindas com proposta do app
2. perfil financeiro
3. plataformas e origens
4. revisão e confirmação final

Arquivos esperados:
- `lib/features/onboarding/onboarding_screen.dart`
- `lib/features/onboarding/onboarding_store.dart`
- `lib/features/onboarding/steps/welcome_step.dart`
- `lib/features/onboarding/steps/profile_step.dart`
- `lib/features/onboarding/steps/platforms_step.dart`
- `lib/features/onboarding/steps/review_step.dart`

Regras:
- linguagem simples
- fluxo leve
- sem excesso de campos na mesma etapa
- precisa ser fácil voltar e editar
- persistir progresso local se possível
- não depender de backend para cada clique do fluxo
- o resultado final deve gerar um objeto de contexto do usuário utilizável pelo app

Quero como saída:
- arquivos completos
- store do onboarding
- navegação entre etapas
- conclusão salvando o contexto básico
