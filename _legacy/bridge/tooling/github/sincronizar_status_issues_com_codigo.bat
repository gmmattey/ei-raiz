@echo off
setlocal

set "REPO=serealdemanga/Quebra_Nozes"
set "MODE=%~1"
if "%MODE%"=="" set "MODE=dry-run"

set "WORKDIR=%TEMP%\qn_issue_status_sync"
if not exist "%WORKDIR%" mkdir "%WORKDIR%"

echo.
echo Repositorio: %REPO%
echo Modo: %MODE%
echo.

call :write_templates

rem US - backlog funcional sem app integrado
call :comment_range 12 111 us_sem_evidencia.txt

rem UX - documentado ou prototipado, sem frontend integrado
call :comment_range 112 169 ux_parcial.txt

rem TEC - base backend e contratos
call :comment_range 170 172 tec_fundacao_parcial.txt
call :issue_comment 173 tec_schema_conflitado.txt
call :comment_range 174 176 tec_d1_base_parcial.txt
call :comment_range 177 193 tec_backend_parcial.txt
call :issue_comment 194 tec_dominios_parcial.txt
call :issue_comment 195 tec_planned_orders_sem_evidencia.txt
call :issue_comment 196 tec_contrato_analise_parcial.txt
call :issue_comment 197 tec_score_parcial.txt
call :issue_comment 198 tec_alertas_parcial.txt
call :issue_comment 199 tec_recomendacao_parcial.txt
call :issue_comment 200 tec_traducao_ia_sem_evidencia.txt
call :issue_comment 201 tec_auth_parcial.txt
call :comment_range 202 205 tec_expansao_backend_sem_evidencia.txt
call :issue_comment 206 tec_contratos_compartilhados_parcial.txt
call :comment_range 207 214 tec_frontend_sem_evidencia.txt
call :comment_range 215 219 tec_qualidade_operacao_sem_evidencia.txt

rem E2E - sem aplicacao integrada suficiente
call :comment_range 220 244 e2e_sem_evidencia.txt

rem Issues operacionais recentes
call :issue_done 254 tec_051_done.txt
call :issue_done 255 tec_052_done.txt
call :issue_done 256 tec_053_done.txt
call :issue_done_remove_progress 257 tec_054_done.txt

echo.
echo Lote montado.
echo Use:
echo   %~nx0 apply
echo para aplicar de verdade.
echo.
goto :eof

:comment_range
set "START=%~1"
set "END=%~2"
set "BODY=%~3"
for /L %%I in (%START%,1,%END%) do call :issue_comment %%I "%BODY%"
goto :eof

:issue_comment
set "ISSUE=%~1"
set "BODY=%~2"
if /I "%MODE%"=="apply" (
  gh issue comment %ISSUE% --repo %REPO% --body-file "%WORKDIR%\%BODY%"
) else (
  echo [dry-run] gh issue comment %ISSUE% --repo %REPO% --body-file "%WORKDIR%\%BODY%"
)
goto :eof

:issue_done
set "ISSUE=%~1"
set "BODY=%~2"
call :issue_comment %ISSUE% "%BODY%"
if /I "%MODE%"=="apply" (
  gh issue edit %ISSUE% --repo %REPO% --add-label "DONE"
) else (
  echo [dry-run] gh issue edit %ISSUE% --repo %REPO% --add-label "DONE"
)
goto :eof

:issue_done_remove_progress
set "ISSUE=%~1"
set "BODY=%~2"
call :issue_comment %ISSUE% "%BODY%"
if /I "%MODE%"=="apply" (
  gh issue edit %ISSUE% --repo %REPO% --remove-label "IN PROGRESS" --add-label "DONE"
) else (
  echo [dry-run] gh issue edit %ISSUE% --repo %REPO% --remove-label "IN PROGRESS" --add-label "DONE"
)
goto :eof

:write_templates
> "%WORKDIR%\us_sem_evidencia.txt" (
  echo Status baseado no codigo: sem_evidencia_suficiente
  echo.
  echo Evidencia real:
  echo - ainda nao existe frontend integrado executavel em `apps/web`
  echo - a jornada funcional do usuario nao esta pronta ponta a ponta na `main`
  echo - existem contratos, prototipos e partes do backend, mas nao a entrega de produto final desta historia
  echo.
  echo Estimativa atual da tarefa:
  echo - 8h a 24h, dependendo da dependencia tecnica da frente correspondente
  echo.
  echo Veredito:
  echo - manter aberta
  echo - nao marcar como concluida sem nova evidencia de fluxo integrado
)

