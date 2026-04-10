# 🚀 Esquilo Invest Design System - Quick Start

## ⚡ 3 Coisas Que Você Precisa Fazer AGORA

### 1️⃣ Abrir Figma (5 minutos)
```
https://www.figma.com/design/EpWH8v7RipihZnPlAJKt3d
```
- Visualizar as 17 telas
- Revisar componentes base
- Entender design tokens
- Favoritar para referência durante dev

### 2️⃣ Ler os 4 Arquivos de Docs

| Arquivo | Tempo | O Que Tem |
|---------|-------|----------|
| **README_DESIGN.md** | 10 min | Resumo executivo + roadmap |
| **ESQUILO_INVEST_DESIGN_SYSTEM.md** | 30 min | Specs técnicas completas (17 telas) |
| **IMPLEMENTATION_SPECS.md** | 20 min | Guia code: CSS vars, componentes React/Vue |
| **SCREENS_BREAKDOWN.md** | 40 min | Layout detalhado de cada tela |

**Total:** ~100 minutos de leitura (faça em 2-3 sessões)

### 3️⃣ Preview HTML Interativo (2 minutos)
```bash
# Abrir arquivo no navegador
design-system-preview.html
```
- Ver cores, tipografia, spacing
- Testar componentes
- Validar responsividade (devtools)

---

## 📂 Arquivos Criados

```
E:\Projetos\Esquilo.ia\Quebra-Nozes\.claude\worktrees\zen-antonelli\
├─ README_DESIGN.md                          ← LEIA PRIMEIRO (resumo)
├─ DESIGN_SYSTEM_QUICKSTART.md              ← Este arquivo (roadmap)
├─ ESQUILO_INVEST_DESIGN_SYSTEM.md          ← Specs completas (17 telas)
├─ IMPLEMENTATION_SPECS.md                   ← Guia técnico (code)
├─ SCREENS_BREAKDOWN.md                      ← Layout detalhado
├─ design-system-preview.html               ← Preview interativo
└─ [Figma arquivo]                          ← https://www.figma.com/design/EpWH8v7RipihZnPlAJKt3d
```

---

## 🎯 O Que Você Recebeu

### ✅ Design System Completo
- **Figma:** 3 páginas com 17 telas wireframe
- **Componentes:** Button, Input, Card, Pill, Header, BottomNav
- **Design Tokens:** Cores, tipografia, spacing, shadows
- **Documentação:** 4 markdown + 1 HTML preview

### ✅ 17 Telas Mapeadas

**Implementadas (Renderizando):**
1. Splash
2. Login
3. Onboarding
4. Home/Dashboard
5. Portfolio
6. Holding Detail
7. Radar
8. History
9. Imports Start
10. Imports Preview
11. Imports Commit
12. Profile

**Planejadas (Backend Pronto):**
13. Register
14. Forgot Password
15. Imports Conflicts
16. Imports Detail
17. Imports Engine Status

### ✅ Guias Prontos
- CSS variables para design tokens
- React/Vue component patterns
- Responsive breakpoints
- States (loading, error, empty, success)
- QA checklist

---

## 🏗️ Arquitetura Recomendada

### Frontend Structure
```
src/
├─ components/           ← Componentes reutilizáveis
│  ├─ buttons/
│  ├─ inputs/
│  ├─ cards/
│  ├─ layout/
│  └─ ...
├─ screens/              ← 17 telas (page components)
│  ├─ SplashScreen.tsx
│  ├─ LoginScreen.tsx
│  ├─ RegisterScreen.tsx
│  └─ ...
├─ services/             ← API calls
│  ├─ auth.ts
│  ├─ portfolio.ts
│  └─ imports.ts
└─ styles/               ← CSS global
   ├─ variables.css      ← Design tokens
   ├─ components.css
   └─ layout.css
```

### CSS Approach
```css
/* variables.css - Design Tokens */
:root {
  --color-primary: #F56A2A;
  --color-secondary: #0B1218;
  --space-lg: 16px;
  --font-display: 'Sora', sans-serif;
  --font-body: 'Inter', sans-serif;
}

/* components.css - Base Components */
.btn { /* Button styles */ }
.input { /* Input styles */ }
.card { /* Card styles */ }

/* screens or own css per screen */
.home-screen { /* Home-specific */ }
```

---

## 📋 Dev Checklist - Ordem de Implementação

