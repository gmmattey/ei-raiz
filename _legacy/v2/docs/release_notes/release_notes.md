# Release Notes

Nota: entradas antigas preservam nomes e caminhos historicos da epoca em que foram registradas.

## [Laranja Orbital] v2.0.0

### Rebuild completo do app mobile

O app Flutter foi reconstruido para seguir a hierarquia do novo prototipo sem perder a identidade do Esquilo Invest: header com logo + nome, tema dark premium recalibrado para a cor da marca, home com circulo de composicao real da carteira e centro dedicado a rentabilidade total, navegacao inferior redesenhada e quatro frentes reais de uso (`Inicio`, `Carteira`, `Radar` e `Base`).

### Cobertura real do backend

O mobile passou a expor blocos que ja existiam no `dashboard` e nao apareciam na UI anterior, incluindo:
- alertas inteligentes
- ranking de ativos
- historico de decisao
- ordens sugeridas
- perfis de dados
- capacidades operacionais
- resumo de previdencia
- detalhe navegavel por categoria
- detalhe navegavel por ativo com leitura inteligente e link externo

### Observacoes

O endpoint `ai-analysis` continua dependente da chave Gemini no App Script; por isso o app trata a indisponibilidade de forma honesta, sem quebrar o fluxo principal da carteira.
O build Android permanece com nome de app `Esquilo Invest` e versao `2.0.0`, alinhado ao projeto atual.

## Release Note - Pocket Ops v2.1.0

### HOME premium reconstruida

A HOME premium do app Flutter foi reconstruida para seguir a hierarquia do prototipo em um fluxo unico: topo compacto, bloco principal com total investido + gauge de risco + distribuicao, recomendacao dedicada, score resumido, insights em lista e navegacao inferior com aparencia premium.

### Arquivos

Foram ajustados:
- `mobile_app/lib/app/app_theme.dart`
- `mobile_app/lib/features/dashboard/dashboard_screen.dart`
- `mobile_app/lib/features/dashboard/dashboard_home_premium_tab.dart`
- `mobile_app/test/dashboard_ui_audit_test.dart`
- `docs/release_notes/release_notes.md`

### Observacoes

Os dados continuam vindo da integracao existente, sem congelar valores estruturais na HOME.
Os estados de carregamento, erro e falta de configuracao passaram a respeitar a mesma moldura visual da tela principal, sem expor mensagem tecnica ao usuario.

## Release Note - Pocket Ops v2.0.0

### MVP mobile Flutter

Foi criada a base inicial do app mobile em `mobile_app/`, com arquitetura Flutter simples, home tatico-mobile, navegacao para detalhe por categoria, painel de insights e camada HTTP para consumir o AppScript sem duplicar a regra de negocio do dashboard atual.

### Arquivos

Foram ajustados:
- `mobile_app/*`
- `apps_script/backend/Backend_Core.gs`
- `apps_script/backend/Mobile_Api.gs`
- `apps_script/utils/Config.gs`
- `docs/release_notes/release_notes.md`
- `README.md`

### Observacoes

O AppScript continua servindo o `Dashboard.html` por padrao e passa a entregar JSON apenas quando o app Flutter envia `format=json`.
O iPhone fica estruturalmente preparado no projeto Flutter, mas a execucao local real ainda depende de Mac com Xcode e assinatura Apple.

## Release Note - Pocket Recon v1.6.0

### MVP mobile da carteira

O dashboard passou a ter uma experiencia mobile propria no mesmo `Dashboard.html`, com header fixo, hero de patrimonio e score, alocacao por macroclasse, radar da carteira, missao do mes, navegacao curta em tres camadas e painel funcional do Esquilo IA sem duplicar backend nem retrabalhar o desktop.

### Arquivos

Foram ajustados:
- `apps_script/utils/Config.gs`
- `frontend/html/Dashboard.html`
- `docs/release_notes/release_notes.md`
- `README.md`

### Observacoes

O mobile reaproveita o payload atual do dashboard e usa leitura honesta quando ainda nao existe meta de aporte ou reserva explicita na base.
O desktop foi preservado para telas grandes, enquanto a camada mobile assume a navegacao e a hierarquia visual apenas em breakpoints menores.

## Release Note - Trilha de Castanha v1.5.0

### Leitura operacional da carteira

O dashboard passou a usar macroclasses reais no topo da tela, com grafico consolidado de carteira, representatividade com valor, peso e rentabilidade, faixa discreta de insight abaixo do header e tabelas comparativas para fundos de investimento e previdencia.