> "%WORKDIR%\ux_parcial.txt" (
  echo Status baseado no codigo: parcial
  echo.
  echo Evidencia real:
  echo - existe documentacao, wireframe ou prototipo relacionado a esta frente
  echo - o frontend oficial ainda nao esta integrado ao backend novo
  echo.
  echo Estimativa atual da tarefa:
  echo - 6h a 16h por issue, depois de shell, router e data source oficial
  echo.
  echo Veredito:
  echo - nao marcar como concluida
  echo - tratar como frente parcialmente especificada, nao entregue
)

> "%WORKDIR%\tec_fundacao_parcial.txt" (
  echo Status baseado no codigo: parcial
  echo.
  echo Evidencia real:
  echo - existe starter Cloudflare Worker ^+ D1 em `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter`
  echo - existem `wrangler.toml`, rotas base e contrato inicial
  echo - a fronteira oficial de backend ainda nao esta consolidada
  echo.
  echo Estimativa atual da tarefa:
  echo - 2h a 8h por issue para consolidacao final na trilha oficial
)

> "%WORKDIR%\tec_schema_conflitado.txt" (
  echo Status baseado no codigo: conflitado
  echo.
  echo Evidencia real:
  echo - coexistem `database/d1/schema.sql` e `OLD/banco_legado/01_schema.sql`
  echo - as duas referencias nao descrevem exatamente o mesmo modelo
  echo.
  echo Estimativa atual da tarefa:
  echo - 4h a 8h para fechar fonte oficial de schema e rebaixar a concorrente
)

> "%WORKDIR%\tec_d1_base_parcial.txt" (
  echo Status baseado no codigo: parcial
  echo.
  echo Evidencia real:
  echo - existem schema, seed e repositorios no starter
  echo - a base existe, mas ainda sem consolidacao oficial unica
  echo.
  echo Estimativa atual da tarefa:
  echo - 3h a 8h por issue para consolidar e estabilizar
)

> "%WORKDIR%\tec_backend_parcial.txt" (
  echo Status baseado no codigo: parcial
  echo.
  echo Evidencia real:
  echo - ha rotas e servicos reais no starter para health, home, carteira, detalhe, perfil, historico e importacao
  echo - parte relevante do backend ja existe, mas ainda vive em starter e nao em fronteira oficial fechada
  echo.
  echo Estimativa atual da tarefa:
  echo - 3h a 12h por issue, conforme a complexidade da consolidacao final
)

> "%WORKDIR%\tec_dominios_parcial.txt" (
  echo Status baseado no codigo: parcial
  echo.
  echo Evidencia real:
  echo - existe base de ativos, categorias e plataformas no schema e em partes do fluxo de importacao
  echo - a cobertura ainda nao esta consolidada como dominio fechado
  echo.
  echo Estimativa atual da tarefa:
  echo - 4h a 10h
)

> "%WORKDIR%\tec_planned_orders_sem_evidencia.txt" (
  echo Status baseado no codigo: sem_evidencia_suficiente
  echo.
  echo Evidencia real:
  echo - nao ha implementacao integrada suficiente de planned orders e contribuicoes no backend atual
  echo.
  echo Estimativa atual da tarefa:
  echo - 6h a 14h
)

> "%WORKDIR%\tec_contrato_analise_parcial.txt" (
  echo Status baseado no codigo: parcial
  echo.
  echo Evidencia real:
  echo - existem contratos e regras de analise, score e recomendacao
  echo - a fronteira oficial ainda nao esta consolidada
  echo.
  echo Estimativa atual da tarefa:
  echo - 3h a 6h
)

> "%WORKDIR%\tec_score_parcial.txt" (
  echo Status baseado no codigo: parcial
  echo.
  echo Evidencia real:
  echo - existe motor deterministico em `backend/modules/score`
  echo - ainda falta encaixe oficial de runtime
  echo.
  echo Estimativa atual da tarefa:
  echo - 4h a 8h
)

> "%WORKDIR%\tec_alertas_parcial.txt" (
  echo Status baseado no codigo: parcial
  echo.
  echo Evidencia real:
  echo - existem regras de alerta em `backend/modules/alerts`
  echo - ainda falta consolidacao operacional e integracao completa
  echo.
  echo Estimativa atual da tarefa:
  echo - 4h a 8h
)

> "%WORKDIR%\tec_recomendacao_parcial.txt" (
  echo Status baseado no codigo: parcial
  echo.
  echo Evidencia real:
  echo - existem contratos e pontos de produto para recomendacao contextual
  echo - nao ha entrega fechada desta camada em runtime oficial
  echo.
  echo Estimativa atual da tarefa:
  echo - 6h a 12h
)