### SEMANA 1: Setup + Auth

**Dia 1-2: Design System Setup**
- [ ] Instalar/configurar projeto base
- [ ] Importar Google Fonts (Sora + Inter)
- [ ] Criar CSS variables (design tokens)
- [ ] Criar componentes base (5 componentes)

**Dia 3-4: Auth Screens**
- [ ] Splash screen
- [ ] Login screen (ya existe em código)
- [ ] Register screen (NOVO)
- [ ] Forgot Password screen (NOVO)
- [ ] Testes: validação, API integration

**Dia 5: Onboarding**
- [ ] Wizard com 5 steps
- [ ] Navegação (próximo/voltar)
- [ ] Dados persistência

### SEMANA 2: Core Features

**Dia 6-7: Home/Dashboard**
- [ ] Layout responsivo
- [ ] Componentes (cards, buttons)
- [ ] 5 estados (empty, loading, error, ready, redirect)
- [ ] API integration
- [ ] Tests

**Dia 8-9: Portfolio**
- [ ] List view com filtros
- [ ] Holding detail screen
- [ ] Performance charts
- [ ] 3 estados (empty, loading, ready)

**Dia 10: History + Radar**
- [ ] Timeline com filtros
- [ ] Radar analysis com score
- [ ] AI suggestion card

### SEMANA 3: Imports + Polish

**Dia 11-12: Imports Flow (6 Steps)**
- [ ] Step 1: Upload
- [ ] Step 2: Preview
- [ ] Step 3: Conflicts (NOVO)
- [ ] Step 4: Commit
- [ ] Step 5: Detail (NOVO)
- [ ] Step 6: Engine Status (NOVO)

**Dia 13: Profile + Menu**
- [ ] Profile screen
- [ ] Settings/preferences
- [ ] Logout

**Dia 14: QA + Polish**
- [ ] Responsividade (mobile/tablet/desktop)
- [ ] Acessibilidade (WCAG 2.1)
- [ ] Performance (Lighthouse > 90)
- [ ] Cross-browser
- [ ] E2E tests

---

## 🎨 Design Tokens Cheat Sheet

### Cores
```
Primary:   #F56A2A (Orange)      → CTAs, highlights
Secondary: #0B1218 (Navy)        → Headers, main text
Gray-50:   #F9FAFB              → Backgrounds
Gray-100:  #F3F4F6              → Hover states
Gray-200:  #E5E7EB              → Borders, dividers
Gray-400:  #9CA3AF              → Secondary text
White:     #FFFFFF              → Cards, text bg
Black:     #000000              → Dark backgrounds
```

### Tipografia
```
H1: Sora 32px bold    → Títulos de página
H2: Sora 28px semi    → Títulos de seção
H3: Sora 24px semi    → Subtítulos
Body: Inter 14px      → Texto padrão
Caption: Inter 12px   → Labels, hints
```

### Spacing (4px grid)
```
xs:   4px   |  lg: 16px    |  3xl: 48px
sm:   8px   |  xl: 24px    |  4xl: 64px
md:   12px  |  2xl: 32px   |
```

### Raio/Shadows
```
Radius padrão: 4px
Radius cards: 12px
Radius pills: 999px

Shadow card: 0 2px 8px rgba(0,0,0,0.08)
Shadow lg: 0 4px 16px rgba(0,0,0,0.12)
```

---

## 🔗 Links Importantes

| Recurso | URL | Descrição |
|---------|-----|-----------|
| **Figma** | https://www.figma.com/design/EpWH8v7RipihZnPlAJKt3d | Design system completo |
| **GitHub** | (seu repo) | Código frontend |
| **API Docs** | (seu backend docs) | Endpoints |
| **Preview HTML** | design-system-preview.html | Demo de componentes |

---

## ❓ FAQ Rápido

**P: Por onde começo?**
R: 1) Abra Figma. 2) Leia README_DESIGN.md. 3) Crie projeto React com CSS variables.

**P: Preciso usar Sora + Inter?**
R: Sim. Sora para headers (H1/H2/H3), Inter para body text. Google Fonts.

**P: Quantas telas preciso fazer?**
R: 17 total. 12 já têm código base, 5 são novas (Register, ForgotPwd, Conflicts, Detail, EngineStatus).

**P: E a responsividade?**
R: Mobile 375px, Tablet 768px, Desktop 1024px+. Teste com DevTools.

