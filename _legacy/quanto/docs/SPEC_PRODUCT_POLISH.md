# SPEC — Product Polish v1

> Status: **in_progress**
> Data: 2026-06-15
> Objetivo: Levar o app de "funcional" para "o single-user gosta e valida"
> Prioridade: Antes de seguranca, multi-user e features novas

---

## 1. Contexto

O Quanto tem 5 telas, 6 sheets, ~22 endpoints, e todas as features core implementadas (cotacoes auto, import XLSX, bens, aportes, IA). Porem, varias telas tem CSS incompleto, interacoes sem feedback, e a UX em mobile apresenta fricoes que impedem o single-user de adotar o app no dia-a-dia.

Este spec cobre exclusivamente **product polish**: CSS faltante, interacoes, feedback visual e comportamentos de sheet. NAO cobre seguranca, multi-user, LGPD, analytics ou infra.

---

## 2. Problemas Criticos (P0) — Telas Quebradas

### 2.1 CSS faltante: Tela Bens e Garantias

A tela Bens (`tela-bens`) renderiza HTML via `renderGoods()` usando classes que nao existem no `style.css`:

| Classe usada no JS | Presente no CSS? | Descricao |
|---|---|---|
| `.bens-total-card` | NAO | Card de total de bens |
| `.bens-total-val` | NAO | Valor total de bens |
| `.bens-item-top` | NAO | Header do item de bem (nome + valor) |
| `.bens-edit-btn` | NAO | Botao "Editar" em cada bem |
| `.stale-icon` | NAO | Icone de alerta de frescor |

**Classes que EXISTEM mas com nomes diferentes:**
- `bens-total` existe (card generico), mas o JS usa `bens-total-card`
- `bens-total-value` existe, mas o JS usa `bens-total-val`
- `btn-edit-sm` existe mas o JS usa `bens-edit-btn`

**Impacto:** A tela Bens renderiza sem formatacao adequada — itens desalinhados, botoes sem estilo, totais sem destaque.

**Solucao:** Alinhar os nomes de classe entre JS e CSS. Preferir renomear no CSS (adicionar as classes faltantes) para evitar regressoes no JS.

### 2.2 CSS faltante: Tela Detalhe do Ativo

A funcao `renderDetail()` gera HTML com ~20 classes sem regras CSS:

| Classe | Descricao |
|---|---|
| `.detail-sub` | Subtitulo (instituicao + classe + ticker) |
| `.detail-stale-warn` | Alerta amber de frescor vencido |
| `.detail-stale-ok` | Info verde de frescor em dia |
| `.detail-price-info` | Preco unitario (BRAPI/CVM) |
| `.detail-gain` | Bloco de gain |
| `.detail-gain-pos` | Gain positivo (cor verde) |
| `.detail-gain-neg` | Gain negativo (cor vinho) |
| `.detail-chart-area` | Container do grafico de preco |
| `.chart-unavailable` | Mensagem quando grafico nao carrega |
| `.detail-empty-contribs` | Empty state de aportes |
| `.detail-contribs-summary` | Resumo de aportes (N aportes, total) |
| `.detail-contrib-row` | Linha de aporte individual |
| `.detail-contrib-left` | Lado esquerdo da linha de aporte |
| `.detail-contrib-amount` | Valor do aporte |
| `.detail-contrib-date` | Data do aporte |
| `.detail-contrib-note` | Nota/observacao do aporte |
| `.detail-contrib-del` | Botao de remover aporte |
| `.detail-aporte-btn` | Botao de registrar aporte |
| `.detail-loading` | Loading placeholder |
| `.detail-error` | Mensagem de erro |
| `.detail-row-label` | Label da linha de detalhe |
| `.detail-row-val` | Valor da linha de detalhe |

**Impacto:** A tela funciona (dados aparecem) mas sem estilizacao — tudo amontoado, sem espacamento, cores ou hierarquia visual.

**Solucao:** Adicionar bloco completo de CSS para a tela Detalhe, seguindo o design system v4 (tokens, radius, shadows, tipografia).

---

## 3. Sheets — Comportamento de Arrastar para Fechar (P0)

