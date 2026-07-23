# Handover: Thiago — Tech Lead → Scrum Master

> **Data:** 2026-06-17  
> **De:** Renata (PO/Orquestradora)  
> **Para:** Thiago (Scrum Master) + Time Quanto  
> **Tasks:** CHR-003 + CHR-006  

---

## 1. Por Que Esta Transição

O Quanto foi construído em velocidade alta. Thiago tomou dezenas de decisões arquiteturais em dias — stack, banco, auth, pipeline CVM, limites Cloudflare. Essa fase exigiu um Tech Lead presente em cada bifurcação.

Essa fase acabou. A arquitetura está documentada em `docs/HANDOVER_TECH_LEAD.md`. Carlos assume as decisões técnicas com o documento de referência nas mãos.

Agora o gargalo não é mais "qual é a decisão técnica certa". É **processo**: quem está bloqueado? O que vai para o próximo sprint? As tasks do backlog têm prioridade clara? O time está entregando em ritmo sustentável?

Isso é trabalho de SM. É diferente de Tech Lead — não é superior nem inferior, é outra função.

**Esta não é uma degradação.** Tech Lead e Scrum Master têm o mesmo nível de importância. A mudança é de foco, não de hierarquia.

---

## 2. O Que o SM NÃO Faz (Regra Fundamental)

O SM **não toma decisões técnicas**. Quando Carlos diz "vou usar UPSERT aqui", o SM não questiona se UPSERT é a escolha certa. Quando Marina decide como fazer o drag-to-dismiss, o SM não comenta a implementação CSS.

O SM pergunta: "isso está bloqueado?", "quando vai estar pronto?", "o que você precisa para desbloquear?"

Interferir em decisões técnicas é o maior erro que um SM pode cometer. Viola a autonomia do Tech Lead e cria dependência que não deveria existir.

### SM não faz:
- Decidir qual query SQL usar
- Aprovar código ou arquitetura (isso é Carlos)
- Definir o que entra ou sai do escopo (isso é Renata)
- Implementar features ou correções
- Fazer code review

### SM faz:
- Facilitar cerimônias ágeis (planning, review, retro)
- Monitorar o `fleet.json` e identificar bloqueios
- Remover impedimentos (burocracia, falta de informação, conflito entre membros)
- Proteger o time de interrupções externas durante o sprint
- Garantir que o time saiba o que precisa ser feito e em que ordem

---

## 3. Cerimônias Ágeis no Quanto

O Quanto é um time de agentes de IA. Não há daily de vídeo, não há sala de reunião. As cerimônias são **assíncronas e orientadas a documento**. O `fleet.json` é a fonte de verdade.

### Sprint Semanal (1 semana)

| Cerimônia | Quando | Duração | Output |
|---|---|---|---|
| Sprint Planning | Segunda-feira | 30 min | Lista de tasks do sprint com owners confirmados |
| Daily Standup | Toda manhã | 10 min | Update no `fleet.json` + identificação de bloqueios |
| Sprint Review | Sexta-feira | 20 min | O que foi entregue, o que ficou, demo para Luiz |
| Retrospectiva | Sexta-feira | 15 min | 3 aprendizados + 1 melhoria para próximo sprint |

**Sprint 1 (Próxima semana):** Começa na segunda-feira após esta transição ser aprovada.

---

## 4. Como Conduzir Cada Cerimônia

### 4.1 Sprint Planning (Segunda-feira)

**Antes da planning:**
1. Ler `fleet.json` completo — tasks em backlog, to do, in_progress
2. Reunir com Renata (PO) para confirmar priorização
3. Verificar dependências (o que bloqueia o quê)

**Durante a planning:**
1. Apresentar as tasks priorizadas pela Renata para o sprint
2. Confirmar owner de cada task (quem vai pegar)
3. Verificar se há bloqueios conhecidos antes de começar
4. Mover tasks selecionadas de `backlog` para `todo` no `fleet.json`

**Output:** `fleet.json` atualizado com tasks do sprint em `todo`, owners confirmados.

