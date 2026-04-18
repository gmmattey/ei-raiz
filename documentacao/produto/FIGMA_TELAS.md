# Esquilo Invest — Entrega de Figma (Mobile + Desktop XL)
**Data:** 2026-04-18

Este documento existe para padronizar a montagem das telas no Figma a partir do spec mobile (`documentacao/mobile-wireframes.md`) e para orientar a remodelagem desktop (telas grandes).

> Importante: o login acontece direto na Landing Page (sem tela separada).

---

## 1) Estrutura do Arquivo no Figma

Crie 3 páginas:

1. **`00 - Foundations`**
   - Cores (tokens do spec mobile)
   - Tipografia (Sora + Inter)
   - Spacing (4px)
   - Radius / Shadows
   - Componentes atômicos (Button, Input, Chip, Badge, Card, Divider, Nav)

2. **`01 - Mobile (375)`**
   - Frames 375 × 812 (iPhone 14), Auto Layout em tudo que for container.
   - Usar o spec como fonte de verdade: `documentacao/mobile-wireframes.md`.

3. **`02 - Desktop XL (1440/1920)`**
   - Frames 1440 × 900 (base) + 1920 × 1080 (variante XL).
   - Layout 3-colunas (Sidebar + Main + Right Rail) no app logado.
   - Landing com login inline (bloco fixo).

---

## 2) Mobile — Lista de Telas (frames)

Referência direta: `documentacao/mobile-wireframes.md`.

- `2.1 Login / Landing` (inclui modal/fluxo de login)
- `2.2 Onboarding (3 passos)` (se o produto atual estiver em 5 passos, manter UI preparada para N passos)
- `Home` (Tab 1)
- `4.1 Carteira (visão geral)`
- `4.2 Carteira (categoria)`
- `4.3 Ativo (detalhe)`
- `Insights` (Tab 3)
- `6.1 Decisões (hub)`
- `6.2 Decisões (simulador genérico)`
- `6.3 Decisões (resultado)`
- `7.1 Perfil`
- `7.2 Perfil de risco`
- `7.3 Configurações`
- `8.3 Histórico de transações`

---

## 3) Desktop XL — Proposta Remodelada (telas grandes)

### 3.1 Princípio (pilar produto)
- **Consolidar:** visão “single pane” do patrimônio + composição + variação.
- **Traduzir:** insights e risco sempre contextualizados (Right Rail) e acionáveis.
- **Orientar:** decisões com simuladores guiados (defaults bons + explicação curta).

### 3.2 Grid e Layout Base

**Frame 1440 × 900**
- Grid: 12 colunas
- Margin: 80
- Gutter: 24
- Conteúdo máximo recomendado: ~1280

**Shell (app logado)**
- **Sidebar fixa** (280): navegação + atalhos (Importar, Histórico).
- **Main** (flex): conteúdo da rota.
- **Right Rail** (360): score/alertas/recomendações contextuais.
- Topbar: busca, período, seletor “Últimos 30d”, ações rápidas.

### 3.3 Landing (Desktop) com Login Inline

**Frame 1440 × 900**
- Coluna esquerda (Hero):
  - Título: “Consolide sua carteira. Entenda seu risco. Decida melhor.”
  - 3 bullets curtos (Consolidar / Traduzir / Orientar)
  - Provas: segurança, privacidade, “Cloudflare-native”, LGPD (selos simples)
- Coluna direita (Card de Login fixo):
  - Email + senha
  - CTA primário: Entrar
  - Ações secundárias: “Esqueci minha senha”, “Criar conta”
  - Estado “recover” no mesmo card (sem navegar)

### 3.4 Telas do App (Desktop XL)

Mapear 1:1 com as rotas do produto atual (`documentacao/produto/SCREENS_BREAKDOWN.md`):

1. **Home (`/home`)**
   - Main: patrimônio total + variação + alocação (donut/stack).
   - Right Rail: score + 3 insights prioritários + 1 recomendação acionável.

2. **Carteira (`/carteira`)**
   - Main: tabela (sortable) + filtros (chips) + mini-chart por categoria.
   - Right Rail: “Risco por concentração”, “Top 3 exposições”, alertas.

3. **Ativo (`/ativo/:ticker`)**
   - Main: resumo + performance + histórico + posição.
   - Right Rail: “O que mudou”, “Sugestões (rebalance)”, risco específico.

4. **Insights (`/insights`)**
   - Main: painel com seções (Saúde, Concentração, Volatilidade, Liquidez).
   - Right Rail: checklist de ações (“reduzir X”, “diversificar Y”).

5. **Decisões (`/decisoes`)**
   - Main: cards grandes por simulador (Imóvel/Carro/Dívida/Luxo).
   - Simulador: 2 colunas (inputs à esquerda, preview à direita).
   - Resultado: comparativo lado a lado (cenário A vs B) + “próximo passo”.

6. **Perfil/Config (`/perfil`, `/configuracoes`)**
   - Main: 2-pane (menu interno + conteúdo).
   - Right Rail: status conta, segurança, conexão importadores.

7. **Histórico (`/historico`)**
   - Main: tabela com agrupamento + filtros por período.
   - Right Rail: resumo do período + anomalias.

8. **Importar (`/importar`)**
   - Main: stepper horizontal + preview de parsing (tabela).
   - Right Rail: regras e checagens de consistência (antes de “Commit”).

---

## 4) Entregáveis FigJam (já gerados)

Os diagramas abaixo documentam o fluxo e o layout desktop de alto nível:
- Fluxo de telas: ver link do FigJam gerado na conversa.
- Layout desktop (telas grandes): ver link do FigJam gerado na conversa.