### Arquivos

Foram ajustados:
- `apps_script/backend/Backend_Core.gs`
- `apps_script/services/Portfolio_Metrics.gs`
- `apps_script/services/Sheet_Readers.gs`
- `apps_script/utils/Config.gs`
- `frontend/html/Dashboard.html`
- `docs/project_context.md`
- `docs/release_notes/release_notes.md`
- `README.md`

### Observacoes

As acoes agora podem ser atualizadas automaticamente sem reload completo da pagina, preservando contexto visual e filtros.
O Esquilo IA ganhou fallback local baseado em regras da carteira para nao deixar o CTA morto quando a resposta remota nao estiver disponivel.

## Release Note - Trilha de Castanha v1.4.0

### Reconsolidacao do frontend

O frontend deixou de depender de includes HTML parciais e voltou a operar em um unico `Dashboard.html`, com HTML, CSS e JavaScript reunidos no mesmo arquivo para garantir compatibilidade total com o Apps Script classico.

### Arquivos

Foram ajustados:
- `apps_script/backend/Backend_Core.gs`
- `apps_script/utils/Config.gs`
- `frontend/html/Dashboard.html`
- `docs/project_context.md`
- `docs/release_notes/release_notes.md`
- `README.md`

### Observacoes

O helper `include(filename)` foi removido porque deixou de participar da execucao real.
Os arquivos HTML parciais da modularizacao devem ser removidos do projeto Apps Script publicado e do repositorio local.

## Release Note - Trilha de Castanha v1.3.1

### Bootstrap e compatibilidade Apps Script

Foram corrigidos os pontos mais sensiveis da modularizacao no frontend classico do Apps Script: bootstrap da tela, rebind de `google.script.run` e exposicao explicita no `window` das funcoes usadas pelos handlers inline do HTML.

### Arquivos

Foram ajustados:
- `apps_script/utils/Config.gs`
- `frontend/html/Dashboard_StateScript.html`
- `frontend/html/Dashboard_EventsScript.html`

### Observacoes

O dashboard passa a tentar reconectar com o bridge do Apps Script quando `google.script.run` ainda nao estiver disponivel no primeiro ciclo de carga.
As funcoes acionadas por `onclick` e `onkeydown` ficaram explicitamente registradas no escopo global para evitar falhas silenciosas em runtime.

## Release Note - Trilha de Castanha v1.3.0

### Frontend modular

O frontend do dashboard foi modularizado para Apps Script com includes server-side, reduzindo o peso do `Dashboard.html` e separando layout, estilos e scripts por responsabilidade.

### Arquivos

Foram ajustados:
- `apps_script/backend/Backend_Core.gs`
- `apps_script/utils/Config.gs`
- `frontend/html/Dashboard.html`
- `frontend/html/Dashboard_Styles.html`
- `frontend/html/Dashboard_SvgSprites.html`
- `frontend/html/Dashboard_Header.html`
- `frontend/html/Dashboard_PortfolioOverview.html`
- `frontend/html/Dashboard_SummaryCards.html`
- `frontend/html/Dashboard_RecommendedAction.html`
- `frontend/html/Dashboard_ActionPlan.html`
- `frontend/html/Dashboard_AISection.html`
- `frontend/html/Dashboard_FeaturePopup.html`
- `frontend/html/Dashboard_StateScript.html`
- `frontend/html/Dashboard_UtilsScript.html`
- `frontend/html/Dashboard_RenderScript.html`
- `frontend/html/Dashboard_EventsScript.html`
- `docs/project_context.md`
- `README.md`

### Observacoes

Foi criado o helper `include(filename)` no Apps Script para montar as parciais via `HtmlService`.
O comportamento visual e as chamadas para `google.script.run` foram preservados sem depender de build, framework ou `import/export`.

## Release Note - Trilha de Castanha v1.1.0

### BigQuery operacional

O dashboard passou a usar o BigQuery como fonte primaria de dados, com fallback controlado para a planilha operacional quando a consulta principal nao estiver disponivel.

### Arquivos

Foram ajustados:
- `apps_script/services/BigQueryService.gs`
- `apps_script/backend/Backend_Core.gs`
- `apps_script/backend/Operational_CRUD.gs`
- `apps_script/services/AI_Service.gs`
- `frontend/html/Dashboard.html`
- `apps_script/utils/Config.gs`
- `docs/project_context.md`
- `README.md`

### Observacoes