### 3.1 Problema

As sheets abrem com animacao `sheetUp` mas **nao podem ser recolhidas por gesto**. O drag handle (`.sheet-drag`) e puramente visual — nao responde a toque. O unico jeito de fechar uma sheet e tocar no overlay (fundo escuro).

Isso e especialmente problematico em:
- Sheets longas (Editar ativo, Adicionar bem) que passam da altura da tela
- Mobile, onde o gesto natural de "puxar para baixo" nao funciona
- Sheets que abrem sobre outras (aporte sobre detalhe)

### 3.2 Solucao

Implementar drag-to-dismiss nas sheets:

```
Comportamento esperado:
1. Toque no drag handle ou na area do titulo → inicia arrasto
2. Arrastar para baixo → sheet acompanha o dedo (translateY)
3. Se arrastar > 100px para baixo → fecha a sheet (snap para baixo)
4. Se arrastar < 100px → retorna para posicao original (snap para cima)
5. Velocity: se velocidade do gesto > 0.5px/ms → fecha independente da distancia
```

**Regras:**
- O arrasto so funciona quando a sheet esta no topo do scroll (scrollTop === 0)
- Se a sheet tem conteudo rolavel e esta scrollada, o arrasto nao interfere
- Feedback visual: opacidade do overlay diminui proporcionalmente ao arrasto
- Animacao de retorno: `.28s cubic-bezier(0.32, 0.72, 0.3, 1)` (mesmo timing da abertura)

### 3.3 Altura maxima das sheets

Atualmente `max-height: 88vh`. Sheets com muito conteudo (Adicionar bem com tipo Imovel, Editar ativo) podem nao caber. A sheet precisa:

- `max-height: 88dvh` (dynamic viewport height, ja presente)
- Scroll interno funcional (ja presente via `overflow-y: auto`)
- Padding bottom suficiente para o ultimo botao nao ficar colado na borda

---

## 4. Loading States nos Botoes (P0)

### 4.1 Problema

Nenhum botao de acao mostra loading durante o request. O usuario pode:
- Clicar 2x em "Salvar saldo" → request duplicado
- Clicar "Adicionar ativo" sem feedback → achar que nao funcionou
- Clicar "Confirmar importacao" de 30 ativos → esperar sem saber se algo aconteceu

### 4.2 Solucao

Criar um helper `btnLoading(btn, promise)`:

```
Comportamento:
1. Ao clicar: btn.disabled = true, texto muda para "Salvando...", adiciona classe .loading
2. Ao resolver: btn.disabled = false, texto volta ao original
3. Ao rejeitar: btn.disabled = false, texto volta ao original, toast de erro
```

Aplicar em todos os botoes de acao:
- `sh-saldo-save` → "Salvando..."
- `sh-edit-save` → "Salvando..."
- `sh-add-save` → "Adicionando..."
- `sh-aporte-save` → "Registrando..."
- `sh-bem-save` → "Salvando..."
- `imp-confirm-btn` → "Importando..."
- `login-btn` → "Entrando..."
- `register-btn` → "Criando conta..."
- `recover-btn` → "Redefinindo..."

CSS do estado loading:
```css
.btn-primary.loading {
  opacity: 0.7;
  pointer-events: none;
}
```

---

## 5. Melhorias de UX (P1)

### 5.1 Saldo na sheet de edicao

Atualmente a Sheet B (editar) mostra nome, instituicao, classe, ticker, investido — mas NAO o saldo atual. O usuario precisa fechar, ir na sheet A (saldo) para ver/atualizar.

**Solucao:** Adicionar campo somente-leitura de saldo atual no topo da Sheet B para ativos manuais, com botao "Atualizar saldo" que abre a Sheet A.

### 5.2 Busca por texto na Carteira

Com 20+ ativos, nao tem busca por texto. So filtro por instituicao/classe via chips.

**Solucao:** Adicionar campo de busca acima dos chips de filtro. Busca local em `name`, `display_name`, `ticker`, `institutionName`. Debounce de 150ms, sem request ao server.

### 5.3 Timestamp de atualizacao no KPI

