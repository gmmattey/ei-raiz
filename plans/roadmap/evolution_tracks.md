# Evolution Tracks

## Track 1 - Runtime hardening
- remover segredos hardcoded do repositorio e migrar tudo para `Script Properties`
- decidir se `BigQuery_Sync.gs` continua bound a planilha ou vira fluxo standalone separado
- documentar deploy Apps Script e checklist de publish

## Track 2 - Data contract hardening
- congelar cabecalhos oficiais da planilha operacional
- adicionar validacao automatica de contratos entre planilha, payload e BigQuery
- reduzir alias redundantes quando houver sprint dedicada de migracao de dados

## Track 3 - Frontend modularization
- quebrar `frontend/html/Dashboard.html` so depois de congelar o payload do backend
- separar layout, estilos e renderizadores em parciais menores
- remover funcoes legadas sem uso quando houver cobertura minima de regressao visual

## Track 4 - Observability and AI quality
- adicionar diagnostico de payload e modo debug controlado
- revisar retries, timeouts e mensagens de erro da camada de IA
- criar validacao previsivel para respostas e fallback antes de mudar prompt ou provider