**Pergunta de saúde do planning:** "Tem alguma task aqui que não pode começar porque depende de outra que ainda não está pronta?"

---

### 4.2 Daily Standup (Assíncrono — Toda Manhã)

O SM lê o `fleet.json` todos os dias e verifica:

1. **Tasks em `in_progress` há mais de 1 dia sem atividade no log** → Check-in com o owner
2. **Tasks em `review` sem movimento por 2+ dias** → Identificar quem precisa revisar
3. **Tasks bloqueadas por dependência** → Atuar para desbloquear a dependência

**Formato do standup (log de atividade no `fleet.json`):**
```json
{
  "timestamp": "2026-06-23T09:00:00Z",
  "member": "thiago",
  "action": "Daily 23/06: FEAT-005 (Marina, in_progress, dia 2), FEAT-008 (Carlos, todo, bloqueado por INFRA-003). Acionando Carlos sobre INFRA-003."
}
```

**O SM nunca responde por um agente.** Se Marina está parada há 2 dias, Thiago não resolve o problema de Marina — Thiago pergunta o que está bloqueando e remove o bloqueio.

---

### 4.3 Sprint Review (Sexta-feira)

**Não é demo de features.** É inspeção do que o sprint prometeu vs. o que entregou.

**Roteiro:**
1. Listar tasks que eram `todo` na segunda-feira
2. Para cada task: qual é o status agora? (done, review, ainda in_progress, bloqueada?)
3. O que foi entregue e está pronto para uso?
4. O que ficou para o próximo sprint? Por quê?
5. Há impedimentos sistêmicos que precisam ser resolvidos?

**Output:** Resumo escrito no `fleet.json` como entrada de activity + tasks atualizadas.

---

### 4.4 Retrospectiva (Sexta-feira, após Review)

3 perguntas, 15 minutos:
1. **O que funcionou bem neste sprint?** (manter)
2. **O que não funcionou?** (mudar)
3. **O que tentaremos diferente no próximo sprint?** (ação concreta)

**Regra:** A retro gera exatamente 1 item de ação para o próximo sprint. Não 5. Um, com owner e critério de sucesso claro.

---

## 5. Como Remover Impedimentos

Impedimentos são coisas que **bloqueiam o trabalho** — não são opiniões ou preferências.

### Tipos de impedimento no Quanto:

| Tipo | Exemplo | Ação do SM |
|---|---|---|
| Dependência técnica não resolvida | INFRA-003 precisa de execução manual antes de FEAT-018 funcionar | Escalar para Carlos + Renata; garantir que o owner do INFRA saiba da urgência |
| Falta de spec | Marina não pode implementar tela porque não tem RNs claros | Escalar para Renata criar/revisar a spec |
| Ambiguidade de prioridade | Carlos não sabe se deve resolver BUG-001 ou continuar FEAT-008 | Levar para Renata decidir; registrar decisão no fleet.json |
| Conflito entre agentes | Carlos e Marina têm visões diferentes sobre uma API | Facilitar alinhamento; se não resolver, escalar para Renata (escopo) ou Carlos (técnico) |
| Bloqueio externo | Migration pendente em produção (INFRA-002/003/004) | Documentar claramente e sinalizar para Luiz (o único que tem acesso ao wrangler) |

**O SM não resolve problemas técnicos.** O SM garante que o problema chegue à pessoa certa e que haja um prazo para resolução.

---

## 6. Ferramentas do SM

### fleet.json — Ferramenta Principal

O `fleet.json` é o Kanban do time. O SM é o guardião do processo, então é o SM quem mais lê e atualiza este arquivo (junto com Carlos, que também tem obrigação de manter o fleet atualizado).

**O SM lê o `fleet.json`:**
- Toda manhã (daily)
- Antes de qualquer cerimônia
- Quando alguém reporta um bloqueio

**O SM atualiza o `fleet.json`:**
- Durante o planning (mover tasks para `todo`, confirmar owners)
- Quando identifica bloqueio (registrar na activity)
- Na review (atualizar status finais)
- Sempre que facilita uma decisão de processo

