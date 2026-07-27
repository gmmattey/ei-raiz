# Savro — Protótipos de tela (fonte de verdade)

> Substitui `FIGMA_TELAS.md` como referência vigente de telas/fluxo. Mantido como histórico, não
> como fonte de verdade.

**Projeto de origem (claude.ai/design):** https://claude.ai/design/p/445b937c-6ecb-433d-a2b2-6886bc919204
**Project ID:** `445b937c-6ecb-433d-a2b2-6886bc919204` — nome no claude.ai: "Novo Esquilo" (`type: PROJECT`, não design-system)

Esse projeto consome o design system Savro (`documentacao/marca/SAVRO_DESIGN_SYSTEM.md`,
projeto `abe5910f-d043-47ec-a4df-2bff8715cf39`) e o "7A Labs Design System" (`bd81a4fa-...`) via
`_ds/` — os protótipos já usam os tokens/assets Savro corretos, não uma versão paralela.

## Arquivos do projeto

| Arquivo | Conteúdo |
|---|---|
| `Esquilo - Prototipos Mobile.dc.html` | Protótipo mobile/Android completo — fluxo linkado por Luiz em 2026-07-27 |
| `Esquilo - MVP1.dc.html` | Protótipo do escopo MVP1 |
| `Esquilo - Landing Em Breve.dc.html` | Landing "em breve" |

## Estrutura do protótipo mobile (`Esquilo - Prototipos Mobile.dc.html`)

Levantamento estrutural (títulos de seção), não transcrição completa — para o detalhe visual de
qualquer tela, sincronizar sob demanda (processo abaixo).

1. **Abertura** — "Organização patrimonial local-first"
2. **Primeiro acesso e proteção** — "Sem conta e sem cadastro", "Seus dados ficam no aparelho",
   "Você mantém o controle", "Proteja seu cofre" (splash + onboarding + PIN/biometria)
3. **Patrimônio na Home** — resumo consolidado, valores, gráfico
4. **Cadastro e busca de ativos** — Adicionar item, Buscar ativo, Nova ação, detalhe de ativo
   (ex. ticker "XPTO3"), Registrar movimento
5. **Histórico e dados públicos**
6. **Backup, transferência e privacidade** — Backup e segurança, Transferir dados, Ajustes,
   Segurança, Dados e proteção
7. **Savro Completo** — tela de upsell/paywall ("Tenha o Savro completo")

> **Observação de produto (não interpretada além do que está no protótipo):** o copy do onboarding
> ("sem conta e sem cadastro", "seus dados ficam no aparelho") descreve um modelo **local-first**,
> o que diverge da arquitetura atual documentada em `CLAUDE.md` (API/D1 centralizados, sessão
> autenticada). Isso é só um registro do que o protótipo mostra — decisão de arquitetura sobre
> adotar local-first é de produto/negócio, não foi tomada aqui.

## Como sincronizar de novo (versão mais atual)

Mesmo processo usado para `SAVRO_DESIGN_SYSTEM.md`:

1. Tool `DesignSync`, `projectId: 445b937c-6ecb-433d-a2b2-6886bc919204`.
2. `list_files` → conferir se os 3 arquivos `.dc.html` ainda são os mesmos ou se surgiu protótipo novo.
3. `get_file` no arquivo relevante à tarefa. Os `.dc.html` são grandes (100KB+) — ler o arquivo
   inteiro só quando for implementar a tela específica; para checar mudança estrutural, grep no
   conteúdo por título de seção (`font-family:var(--font-display)`) em vez de reler tudo.
4. Antes de implementar qualquer tela, comparar o protótipo atual com o comportamento/telas já
   existentes no `apresentacao/` (React) e no `android/` — não copiar 1:1 sem adaptar aos contratos,
   nomenclatura de domínio e camadas definidas no `AGENTS.md`.
5. Sem polling automático — resync manual antes de tarefas de UI que dependam de fidelidade visual.

## Observação — nenhuma implementação feita

Esta sincronização é só documentação/referência, igual ao design system. Nenhuma tela do
`apresentacao/` ou `android/` foi alterada.
