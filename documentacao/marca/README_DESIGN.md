# 🐿️ Esquilo Invest - Design System v1

## 📊 Resumo Executivo

Design system **PROFISSIONAL e COMPLETO** para o Esquilo Invest com **17 telas**, **componentes base** e **guias de implementação**.

| Item | Status | Link |
|------|--------|------|
| **Figma Design File** | ✅ Criado | https://www.figma.com/design/EpWH8v7RipihZnPlAJKt3d |
| **Especificações** | ✅ Documentadas | `ESQUILO_INVEST_DESIGN_SYSTEM.md` |
| **Implementação** | ✅ Guia Técnico | `IMPLEMENTATION_SPECS.md` |
| **Preview Interativo** | ✅ HTML Demo | `design-system-preview.html` |

---

## 🎨 Design Tokens

### Paleta
- **Primária:** Orange `#F56A2A` (CTAs, highlights)
- **Secundária:** Navy `#0B1218` (headers, backgrounds)
- **Neutros:** 9 tons de gray + white/black

### Tipografia
- **Headers:** Sora Bold/SemiBold (H1 32px, H2 28px, H3 24px)
- **Body:** Inter Regular (Body 14px, Caption 12px)

### Spacing
Grid 4px: xs(4px) → sm(8px) → md(12px) → lg(16px) → xl(24px) → 2xl(32px) → 3xl(48px) → 4xl(64px)

### Componentes Base
- ✅ Buttons (Primary, Secondary, Disabled)
- ✅ Input Fields (Default, Focus, Error)
- ✅ Cards (Default, Clickable, Highlight)
- ✅ Pills/Badges (Active, Inactive)
- ✅ Headers
- ✅ Bottom Navigation (Mobile)

---

## 📱 17 Telas

### Implementadas (Renderizando) ✅
1. **Splash** `/splash` - Loading com branding
2. **Login** `/login` - Autenticação email/password
3. **Onboarding** `/onboarding` - Wizard 5-step
4. **Home** `/home` - Dashboard principal (5 estados)
5. **Portfolio** `/portfolio` - Lista de ativos (3 estados + filtros)
6. **Holding Detail** `/portfolio/:ticker` - Detalhe de ativo
7. **Radar** `/radar` - Análise de risco com AI suggestions
8. **History** `/history` - Timeline de eventos
9. **Imports Start** `/imports` - Upload de arquivo
10. **Imports Preview** `/imports/preview` - Visualização de dados
11. **Imports Commit** `/imports/commit` - Confirmação final
12. **Profile** `/profile` - Configurações e preferências

### Planejadas (Backend Pronto) 🎯
13. **Register** `/register` - Criação de conta
14. **Forgot Password** `/forgot-password` - Recuperação de acesso
15. **Imports Conflicts** `/imports/conflicts` - Resolução de conflitos
16. **Imports Detail** `/imports/:id/detail` - Detalhes técnicos
17. **Imports Engine Status** `/imports/engine-status` - Monitoramento

---

## 🎯 Próximos Passos

### 1️⃣ Review Figma (5 min)
```
Abrir: https://www.figma.com/design/EpWH8v7RipihZnPlAJKt3d
- Visualizar 17 telas com wireframes
- Revisar componentes base
- Validar design tokens
```

### 2️⃣ Implementar Telas Faltantes (3-4 dias)
```
Frontend Development:
├─ Register screen + validações
├─ Forgot Password flow
├─ Imports Conflicts resolver
├─ Imports Detail + logs
├─ Engine Status monitor
└─ Testes de responsividade
```

### 3️⃣ Conectar com Backend (2-3 dias)
```
APIs Necessárias:
├─ auth.ts (Login/Register/ForgotPassword)
├─ portfolio_service.ts (Holdings)
├─ import_conflicts_service.ts (Conflicts)
├─ import_detail_service.ts (Detail)
├─ import_engine_status_service.ts (Status)
└─ ai_suggestion_service.ts (Radar)
```

### 4️⃣ QA & Polish (1-2 dias)
```
✓ Responsividade (mobile/tablet/desktop)
✓ Acessibilidade (WCAG 2.1)
✓ Performance (Lighthouse > 90)
✓ Cross-browser testing
✓ Testes E2E
```

