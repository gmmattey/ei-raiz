# Quanto — Status da Documentacao

Atualizado em: 2026-06-19
Objetivo: classificar a documentacao do repo apos o cutover para `apps/web`

## 1. Como ler este documento

Esta classificacao separa os arquivos em tres grupos:

1. documentacao viva e confiavel
2. documentacao util, mas parcialmente desatualizada
3. documentacao historica/legado

Regra pratica:

- para decisoes atuais, use primeiro o grupo 1
- use o grupo 2 com verificacao no codigo
- nao use o grupo 3 como fonte primaria de verdade

## 2. Grupo 1 — Viva e confiavel

Arquivos que refletem o estado real atual do app ou servem como instrucao operacional vigente.

### Instrucoes centrais

- [AGENTS.md](C:\Projetos\Quanto\AGENTS.md)
- [CLAUDE.md](C:\Projetos\Quanto\CLAUDE.md)
- [apps/web/README.md](C:\Projetos\Quanto\apps\web\README.md)

### Base oficial da fusao

- [docs/fusao/00-visao-geral.md](C:\Projetos\Quanto\docs\fusao\00-visao-geral.md)
- [docs/fusao/01-arquitetura-alvo.md](C:\Projetos\Quanto\docs\fusao\01-arquitetura-alvo.md)
- [docs/fusao/02-mapa-de-migracao.md](C:\Projetos\Quanto\docs\fusao\02-mapa-de-migracao.md)
- [docs/fusao/03-backlog-de-fusao.md](C:\Projetos\Quanto\docs\fusao\03-backlog-de-fusao.md)
- [docs/fusao/04-cutover-checklist.md](C:\Projetos\Quanto\docs\fusao\04-cutover-checklist.md)
- [docs/fusao/05-modelo-canonico-portfolio-import.md](C:\Projetos\Quanto\docs\fusao\05-modelo-canonico-portfolio-import.md)
- [docs/fusao/06-operacao-cutover.md](C:\Projetos\Quanto\docs\fusao\06-operacao-cutover.md)
- [docs/fusao/07-inventario-schema-real.md](C:\Projetos\Quanto\docs\fusao\07-inventario-schema-real.md)
- [docs/fusao/08-handoff-arquitetura-qa.md](C:\Projetos\Quanto\docs\fusao\08-handoff-arquitetura-qa.md)
- [docs/fusao/09-trilhas-remanescentes.md](C:\Projetos\Quanto\docs\fusao\09-trilhas-remanescentes.md)

### QA e operacao ainda validos

- [docs/TEST_PLAN.md](C:\Projetos\Quanto\docs\TEST_PLAN.md)
- [docs/QA_REPORT_2026-06-18_FUSAO_PILOTO.md](C:\Projetos\Quanto\docs\QA_REPORT_2026-06-18_FUSAO_PILOTO.md)

### Ativos de marca

- [docs/branding](C:\Projetos\Quanto\docs\branding)

## 3. Grupo 2 — Util, mas parcialmente desatualizada

Arquivos que continuam valiosos como contexto, regras de negocio, cobertura funcional ou design reference, mas nao devem ser lidos como reflexo literal do estado pos-cutover sem checagem no codigo.

### Specs funcionais e tecnicas

- [docs/SPEC_FUNCIONAL_v1.md](C:\Projetos\Quanto\docs\SPEC_FUNCIONAL_v1.md)
- [docs/QUANTO_SPEC_v4.md](C:\Projetos\Quanto\docs\QUANTO_SPEC_v4.md)
- [docs/api-spec.yaml](C:\Projetos\Quanto\docs\api-spec.yaml)
- [docs/SPEC_CVM_PIPELINE.md](C:\Projetos\Quanto\docs\SPEC_CVM_PIPELINE.md)
- [docs/SPEC_DESIGN_IMPLEMENTATION.md](C:\Projetos\Quanto\docs\SPEC_DESIGN_IMPLEMENTATION.md)
- [docs/SPEC_PRODUCT_POLISH.md](C:\Projetos\Quanto\docs\SPEC_PRODUCT_POLISH.md)
- [docs/DESIGN_SYSTEM.md](C:\Projetos\Quanto\docs\DESIGN_SYSTEM.md)

### Specs de backlog ou modulo

- [docs/SPEC_ACOES_LOTES.md](C:\Projetos\Quanto\docs\SPEC_ACOES_LOTES.md)
- [docs/SPEC_FLUXO_ACOES.md](C:\Projetos\Quanto\docs\SPEC_FLUXO_ACOES.md)
- [docs/SPEC_AI_FEATURES.md](C:\Projetos\Quanto\docs\SPEC_AI_FEATURES.md)
- [docs/SPEC_APORTES.md](C:\Projetos\Quanto\docs\SPEC_APORTES.md)
- [docs/SPEC_ASSET_DETAIL.md](C:\Projetos\Quanto\docs\SPEC_ASSET_DETAIL.md)
- [docs/SPEC_BENS_GARANTIAS.md](C:\Projetos\Quanto\docs\SPEC_BENS_GARANTIAS.md)
- [docs/SPEC_MACRO_BENCHMARKS.md](C:\Projetos\Quanto\docs\SPEC_MACRO_BENCHMARKS.md)

