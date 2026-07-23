# Esquilo Invest 2.0

Segunda geração do Esquilo Invest, com dashboard financeiro, backend em Google Apps Script, BigQuery como fonte principal e aplicativo Flutter experimental.

## Estado atual

- BigQuery é a fonte primária do dashboard, com fallback para a planilha operacional.
- O backend expõe operações controladas de dados e não executa ordens financeiras.
- A IA utiliza o mesmo contexto consolidado apresentado no dashboard.
- O frontend principal permanece em `Dashboard.html` por compatibilidade com o Apps Script clássico.
- A pasta `mobile_app/` contém o MVP Flutter do Pocket Ops, integrado ao mesmo backend por HTTP.

## Estrutura

```text
apps_script/   Runtime e serviços do Google Apps Script
frontend/      Interface HTML do dashboard
automations/   Rotinas operacionais, quando existentes
mobile_app/    MVP Flutter separado
data/          Contratos, modelos e dados de apoio
docs/          Documentação viva, histórico e releases
plans/         Backlog e trilhas de evolução
```

## Como começar

1. Leia `docs/project_context.md`.
2. Valide os contratos disponíveis em `data/`.
3. Consulte `plans/sprints/backlog.md` antes de iniciar uma nova sprint.
4. Confirme no código se documentos históricos ainda refletem o comportamento atual.

## Princípios

- BigQuery e contratos de dados devem permanecer alinhados.
- Regras financeiras não devem depender exclusivamente de um modelo de IA.
- Nenhuma funcionalidade deve executar compra, venda ou movimentação de ativos.
- Documentação desatualizada deve ser corrigida ou movida para histórico.

## Status

Base funcional em evolução e referência para a migração para uma arquitetura mais moderna.