---

## 📂 Arquivos Entregáveis

```
.claude/worktrees/zen-antonelli/
├─ ESQUILO_INVEST_DESIGN_SYSTEM.md      ← Specs completas (17 telas)
├─ IMPLEMENTATION_SPECS.md               ← Guia técnico (CSS, componentes)
├─ design-system-preview.html            ← Preview interativo (abra no browser)
└─ README_DESIGN.md                      ← Este arquivo
```

### Como Usar os Arquivos

**ESQUILO_INVEST_DESIGN_SYSTEM.md:**
- Leia para entender especificações de cada tela
- Guia de referência para designer e desenvolvedor
- Inclui toda a documentação visual e funcional

**IMPLEMENTATION_SPECS.md:**
- Guia prático para desenvolvimento
- CSS variables, classes, componentes
- React/Vue snippets prontos
- Checklist de implementação

**design-system-preview.html:**
- Abra em navegador para ver preview interativo
- Demonstra cores, tipografia, componentes
- Referência visual durante desenvolvimento

---

## 🔧 Arquitetura Frontend (Recomendado)

```
src/
├─ components/
│  ├─ buttons/
│  │  ├─ Button.tsx
│  │  └─ Button.css
│  ├─ inputs/
│  │  ├─ Input.tsx
│  │  └─ Input.css
│  ├─ cards/
│  │  ├─ Card.tsx
│  │  └─ Card.css
│  ├─ layout/
│  │  ├─ Header.tsx
│  │  ├─ BottomNav.tsx
│  │  ├─ Sidebar.tsx
│  │  └─ Layout.css
│  └─ screens/
│     ├─ SplashScreen.tsx
│     ├─ LoginScreen.tsx        ✅ Existe
│     ├─ RegisterScreen.tsx     🎯 Novo
│     ├─ HomeScreen.tsx         ✅ Existe
│     ├─ PortfolioScreen.tsx    ✅ Existe
│     ├─ HoldingDetailScreen.tsx ✅ Existe
│     ├─ RadarScreen.tsx        ✅ Existe (sem UI)
│     ├─ HistoryScreen.tsx      ✅ Existe
│     ├─ ImportsScreen.tsx      ✅ Existe
│     ├─ ImportsConflictsScreen.tsx  🎯 Novo
│     ├─ ImportsDetailScreen.tsx     🎯 Novo
│     ├─ ImportsEngineStatusScreen.tsx 🎯 Novo
│     └─ ProfileScreen.tsx      ✅ Existe
├─ styles/
│  ├─ variables.css             ← Design tokens
│  ├─ components.css            ← Componentes base
│  ├─ layout.css                ← Responsive
│  └─ theme.css
├─ hooks/
│  ├─ useAuth.ts
│  ├─ usePortfolio.ts
│  └─ useImports.ts
├─ services/
│  ├─ api.ts
│  └─ auth.ts
└─ App.tsx
```

---

## 🎬 States & Variantes

### Estados Globais
```
LOADING    → Skeleton screens
ERROR      → Mensagem + retry button
EMPTY      → Não há dados
SUCCESS    → Dados carregados
REDIRECT   → Sem autenticação
```

### Por Tela

| Tela | Estados | Filtros |
|------|---------|---------|
| Home | 5 | - |
| Portfolio | 3 | Categoria, Plataforma, Status |
| Holding | 2 | - |
| Radar | 5 | - |
| History | 5 | Período, Tipo |
| Imports | 6 steps | - |
| Profile | 3 | - |

---

## 🧪 Testing Checklist

### Visual
- [ ] Cores exatas (verificar com color picker)
- [ ] Tipografia (Sora vs Inter)
- [ ] Spacing (4px grid)
- [ ] Shadows (opacity)

### Responsividade
- [ ] Mobile 375px ✓
- [ ] Tablet 768px ✓
- [ ] Desktop 1024px+ ✓
- [ ] Orientação landscape ✓

### Funcionalidade
- [ ] Todos os inputs validam
- [ ] Botões com loading state
- [ ] Erro handling com retry
- [ ] Empty states mostram mensagens

