# 🔄 Reorganização Squad Ágil — Handover Master Plan

**Data:** 2026  
**Status:** Em Execução  
**Orquestrador:** Renata  

---

## 📋 Visão Geral

Reorganização completa da squad técnica do Quanto com 3 handovers paralelos:

| Handover | De | Para | Entrega | Status |
|----------|----|----|---------|--------|
| **CHR-001** | Thiago (Tech Lead) | Carlos (Dev Backend + Tech Lead) | `docs/HANDOVER_THIAGO_TECH_LEAD_TO_CARLOS.md` | Em Progresso |
| **CHR-002** | Beatriz (Data/Eng + Designer) | Gabriel (Data Engineer) | `docs/HANDOVER_BEATRIZ_CVM_IMPORT_TO_GABRIEL.md` | Em Progresso |
| **CHR-003** | Thiago (Tech Lead) | Thiago (Scrum Master) | `docs/HANDOVER_THIAGO_TECH_LEAD_TO_SM.md` | Em Progresso |

---

## 🔄 Fluxo de Handover

### **Fase 1: Preparação (Paralelo)**

**CHR-001 — Thiago documenta Tech Lead:**
- [ ] Decisões arquiteturais (Hono, D1, PWA, Cloudflare)
- [ ] Limites técnicos e restrições free tier
- [ ] Code review standards e patterns
- [ ] Débitos técnicos e decisions pendentes
- [ ] Documento criado e pronto para Carlos

**CHR-002 — Beatriz documenta CVM/Import:**
- [ ] Pipeline CVM completo (busca, normalização, schema)
- [ ] Import XLSX (formato, parsing, validações)
- [ ] Edge cases (fundos extintos, múltiplas classes)
- [ ] Testes e checklist QA
- [ ] Documento criado e pronto para Gabriel

**CHR-003 — Renata coordena transição SM:**
- [ ] Valida preparação de Thiago para sair de Tech Lead
- [ ] Documenta novo papel de SM (eventos, facilitação, unblock)
- [ ] Prepara comunicação interna

### **Fase 2: Estudo (Sequencial)**

**CHR-004 — Carlos estuda handover de Thiago:**
- [ ] Lê `docs/HANDOVER_THIAGO_TECH_LEAD_TO_CARLOS.md`
- [ ] Faz perguntas de clarificação
- [ ] Estuda código-chave do projeto
- Task: `CHR-004`

**CHR-005 — Gabriel estuda handover de Beatriz:**
- [ ] Lê `docs/HANDOVER_BEATRIZ_CVM_IMPORT_TO_GABRIEL.md`
- [ ] Faz perguntas de clarificação
- [ ] Estuda schema D1 e pipeline CVM
- Task: `CHR-005`

### **Fase 3: Alinhamento (Síncrono)**

**CHR-007 — Thiago & Carlos sync técnico:**
- [ ] Sync 1h com Q&A
- [ ] Code review examples
- [ ] Thiago responde dúvidas
- [ ] Carlos confirma: "Ready to approve PRs"
- Task: `CHR-007`

**CHR-008 — Beatriz & Gabriel sync CVM/Import:**
- [ ] Sync 1h com Q&A
- [ ] Walkthrough código (parsing, normalização)
- [ ] Gabriel testa imports
- [ ] Beatriz responde dúvidas
- [ ] Gabriel confirma: "Ready to implement/maintain"
- Task: `CHR-008`

### **Fase 4: Validação & Fechamento**

**CHR-006 — Renata valida tudo:**
- [ ] Todos os handovers completos?
- [ ] Nenhum overlap de responsabilidades?
- [ ] Documentação atualizada?
- [ ] Time entende as mudanças?
- Task: `CHR-006`

**CHR-009 — Atualizar CLAUDE.md:**
- [ ] CLAUDE.md reflete nova squad
- [ ] Todos os 7 agentes com responsabilidades finais
- [ ] Remove referências a Tech Lead de Thiago
- [ ] Confirma Gabriel como novo Data/Eng
- Task: `CHR-009`

---

## 👥 Nova Squad (Pós-Transição)

```
┌─────────────────────────────────────────┐
│         SQUAD ÁGIL DO QUANTO            │
├─────────────────────────────────────────┤
│                                         │
│  PO: Renata (escopo, specs)             │
│                                         │
│  Tech Lead: Carlos (arquitetura, code)  │
│  SM: Thiago (ágil, facilita, unblock)   │
│                                         │
│  Dev Frontend: Marina (UI, CSS)         │
│  Dev Backend: Carlos (API, schema)      │
│                                         │
│  UI/UX Designer: Beatriz (design, UX)   │
│  Data/Eng: Gabriel (CVM, import, dados) │
│                                         │
│  QA Engineer: Pedro (testes, regressão) │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📊 Métricas de Sucesso

- ✅ Todos os handovers documentados
- ✅ Todos os alinhamentos síncronos realizados
- ✅ CLAUDE.md atualizado
- ✅ Nenhum conhecimento perdido
- ✅ Squad operacional na próxima sprint
- ✅ Responsabilidades 100% claras

---

## ⚠️ Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Carlos sobrecarregado (Backend + Tech Lead) | Documentação clara, pair programming com Thiago para PR review |
| Gabriel entra sem contexto CVM | Beatriz disponível para Q&A, documentação detalhada, primeiras tasks mentoradas |
| Thiago perde autoridade em tech (mudança para SM) | Comunicação clara: SM é posição estratégica, não degradação |
| Squad sem Tech Lead sênior? | Carlos + Renata trabalham juntos em decisões críticas |

---

## 📅 Timeline

**Semana 1 (Agora):**
- Thiago & Beatriz documentam (CHR-001, CHR-002)
- Renata coordena (CHR-003)

**Semana 2:**
- Carlos estuda (CHR-004)
- Gabriel estuda (CHR-005)
- Sync Thiago-Carlos (CHR-007)
- Sync Beatriz-Gabriel (CHR-008)

**Semana 3:**
- Renata valida (CHR-006)
- CLAUDE.md atualizado (CHR-009)
- **Squad operacional!**

---

## 🔗 Documentos Relacionados

- `.claude/CLAUDE.md` — Squad definition
- `docs/REORGANIZACAO_SQUAD_2026.md` — Visão geral
- `docs/HANDOVER_THIAGO_TECH_LEAD_TO_CARLOS.md` — (será criado por Thiago)
- `docs/HANDOVER_BEATRIZ_CVM_IMPORT_TO_GABRIEL.md` — (será criado por Beatriz)
- `docs/HANDOVER_THIAGO_TECH_LEAD_TO_SM.md` — (será criado por Renata)

---

**Próximo passo:** Aguardar entrega de Thiago e Beatriz (CHR-001, CHR-002).
