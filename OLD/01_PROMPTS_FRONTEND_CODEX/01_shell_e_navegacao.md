# Prompt 01 - Shell e navegação

Você vai trabalhar no app Flutter do Esquilo Invest.

Objetivo desta etapa:
estruturar o shell principal do app, a navegação base e o estado global mínimo, sem quebrar o que já existe implementado.

Contexto importante:
- o projeto já possui base mobile em Flutter
- já existem telas e serviços ligados a dashboard, health e ai-analysis
- não quero reescrever o app do zero
- quero preservar o que já funciona e organizar melhor a arquitetura para suportar a evolução futura
- a navegação alvo do produto deve caminhar para: Home, Carteira, Importar, Perfil e Histórico
- se hoje existir Radar e Base como telas separadas, você deve considerar estratégia de transição e não destruição burra

Sua missão:
1. analisar a estrutura atual do app mobile
2. identificar o ponto de entrada real
3. identificar como a navegação atual funciona
4. refatorar o shell para uma estrutura mais limpa e evolutiva
5. preparar a base para suportar as rotas:
   - /home
   - /portfolio
   - /import
   - /profile
   - /history
   - /holding/:category/:id
   - /radar
   - /onboarding
6. manter compatibilidade com o que já existe hoje, sempre que possível
7. criar uma base clara para que as próximas etapas possam ser implementadas sem gambiarra

Arquivos esperados ou ajustados:
- `lib/app/esquilo_invest_app.dart`
- `lib/app/app_router.dart`
- `lib/app/shell/app_shell.dart`
- `lib/core/state/app_session_store.dart`
- qualquer ajuste mínimo necessário em configuração e rotas

Regras:
- não invente arquitetura super complexa
- não use estado global desnecessário
- não troque tudo só por vaidade
- preserve serviços e modelos já úteis
- se encontrar algo fraco, organize e documente no código
- se houver acoplamento ruim, reduza com pragmatismo
- não deixe código morto espalhado
- não deixe imports quebrados
- mantenha o código pronto para rodar

Quero como saída:
- arquivos completos
- comentários curtos só onde realmente ajudam
- navegação funcionando
- estrutura pronta para as próximas etapas
