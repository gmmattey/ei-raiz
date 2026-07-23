# Prompt 13 - Testes, refino e endurecimento

Você vai fazer a etapa de endurecimento do app Flutter do Esquilo Invest.

Objetivo desta etapa:
reduzir fragilidade, melhorar previsibilidade e fechar o app com menos gambiarra.

Frentes desta etapa:
1. revisar rotas e contratos consumidos
2. revisar segredos e configurações frágeis
3. revisar cache e invalidação mínima
4. revisar observabilidade e health
5. criar testes pragmáticos
6. revisar estados de erro, vazio e fallback nas telas principais

Pontos de atenção:
- não deixar token ou segredo hardcoded onde não deve
- revisar dependências frágeis de ambiente
- validar fluxos críticos:
  - bootstrap
  - home
  - carteira
  - detalhe do ativo
  - onboarding
  - importar
  - preview importação
- ampliar ou corrigir testes existentes quando necessário

Quero como saída:
- arquivos ajustados
- testes criados ou ampliados
- código mais robusto sem reescrever o projeto todo
- breve explicação inline no código só onde isso evitar erro futuro
