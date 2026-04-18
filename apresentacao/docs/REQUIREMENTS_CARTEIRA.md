# Especificações de Redesign - Tela Carteira (Mobile + Desktop)

**Data:** 2026-04-18  
**Responsável:** Luiz Giammattey (CEO)  
**Status:** Em Especificação

---

## 📍 Localização das Telas

- **Desktop:** `apresentacao/src/features/carteira/Carteira.jsx`
- **Mobile:** `apresentacao/src/features/carteira/CarteiraMobile.jsx`
- **Home (referência de layout):** `apresentacao/src/features/home/Home.jsx` e `HomeMobile.jsx`

---

## 🎯 Requisitos Gerais

### 1. Menu Lateral
- [ ] Trocar "Meus Ativos" por **"Sua Carteira"**
- [ ] Remover subtítulo da página

### 2. Botões de Ação Principal
- [ ] Remover botão **"Ver histórico"** de todas as telas
- [ ] Adicionar botão **"Importar"** (principal) em substituição
- [ ] **Mobile:** Trocar "Registrar aporte" por **"Importar"**

### 3. Edição de Itens
- [ ] Permitir edição de cada item da carteira (ícone lápis já existe, verificar funcionalidade)

---

## 🏠 Seção Patrimônio Consolidado (Home da Carteira)

### Card Principal - "Investimentos"
- [ ] Somar **apenas investimentos** (SEM incluir bens)
- [ ] Layout similar ao card **"Investimentos"** da Home (Carteira.jsx linhas 491-502)
- [ ] Exibir:
  - Valor total de investimentos
  - Rentabilidade % a.a.
  - Status de atualização (data/hora discreta - ver requisito Desktop)

### Card Secundário - "Score da Carteira"
- [ ] Posicionar **ao lado** do card de Patrimônio
- [ ] Exibir:
  - Score unificado (ex: 750/1000)
  - Classificação (Crítico, Frágil, Estável, Bom, Sólido)
  - Status visual

### Remoção
- [ ] **Remover botão "Ver histórico"** (line 747-749 em Carteira.jsx)

---

## 📊 Gráfico de Rentabilidade Histórica

### Localização
- Posicionar **abaixo do card de patrimônio**

### Características
- [ ] Exibir rentabilidade **histórica de todos os investimentos**
- [ ] **Filtro por tipo de investimento:**
  - Ações
  - Fundos
  - Renda Fixa
  - Previdência
  - Poupança
  - (NÃO incluir Bens)

### Comparação com CDI
- [ ] **Toggle "vs CDI"** para comparar com benchmark
- [ ] **RESTRIÇÃO:** CDI NÃO disponível para AÇÕES
  - Desabilitar/ocultar opção quando filtro = Ações
  - Mostrar mensagem explicativa se aplicável

### Dados
- [ ] Usar dados de `benchmark` (em desenvolvimento)
- [ ] Mostrar somente investimentos **que o usuário possui cadastrado**

---

## 📱 DESKTOP Específico

### Atualização de Hora
- [ ] **Remover:** "Cotações atualizadas agora" (linha 763 em Carteira.jsx)
- [ ] **Substituir por:** Data/hora da **última atualização** de forma discreta
  - Formato: "Atualizado em 18/04 às 14:30"
  - Texto pequeno, cor secundária

### Posicionamento de Cards
- [ ] **Ajustar spacing** entre card principal e subcards (ações/fundos)
- [ ] Subcards "Ações" e "Fundos" não devem estar encostados na borda do card maior
- [ ] Aplicar padding/margin consistente

---

## 📱 MOBILE Específico

### Card Patrimônio Consolidado
- [ ] Layout similar ao Home Mobile (CarteiraMobile.jsx linhas 61-68)
- [ ] Card único com valor total em destaque

### Estrutura de Categorias
- [ ] Manter cards por categoria (ações, fundos, etc.)
- [ ] Cada card exibe:
  - Ícone da categoria
  - Nome da categoria
  - Valor total consolidado
  - Botão para abrir detalhes

---

## 🏢 AMBOS (Desktop + Mobile)