**P: Como validar a implementação?**
R: Compare pixel-by-pixel com Figma usando color picker. Use lighthouse para performance.

**P: Qual é o stack recomendado?**
R: React + TypeScript + CSS (ou Tailwind) + Vite. Mas qualquer stack funciona se seguir design tokens.

**P: Preciso fazer componentes reutilizáveis?**
R: Sim! Button, Input, Card, Pill, Header são usados em múltiplas telas.

---

## ⚙️ Setup Rápido (30 minutos)

### 1. Clonar / Inicializar Projeto
```bash
# Se começando do zero (Vite + React)
npm create vite@latest esquilo-invest -- --template react-ts
cd esquilo-invest
npm install

# Já tem projeto? Vá para passo 2
```

### 2. Instalar Dependências
```bash
npm install

# Para CSS-in-JS (opcional)
npm install styled-components
# OU Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3. Setup Fontes (Google Fonts)
```html
<!-- Em public/index.html ou main.jsx -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700&display=swap" rel="stylesheet">
```

### 4. Criar Design Tokens CSS
```css
/* src/styles/variables.css */
:root {
  /* COLORS */
  --color-primary: #F56A2A;
  --color-secondary: #0B1218;
  --color-white: #FFFFFF;
  --color-gray-50: #F9FAFB;
  /* ... mais cores ... */

  /* TYPOGRAPHY */
  --font-display: 'Sora', sans-serif;
  --font-body: 'Inter', sans-serif;

  /* SPACING */
  --space-xs: 4px;
  --space-sm: 8px;
  /* ... */
}
```

### 5. Criar Componentes Base
```jsx
// src/components/Button.tsx
export const Button = ({ variant = 'primary', ...props }) => (
  <button className={`btn btn-${variant}`} {...props} />
);

// src/components/Input.tsx
export const Input = ({ label, error, ...props }) => (
  <div className="input-group">
    {label && <label className="input-label">{label}</label>}
    <input className={error ? 'input error' : 'input'} {...props} />
    {error && <span className="input-error">{error}</span>}
  </div>
);
```

### 6. Criar Primeira Tela
```jsx
// src/screens/SplashScreen.tsx
export const SplashScreen = () => (
  <div style={{ background: 'var(--color-primary)', /* ... */ }}>
    <h1>Esquilo Invest</h1>
  </div>
);
```

### 7. Testar
```bash
npm run dev
# Abrir http://localhost:5173
# DevTools: F12 → Toggle device toolbar (375px mobile view)
```

---

## 🎬 Próximos Passos

1. **Hoje:** Abrir Figma + ler README_DESIGN.md
2. **Amanhã:** Setup projeto + CSS variables + componentes base
3. **Semana 1:** Auth screens (Login, Register, Forgot)
4. **Semana 2:** Home, Portfolio, History
5. **Semana 3:** Imports completo, Profile, QA

---

## 📞 Precisa de Ajuda?

### Documentação Referência
- `ESQUILO_INVEST_DESIGN_SYSTEM.md` - Tudo sobre design
- `IMPLEMENTATION_SPECS.md` - CSS + React code
- `SCREENS_BREAKDOWN.md` - Layout de cada tela

### Testes de Validação
```bash
# Performance
npm run build
npx lighthouse https://seu-app.com

# Tests
npm run test

# Coverage
npm run test:coverage
```

### Acessibilidade
```bash
# Validar WCAG 2.1
npm install -D axe-core
# Usar em testes: axe(page).run()
```

---

## ✅ Checklist Final

Antes de considerar "pronto":

- [ ] Todas 17 telas implementadas
- [ ] Componentes base funcionando
- [ ] Responsividade (375px, 768px, 1024px+)
- [ ] Estados (loading, error, empty, success)
- [ ] Cores exatas (usar color picker no Figma)
- [ ] Tipografia (Sora headers, Inter body)
- [ ] Acessibilidade (WCAG AA: 4.5:1 contrast)
- [ ] Performance (Lighthouse > 90)
- [ ] Testes E2E passando
- [ ] Cross-browser (Chrome, Firefox, Safari, Edge)
- [ ] Mobile layout fine-tuned
- [ ] Animações/transitions smooth

---

**Documento:** DESIGN_SYSTEM_QUICKSTART.md
**Versão:** 1.0
**Data:** 2026-04-05

**🚀 Bora desenvolver o Esquilo Invest!**
