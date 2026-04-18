# Carteira - Resumo Executivo de Mudanças

**Para:** Luiz Giammattey (CEO)  
**Data:** 2026-04-18  
**Status:** Especificação Pronta para Implementação

---

## 🎯 O que vai mudar

### ✅ Visibilidade & Navegação
| Antes | Depois |
|-------|--------|
| Menu: "Meus Ativos" | Menu: "Sua Carteira" |
| Subtítulo: "Acompanhe todos os seus ativos..." | Sem subtítulo |
| Botão "Ver histórico" | Botão "Importar" (principal) |
| Mobile: "Registrar aporte" | Mobile: "Importar" |

### ✅ Cards de Patrimônio
**NOVO:** Seção dividida em 2 cards lado a lado
1. **"Investimentos"** - Soma valores SEM bens
2. **"Score da Carteira"** - Classificação e score

### ✅ Análise de Rentabilidade
**NOVO:** Gráfico histórico com features avançadas
- 24 meses de histórico
- Filtro por tipo de ativo
- Comparação com CDI (exceto ações)
- Dados em tempo real

### ✅ Dados Precisos
- Fórmula de rentabilidade validada
- Ativos duplicados consolidados (soma + preço médio)
- Apenas investimentos cadastrados exibidos

### ✅ UX Desktop
- "Cotações atualizadas agora" → Data/hora discreta
- Spacing ajustado entre cards
- Colunas tipificadas por tipo de ativo

---

## 📊 Impacto do Usuário

### Antes
- ❌ Não sabe se carteira está consolidada
- ❌ Sem visão histórica de rentabilidade
- ❌ Sem comparação com benchmark
- ❌ Dados confusos se tiver ativos duplicados

### Depois
- ✅ Visão clara de investimentos vs total
- ✅ Histórico visual de 24 meses
- ✅ Benchmark CDI para contexto
- ✅ Dados limpos e consolidados
- ✅ Fluxo de importação destacado

---

## 🔧 Escopo Técnico

### Arquivos a Modificar
1. `Carteira.jsx` - Desktop (redesign da seção de patrimônio)
2. `CarteiraMobile.jsx` - Mobile (nova estrutura de cards)
3. Menu/Navigation - Renomear "Meus Ativos"
4. API integration - Validar dados de benchmark

### Componentes Novos
- Card "Score da Carteira"
- Gráfico "Rentabilidade Histórica" com filtros
- Toggle CDI com lógica de restrição

### Componentes Modificados
- MetricCard (ajustar para 2 colunas)
- GrupoCategoria (revisão de spacing)
- AssetRow (consolidação de lógica)

---

## 📅 Priorização de Fases

### 🔴 CRÍTICA (Semana 1)
1. Menu: "Meus Ativos" → "Sua Carteira"
2. Card "Investimentos" (sem bens)
3. Card "Score da Carteira"
4. Remover "Ver histórico", adicionar "Importar"

### 🟡 ALTA (Semana 2)
1. Gráfico rentabilidade histórica
2. Filtro por tipo de ativo
3. Toggle CDI (com restrição para ações)
4. Validação de fórmula de rentabilidade

### 🟠 MÉDIA (Semana 3)
1. Consolidação de ativos duplicados
2. Spacing/UX refinements (Desktop)
3. Data/hora discreta (substituir "agora")
4. Colunas tipificadas revisão

### 🟢 BAIXA (Backlog)
1. Testes de edge cases
2. Otimizações de performance
3. Refinements visuais finais

---

## ✨ Princípios de Design

- **Domínio em PT-BR:** Todos os labels, mensagens e componentes em português rigoroso
- **Sem código legado:** Construção limpa, sem hacks
- **Diagnósticos francos:** Mostrar dados reais, mesmo se incômodos
- **Referência de layout:** Home serve como baseline visual

---

## 🚀 Próximos Passos

1. ✅ **Especificação:** COMPLETA (você está aqui)
2. ⏭️ **Kickoff:** Revisar com time técnico
3. ⏭️ **Design:** Mockups finais se necessário
4. ⏭️ **Desenvolvimento:** Sprint conforme priorização
5. ⏭️ **QA:** Testes em staging
6. ⏭️ **Deploy:** Produção

---

## 📞 Contato & Dúvidas

**Documentação:**
- `apresentacao/docs/REQUIREMENTS_CARTEIRA.md` - Especificação técnica completa
- `apresentacao/docs/CARTEIRA_MOCKUP_LAYOUT.md` - Mockups visuais antes/depois

**Localização das telas:**
- Desktop: `apresentacao/src/features/carteira/Carteira.jsx`
- Mobile: `apresentacao/src/features/carteira/CarteiraMobile.jsx`
- Home (ref): `apresentacao/src/features/home/Home.jsx`

---

**Status:** Pronto para desenvolvimento ✅