> "%WORKDIR%\tec_traducao_ia_sem_evidencia.txt" (
  echo Status baseado no codigo: sem_evidencia_suficiente
  echo.
  echo Evidencia real:
  echo - nao ha camada oficial consolidada de traducao por IA integrada ao backend novo
  echo.
  echo Estimativa atual da tarefa:
  echo - 6h a 12h
)

> "%WORKDIR%\tec_auth_parcial.txt" (
  echo Status baseado no codigo: parcial
  echo.
  echo Evidencia real:
  echo - existem rotas de auth no starter
  echo - a autenticacao minima existe parcialmente, mas ainda sem consolidacao final de fronteira oficial
  echo.
  echo Estimativa atual da tarefa:
  echo - 4h a 10h
)

> "%WORKDIR%\tec_expansao_backend_sem_evidencia.txt" (
  echo Status baseado no codigo: sem_evidencia_suficiente
  echo.
  echo Evidencia real:
  echo - esta frente ainda nao tem implementacao integrada suficiente na `main`
  echo - pode existir documentacao ou schema de apoio, mas nao entrega fechada
  echo.
  echo Estimativa atual da tarefa:
  echo - 6h a 16h por issue
)

> "%WORKDIR%\tec_contratos_compartilhados_parcial.txt" (
  echo Status baseado no codigo: parcial
  echo.
  echo Evidencia real:
  echo - existe `packages/contracts` como Markdown
  echo - ainda nao existe package compartilhado executavel de tipos
  echo.
  echo Estimativa atual da tarefa:
  echo - 4h a 8h
)

> "%WORKDIR%\tec_frontend_sem_evidencia.txt" (
  echo Status baseado no codigo: sem_evidencia_suficiente
  echo.
  echo Evidencia real:
  echo - o frontend oficial ainda nao esta integrado ao backend novo
  echo - existem prototipos, mocks e documentacao, mas nao app executavel entregue
  echo.
  echo Estimativa atual da tarefa:
  echo - 8h a 24h por issue
)

> "%WORKDIR%\tec_qualidade_operacao_sem_evidencia.txt" (
  echo Status baseado no codigo: sem_evidencia_suficiente
  echo.
  echo Evidencia real:
  echo - ainda nao ha suite integrada suficiente de testes, observabilidade e pipeline operacional
  echo.
  echo Estimativa atual da tarefa:
  echo - 4h a 16h por issue
)

> "%WORKDIR%\e2e_sem_evidencia.txt" (
  echo Status baseado no codigo: sem_evidencia_suficiente
  echo.
  echo Evidencia real:
  echo - nao existe aplicacao integrada ponta a ponta suficiente para validar este cenario como concluido
  echo - faltam frontend integrado, testes e operacao consistentes
  echo.
  echo Estimativa atual da tarefa:
  echo - 2h a 8h por cenario, depois da consolidacao do produto integrado
)

> "%WORKDIR%\tec_051_done.txt" (
  echo Status baseado no codigo: completo
  echo.
  echo Evidencia real:
  echo - legado e itens nao ativos foram isolados em `OLD/`
  echo - a raiz do repositorio foi limpa
  echo - nomes e caminhos foram padronizados
  echo.
  echo Tempo estimado: 40 min
  echo Tempo real: 55 min
)

> "%WORKDIR%\tec_052_done.txt" (
  echo Status baseado no codigo: completo
  echo.
  echo Evidencia real:
  echo - criado `GET /v1/imports/:importId/engine-status`
  echo - criado contrato `ImportEngineStatusData`
  echo - criado mapeamento operacional do motor de extracao
  echo.
  echo Tempo estimado: 30 min
  echo Tempo real: 32 min
)

> "%WORKDIR%\tec_053_done.txt" (
  echo Status baseado no codigo: completo
  echo.
  echo Evidencia real:
  echo - enriquecido `GET /v1/imports/:importId/detail`
  echo - adicionados `operationalSummary`, `issueSummary` e `decisionSummary`
  echo - adicionadas flags operacionais por linha
  echo.
  echo Tempo estimado: 40 min
  echo Tempo real: 38 min
)

> "%WORKDIR%\tec_054_done.txt" (
  echo Status baseado no codigo: completo
  echo.
  echo Evidencia real:
  echo - gerado `tooling/github/sincronizar_status_issues_com_codigo.bat`
  echo - lote preparado para atualizar comentarios e labels a partir do estado atual do codigo
  echo - o script nasce em `dry-run` por seguranca
  echo.
  echo Tempo estimado: 45 min
  echo Tempo real: 44 min
)
goto :eof
