# Documentos herdados do `Esquilo-Invest-2.0` úteis para a fase 2

Este documento registra o que foi lido no `serealdemanga/Esquilo-Invest-2.0` e o que faz sentido trazer para o `Quebra_Nozes`.

## Fonte analisada

Arquivos confirmados no `Esquilo-Invest-2.0`:
- `README.md`
- `docs/project_context.md`
- `docs/functional/functional_overview_legacy.md`
- `docs/technical/technical_overview_legacy.md`
- `docs/technical/operational_data_update_report.md`

O `README.md` do projeto legado deixa claro que a base atual ainda está centrada em Apps Script, BigQuery, fallback em planilha e frontend HTML único, com `docs/project_context.md` como fonte principal de contexto. Ele também informa que a estrutura do projeto está dividida entre `apps_script/`, `frontend/`, `mobile_app/`, `data/`, `docs/` e `plans/`.

## Leitura prática do que vale herdar

### 1. `docs/project_context.md`
Este é o documento mais importante herdado.

Por que entra:
- descreve arquitetura real do legado
- mostra o fluxo de dados completo
- mapeia pastas, arquivos, integrações e riscos técnicos
- ajuda a separar claramente o que é runtime atual do que é material histórico

Como usar no `Quebra_Nozes`:
- como contexto legado de origem
- como base para mapear o que precisa ser substituído na migração para Cloudflare + D1
- como documento de contraste entre estado atual e estado alvo

### 2. `docs/functional/functional_overview_legacy.md`
Entra como apoio funcional.

Por que entra:
- resume o comportamento do produto em linguagem de negócio
- deixa claro que o sistema consolida, traduz e orienta, sem executar ordens
- ajuda a preservar o propósito do produto mesmo trocando toda a base técnica

Como usar no `Quebra_Nozes`:
- como referência funcional do produto de origem
- como material para manter coerência entre UX, copy e serviços do projeto novo

### 3. `docs/technical/technical_overview_legacy.md`
Entra como apoio técnico legado.

Por que entra:
- mostra a arquitetura Apps Script + planilha + BigQuery no detalhe
- separa base operacional atual de artefatos legados
- ajuda a identificar o que deve morrer na migração e o que precisa ser reimplementado

Como usar no `Quebra_Nozes`:
- como documento técnico de origem
- como apoio para decisões arquiteturais do backend novo

### 4. `docs/technical/operational_data_update_report.md`
Entra como material auxiliar.

Por que entra:
- ajuda a entender atualização e consistência da base operacional
- é pequeno e barato de carregar
- pode ajudar a rastrear a evolução da estrutura de dados

Como usar no `Quebra_Nozes`:
- como anexo de migração de dados
- não deve virar documento central

## O que NÃO deve virar centro do `Quebra_Nozes`

Não faz sentido trazer o legado inteiro como coração do repositório novo.

O `Quebra_Nozes` deve usar esse material apenas como:
- contexto de origem
- prova de como o sistema antigo funciona
- insumo para a substituição por código novo

Não deve usar isso como:
- arquitetura alvo
- contrato final
- estrutura de pasta final
- modelo final de backend

## Decisão de organização

No `Quebra_Nozes`, o material herdado do `Esquilo-Invest-2.0` deve ficar separado em área de migração/herança.

Estrutura sugerida:
- `docs/00_migration/`
- `docs/01_legacy_context/`
- `docs/10_target_architecture/`
- `docs/20_product/`
- `docs/30_data/`
- `docs/40_prompts/`

## Próximos passos

1. trazer também os materiais de pitch, MVP e migração já levantados fora do GitHub
2. consolidar o que é herança e o que é alvo novo
3. montar a estrutura de pastas definitiva
4. preparar o repositório para receber front, back, contratos e banco novos
