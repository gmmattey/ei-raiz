# Padrao visual base do webapp

## Fonte obrigatoria

Este documento nao cria nova identidade.

Ele apenas consolida a aplicacao pratica de:
- `docs/brand/esquilo_design_system.md`
- `docs/brand/esquilo_brand_guide.md`
- `docs/brand/esquilo_ui_examples.md`

## Principio central

O produto precisa ajudar o usuario a entender e agir.

Se um elemento nao melhora leitura, decisao ou proximo passo, ele nao entra.

## Paleta base aplicada

### Fundo
- `#061018`

### Card
- `#0C1823`

### Texto principal
- `#EFF5F7`

### Texto de apoio
- `#9DB1BC`

### Cor de clareza e acao primaria
- `#56D5DE`

### Cor de acao de destaque
- `#F7B955`

### Positivo
- `#7ED9A3`

### Alerta
- `#FF6B6B`

## Tipografia base

### Titulo principal
- familia: `Sora`
- tamanho: `28px`
- peso: `700`

### Titulo de secao
- familia: `Sora`
- tamanho: `22px`
- peso: `700`

### Corpo
- familia: `Inter`
- tamanho: `14px`

### Dados e numeros
- familia: `Inter`
- usar `tabular nums`

## Grid e espacamento

- base unica: `8px`
- nenhum espacamento arbitrario
- padding horizontal mobile: `16px`
- padding desktop: `24px`
- gap padrao entre secoes: `24px`

## Estrutura do shell

### Navegacao principal
- lateral fixa no web
- itens: Home, Carteira, Importacoes, Historico, Radar, Perfil

### Barra superior
- titulo da tela
- subtitulo curto quando necessario
- acoes rapidas
- contexto operacional ou status quando fizer sentido

### Conteudo
- leitura vertical
- bloco principal acima
- blocos secundarios abaixo
- rail contextual so quando trouxer ganho real

## Componentes base

### Card
- fundo `#0C1823`
- raio `16px`
- padding `16px`
- usar para resumo, alerta, acao e grupos de leitura

### Botao primary
- fundo `#56D5DE`
- texto `#061018`
- raio `12px`

### Botao secondary
- fundo transparente
- borda `#56D5DE`
- raio `12px`

### Botao danger
- fundo `#FF6B6B`
- raio `12px`

### Lista
- preferir linhas ou cards compactos
- cada item precisa ter titulo, contexto curto e acao possivel

### Tabela
- usar so quando a comparacao tabular for inevitavel
- oferecer alternativa empilhavel no futuro mobile

### Modal
- usar apenas para confirmacao, risco ou decisao irreversivel
- nao esconder conteudo principal em modal

### Estados
- loading: skeleton
- empty: mensagem clara + proximo passo
- error: mensagem humana + acao de recuperacao

## Hierarquia por tipo de tela

### Home
- patrimonio
- problema principal
- acao principal
- distribuicao
- insights

### Carteira
- resumo
- filtros
- agrupamentos
- holdings

### Detalhe
- cabecalho
- metricas
- sinais
- recomendacao

### Importacao
- instruir
- revisar
- decidir

### Radar
- score
- problema
- acao
- alertas

### Perfil
- contexto
- preferencias
- saude

## Regras para futura adaptacao mobile

- toda secao precisa caber empilhada
- evitar dependencia de tabela larga
- separar navegacao global de navegacao contextual
- cards e listas precisam funcionar como blocos independentes
- formularios devem ser compostos por etapas curtas

## Regra final

Este padrao visual base existe para estruturar o webapp.

Nao e etapa de acabamento.
Nao e etapa de exploracao estetica.
Nao autoriza trocar paleta, tipografia ou hierarquia ja definidas.