### 1. Detalhamento com Colunas Tipificadas
- [ ] **NÃO padronizar colunas por tipo:**
  - Ações: ticker, posição, %aloc, rentabilidade%, preço médio, preço atual, quantidade
  - Fundos: nome, posição, %aloc, rentabilidade%, valor aplicado, valor líquido
  - Renda Fixa: nome, posição, %aloc, rentabilidade%, valor aplicado, valor líquido
  - Previdência: nome, posição, %aloc, rendimento(R$), rentabilidade%, valor aplicado

### 2. Verificação de Fórmula de Rentabilidade
- [ ] Revisar cálculo em `calcGanhoPerdaPerc()` (Carteira.jsx linhas 132-140)
- [ ] Validar coerência com dados de API
- [ ] Fórmula esperada:
  ```
  Rentabilidade % = (Valor Atual - Valor Investido) / Valor Investido × 100
  ```

### 3. Consolidação de Ativos Duplicados
- [ ] Se houver **múltiplas posições do mesmo ativo:**
  - [ ] **Somar quantidade**
  - [ ] **Calcular preço médio** ponderado
  - [ ] **Exibir como um único ativo** consolidado
  - **Exemplo:** 100 ações @ R$50 + 50 ações @ R$60 = 150 ações @ R$53,33 médio

---

## 🔍 Validações de Dados

### Investimentos (Sem Bens)
- [ ] Card "Investimentos" exclui categoria `bens`
- [ ] Gráfico histórico exclui `bens`
- [ ] Filtros de gráfico disponibilizam apenas: ações, fundos, renda_fixa, previdencia, poupanca

### Ativos Cadastrados
- [ ] Mostrar somente ativos que o usuário já importou
- [ ] Não exibir placeholders ou ativos padrão

---

## 🎨 UI/UX

- [ ] Manter design consistente com Home (referência visual)
- [ ] Cores de categoria (já definidas em `COR_CATEGORIA`)
- [ ] Responsive design (mobile-first)
- [ ] Animações fade-in ao carregar

---

## 📋 Checklist de Implementação

### Fase 1: Menu e Botões
- [ ] Renomear "Meus Ativos" → "Sua Carteira" (GlobalHeader/Menu)
- [ ] Remover subtítulo
- [ ] Trocar "Ver histórico" → "Importar"
- [ ] Trocar "Registrar aporte" → "Importar" (Mobile)

### Fase 2: Cards de Patrimônio
- [ ] Criar card "Investimentos" (sem bens)
- [ ] Criar card "Score da Carteira"
- [ ] Posicionar lado a lado (Desktop + Mobile)

### Fase 3: Gráfico de Rentabilidade
- [ ] Implementar gráfico histórico
- [ ] Adicionar filtro por tipo
- [ ] Implementar toggle CDI com restrição para Ações
- [ ] Validar dados de benchmark

### Fase 4: Ajustes Desktop/Mobile
- [ ] Substituir "cotações agora" por data/hora discreta
- [ ] Ajustar spacing de cards
- [ ] Revisar colunas tipificadas
- [ ] Implementar consolidação de ativos

### Fase 5: Testes
- [ ] Testes de cálculo de rentabilidade
- [ ] Testes de consolidação de ativos
- [ ] Testes responsivos (mobile, tablet, desktop)
- [ ] Validar dados com backend

---

## 📞 Notas Importantes

- **Luiz é CEO:** Espera diagnósticos francos e postura de dono
- **Domínio em PT-BR:** Todos os labels, mensagens e componentes em português rigoroso
- **Sem código legado:** Construção do zero, sem restrições técnicas herdadas
- **Referência visual:** Home (Carteira.jsx) serve como baseline de design

---

## 🔗 Arquivos Relacionados

- `apresentacao/src/features/carteira/Carteira.jsx` (Desktop)
- `apresentacao/src/features/carteira/CarteiraMobile.jsx` (Mobile)
- `apresentacao/src/features/home/Home.jsx` (Referência)
- `apresentacao/src/components/design-system/MetricCard.jsx` (Card component)
- `apresentacao/src/cliente-api.js` (API calls)
