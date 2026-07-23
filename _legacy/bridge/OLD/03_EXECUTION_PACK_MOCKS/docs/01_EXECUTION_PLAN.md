# Plano de execução

## Objetivo da fase 1

Entregar uma base funcional do produto, com:
- shell
- navegação
- home
- carteira
- detalhe do ativo
- perfil
- mocks locais realistas
- estados de loading, erro e vazio
- contratos estáveis para app e web

## O que fica para depois

Só entra depois que a base estiver estável:
- importação real de arquivo
- persistência real no backend
- snapshots reais
- histórico real
- análise real
- benchmarks externos
- IA real
- autenticação completa
- observabilidade completa

## Sequência obrigatória

### Etapa 1
Montar shell, rotas, tema, navegação, estado global e troca de ambiente.

### Etapa 2
Plugar fonte de dados local mockada e validar Home, Carteira, Detalhe do Ativo, Perfil.

### Etapa 3
Criar camada de adapters para que web e app usem os mesmos contratos.

### Etapa 4
Substituir o provider local por provider HTTP mantendo os contratos.

### Etapa 5
Entrar com importação, preview e commit.

### Etapa 6
Entrar com snapshots, histórico e análise.

### Etapa 7
Entrar com dados externos, cache, fallback, segurança e endurecimento.

## Regra de ouro

Nenhuma tela nasce primeiro ligada em backend complexo.
Primeiro ela fica boa com mock local.
Depois o backend encaixa.
