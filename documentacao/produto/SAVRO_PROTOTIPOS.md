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
| `Esquilo - MVP1.dc.html` | Protótipo do escopo MVP1 (telas) | **Ativo — entregar agora**, mas modelo de dado da tela 5/6 superado pelo diagrama, ver abaixo |
| `Esquilo - Prototipos Mobile.dc.html` | Protótipo mobile/Android completo (fluxo estendido) | Backlog — referência futura, não implementar agora |
| `Esquilo - Landing Em Breve.dc.html` | Landing "em breve" | Backlog — referência futura, não implementar agora |

## Escopo de entrega atual — MVP1

Decisão de 2026-07-27: **entregar somente o MVP1** neste momento. O fluxo completo
("Prototipos Mobile") e a landing ficam como referência de onde o produto vai depois, mas não
entram na implementação agora — evita construir tela que não faz parte do corte atual.

**Referência canônica da jornada:** `documentacao/produto/jornada-mvp1.png` — diagrama entregue por
Luiz em 2026-07-27, mais recente que o protótipo `Esquilo - MVP1.dc.html` e que prevalece em caso
de divergência (ver nota de divergência abaixo).

Jornada do MVP1 (7 etapas, conforme o diagrama):

1. **Descoberta** — Landing page/loja; entende a proposta. *(sem conta · local-first · privado)*
2. **Instalação** — Baixa o app; abre o Savro. *(o protótipo/diagrama dizem "Android primeiro,
   iOS na mesma base"; as issues do GitHub do épico MVP1 — `#196` — exigem Android **e** iOS
   disponíveis com a mesma base funcional como critério de lançamento, não sequencial — ver seção
   de arquitetura abaixo)*
3. **Primeira abertura** — Onboarding curto (privacidade → offline → backup é importante) →
   "Ativar proteção?" — **Sim** → biometria/credencial do aparelho; **Não** → continuar sem
   biometria → Entrar na Home. *(sem login · sem e-mail · sem CPF)*
4. **Home vazia** — Estado inicial sem dados; CTA "Adicionar item". *(mostrar valor oculto quando
   necessário)*
5. **Cadastrar patrimônio** — Escolher tipo (**Conta / Renda variável / Renda fixa / Cripto / Bens
   / Dívidas / Outros**) → preencher dados essenciais (**nome · valor atual · moeda · data ·
   instituição opcional**) → Salvar → Home atualizada. *(tudo salvo localmente)*
6. **Uso recorrente** — "Acompanhar patrimônio" como tela central, com "Ver distribuição básica" e
   "Abrir detalhe" → do detalhe: "Editar/ajustar valor" ou "Arquivar/excluir" → "Linha do tempo
   básica de alterações". *(funciona em modo avião)*
7. **Segurança e portabilidade** — Ajustes → Gerar backup criptografado → Restaurar backup →
   Exportar CSV → "Confiança para continuar usando". *(dados continuam do usuário)*

**Princípios explícitos do MVP1** (rotulados no diagrama e no protótipo): sem conta · dados no
dispositivo · offline first · backup e restauração · **sem cotações automáticas no MVP1**.

### Divergência entre o diagrama e o protótipo `.dc.html` — usar o diagrama

O diagrama (`jornada-mvp1.png`) simplifica o modelo de dado do MVP1 em relação ao que o protótipo
`Esquilo - MVP1.dc.html` desenha:

| | Diagrama (canônico) | Protótipo `.dc.html` (mais antigo/mais rico) |
|---|---|---|
| Tipos de item | Conta, Renda variável, Renda fixa, Cripto, Bens, Dívidas, Outros | Ação, Renda fixa, Conta ou saldo, Imóvel, Cartão/Dívida |
| Campos de cadastro | Nome, valor atual, moeda, data, instituição (opcional) | Ativo (ticker), instituição (opcional), quantidade, preço médio, data de referência |
| Atualização de posição | "Editar/ajustar valor" (valor único por item) | "Registrar movimento" (lançamento tipo compra/venda) |

Ou seja: o MVP1 não modela posição por ticker/quantidade/preço médio — é um registro de valor por
item de patrimônio (mais simples, tipo "saldo atual"), ajustado manualmente. Implementar conforme
o diagrama; o `.dc.html` mostra uma versão mais avançada que não é o corte do MVP1.

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

## Arquitetura alvo — Android + iOS via KMP (não só Android)

As issues do GitHub (`gmmattey/esquilo-wallet`) mostram que a ADR-001 (Android único runtime) foi
**superada** pela issue `#192` — nova arquitetura em **Kotlin Multiplatform + Compose
Multiplatform**, Android e iOS como runtimes de primeira classe. Detalhe completo no adendo de
`documentacao/arquitetura/ADR-001-savro-android-local-first.md`. Isso não muda a jornada nem os
tipos/campos do MVP1 documentados acima (que são de produto, não de plataforma) — muda como o
protótipo deve ser lido: onde ele diz "Android primeiro", o épico `#196` já pede as duas
plataformas juntas como critério de lançamento do MVP1.

O épico `#196` no GitHub também confirma, com pequeno refinamento, os tipos e campos do MVP1
documentados acima (issue `#119`): mesmos 7 tipos do diagrama; quantidade/preço médio existem mas
são **opcionais**, só para renda variável — o usuário pode controlar qualquer item só pelo valor
atual. `#119`–`#122` são as issues de referência para implementação; `#196` é o épico com os
critérios de lançamento completos.

## Como sincronizar de novo (versão mais atual)

Mesmo processo usado para `SAVRO_DESIGN_SYSTEM.md`:

1. Tool `DesignSync`, `projectId: 445b937c-6ecb-433d-a2b2-6886bc919204`.
2. `list_files` → conferir se os 3 arquivos `.dc.html` ainda são os mesmos ou se surgiu protótipo novo.
3. `get_file` no arquivo relevante à tarefa. Os `.dc.html` são grandes (100KB+) — ler o arquivo
   inteiro só quando for implementar a tela específica; para checar mudança estrutural, grep no
   conteúdo por título de seção (`font-family:var(--font-display)`) em vez de reler tudo.
4. Antes de implementar qualquer tela, comparar o protótipo atual com o comportamento/telas já
   existentes no `apresentacao/` (React) e no `aplicativo/` (KMP) — não copiar 1:1 sem adaptar aos contratos,
   nomenclatura de domínio e camadas definidas no `AGENTS.md`.
5. Sem polling automático — resync manual antes de tarefas de UI que dependam de fidelidade visual.

## Observação — nenhuma implementação feita

Esta sincronização é só documentação/referência, igual ao design system. Nenhuma tela do
`apresentacao/` ou `aplicativo/` foi alterada.