Foram adicionadas operacoes basicas de CRUD no backend, sem qualquer execucao financeira real.
A Esquilo IA passou a consumir o contexto consolidado vindo do BigQuery sempre que a fonte principal estiver disponivel.
O frontend recebeu estrutura visual para futuras acoes de status, atualizacao e exclusao, ainda em modo guiado nesta sprint.

## Release Note - Trilha de Castanha v1.0.0

### Bootstrap estrutural

Base reorganizada em camadas claras para Apps Script, frontend, dados, documentacao e planejamento.

### Arquivos

Foram ajustados:
- `apps_script/*`
- `frontend/html/Dashboard.html`
- `data/*`
- `docs/*`
- `plans/*`

### Observacoes

Foram consolidados `docs/project_context.md`, `data/bigquery/table_schemas.md`, `data/mappings/operational_sheet_headers.md`, `plans/roadmap/evolution_tracks.md` e `plans/sprints/backlog.md`.
As notas intermediarias de etapa foram removidas apos consolidacao do contexto.
O release visivel da base foi realinhado para `Trilha de Castanha v1.0.0`.

## Release Note - Mapa de Cobre v1.1.4

### Estabilizacao da IA

Corrigida a falha em que a Esquilo IA descartava respostas uteis por excesso de rigidez no formato final.

### Arquivos

Foram ajustados:
- `AI_Service.gs`

### Observacoes

Quando o provider responder fora do padrao exato, o backend agora monta uma leitura curta e valida a partir do contexto ja calculado da carteira.

## Release Note - Mapa de Cobre v1.1.3

### Chave Gemini

Corrigida a inicializacao da chave Gemini para evitar falha quando `Script Properties` ainda estiver vazia.

### Arquivos

Foram ajustados:
- `API KEY.gs`

### Observacoes

Agora `getGeminiKey_()` reaproveita a chave padrao e a grava automaticamente quando a propriedade ainda nao existe.

## Release Note - Mapa de Cobre v1.1.2

### Chave Gemini

O acesso a `GEMINI_API_KEY` foi movido para um arquivo dedicado, deixando a integracao da IA apontando para `API KEY.gs`.

### Arquivos

Foram ajustados:
- `API KEY.gs`
- `Config.gs`

### Observacoes

O wrapper principal de chamada Gemini foi preservado em `AI_Service.gs` para evitar conflito de funcao global no Apps Script.

## Release Note - Mapa de Cobre v1.1.1

### Atualizacao de Planilha

A referencia principal da planilha operacional foi trocada para o novo Google Sheets oficial do projeto.

### Arquivos

Foram ajustados:
- `Config.gs`
- `Dashboard.html`
- `Esquilo_Invest_Operacional.xlsx`
- `Standalone_Stage_2_Config_Centralization.md`

### Observacoes

O `spreadsheetId` e a `spreadsheetUrl` da base operacional passaram a apontar para a nova planilha publicada.

## Release Note - Mapa de Cobre v1.1.0

### Estabilizacao

Concluida a validacao final da base operacional com alinhamento entre frontend, backend, planilha e camada de sincronizacao com BigQuery.

### Arquivos

Foram ajustados:
- `Esquilo_Invest_Operacional.xlsx`
- `BigQuery_Sync.gs`
- `Config.gs`
- `Dashboard.html`

### Observacoes

O projeto ficou com script local de sync salvo na base e com a aba `Config` populada para evitar sincronizacao vazia.

## Release Note - Mapa de Cobre v1.0.14

### Dados

Atualizada a planilha operacional com os dados mais recentes da fonte Esquilo_Invest_v3 (3), preservando a estrutura das abas operacionais.

### Arquivos

Foram ajustados:
- `Esquilo_Invest_Operacional.xlsx`
- `Operational_Data_Update_Report.md`
- `Config.gs`
- `Dashboard.html`

### Observacoes

Foram descartadas linhas decorativas, totalizadoras, placeholders e registros nao migraveis, sem alterar o modelo da base operacional.

## Release Note - Mapa de Cobre v1.0.13

### Correcao

Executada a varredura de estabilizacao da base operacional, corrigindo comentarios truncados que ocultavam funcoes, eliminando dependencias restantes de planilha ativa e limpando blocos mortos no backend.

### Arquivos

Foram ajustados:
- `Decision_Engine.gs`
- `Portfolio_Metrics.gs`
- `AI_Service.gs`
- `Sheet_Readers.gs`
- `Config.gs`
- `Dashboard.html`

