# Esquilo Invest - Sprints Executadas

Nota: este arquivo preserva referencias historicas de nomes e caminhos usados nas sprints anteriores.

## Critério de reconstrução

Esta tabela foi reconstruída a partir dos arquivos presentes no repositório, especialmente:

- `Sprint *.txt` na raiz
- `Stage_*.md` e `Standalone_Stage_*.md` na base operacional
- `Release Notes.txt`
- `EsquiloInvest_BaseOperacional/Release_Notes.md`

Quando a trilha não está completa, a coluna de observações marca o item como `inferido`.

| Sprint | Nome da Sprint | Objetivo | Principais Entregas | Arquivos Impactados | Status | Observações |
|---|---|---|---|---|---|---|
| Sprint 1 | Limpeza visual inicial do dashboard | remover banner, ajustar layout e exibir release na interface legada | auditoria visual, remoção de banner, ajuste de layout, exibição de versão | `frontend/layout/dashboard-app.html`, `Release Notes.txt` | Concluída | baseado em `Sprint 1 - Stage 1` a `Stage 5` |
| Sprint 3 | Auditoria da IA e transição de provider | revisar a camada de IA legada e remover dependência antiga de Gemini | auditoria da IA, remoção/substituição de integração anterior de provider | `backend/services/portfolio-dashboard-service.gs`, `frontend/layout/dashboard-app.html` | Parcial | inferido; só existem `Sprint 3 - Stage 1` e `Stage 2` |
| Sprint 4 | Integração de dados externos de mercado | enriquecer ações com contexto público sem quebrar a planilha como fonte primária | escopo mínimo, escolha de fonte, camada de integração, `marketData`, contexto de IA, exposição discreta no frontend, fallback | `backend/services/portfolio-dashboard-service.gs`, `frontend/layout/dashboard-app.html`, `Release Notes.txt` | Concluída | baseado em `Sprint 4 - Stage 1` a `Stage 7` |
| Sprint 5 | Decision Engine | sair de leitura passiva e criar score, ranking e recomendação contextual por ativo | score por ativo, ranking, `smartRecommendation`, uso de dados externos, contexto ampliado da IA | `backend/services/portfolio-dashboard-service.gs`, `Release Notes.txt` | Concluída | baseado em `Sprint 5 - Stage 1` a `Stage 7` |
| Sprint 6 | Plano de ação e histórico de decisões | transformar análise em orientação prática, histórico e alertas | `actionPlan`, prioridade, histórico persistido, avaliação de resultado, alertas inteligentes, bloco visual no frontend | `backend/services/portfolio-dashboard-service.gs`, `frontend/layout/dashboard-app.html`, `Release Notes.txt` | Concluída | baseado em `Sprint 6 - Stage 1` a `Stage 8` |
| Sprint Estrutural A | Base operacional Apps Script-friendly | criar nova base local enxuta para Apps Script com planilha própria | pasta `EsquiloInvest_BaseOperacional`, novos `.gs` por responsabilidade, `Dashboard.html` único, nova planilha operacional, migração de dados | `EsquiloInvest_BaseOperacional/*`, `Esquilo_Invest_Operacional.xlsx` | Concluída | inferido a partir de `Stage_4` a `Stage_8` e do estado atual da base |
| Sprint Estrutural B | Adaptação standalone por Spreadsheet ID | preparar a base nova para Apps Script standalone fora da planilha | centralização de `spreadsheetId`, `openById`, revisão dos leitores, backend standalone | `Config.gs`, `Backend_Core.gs`, `Sheet_Readers.gs`, `Decision_Engine.gs`, `Standalone_Stage_1_*`, `Standalone_Stage_2_*`, `Standalone_Stage_3_*` | Concluída | inferido; a adaptação está materializada no código atual |
| Sprint Técnica | Estabilização da base operacional | corrigir funções ausentes, comentários truncados, dependências quebradas e bugs de IA | correção de `Backend_Core.gs`, `Portfolio_Metrics.gs`, `Decision_Engine.gs`, `AI_Service.gs`, `API KEY.gs`; fallback de resposta válida da IA | `AI_Service.gs`, `API KEY.gs`, `Backend_Core.gs`, `Decision_Engine.gs`, `Portfolio_Metrics.gs`, `Sheet_Readers.gs`, `Release_Notes.md` | Concluída | inferido a partir das releases `Mapa de Cobre v1.0.13` até `v1.1.4` |
| Sprint Dados | Atualização da planilha operacional e compatibilização BigQuery | alinhar planilha operacional com a fonte v3 e com o motor de sync do BigQuery | atualização de dados, cabeçalhos compatíveis, script local `BigQuery_Sync.gs`, aba `Config` populada | `Esquilo_Invest_Operacional.xlsx`, `Operational_Data_Update_Report.md`, `BigQuery_Sync.gs`, `Release_Notes.md` | Concluída | inferido a partir de `v1.0.14`, `v1.1.0` e da presença do script de sync |

## Leitura resumida da evolução

O histórico presente nos arquivos indica três fases claras:

1. base legada focada em dashboard e IA
2. evolução analítica com dados externos, decision engine e plano de ação
3. reestruturação para uma base operacional nova, standalone e integrada a BigQuery

Essa leitura é consistente com os arquivos atuais, mas parte do histórico foi reconstruída por inferência dos artefatos disponíveis.