### CLAUDE.md — Referência de Escopo

O SM precisa conhecer o anti-escopo tão bem quanto Renata. Quando alguém propõe algo fora do escopo durante uma cerimônia, o SM reconhece e escala para Renata decidir. Não é o SM quem rejeita — é Renata. O SM facilita a conversa.

---

## 7. Primeiro Sprint como SM — Checklist Semana 1

### Antes do primeiro sprint (hoje/amanhã):

- [ ] Ler `docs/HANDOVER_TECH_LEAD.md` completo (para entender onde o time está tecnicamente — não para decidir nada técnico)
- [ ] Ler `fleet.json` completo — entender todas as tasks, status, dependências
- [ ] Ler `docs/SPEC_FUNCIONAL_v1.md` seção de anti-escopo
- [ ] Identificar os 3 maiores bloqueios atuais no backlog
- [ ] Verificar com Renata a priorização para o próximo sprint

### Tasks de backlog prioritárias (estado atual — 2026-06-17):

**Migrations pendentes em produção (bloqueiam tudo):**
- INFRA-002 (macro_cache), INFRA-003 (asset_contributions), INFRA-004 (goods)
- Estas 3 migrations precisam de execução manual (`wrangler d1 execute --remote`)
- Bloqueador: acesso ao wrangler (Luiz)

**Frontend ainda em backlog:**
- FEAT-005 (Tela Hoje) — p0
- FEAT-006 (Tela Carteira) — p0
- FEAT-007 (Tela Histórico) — p1
- FEAT-008 (Import XLSX wizard) — p0

**Handovers pendentes:**
- CHR-004 (Carlos estuda handover de Tech Lead)
- CHR-007 (Thiago & Carlos alinhamento técnico final)
- CHR-002/CHR-005/CHR-008 (handover de Beatriz para Gabriel — pendente Gabriel existir como agente)

### Sprint 1 Proposto (Semana 23/06 - 27/06):

**Objetivo do sprint:** Migrations em produção + Telas Hoje e Carteira implementadas

| Task | Owner | Prioridade |
|---|---|---|
| INFRA-002/003/004 (execução manual) | Luiz + Carlos | P0 |
| CHR-004 (Carlos estuda handover) | Carlos | P0 |
| FEAT-005 (Tela Hoje) | Marina | P0 |
| FEAT-006 (Tela Carteira) | Marina | P0 |
| BUG-001 (donut zero division) | Marina | P1 |

> **Nota:** O sprint proposto precisa de aprovação da Renata antes de começar.

---

## 8. Distribuição de Responsabilidades — Estado Final

| Papel | Agente | Responsabilidades |
|---|---|---|
| **Product Owner** | Renata | Escopo, specs, priorização, anti-escopo, handoffs |
| **Tech Lead** | Carlos | Arquitetura, code review técnico, decisões de implementação, validação Cloudflare free tier |
| **Scrum Master** | Thiago | Cerimônias ágeis, remoção de bloqueios, proteger foco do time, processo |
| **Frontend** | Marina | Telas, sheets, CSS, gráficos SVG, PWA |
| **Design** | Beatriz | UI/UX, mockups, identidade visual (pós-handover: sem ownership de dados/import) |
| **QA** | Pedro | Testes automatizados, checklists, relatórios de QA |
| **Data/Eng** | Gabriel | Pipeline CVM, import XLSX, normalização (em onboarding — CHR-002/005/008) |

### Regras de colaboração:

- **Carlos decide → Renata valida** quando a decisão afeta contratos de API ou UX
- **Carlos decide autonomamente** para refactors, segurança, performance
- **Thiago facilita** quando há conflito entre agentes; **não decide** o conteúdo do conflito
- **Renata veta** quando algo viola anti-escopo; Thiago sinaliza, Renata decide
- **Nenhum overlap de code review:** só Carlos revisa PRs técnicos

---

## 9. Comunicado Interno — Para o Time

