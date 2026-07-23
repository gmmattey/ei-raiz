# Esquilo Invest - Documento Funcional

## Escopo deste documento

Este documento descreve o sistema com base no estado atual dos arquivos do projeto em `EsquiloInvest_BaseOperacional`.
O diretório raiz ainda contém artefatos legados, anotações de auditoria e a base anterior, mas o runtime operacional atual está concentrado na base operacional.

## 1. Visão geral do sistema

O Esquilo Invest é um dashboard de acompanhamento de carteira construído para Google Apps Script, com interface HTML e base principal em Google Sheets.

O objetivo do sistema é:

- consolidar a carteira em um painel único
- organizar posições de ações, fundos, previdência, aportes e pré-ordens
- gerar métricas e recomendações sem executar ordens financeiras
- oferecer uma camada de leitura assistida por IA
- manter uma trilha simples de decisões e alertas
- sincronizar dados estruturados com BigQuery

Em termos funcionais, o sistema atua como uma camada de leitura, decisão e acompanhamento. Ele não automatiza compra, venda ou integração com corretoras.

## 2. Principais funcionalidades

### Dashboard principal

O dashboard apresenta:

- patrimônio consolidado
- resumo executivo
- score e perfil da carteira
- visão por categoria
- lista detalhada de ações
- leitura resumida de fundos e previdência
- alertas e próximas ordens
- plano de ação
- análise da Esquilo IA

### Análise de carteira

O sistema lê a planilha operacional, normaliza os dados e transforma isso em:

- resumo financeiro consolidado
- distribuição entre categorias
- performance geral
- status por categoria
- perfil do investidor
- score consolidado

### Recomendações

As recomendações aparecem em mais de uma camada:

- recomendação simples por ativo
- recomendação contextual por ativo
- decisão consolidada da carteira
- plano de ação com prioridade única
- alertas inteligentes

### Esquilo IA

A IA usa o contexto consolidado da carteira para entregar uma leitura curta em linguagem simples.

Ela considera:

- resumo executivo
- score e perfil
- ranking de ativos
- alertas
- decisão consolidada
- sinais externos de mercado quando existirem

Se a resposta do provider vier fora do formato esperado, o backend monta um fallback textual válido para não deixar a interface sem leitura.

### Integração com planilha

A planilha operacional é a principal fonte de dados do sistema.

Ela organiza:

- ações
- fundos
- previdência
- pré-ordens
- aportes
- configurações

Além disso, o backend pode criar abas internas ocultas para cache de mercado e histórico de decisões.

### Integração com banco de dados

Existe uma camada de sincronização com BigQuery para enviar e puxar dados estruturados por tabela.

Essa integração é separada do dashboard. O objetivo dela é:

- persistir dados estruturados por aba
- permitir leitura e escrita por tabela
- manter compatibilidade por nome exato dos cabeçalhos

## 3. Fluxo do usuário

### Entrada de dados

O fluxo normal começa na planilha operacional.

O usuário atualiza:

- posições em ações
- fundos
- previdência
- pré-ordens
- aportes
- parâmetros simples em `Config`

### Processamento

Quando o dashboard é carregado:

1. o Apps Script abre a planilha operacional por `Spreadsheet ID`
2. os leitores normalizam cada aba
3. o backend consolida métricas e resumo
4. o Decision Engine calcula score, ranking, recomendações, plano e alertas
5. a IA recebe esse contexto e monta uma leitura geral

### Exibição

O frontend renderiza:

- cabeçalho com score, nível e resumo
- cards por bloco de patrimônio
- tabela de ações
- listas resumidas de fundos e previdência
- alertas e pré-ordens
- plano de ação
- bloco da Esquilo IA

## 4. Estrutura da carteira

### Ações

É a categoria mais detalhada do sistema.

Ela suporta:

- ticker
- quantidade
- preço médio
- cotação atual
- valor investido
- valor atual
- stop
- rentabilidade
- score por ativo
- recomendação contextual
- dados externos de mercado

### Fundos

São tratados como uma categoria passiva com leitura simplificada.

O sistema acompanha:

- nome do fundo
- plataforma
- categoria
- estratégia
- valor investido
- valor atual
- rentabilidade
- recomendação resumida

### Previdência

A previdência também entra como bloco passivo, mas com atenção à instituição, ao plano e ao tipo.

O sistema acompanha:

- plano
- plataforma
- tipo
- estratégia
- valor investido
- valor atual
- rentabilidade

### Aportes

Os aportes formam o histórico de entrada de capital, útil para integração analítica e sincronização com o banco.

### Pré-ordens

As pré-ordens funcionam como apoio tático do dashboard.

Elas não executam nada, mas ajudam a visualizar:

- tipo de ordem
- ativo
- quantidade
- preço-alvo
- validade
- valor potencial
- cotação atual

## 5. Como o sistema toma decisões

### Regras gerais

O sistema combina:

- performance do ativo
- concentração na carteira
- risco e stop
- contexto de mercado quando disponível
- volatilidade simples

Com isso ele produz:

- score por ativo
- status do ativo
- ranking de prioridade
- recomendação contextual

Em nível de carteira, ele também produz:

- status por categoria
- decisão consolidada
- score geral
- perfil
- plano de ação

### Comportamento da IA

A Esquilo IA não toma decisões automáticas. Ela transforma o contexto do sistema em uma explicação curta e prática.

O papel da IA é:

- traduzir o estado da carteira para linguagem simples
- priorizar pontos de risco e oportunidade
- sugerir ações em formato legível
- manter coerência com o motor de decisão já calculado no backend

## 6. Limitações atuais

- o sistema depende da qualidade da planilha operacional
- exportação PDF, exportação CSV e importação CSV ainda estão em modo stub na base operacional
- a sincronização com BigQuery existe como script separado e não como parte nativa do fluxo do dashboard
- a IA depende de chave válida do Gemini e, opcionalmente, de fallback OpenAI
- alguns recursos visuais do frontend ainda mostram placeholders de “gráfico e análise” fora do núcleo principal
- a base atual convive com arquivos legados na raiz do repositório, o que exige clareza sobre qual é o runtime oficial

## 7. Leitura funcional resumida

O Esquilo Invest atual é uma aplicação de leitura e decisão para carteira pessoal baseada em planilha.

Funcionalmente, ele já cobre:

- consolidação da carteira
- priorização de ativos
- recomendações táticas
- plano de ação
- histórico de decisão
- alertas inteligentes
- análise por IA
- sincronização estruturada com BigQuery

O ponto central do sistema é a combinação entre planilha operacional, backend em Apps Script e frontend único em HTML.
