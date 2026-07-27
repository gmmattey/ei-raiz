# Savro — Protótipos de tela (fonte de verdade)

> Substitui `FIGMA_TELAS.md` como referência vigente de telas/fluxo. Mantido como histórico, não
> como fonte de verdade.

**Projeto de origem (claude.ai/design):** https://claude.ai/design/p/445b937c-6ecb-433d-a2b2-6886bc919204
**Project ID:** `445b937c-6ecb-433d-a2b2-6886bc919204` — nome no claude.ai: "Novo Esquilo" (`type: PROJECT`, não design-system)

Esse projeto consome o design system Savro (`documentacao/marca/SAVRO_DESIGN_SYSTEM.md`,
projeto `abe5910f-d043-47ec-a4df-2bff8715cf39`) e o "7A Labs Design System" (`bd81a4fa-...`) via
`_ds/` — os protótipos já usam os tokens/assets Savro corretos, não uma versão paralela.

## Arquivos do projeto

| Arquivo | Conteúdo | Escopo de entrega |
|---|---|---|
| `Esquilo - MVP1.dc.html` | Protótipo do escopo MVP1 | **Ativo — entregar agora** (decisão de 2026-07-27) |
| `Esquilo - Prototipos Mobile.dc.html` | Protótipo mobile/Android completo (fluxo estendido) | Backlog — referência futura, não implementar agora |
| `Esquilo - Landing Em Breve.dc.html` | Landing "em breve" | Backlog — referência futura, não implementar agora |

## Escopo de entrega atual — MVP1 (`Esquilo - MVP1.dc.html`)

Decisão de 2026-07-27: **entregar somente o MVP1** neste momento. O fluxo completo
("Prototipos Mobile") e a landing ficam como referência de onde o produto vai depois, mas não
entram na implementação agora — evita construir tela que não faz parte do corte atual.

Jornada do MVP1 (7 etapas, conforme o protótipo):

1. **Descoberta** — landing/loja, proposta "sem conta · local-first · privado"
2. **Instalação** — baixa o app (Android primeiro, iOS na mesma base depois), abre o Savro
3. **Primeira abertura** — onboarding curto (3 telas: privacidade, offline, backup) + escolha de
   proteção do cofre (biometria / credencial do aparelho / continuar sem bloqueio) — sem login,
   sem e-mail, sem CPF
4. **Home vazia** — estado inicial sem dados, CTA "Adicionar primeiro item"
5. **Cadastrar patrimônio** — escolher tipo (Ação, Renda fixa, Conta ou saldo, Imóvel,
   Cartão/Dívida) → formulário (ativo, instituição opcional, quantidade, preço médio, data de
   referência) → "Salvar no aparelho"
6. **Uso recorrente** — Home com patrimônio líquido e distribuição por categoria, detalhe de ativo
   com histórico de movimentos, tela de Histórico (linha do tempo básica) — funciona em modo avião
7. **Segurança e portabilidade** — Ajustes (privacidade, Backup, Transferência entre aparelhos),
   tela de Backup e segurança (criar backup criptografado, exportar CSV, restaurar)

**Princípios explícitos do MVP1** (rotulados no próprio protótipo): sem conta · dados no
dispositivo · offline first · backup e restauração · **sem cotações automáticas no MVP1**.

## Estrutura do protótipo mobile completo (`Esquilo - Prototipos Mobile.dc.html`) — backlog

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

> **Confirmado por Luiz em 2026-07-27:** o modelo **local-first** (sem conta, dados só no
> aparelho) descrito no protótipo é decisão real de produto/arquitetura, não só copy de onboarding.
> Já estava formalizado em `documentacao/arquitetura/ADR-001-savro-android-local-first.md`
> (2026-07-26); o `CLAUDE.md` da raiz do repo ainda descreve a arquitetura anterior
> (API/D1 centralizados, sessão autenticada) porque é isso que está implementado hoje — a ADR
> trata o sistema atual como isolado durante a transição, sem ampliação funcional.

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
