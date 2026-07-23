# Sprint Backlog

Prioridade atual:

## P1
- remover a chave Gemini hardcoded de `apps_script/integrations/Api_Keys.gs`
- isolar e validar o contrato de `getDashboardData()` com amostras reais da planilha
- definir estrategia de execucao do sync BigQuery sem depender de ambiguidade entre script bound e standalone

## P2
- modularizar `frontend/html/Dashboard.html` em partes menores sem alterar o contrato visual atual
- revisar e limpar funcoes legacy sem uso claro no frontend
- consolidar fontes de versionamento para evitar drift entre codigo, planilha e release notes

## P3
- implementar export/import de fato em `apps_script/backend/Export_Import.gs`
- adicionar documentacao operacional de deploy e manutencao
- avaliar testes automatizados para parse da planilha e regras do Decision Engine
