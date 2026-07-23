# Spec Funcional — Fleet

> Fleet e um painel standalone de gestao de agents de IA.
> Multi-projeto: qualquer pasta com `.claude/agents/` pode ser monitorada.
> Acesso local (localhost) e remoto (Cloudflare Tunnel + snapshot offline).

---

## Visao Geral

**Nome**: Fleet
**Conceito**: painel de gestao de agents de IA — nao humanos
**Origem**: evoluiu do "Nucleo Q" (sub-tela do Quanto) para produto independente
**Stack**: Vanilla JS + CSS (sem framework, sem build), Node.js CLI scanner
**Acesso**: local (localhost:3333) + remoto (Cloudflare Tunnel/Pages)

---

## Abas

| Aba | Descricao |
|-----|-----------|
| **Board** | Kanban 5 colunas com tipos de task, filtros e drag & drop |
| **Dashboard** | Graficos SVG, KPIs, filtros por periodo/agent/tipo |
| **Organograma** | Org chart hierarquico dos agents com detalhe ao clicar |
| **Fluxos** | Pipeline horizontal do fluxo processual dos agents |
| **Pulso** | Cards heartbeat — visao rapida de atividade recente |
| **Docs** | Acesso a documentacao do projeto, auto-descoberta + mapeamento manual |

Aba removida: **Prototipos** — artefatos tecnicos pertencem a documentacao do projeto, nao ao painel de gestao. O conteudo migra para a aba Docs.

---

## 1. Header

### 1.1 Identidade