### QA e handoff ainda uteis como trilha de decisao

- [docs/QA_REPORT_2026-06-16.md](C:\Projetos\Quanto\docs\QA_REPORT_2026-06-16.md)
- [docs/HANDOVER_BEATRIZ_CVM_IMPORT_TO_GABRIEL.md](C:\Projetos\Quanto\docs\HANDOVER_BEATRIZ_CVM_IMPORT_TO_GABRIEL.md)
- [docs/HANDOVER_TECH_LEAD.md](C:\Projetos\Quanto\docs\HANDOVER_TECH_LEAD.md)
- [docs/HANDOVER_THIAGO_TECH_LEAD_TO_CARLOS.md](C:\Projetos\Quanto\docs\HANDOVER_THIAGO_TECH_LEAD_TO_CARLOS.md)
- [docs/HANDOVER_THIAGO_TECH_LEAD_TO_SM.md](C:\Projetos\Quanto\docs\HANDOVER_THIAGO_TECH_LEAD_TO_SM.md)

### Referencias visuais e prototipos

- [docs/quanto-home-linka-prototype.html](C:\Projetos\Quanto\docs\quanto-home-linka-prototype.html)
- [docs/quanto-mockup-v5.html](C:\Projetos\Quanto\docs\quanto-mockup-v5.html)
- [docs/wireframes](C:\Projetos\Quanto\docs\wireframes)

### Observacao

O grupo 2 tende a conter uma mistura de:

- regras ainda validas
- exemplos apontando para `public/`
- contagens antigas de telas/endpoints/tabelas
- referencias a fases pre-cutover

## 4. Grupo 3 — Historica / legado

Arquivos que servem como registro de auditoria, handoff antigo, execucao passada ou referencia historica. Nao devem orientar decisoes atuais sem triangulacao com o grupo 1.

### Auditorias e mapeamentos historicos

- [docs/AUDITORIA_FUNCIONAL_ESQUILO.md](C:\Projetos\Quanto\docs\AUDITORIA_FUNCIONAL_ESQUILO.md)
- [docs/AUDITORIA_MIGRACAO_QUANTO.md](C:\Projetos\Quanto\docs\AUDITORIA_MIGRACAO_QUANTO.md)
- [docs/ei-raiz-mapeamento.html](C:\Projetos\Quanto\docs\ei-raiz-mapeamento.html)

### Specs antigas

- [docs/QUANTO_SPEC_v2.md](C:\Projetos\Quanto\docs\QUANTO_SPEC_v2.md)
- [docs/QUANTO_SPEC_v3.md](C:\Projetos\Quanto\docs\QUANTO_SPEC_v3.md)
- [docs/quanto-mockup-v3.html](C:\Projetos\Quanto\docs\quanto-mockup-v3.html)
- [docs/quanto-mockup-v4.html](C:\Projetos\Quanto\docs\quanto-mockup-v4.html)

### Handovers e dashboards de fase antiga

- [docs/HANDOVER_KANBAN_STATUS.md](C:\Projetos\Quanto\docs\HANDOVER_KANBAN_STATUS.md)
- [docs/HANDOVER_RESUMO_EXECUTIVO.md](C:\Projetos\Quanto\docs\HANDOVER_RESUMO_EXECUTIVO.md)
- [docs/HANDOVER_SQUAD_2026_MASTER.md](C:\Projetos\Quanto\docs\HANDOVER_SQUAD_2026_MASTER.md)
- [HANDOVER_EXECUCAO_COMPLETA.md](C:\Projetos\Quanto\HANDOVER_EXECUCAO_COMPLETA.md)
- [HANDOVER_STATUS_DASHBOARD.md](C:\Projetos\Quanto\HANDOVER_STATUS_DASHBOARD.md)
- [AUTOPILOT_LOG.md](C:\Projetos\Quanto\AUTOPILOT_LOG.md)
- [AUTOPILOT_PLAN.md](C:\Projetos\Quanto\AUTOPILOT_PLAN.md)
- [AUTOPILOT_REPORT.md](C:\Projetos\Quanto\AUTOPILOT_REPORT.md)

### Artefatos auxiliares ou consultivos

- [fleet.json](C:\Projetos\Quanto\fleet.json)
- [memory-index.json](C:\Projetos\Quanto\memory-index.json)
- [docs/SPEC_PAINEL_NUCLEO_Q.md](C:\Projetos\Quanto\docs\SPEC_PAINEL_NUCLEO_Q.md)

## 5. Trilhas de saneamento documental ainda recomendadas

### Trilha 1 — Congelar legado explicitamente

- marcar no topo dos arquivos do grupo 3 que sao historicos
- evitar que virem fonte primaria por engano

### Trilha 2 — Revisar o grupo 2

- aproximar `SPEC_FUNCIONAL_v1.md`, `QUANTO_SPEC_v4.md` e `api-spec.yaml` do estado pos-cutover
- remover referencias que ainda pressupoem `public/` como shell ativo

### Trilha 3 — Criar um indice permanente

- este documento pode virar o indice oficial de documentacao
- se desejado, o proximo passo e renomear para algo mais permanente, como `docs/DOCUMENTACAO_VIVA.md`
