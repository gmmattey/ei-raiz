# MVP e fases

## MVP

O MVP do projeto novo deve provar a espinha dorsal do produto.

Ele precisa entregar:
- entrada simples do usuário
- onboarding curto
- home com leitura principal da carteira
- carteira por categoria e por ativo
- detalhe do ativo
- perfil com contexto financeiro
- input manual de dados
- importação com preview antes de salvar
- histórico básico
- radar com leitura curta
- fallbacks úteis quando faltar dado

## O que fica para depois

Depois do MVP entram:
- importação mais robusta
- PDF com IA para layouts conhecidos
- snapshots mais sofisticados
- benchmark externo mais completo
- análise mais profunda
- dados de mercado mais ricos
- endurecimento de observabilidade e segurança

## Fases sugeridas

### Fase 1
- shell
- router
- mocks
- home
- carteira
- detalhe
- onboarding
- perfil
- fallbacks

### Fase 2
- backend real de leitura
- health
- contexto do usuário
- home real
- carteira real
- detalhe real

### Fase 3
- importação real
- preview real
- commit real
- snapshot básico
- timeline básica

### Fase 4
- análise real persistida
- radar real
- inteligência contextual

### Fase 5
- dados externos
- benchmark
- endurecimento
- melhoria contínua

## Regra prática

Desenvolvimento complexo vem por último.
Tudo que depende de parser difícil, dado externo instável ou integração chata não deve travar a base do produto.