O hero mostra o patrimonio total mas nao quando foi atualizado. O usuario nao sabe se esta olhando dado de agora ou do cache SW.

**Solucao:** Adicionar texto discreto "atualizado agora" / "atualizado ha X min" abaixo do chip de ganho, usando `p.quotesFetchedAt` ou a hora do ultimo `loadPortfolio()`.

### 5.4 Transicoes entre telas

A troca de tab e instantanea (`display:none` → `display:''`). Sem slide ou fade. Parece app nao-nativo.

**Solucao:** Animacao de fade curto (150ms opacity) na troca de tab. NAO usar slide horizontal (conflita com o swipe entre tabs que ja existe).

### 5.5 Skeleton loading

Quando a API carrega, o conteudo "pula" quando renderiza.

**Solucao:** Skeleton placeholders nos 3 pontos criticos:
- Hero (bloco animado no lugar do KPI)
- Donut (circulo cinza pulsante)
- Lista de ativos (3 linhas placeholder)

Classe `.skeleton`:
```css
.skeleton {
  background: linear-gradient(90deg, var(--mist) 25%, var(--border) 50%, var(--mist) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## 6. Polish Visual (P2)

### 6.1 Micro-animacoes em chips e toggles

Os chips trocam estado sem transicao. Toggle pill troca sem indicador animado.

**Solucao:** `transition: all 0.15s ease` ja existe na maioria — verificar que todas as interacoes visuais tem transicao.

### 6.2 Confirmacao ao fechar sheet com dados

Se o usuario preencheu metade do formulario e toca no overlay, perde tudo sem aviso.

**Solucao:** Se algum input na sheet tem valor, mostrar confirm antes de fechar. Implementar como `hasSheetDirtyData()` que checa os inputs do sheet aberto.

---

## 7. Fora de Escopo deste Spec

| Item | Motivo |
|---|---|
| CORS / rate limiting / CSP | Seguranca — fazer depois de validar produto |
| Export de dados (LGPD) | Compliance — apos validacao |
| Onboarding / tutorial | Pode ser feito depois com dados reais de uso |
| Mover tab "Importar" | Decisao de IA com impacto em navegacao — discutir separado |
| Ordenacao na Carteira | Nice-to-have, pode vir depois |
| Filtro de periodo no Historico | Nice-to-have |
| Analytics | Infra — depois de validar |

---

## 8. Ordem de Implementacao

```
Fase 1 — Telas visivelmente quebradas (P0)
  1. CSS Tela Bens (alinhar classes JS ↔ CSS)
  2. CSS Tela Detalhe (bloco completo de estilos)
  3. Sheet drag-to-dismiss (gesto de arrastar para fechar)
  4. Loading states nos botoes

Fase 2 — UX que faz diferenca no dia-a-dia (P1)
  5. Saldo na sheet de edicao
  6. Busca na Carteira
  7. Timestamp no KPI
  8. Transicoes entre telas (fade)
  9. Skeleton loading

Fase 3 — Polish fino (P2)
  10. Confirmacao ao fechar sheet com dados
  11. Micro-animacoes faltantes
```

---

## 9. Checklist

### Fase 1 — P0
- [x] Adicionar CSS faltante para `.bens-total-card`, `.bens-total-val`, `.bens-item-top`, `.bens-edit-btn`, `.stale-icon`
- [x] Adicionar CSS completo para tela Detalhe (~20 classes)
- [x] Implementar drag-to-dismiss nas 6 sheets (saldo, edit, add, aporte, bem, analyze)
- [x] Implementar `btnLoading()` helper + aplicar em 9 botoes
- [ ] Testar sheets em Safari iOS (posicionamento, scroll, drag)

### Fase 2 — P1
- [x] Adicionar saldo somente-leitura na Sheet B
- [x] Implementar busca local na Carteira
- [x] Adicionar timestamp de atualizacao no hero
- [x] Adicionar fade transition na troca de tabs
- [x] Implementar skeleton loading (hero)
- [ ] Skeleton loading (donut, lista) — pendente

### Fase 3 — P2
- [ ] Detectar dirty state em sheets e confirmar antes de fechar
- [ ] Revisar transicoes em todos os elementos interativos