### Observacoes

A base local terminou a sprint sem helpers internos ausentes e sem uso remanescente de `getActiveSpreadsheet()` ou `getActiveSheet()`.

## Release Note - Mapa de Cobre v1.0.12

### Correcao

Corrigidos comentarios de bloco truncados no Portfolio_Metrics.gs em pontos que cercam evaluateStocks_() e buildPortfolioGeneralAdvice_().

### Arquivos

Foram ajustados:
- Portfolio_Metrics.gs
- Config.gs
- Dashboard.html

### Observacoes

A funcao evaluateStocks_() existe na base nova. Se o Apps Script continuar acusando que ela nao esta definida, o Portfolio_Metrics.gs publicado esta desatualizado ou incompleto.

## Release Note - Mapa de Cobre v1.0.11

### Correcao

Alinhado o hotfix do motor de decisao para Apps Script, confirmando a presenca de buildScoredActions_() na base nova e limpando o trecho truncado no fim do Decision_Engine.gs.

### Arquivos

Foram ajustados:
- Decision_Engine.gs
- Config.gs
- Dashboard.html

### Observacoes

Se o Apps Script ainda mostrar buildScoredActions_ is not defined, o Decision_Engine.gs publicado esta desatualizado ou nao foi copiado integralmente para o projeto.

## Release Note - Mapa de Cobre v1.0.10

### Correcao

Corrigido erro de sintaxe no Portfolio_Metrics.gs causado por truncamento no fim do arquivo.

### Arquivos

Foram ajustados:
- Portfolio_Metrics.gs
- Config.gs
- Dashboard.html

### Observacoes

Hotfix localizado para restaurar o fechamento das funcoes finais de metricas sem alterar regra de negocio.

## Release Note - Mapa de Cobre v1.0.9

### Correcao

Corrigido erro de sintaxe no `Backend_Core.gs` causado por um bloco de comentario truncado no fim do arquivo.

### Arquivos

Foram ajustados:
- `Backend_Core.gs`
- `Config.gs`
- `Dashboard.html`

### Observacoes

Hotfix localizado para permitir nova subida da base no Apps Script sem alterar regra de negocio.

## Release Note - Mapa de Cobre v1.0.8

### Estrutura

Adaptado o nucleo do backend para modo Apps Script standalone, com abertura explicita da planilha operacional por ID.

### Backend

Foram ajustados:
- `Config.gs`
- `Backend_Core.gs`
- `Decision_Engine.gs`

O fluxo principal do dashboard passou a usar `SpreadsheetApp.openById(APP_CONFIG_.spreadsheetId)`.

### Observacoes

Ainda restam dependencias de planilha ativa fora do nucleo principal, isoladas para as proximas etapas.
## Release Note - Mapa de Cobre v1.0.7

### Estrutura

Centralizada a configuracao da planilha operacional em `Config.gs` para preparar a base para Apps Script standalone.

### Configuracao

Foram adicionados:
- `APP_CONFIG_.spreadsheetId`
- `APP_CONFIG_.spreadsheetUrl`
- `getOperationalSpreadsheetId_()`
- `getOperationalSpreadsheetUrl_()`

Os nomes das abas operacionais permaneceram concentrados em `APP_CONFIG_.sheetNames`.

### Observacoes

Nenhuma regra de negocio foi alterada nesta etapa.
A troca efetiva do backend para `openById` fica para a etapa seguinte.
## Release Note - Mapa de Cobre v1.0.6

### Estrutura

Executada a auditoria inicial da base operacional para identificar dependencias de planilha ativa antes da adaptacao para Apps Script standalone.

### Auditoria

Foram mapeados pontos que ainda usam `SpreadsheetApp.getActiveSpreadsheet()` em:
- `Backend_Core.gs`
- `AI_Service.gs`
- `Decision_Engine.gs`
- `Sheet_Readers.gs`

Tambem foi confirmado que a base nao usa `getActiveSheet()` nem depende de aba ativa.

### Observacoes

Nenhuma regra de negocio foi alterada nesta etapa.
A entrega foi apenas de diagnostico e preparacao segura da adaptacao standalone.
## Release Note - Mapa de Cobre v1.0.5

### Estrutura

Concluida a validacao final da nova base operacional local do Esquilo Invest.
A estrutura ficou pronta para criacao manual de um novo projeto Google Apps Script, com poucos arquivos, nomes claros e planilha operacional separada.

### Validacao