### Acessibilidade
- [ ] Contraste WCAG AA (4.5:1)
- [ ] Labels em todos inputs
- [ ] Keyboard navigation
- [ ] Screen reader compatible

### Performance
- [ ] Lighthouse > 90
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1

---

## 🚀 Getting Started

### 1. Instalar Dependências
```bash
npm install

# Fontes Google
# Já vem via Google Fonts CDN no CSS
```

### 2. Setup Styles
```bash
# Copiar design tokens CSS
cp design-tokens.css src/styles/

# Build CSS
npm run styles:build
```

### 3. Setup Componentes
```bash
# Implementar em components/
# Seguir IMPLEMENTATION_SPECS.md
```

### 4. Setup Telas
```bash
# Implementar em screens/
# Conectar com services/api.ts
```

### 5. Testes
```bash
npm run test:visual   # Visual regression
npm run test:a11y     # Acessibilidade
npm run test:e2e      # End-to-end
npm run test:perf     # Performance
```

---

## 📊 Estimativa de Esforço

| Fase | Tarefas | Tempo | Status |
|------|---------|-------|--------|
| Design | Design system completo | ✅ Pronto | ✅ Concluído |
| Setup | CSS variables, layout | 1-2 dias | 🎯 Next |
| Componentes | Buttons, Inputs, Cards, etc | 2-3 dias | 🎯 Next |
| Telas Faltantes | Register, ForgotPassword, Conflicts, Detail, EngineStatus | 3-4 dias | 🎯 Next |
| Conexão Backend | APIs + estado global | 2-3 dias | 🎯 Next |
| QA & Polish | Testes, performance, a11y | 1-2 dias | 🎯 Next |
| **TOTAL** | | **10-14 dias** | |

---

## 💡 Best Practices

### CSS
```css
/* Use variables */
background: var(--color-primary);
padding: var(--space-lg);
border-radius: var(--radius-md);
box-shadow: var(--shadow-md);
transition: all var(--transition-base);

/* Mobile first */
@media (min-width: 640px) { }
@media (min-width: 1024px) { }
```

### React
```jsx
// Componentes reutilizáveis
<Button variant="primary" size="md">Continue</Button>
<Input type="email" label="Email" required />
<Card title="Holdings">Content</Card>

// Props validadas
Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.bool,
}
```

### Estados
```jsx
// Composição de states
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [data, setData] = useState(null);

// Render com estado
{loading && <Skeleton />}
{error && <ErrorState retry={retry} />}
{!data && !loading && <EmptyState />}
{data && <DataView />}
```

---

## 🆘 Troubleshooting

**Problema:** Cores não combinam com Figma
```
Solução: Use color picker ou CSS variable
#F56A2A == rgb(245, 106, 42) == var(--color-primary)
#0B1218 == rgb(11, 18, 24) == var(--color-secondary)
```

**Problema:** Tipografia diferente de Figma
```
Solução: Confirmar fontes carregadas
- Sora: Google Fonts (headers)
- Inter: Google Fonts (body)
Font loading policy: font-display: swap
```

**Problema:** Responsividade quebrada
```
Solução: Testar com mobile preview
- Chrome DevTools (375px, 768px, 1024px)
- Orientação portrait/landscape
- Touch interactions
```

---

## 📞 Suporte

**Documentação:**
- Figma: https://www.figma.com/design/EpWH8v7RipihZnPlAJKt3d
- Specs: `ESQUILO_INVEST_DESIGN_SYSTEM.md`
- Tech: `IMPLEMENTATION_SPECS.md`

**Backend APIs:**
- `auth.ts` - Autenticação
- `portfolio_service.ts` - Dados portfolio
- `import_*.ts` - Importação

**Frontend Code:**
- Telas renderizando em: `/screens`
- Componentes em: `/components`

---

## ✅ Status

- [x] Design System criado (Figma)
- [x] Documentação completa
- [x] Componentes especificados
- [x] 17 telas mapeadas
- [ ] Implementação front (em progress)
- [ ] Conexão backend
- [ ] QA & Deploy

---

**Versão:** 1.0
**Data:** 2026-04-05
**Status:** 🟢 Pronto para Desenvolvimento