- **Wordmark**: "fleet" em Outfit 800, minusculo, letter-spacing -1
- **Favicon**: "f" isolado, Outfit 800, fundo --ink (#16242F)
- **Fonte**: Outfit 800 (woff2 self-hosted ou Google Fonts)

### 1.2 Elementos do Header

Da esquerda para a direita:
1. **Wordmark** "fleet"
2. **Seletor de projeto** — dropdown com nome do projeto ativo + contagem de agents. Trocar projeto recarrega todas as abas. Ultimo projeto selecionado salvo no localStorage.
3. **Barra de progresso** — barra unica com % de conclusao (done / total). Sem texto detalhado — o detalhe fica no Dashboard.
4. **Badge de conexao** — "ao vivo" (verde pulsante) quando tunnel ativo; "offline — dados de DD/MMM HH:MM" (amber) quando servindo snapshot.
5. **Botao adicionar projeto** — abre formulario para colar path. Scanner valida se existe `.claude/`. Se sim, indexa e aparece no seletor. Se nao, mensagem de erro.
6. **Dark toggle** — alterna light/dark mode. Persiste no localStorage.

### 1.3 Design System

Estetica de referencia: Linear + Vercel — flat, borders sobre shadows, hierarquia por luminosidade.

#### Tipografia

| Fonte | Uso | Peso |
|-------|-----|------|
| Outfit 800 | Wordmark "fleet" (lowercase, letter-spacing -1px) | 800 |
| Geist Sans | UI: headings, body, labels, buttons | 400 (body), 500 (heading/bold) |
| Geist Mono | Dados: IDs de task, timestamps, numeros, metricas | 400 |

Carregamento: woff2 self-hosted ou CDN (Google Fonts para Outfit, cdn.vercel.com para Geist).

#### Cores — Accent

| Nome | Hex | Uso |
|------|-----|-----|
| Violet | `#7C5CFC` | CTAs, botoes, links, item ativo, accent primario |
| Cyan | `#00D4AA` | Status online/ativo, pulse, badge "ao vivo" |

#### Cores — Status

| Nome | Hex | Uso |
|------|-----|-----|
| Amber | `#F5A623` | Warning, offline, prioridade |
| Red | `#EF4444` | Erro, bug, P0 |
| Blue | `#3B82F6` | Info, link, spec |
| Purple | `#A855F7` | Design (badge e avatar) |

#### Superficies — Dark Mode

| Nivel | Hex | Uso |
|-------|-----|-----|
| L0 | `#0A0A0F` | Page background |
| L1 | `#111118` | Cards, panels |
| L2 | `#1A1A24` | Elevated (modals, dropdowns) |
| L3 | `#22222E` | Hover states |

Texto dark: `#EEEEF0` (primario), `#9898A0` (secundario), `#5C5C66` (terciario).
Borders dark: `rgba(255,255,255,0.08)` (default), `rgba(255,255,255,0.14)` (hover).

#### Superficies — Light Mode

| Nivel | Hex | Uso |
|-------|-----|-----|
| L0 | `#F8F8FC` | Page background |
| L1 | `#FFFFFF` | Cards, panels |
| L2 | `#F0F0F5` | Elevated (modals, dropdowns) |
| L3 | `#E8E8EE` | Hover states |

Texto light: `#111118` (primario), `#6B6B76` (secundario), `#9898A0` (terciario).
Borders light: `rgba(0,0,0,0.08)` (default), `rgba(0,0,0,0.14)` (hover).

#### Principio de superficies

- Hierarquia por luminosidade (L0 < L1 < L2 < L3), nao por sombras
- Borders 1px com opacidade baixa substituem box-shadows
- Sem gradientes, sem blur, sem glow, sem efeitos decorativos

#### Espacamento

Base: 4px. Escala: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48.

#### Border Radius

| Elemento | Radius |
|----------|--------|
| Inputs, badges | 6px |
| Cards, panels | 8px |
| Modals, dropdowns | 12px |

#### Iconografia

Tabler Icons (outline set, webfont). Nunca usar variantes `-filled`.

---

## 2. Board

Kanban 5 colunas: Backlog, A Fazer, Em Progresso, Em Revisao, Concluido.

### 2.1 Tipos de Task

Cada task tem campo `type` com badge visual no card:

| Tipo | Tabler Icon | Cor (hex) | Quando usar |
|------|-------------|-----------|-------------|
| Feature | `ti-diamond` | Violet `#7C5CFC` | Funcionalidade nova |
| Bug | `ti-bug` | Red `#EF4444` | Defeito |
| QA | `ti-shield-check` | Cyan `#00D4AA` | Teste/validacao |
| Spec | `ti-file-text` | Blue `#3B82F6` | Documentacao, spec |
| Infra | `ti-settings` | Amber `#F5A623` | Setup, deploy, config |
| Design | `ti-palette` | Purple `#A855F7` | Mockup, branding |

### 2.2 Card (visao board)

Mostrar:
- **Badge de tipo** (icone + nome curto)
- **Titulo**
- **Prioridade** (se houver)
- **Avatar do owner** (icone de role — ver secao 9 Avatares)

Removido: barra de label de fase (faixa colorida que nao comunica informacao util).

### 2.3 Modal (detalhe ao clicar no card)

- Tipo + prioridade (badges)
- ID do card
- Titulo completo
- Descricao completa (nao truncada)
- Status + fase + responsavel
- **Ultimas acoes**: entradas do activity[] filtradas por task ID ou membro
- **Dependencias**: se houver (ex: "depende de SETUP-005")

### 2.4 Adicionar Card

Botao "+ Adicionar card" abre formulario inline:
- Titulo (obrigatorio)
- Tipo (dropdown: Feature, Bug, QA, Spec, Infra, Design)
- Descricao (opcional)
- Salvar → card vai para **Backlog** (triagem pelo PM, alinhado com Pipeline)
- Persistencia: localStorage override ate proximo sync com fleet.json

### 2.5 Filtros

Substituir chips de fase (muitos, pouco uteis) por:
- **Filtro por Tipo** (Feature, Bug, QA, Spec, Infra, Design) — toggles maiores e mais legiveis
- **Filtro por Agent** (mantido, com avatares de role)
- **Busca textual** (mantida — busca em titulo, descricao e ID)

### 2.6 Drag & Drop

- Manter: arrastar cards entre colunas para mudar status
- Override local salvo no localStorage
- Botao "Reset" para limpar overrides locais
- Toast de confirmacao: "FEAT-001 → Em Revisao"

### 2.7 Coluna Concluido

- Colapsavel (click no header toggle expand/collapse)
- Estado de collapse salvo no localStorage
- Quando colapsada, mostra preview: "X tasks concluidas"

---

## 3. Dashboard (ex-Metricas)

Tela filtravel com graficos SVG e KPIs.

### 3.1 Fases com Nomes Humanos (global)

Fases renomeadas para linguagem de produto — aplica em todo o Fleet:

| ID | Nome antigo (dev) | Nome novo (humano) |
|----|------------------|-------------------|
| prep | Preparacao | Planejamento |
| setup | Setup & Infra | Base Tecnica |
| backend | Backend API | API & Dados |
| frontend | Frontend Core | Interface |
| import | Import XLSX | Importacao |
| pwa | PWA & Cross-cutting | App & Offline |
| auth | Cloudflare Access | Acesso |
| validation | Validacao & Polish | Qualidade |

Nota: cada projeto define suas proprias fases no fleet.json. Os nomes acima sao os do Quanto como exemplo. O Fleet exibe o `name` de cada fase como vier no JSON.

### 3.2 Filtros (barra no topo do Dashboard)

- **Por periodo**: seletor de datas (requer `created_at` / `completed_at` nas tasks)
- **Por agent**: dropdown ou chips com avatares de role
- **Por tipo de task**: toggles (Feature, Bug, QA, Spec, Infra, Design)
- Todos os graficos e KPIs reagem aos filtros selecionados

### 3.3 KPIs (cards no topo)

4 cards em linha:
1. **Total tasks** — contagem total
2. **Concluidas** — contagem de done
3. **Em andamento** — contagem de in_progress + review
4. **% Progresso** — done / total

### 3.4 Graficos SVG

1. **Progresso por fase** — barras horizontais empilhadas (done / wip / pendente), nomes humanos
2. **Distribuicao por tipo** — donut SVG (Feature, Bug, QA, Spec, Infra, Design) com legenda
3. **Carga por agent** — barras agrupadas por agent, empilhadas (done / wip / pendente), avatar de role
4. **Velocidade** — line chart SVG, tasks concluidas por dia ao longo do tempo

### 3.5 Dados Necessarios por Task

- `created_at` (ISO 8601) — quando a task foi criada
- `completed_at` (ISO 8601 ou null) — quando foi concluida
- `type` (string) — tipo da task (feature, bug, qa, spec, infra, design)

---

## 4. Organograma (ex-Time)

Org chart hierarquico visual dos agents do projeto.

### 4.1 Layout

Arvore hierarquica renderizada dinamicamente a partir dos agents do projeto. A hierarquia e derivada dos roles:
- Nivel 1: PM / Product Manager
- Nivel 2: Tech Lead / Lead
- Nivel 3: demais agents (devs, designers, QA)

Se o projeto nao tem hierarquia clara, mostra todos os agents em linha horizontal.

### 4.2 Node do Agent

Cada node mostra:
- **Avatar** com icone de role (ver secao 9)
- **Nome**
- **Cargo** (role)
- **Modelo** (ex: Sonnet 4, Opus 4) — lido do agent file ou fleet.json
- **Indicador de status**: idle / trabalhando / concluiu recente
  - `trabalhando` — tem task `in_progress` ou `review`
  - `concluiu recente` — ultima acao nas ultimas 24h mas sem task ativa
  - `idle` — sem acao recente e sem task ativa

### 4.3 Click no Agent — Painel de Detalhe

Ao clicar em um node, abre modal/painel lateral com:

1. **Cabecalho**: avatar grande com icone de role, nome, cargo, modelo, cor
2. **Trabalhando agora**: tasks com status `in_progress` ou `review` atribuidas ao agent
3. **Proximo**: tasks com status `todo` atribuidas ao agent (ordenadas por prioridade)
4. **Concluidas**: contagem + lista colapsavel
5. **Ultimas acoes**: entradas do `activity[]` filtradas por este agent
6. **Skills**: lista de habilidades (do agent file ou fleet.json)
7. **Tools**: ferramentas disponiveis (Read, Edit, Bash, etc.)

### 4.4 Dados de Modelo

Cada agent pode ter seu modelo especificado de duas formas:
- YAML frontmatter no agent file: `model: sonnet`
- Campo `model` no membro dentro do fleet.json

Se nao especificado, mostra "Nao definido".

---

## 5. Fluxos

Pipeline processual dos agents — como uma demanda entra, e distribuida, revisada e concluida.

### 5.1 Decisao

Removidos: diagramas de arquitetura do app (navegacao, auth, dados). Sao documentacao tecnica — pertencem a aba Docs ou a spec do projeto, nao ao painel de gestao.

### 5.2 Layout

Diagrama horizontal unico mostrando o pipeline de trabalho. Renderizado dinamicamente a partir dos agents e seus roles:

```
Demanda → PM (Triagem) → Tech Lead (Arquitetura) → Devs/Design (Implementacao) → Tech Lead (Code Review) → QA → Done
                                                                                        ↑                    │
                                                                                        └──── Bug ───────────┘
```

O pipeline e montado automaticamente:
- Entrada: "Demanda" (node fixo)
- PM: triagem + spec (agents com role PM/Product Manager)
- Lead: arquitetura (agents com role Tech Lead/Lead)
- Implementacao: devs + designers (agents com role Developer/Designer)
- Review: lead novamente (code review)
- QA: agents com role QA
- Saida: "Done" (node fixo)

Se o projeto nao tem todos os roles, o pipeline adapta (ex: sem QA, pula a etapa).

### 5.3 Elementos Visuais por Node

- **Avatar** com icone de role
- **Nome do agent**
- **Papel nesta etapa** (Triagem, Arquitetura, Implementacao, Code Review, QA)
- **Contador**: quantas tasks estao nesta etapa (derivado do status)

### 5.4 Mapeamento Status → Etapa

| Etapa | Status da task | Quem |
|-------|---------------|------|
| Triagem | `backlog` | PM |
| Arquitetura | (passagem) | Tech Lead |
| Implementacao | `in_progress` | Devs, Designers |
| Code Review | `review` | Tech Lead |
| QA | tasks de QA | QA |
| Done | `done` | — |

### 5.5 Comportamentos

- **Contadores vivos**: atualizados com os dados do projeto
- **Seta de retorno**: QA reprova → seta visual volta para Code Review / Implementacao
- **Highlight ativo**: etapas com tasks > 0 ficam com borda/glow destacado; etapas vazias ficam opacas
- **Node de implementacao**: mostra multiplos agents lado a lado, cada um com seu contador
- **Hover no contador**: tooltip listando os IDs das tasks naquela etapa

---

## 6. Pulso (ex-Atividades)

Painel heartbeat — visao rapida de quem fez o que recentemente.

### 6.1 Layout

Grid de cards (um por agent), estilo dashboard de monitoramento.

### 6.2 Card de Pulso

Cada card mostra:
- **Avatar** com icone de role
- **Nome + cargo**
- **Status visual**:
  - `ativo` — pulso animado (CSS animation). Tem task `in_progress` ou `review`
  - `concluiu recente` — check verde. Ultima acao nas ultimas 24h mas sem task ativa
  - `idle` — cinza opaco. Sem acao recente e sem task ativa
- **Ultima acao**: texto da acao + timestamp relativo ("ha 2h", "ontem", "3 dias atras")

### 6.3 Fonte de Dados

- Com fleet.json: activity[] do projeto
- Sem fleet.json: `git log` (auto-descoberto pelo scanner)
- Combinacao de ambos quando disponiveis

### 6.4 Complemento ao Organograma

- Pulso: visao rapida "quem esta vivo" (sem click)
- Organograma: detalhe completo ao clicar (tasks, historico, skills)
- Sem duplicacao — Pulso e resumo, Organograma e profundidade

---

## 7. Docs

Acesso rapido a documentacao do projeto ativo.

### 7.1 Auto-Descoberta

O scanner indexa automaticamente arquivos conhecidos:

| Pasta/arquivo | Categoria |
|---------------|-----------|
| `docs/*.md` | Funcional / Tecnico (inferido pelo nome) |
| `docs/*.html` | Mockups / Prototipos |
| `docs/*.yaml`, `docs/*.yml` | API / Specs tecnicas |
| `schema.sql`, `*.sql` na raiz | Banco de dados |
| `CLAUDE.md` | Projeto |
| `.claude/agents/*.md` | Agents |
| `memory/`, `.claude/memory/` | Memoria |
| `docs/branding/` | Design / Marca |

### 7.2 Mapeamento Manual (fleet.json)

Para o que o scanner nao consegue categorizar automaticamente:

```json
{
  "docs": {
    "categories": [
      { "name": "Funcional", "icon": "clipboard", "files": ["docs/SPEC_FUNCIONAL_v1.md"] },
      { "name": "Tecnico", "icon": "gear", "files": ["docs/QUANTO_SPEC_v4.md", "docs/api-spec.yaml"] },
      { "name": "Design", "icon": "palette", "files": ["docs/branding/", "docs/quanto-mockup-v5.html"] }
    ]
  }
}
```

### 7.3 Mapeamento pela UI

Botao "Mapear arquivo" na aba Docs:
- Selecionar categoria (dropdown)
- Digitar ou colar path relativo do arquivo/pasta
- Salva no fleet.json do projeto

### 7.4 Visualizacao

- Grid de categorias com icone e contagem de arquivos
- Click na categoria → lista de arquivos
- Click no arquivo:
  - `.md` → renderiza markdown inline (no proprio painel)
  - `.html` → abre em nova aba do navegador
  - `.yaml`, `.yml` → renderiza com syntax highlight inline
  - `.sql` → renderiza com syntax highlight inline
- Busca textual nos nomes e conteudo dos docs

---

## 8. Multi-Projeto

Fleet e standalone e multi-projeto.

### 8.1 Arquitetura de Pastas

```
C:\Projetos\Fleet\              ← projeto standalone
├── fleet-scan.js               ← CLI scanner (Node.js, ~300 linhas)
├── fleet.config.json           ← lista de projetos monitorados
├── public/
│   ├── index.html              ← dashboard Fleet
│   ├── style.css
│   ├── app.js
│   └── data/                   ← gerado pelo scanner
│       ├── projects.json       ← indice de projetos
│       ├── quanto.json         ← dados agregados do Quanto
│       └── linka-android.json  ← dados agregados do Linka Android
└── package.json
```

### 8.2 fleet.config.json

```json
{
  "projects": [
    { "path": "C:\\Projetos\\Quanto", "id": "quanto" },
    { "path": "C:\\Projetos\\Linka Android", "id": "linka-android" }
  ],
  "port": 3333,
  "watchInterval": 30000
}
```

### 8.3 CLI Scanner (fleet-scan.js)

Script Node.js, zero dependencias externas (so `fs`, `path`, `http`, `child_process`).

Para cada projeto configurado, escaneia:

**Auto-descoberto (sem input manual):**

| Fonte | Dados extraidos |
|-------|----------------|
| `.claude/agents/*.md` | Nome, role, tools, model, color, skills |
| `.claude/skills/` | Catalogo de skills por agent |
| `.claude/launch.json` | Configs de dev server |
| `.claude/settings.json` | Permissoes |
| `CLAUDE.md` (H1 + tagline) | Nome e descricao do projeto |
| `.claude/agent-state.json` | Agent ativo no momento (se existir) |
| `git log --oneline -20` | Atividade recente real |
| `docs/`, `schema.sql`, `memory/` | Indice de documentacao |

**Manual (requer `fleet.json` na raiz do projeto):**

| Dados | Por que nao da pra auto-descobrir |
|-------|----------------------------------|
| Fases/milestones | Sao decisoes de gestao, nao tecnicas |
| Tasks + status | Backlog e priorizacao sao humanos |
| Activity log | Acoes especificas dos agents (complementa git log) |
| Metricas custom | KPIs variam por projeto |
| Mapeamento de docs | Categorizacao manual de arquivos |

### 8.4 Contrato Padrao — fleet.json

Arquivo opcional na raiz de cada projeto. Sem ele, Fleet funciona parcialmente (ver 8.7).

```json
{
  "phases": [
    { "id": "planning", "name": "Planejamento", "order": 0 },
    { "id": "dev", "name": "Desenvolvimento", "order": 1 }
  ],
  "tasks": [
    {
      "id": "FEAT-001",
      "title": "Titulo da task",
      "type": "feature",
      "phase": "dev",
      "owner": "carlos",
      "status": "in_progress",
      "priority": "p0",
      "description": "Descricao completa da task",
      "created_at": "2026-06-13T12:00:00Z",
      "completed_at": null,
      "depends_on": ["SETUP-001"]
    }
  ],
  "activity": [
    {
      "timestamp": "2026-06-13T22:00:00Z",
      "member": "carlos",
      "action": "Backend API completo — 7 endpoints + 2 cron jobs"
    }
  ],
  "docs": {
    "categories": [
      { "name": "Funcional", "icon": "clipboard", "files": ["docs/SPEC_FUNCIONAL_v1.md"] }
    ]
  }
}
```

### 8.5 Parser de Agents (dois formatos)

O scanner detecta automaticamente qual formato o projeto usa:

**Formato A — Markdown puro (ex: Quanto):**
```markdown
# Nome — Role
## Quem sou
...
## Tools
- Read, Glob, Grep, Edit, Write, Bash
```
Extrai: nome e role do H1 (separador " — "), tools da secao `## Tools`.

**Formato B — YAML frontmatter (ex: Linka Android):**
```markdown
---
name: Carlos
description: Backend Developer
tools: [Read, Grep, Edit, Write, Bash]
model: sonnet
color: "#1F7A4D"
---
```
Extrai: todos os campos do frontmatter diretamente.

Parser tenta frontmatter primeiro; se nao encontrar, faz fallback para parsing de H1.

### 8.6 Seletor de Projeto (UI)

- Dropdown no header ao lado do wordmark
- Mostra: nome do projeto + contagem de agents + badge (com fleet.json / so agents)
- Trocar projeto recarrega todas as abas
- Ultimo projeto selecionado salvo no localStorage

### 8.7 Graceful Degradation (projeto sem fleet.json)

| Aba | Sem fleet.json | Com fleet.json |
|-----|---------------|----------------|
| Organograma | Funciona (agents/*.md) | Funciona + indicadores de status das tasks |
| Board | Vazio — mensagem "Configure fleet.json para usar o Board" | Funciona completo |
| Dashboard | Parcial — so lista agents | Funciona completo com graficos |
| Fluxos | Pipeline generico baseado nos roles | Pipeline com contadores vivos |
| Pulso | Via git log | Via activity[] + git log combinados |
| Docs | Auto-descoberta apenas | Auto-descoberta + categorias manuais |

### 8.8 Adicionar Projetos pela UI

- Botao no header abre formulario
- Campo para colar o path absoluto do projeto
- Scanner valida se existe `.claude/` na pasta
- Se sim: indexa, gera JSON, aparece no seletor imediatamente
- Se nao: mensagem "Pasta sem .claude/ — nao e um projeto com agents"
- Lista de projetos editavel: remover projeto do Fleet sem apagar nada do disco

### 8.9 Acesso Remoto — Cloudflare Tunnel + Snapshot Offline

**Duas camadas de acesso:**

| Cenario | Fonte dos dados | Experiencia |
|---------|----------------|-------------|
| PC ligado | Tunnel → localhost (live) | Tempo real, auto-refresh 30s |
| PC desligado | Pages/KV → ultimo snapshot | Leitura, badge "offline — dados de DD/MMM HH:MM" |

**Como funciona:**

1. Scanner local roda e serve em `localhost:3333`
2. Cloudflare Tunnel expoe via `fleet.seudominio.com`
3. A cada scan, alem de servir local, faz push do JSON para Cloudflare KV ou Pages
4. Fleet no edge (Pages) tenta primeiro o tunnel (dados vivos)
5. Se tunnel indisponivel (PC desligado), serve o ultimo snapshot do KV
6. Badge visivel no header: "ao vivo" (verde pulsante) ou "offline — dados de [timestamp]" (amber)

**Auth:** Cloudflare Access protege ambos os caminhos (tunnel e Pages). OTP email.
**Custo:** zero (free tier — tunnel, Pages, KV, Access).

### 8.10 Comandos CLI

```bash
# Primeira vez
npm init -y
node fleet-scan.js                              # scan + serve

# Dia a dia
node fleet-scan.js                              # scan + serve (auto-refresh 30s)
node fleet-scan.js --scan-only                  # so gera JSONs, nao serve
node fleet-scan.js --add "C:\Projetos\Novo"     # adiciona projeto ao config
node fleet-scan.js --remove "id-do-projeto"     # remove projeto do config
```

---

## 9. Avatares (global)

Icone de role dentro do circulo colorido. Aplica em todas as abas (Board, Organograma, Pulso, Fluxos, Dashboard).

### 9.1 Mapeamento de Roles para Icones

| Role (pattern matching) | Tabler Icon | Cor default | Significado |
|------------------------|-------------|-------------|-------------|
| Product Manager / PM | `ti-clipboard-text` | Violet `#7C5CFC` | Gestao de produto |
| Tech Lead / Lead | `ti-bolt` | Blue `#3B82F6` | Decisoes tecnicas |
| Backend / API | `ti-code` | Cyan `#00D4AA` | Codigo servidor |
| Frontend / UI | `ti-layout` | Amber `#F5A623` | Codigo cliente |
| Designer / Design / UX | `ti-palette` | Purple `#A855F7` | Visual e UX |
| QA / Test / Quality | `ti-shield-check` | Red `#EF4444` | Qualidade |
| DevOps / Infra / SRE | `ti-tool` | Gray `#6B6B76` | Infraestrutura |
| Data / Analytics | `ti-chart-bar` | Blue `#3B82F6` | Dados |
| (fallback) | `ti-user` | Gray `#6B6B76` | Role nao mapeado |

O scanner faz pattern matching no role do agent para atribuir o icone automaticamente. Se o role nao corresponder a nenhum pattern, usa o fallback.

### 9.2 Cores

Cada agent tem sua cor propria (definida no agent file ou fleet.json). O circulo do avatar usa essa cor como background. O icone e branco sobre o circulo.

---

## 10. Principios Gerais

- **Stack**: Vanilla JS + CSS — sem framework, sem build step, sem dependencias de frontend
- **Dark mode obrigatorio**: toda mudanca visual deve funcionar em light e dark
- **Responsivo**: mobile 360px ate desktop 1920px
- **Alinhamento rigoroso**: CSS grid/flexbox com gaps padronizados (8px, 12px, 16px, 24px — escala de 4px). Sem desalinhamentos entre colunas, cards, barras ou graficos
- **Fonte de dados**: scanner gera JSONs em `public/data/`. Frontend le esses JSONs via fetch.
- **Auto-refresh**: 30s no modo local. Badge de status no header.
- **LocalStorage**: usado para preferencias (dark mode, projeto ativo, coluna done colapsada, overrides de drag & drop)
- **Zero dependencias pesadas**: scanner usa apenas modulos nativos do Node.js (fs, path, http, child_process)
- **Fonte tipografica**: Outfit 800 (wordmark), Geist Sans 400-500 (UI), Geist Mono 400 (dados/IDs). Ver secao 1.3 para tokens completos.