Foi confirmado:
- pasta nova isolada
- `Dashboard.html` principal
- backend repartido em arquivos `.gs`
- planilha `Esquilo_Invest_Operacional.xlsx` com abas operacionais finais
- dados migrados
- backend adaptado para o novo layout da planilha

### Observacoes

O projeto antigo permaneceu intacto.
A nova base ja pode virar o novo projeto principal.
## Release Note - Mapa de Cobre v1.0.4

### Estrutura

Adaptado o backend da nova base operacional para consumir a planilha `Esquilo_Invest_Operacional.xlsx` sem depender dos offsets frageis da planilha antiga.
A leitura agora assume cabecalho simples na linha 1 e dados a partir da linha 2.

### Backend

Foram ajustados:
- `Config.gs`
- `Backend_Core.gs`
- `Sheet_Readers.gs`

Com isso, a nova base passa a ler `Acoes`, `Fundos`, `Previdencia` e `PreOrdens` no formato operacional migrado.

### Observacoes

O projeto antigo permaneceu intacto.
O frontend foi preservado sem redesign nesta etapa.
## Release Note - Mapa de Cobre v1.0.3

### Estrutura

Copiada a base de runtime para a nova estrutura operacional pensada para Google Apps Script classico.
O backend agora esta repartido em poucos arquivos `.gs`, e o `Dashboard.html` principal ja foi trazido para a nova pasta local.

### Arquivos

Foram reorganizados:
- `Config.gs`
- `Backend_Core.gs`
- `Sheet_Readers.gs`
- `Portfolio_Metrics.gs`
- `Decision_Engine.gs`
- `AI_Service.gs`
- `Dashboard.html`

Tambem foi criado um `Export_Import.gs` simples, com stubs claros para futuras migracoes.

### Observacoes

O projeto antigo permaneceu intacto.
A adaptacao fina do backend para a nova planilha operacional fica na etapa seguinte.
## Release Note - Mapa de Cobre v1.0.2

### Estrutura

Executada a migracao inicial dos dados validos da planilha antiga para `Esquilo_Invest_Operacional.xlsx`.
Esta entrega populou a nova base operacional sem levar banners, totais, linhas decorativas ou instrucoes textuais para o corpo das tabelas.

### Migracao

Foram migrados:
- `Acoes`: 5 linhas operacionais
- `PreOrdens`: 3 linhas operacionais
- `Fundos`: 6 linhas operacionais
- `Previdencia`: 4 linhas operacionais
- `Aportes`: 12 linhas operacionais

Tambem houve ajuste fino de cabecalhos para preservar melhor os dados reais da base antiga, especialmente em `Acoes`, `PreOrdens` e `Aportes`.

### Observacoes

Nao foram migrados:
- totais
- avisos textuais
- linhas `Adicionar novo ...`
- abas auxiliares sem fonte operacional equivalente

## Release Note - Mapa de Cobre v1.0.1

### Estrutura

Criada a nova planilha operacional local `Esquilo_Invest_Operacional.xlsx` dentro da base `EsquiloInvest_BaseOperacional`.
Esta entrega separa a nova operacao da planilha antiga e ja prepara as abas para uma migracao segura dos dados nas proximas etapas.

### Planilha

Foram criadas as abas:
- `Acoes`
- `Fundos`
- `Previdencia`
- `PreOrdens`
- `Aportes`
- `Config`
- `Dashboard_Visual`
- `Export_Auxiliar`

Cada aba operacional recebeu cabecalhos iniciais simples, objetivos e pensados para manutencao no Apps Script.

### Observacoes

Nenhum dado da planilha antiga foi migrado nesta etapa.
A validacao confirmou que o arquivo foi gerado como pacote `.xlsx` valido.

## Release Note - Mapa de Cobre v1.0.0

### Estrutura

Criada a pasta local `EsquiloInvest_BaseOperacional` como nova base independente do projeto.
Esta entrega inicializa a estrutura pensada para Google Apps Script classico, com poucos arquivos, nomes claros e sem dependencia de build.

### Arquivos

Foram criados:
- `Dashboard.html`
- `Config.gs`
- `Backend_Core.gs`
- `Sheet_Readers.gs`
- `Portfolio_Metrics.gs`
- `Decision_Engine.gs`
- `AI_Service.gs`
- `Export_Import.gs`
- `Release_Notes.md`

### Observacoes

Nenhum arquivo do projeto atual foi alterado para compor esta nova base.
O preenchimento funcional desses arquivos acontece nas proximas etapas da migracao.














