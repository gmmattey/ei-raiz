# PLANO: Gerar Figma do Esquilo Invest com Logo + Ícones do BrandBook

## CONTEXTO

Anterior falha gerou Figma em branco (desperdício de tokens). Agora: **Blueprint otimizado com estratégia de 3 páginas Figma** ao invés de 15. Isso reduz tokens/tempo mantendo conteúdo completo.

**Objetivo**: Design system profissional com logo + ícones **OBRIGATÓRIOS** do BrandBook

**Assets Obrigatórios**:
- Logo: `E:\Projetos\Esquilo.ia\BrandBook\assets\logo\` (4 arquivos)
- Ícones: `E:\Projetos\Esquilo.ia\BrandBook\assets\icones\` (38 ícones)

**Design Tokens**:
- Tipografia: Sora (headers), Inter (body)
- Cores: Orange #F56A2A, Navy #0B1218, grayscale
- Spacing: 4px grid
- Icons: 24x24px, stroke 1.5, outline round, currentColor

---

## PHASE 1: EXPLORAÇÃO COMPLETADA ✅

### BrandBook Assets Identificados

**Logos** (`E:\Projetos\Esquilo.ia\BrandBook\assets\logo\`):
- `esquilo-invest-logo-horizontal.svg` (1400x420px) → Usar em hero/header
- `esquilo-invest-logo-vertical.svg` → Usar em sidebar
- `esquilo-invest-simbolo.svg` (260x220px) → Usar em favicon/icon
- `esquilo-invest-simbolo.png` (24KB) → Versão raster

**Ícones** (`E:\Projetos\Esquilo.ia\BrandBook\assets\icones\`):
- **33 ícones principais**: home, carteira, radar/score, historico, perfil, importar, busca, editar, fechar, alerta, erro, info, etc
- **19 variantes premium** (opcional para future use)
- **5 ícones filled_active**: home-filled, carteira-filled, perfil-filled, score-filled, alerta-filled (para nav ativa)
- **Manifest.json**: Grid 24x24px, stroke 1.5, outline round, currentColor
- **Total**: 38 ícones + 4 logos

### Telas Mapeadas (11 Implementadas + 2 Faltando)

**11 Implementadas com Screen.tsx**:
1. Splash | 2. Onboarding (5 steps) | 3. Home (4 estados) | 4. Portfolio (3 estados + filtro)
5. Holding Detail (2 estados) | 6. Radar/Analysis (5 estados) | 7. History/Timeline (3 estados)
8. Imports Center (3 estados) | 9. Imports Entry (3 estados) | 10. Imports Preview (4 estados)
11. Profile (5 estados)

**2 Faltando** (para próxima sprint):
- Auth Login (rota em routes.ts, sem Screen.tsx) ← JÁ CRIADA em LoginScreen.tsx
- Analysis Detail (controller existe, sem Screen.tsx) ← FALTA renderização

**Navegação**: 6 itens fixos (home, carteira, radar, historico, perfil, importacoes) + 5 com filled_active

### Componentes Base (CSS-only)

- Button: `.btn` + `.btnPrimary` / `.btnGhost`
- Card: `.card` (opacity, border, shadow)
- Pill: `.pill` (com `.pillDot`)
- Nav: `.shellNav`, `.shellNavItem`, `.shellNavItemActive`
- Layout: Container max-width 1040px, responsive @ 860px

---

## PHASE 2: ESTRATÉGIA DE IMPLEMENTAÇÃO

### Abordagem: 3 Páginas Figma (Eficiente vs 15 páginas anterior)

**Página 00_Design_Tokens**:
- Logo (horizontal, vertical, símbolo) IMPORTADOS do BrandBook
- Ícones (todos 38) em grid com nomes
- Cores (Orange #F56A2A, Navy #0B1218, grayscale 5 tons)
- Tipografia (Sora headers, Inter body)
- Spacing (4px base → 64px)
- Shadows (2 tipos)

**Página 01_Components**:
- Button (Primary, Ghost, Disabled) + 3 states (normal, hover, active)
- Card (default, clickable)
- Pill/Badge (com dot para status)
- Input (text, email, password + focus/error)
- Nav Item (normal + active/filled)
- State Cards (Loading, Error, Empty)

**Página 02_Screens** (13 wireframes):
- Splash | Onboarding (step 1-5) | Home (4 variants) | Portfolio (3 variants)
- Holding Detail (2 variants) | Radar (5 variants) | History (3 variants)
- Imports (4 variants: Start, Entry, Preview, Center) | Profile
- Auth Login (NOVA - já criada em código) | Auth Forgot (planejada)
- Cada tela com estados: loading, error, empty, ready

### Tokens Esperados

- ~50 frames (13 telas + variantes)
- ~40 componentes (buttons, cards, pills, nav, inputs, icons)
- ~200 instances (aplicações nas telas)
- Total tamanho: ~3-5 MB (profissional)

---

## PHASE 3: VERIFICAÇÃO (Pré-Criação)

✅ Logos existem e acessíveis
✅ Ícones (38 totais) catalogados e com manifest
✅ Telas mapeadas (11 + 2)
✅ Componentes identificados (CSS-based)
✅ Design tokens confirmados (Sora, Inter, Orange, Navy)

---

## PHASE 4: IMPLEMENTAÇÃO

### O que será criado

**Figma File**: "Esquilo Invest - Design System v1 - Completo"
- 3 páginas (00_Tokens, 01_Components, 02_Screens)
- Logo + ícones OBRIGATÓRIOS do BrandBook
- 13 telas em wireframe (não visual/mockup)
- Componentes reutilizáveis
- Estados documentados (loading, error, empty, ready)
- Responsividade (mobile 375px, tablet 768px, desktop 1280px)

### Processo

1. Criar arquivo Figma
2. Importar logos do BrandBook como componentes
3. Importar ícones (38) como components grid
4. Criar Page 00 com design tokens
5. Criar Page 01 com components base
6. Criar Page 02 com 13 wireframes + estados
7. Adicionar annotations/specs
8. Verificar visibilidade (não em branco!)
9. Retornar link Figma

### Arquivos Críticos

- Logo source: `E:\Projetos\Esquilo.ia\BrandBook\assets\logo\esquilo-invest-logo-horizontal.svg`
- Ícones source: `E:\Projetos\Esquilo.ia\BrandBook\assets\icones\*.svg` (38 files)
- Telas reference: `apps/web/src/features/*/[Feature]Screen.tsx` (11 files)
- Design tokens: Branding briefing (Sora, Inter, Orange #F56A2A, Navy #0B1218)

---

## PHASE 5: VERIFICAÇÃO PÓS-CRIAÇÃO

- [ ] Figma link abre (não erro)
- [ ] 3 páginas visíveis (não em branco)
- [ ] Page 00: Logo + ícones aparecem
- [ ] Page 01: Componentes com variantes
- [ ] Page 02: 13 wireframes com estados
- [ ] Responsividade documentada
- [ ] Nenhuma página vazia ou com placeholder

---

## DECISÕES

✅ **3 páginas vs 15**: Eficiência, mesma cobertura
✅ **Importar SVGs reais**: BrandBook obrigatório, não substitutos
✅ **Wireframe (não visual)**: Estrutura + estado, economia de tempo
✅ **Estados padrão**: loading, error, empty, ready (em todas as telas)
✅ **Responsive**: 3 breakpoints documentados

---

## STATUS

✅ Phase 1: Exploração completada
✅ Phase 2: Estratégia definida (3 páginas otimizadas)
✅ Phase 3: Verificação pré-criação concluída
→ Phase 4: Pronto para implementação
→ Phase 5: Validação pós-criação

---

## PRÓXIMOS PASSOS (Após Aprovação)

1. Criar arquivo Figma com 3 páginas
2. Importar logo + ícones do BrandBook
3. Desenhar componentes base
4. Desenhar 13 wireframes
5. Adicionar estados e responsividade
6. Retornar link Figma profissional e VISÍVEL