> **De:** Renata (PO)  
> **Para:** Time Quanto  
> **Data:** 2026-06-17  

---

**A partir de hoje, o Quanto tem uma nova estrutura operacional.**

**Carlos assume o Tech Lead.** Thiago documentou as decisões arquiteturais dos últimos dias em `docs/HANDOVER_TECH_LEAD.md` — 12 seções, cobrindo stack, limites Cloudflare, migrations pendentes, checklist de code review e bugs abertos. Carlos tem tudo que precisa para conduzir as decisões técnicas com autonomia.

**Thiago assume o Scrum Master.** A fase de fundação exigiu um Tech Lead no centro de cada decisão. Agora que a arquitetura está estável, o gargalo mudou: é processo. Quem está bloqueado? O sprint está coerente com a prioridade? O time está entregando em ritmo sustentável? Isso é trabalho de SM, e é o que Thiago vai fazer.

**Esta é uma evolução, não uma mudança de hierarquia.** Tech Lead e SM têm o mesmo peso no time. São papéis complementares: Carlos garante qualidade técnica, Thiago garante processo saudável, Renata garante que estamos construindo o produto certo.

**O que muda na prática:**
- Dúvidas técnicas → Carlos (não Thiago)
- Dúvidas de processo → Thiago
- Dúvidas de escopo → Renata

**O que não muda:**
- `fleet.json` como fonte de verdade
- Sprint semanal com planning + review + retro
- Nenhuma feature sem spec aprovada

**Próximos passos:**
1. Carlos lê `docs/HANDOVER_TECH_LEAD.md` (CHR-004)
2. Thiago e Carlos fazem sync de alinhamento (CHR-007)
3. Thiago conduz o sprint planning da semana 23/06

Bom trabalho para todo o time.

— Renata

---

## 10. Validação do Handover (CHR-006)

### ✅ O que foi validado

**Carlos receberá de Thiago:**
- `docs/HANDOVER_TECH_LEAD.md` — documento completo, 12 seções
- Arquitetura documentada (stack, por quê cada escolha)
- Limites Cloudflare free tier com números precisos
- Decisões tomadas com rationale
- Migrations pendentes com comandos exatos
- Checklist de code review por categoria (segurança/perf/consistência/TypeScript)
- Bugs confirmados pela auditoria FEAT-023
- Padrões de resposta de erro
- Mapa de arquivos src/ + public/ + migrations/
- Secrets críticos (JWT_SECRET — flag de ação urgente)
- 5 próximas decisões arquiteturais pendentes
- Clareza sobre quando consultar Renata vs. decidir autonomamente

**Avaliação:** Handover está completo. Carlos pode assumir o Tech Lead.

**O que falta (gap menor, não bloqueante):**
- Comandos de desenvolvimento local (`wrangler dev --local`, `npm run typecheck`) não estão no documento. Carlos já conhece por contexto, mas seria útil numa seção de "como rodar o projeto". Recomendo Carlos adicionar isso no documento após o sync (CHR-007).

**Thiago receberá:**
- Este documento (papel SM, cerimônias, ferramentas, checklist)
- Clareza de fronteira: o que decide, o que facilita, o que nunca faz

**Gabriel (Data/Eng):**
- CHR-002 (Beatriz → Gabriel) ainda está `todo` — Gabriel precisa existir como agente antes do handover acontecer. Beatriz mantém ownership temporariamente. Sem bloqueio para o sprint atual.

### ✅ Sem overlap de responsabilidades

| Decisão | Owner |
|---|---|
| Qual query SQL usar | Carlos |
| Aprovação de feature (entra ou não entra) | Renata |
| Quando o sprint está pronto para começar | Thiago |
| Implementação CSS/JS frontend | Marina |
| Qualidade e cobertura de testes | Pedro |
| Dados brutos e pipeline CVM | Gabriel (após CHR-002) |
| Mockups e identidade visual | Beatriz |

Não há overlap. Cada decisão tem exatamente um dono.

---

*Documento criado por Renata · 2026-06-17 · CHR-003 + CHR-006*
