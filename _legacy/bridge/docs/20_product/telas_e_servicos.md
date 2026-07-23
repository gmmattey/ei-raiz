# Telas e serviços

## Entrada e contexto

### Splash
Serviços:
- `GET /v1/health`
- `GET /v1/auth/session`

Função:
- validar ambiente
- validar sessão
- decidir próxima rota

### Cadastro / Entrada
Serviços:
- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/recover`
- `POST /v1/auth/logout`
- `GET /v1/auth/session`

Função:
- criar usuário
- abrir sessão
- lembrar dispositivo
- recuperar acesso no fluxo inicial por e-mail

### Onboarding
Serviço:
- `PUT /v1/profile/context`

Função:
- coletar renda, objetivo, horizonte, risco e plataformas
- criar ou atualizar contexto financeiro depois da autenticação

## Leitura principal

### Home
Serviços:
- `GET /v1/dashboard/home`
- `GET /v1/analysis`

Função:
- responder como a carteira está
- mostrar principal problema
- mostrar principal ação

### Carteira
Serviço:
- `GET /v1/portfolio`

Função:
- listar categorias e holdings
- permitir filtros
- abrir detalhe

### Detalhe do ativo
Serviço:
- `GET /v1/portfolio/{portfolioId}/holdings/{holdingId}`

Função:
- explicar papel do ativo
- mostrar métricas e contexto

## Atualização de dados

### Importar
Serviço:
- `POST /v1/imports/start`

Função:
- iniciar leitura do arquivo
- preparar preview

### Preview da importação
Serviços:
- `GET /v1/imports/{importId}/preview`
- `POST /v1/imports/{importId}/commit`

Função:
- mostrar o que vai entrar
- tratar inválidos e conflitos
- salvar só após confirmação

### Input manual
Serviço:
- ponte temporária via importação ou endpoint específico futuro

Função:
- permitir cadastro sem arquivo

## Leitura complementar

### Perfil
Serviços:
- `GET /v1/profile/context`
- `PUT /v1/profile/context`
- `GET /v1/health`

Função:
- ajustar contexto
- controlar ghost mode
- ver saúde do app

### Histórico
Serviço:
- `GET /v1/history/snapshots`

Função:
- mostrar evolução
- comparar snapshots
- exibir eventos

### Radar
Serviço:
- `GET /v1/analysis`

Função:
- aprofundar alertas e recomendação principal

## Estados de fallback
- sem carteira
- erro de backend
- fonte externa indisponível
- importação inválida
- conflito de importação

## Regra final
Toda tela precisa ter:
- objetivo claro
- um serviço dominante
- um próximo passo claro
- copy curta e útil
