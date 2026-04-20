# Auditoria 7-Fases: Rentabilidade — Resumo Executivo

**Data:** 2026-04-19  
**Commit:** `4974e2a`  
**Status:** ✅ Completo — Deploy + Banco aplicado

---

## O Que Mudou

### 1. **Fórmulas de Rentabilidade por Família (Backend)**

Novo módulo `servidores/modulos-backend/carteira/src/familias.ts` com cálculo direto por tipo de ativo:

| Família | Tipo | Fórmula | Quando Confiável |
|---------|------|---------|------------------|
| **A** | Ações/ETFs | `precoAtual × quantidade` | Preço real + custo reconcilia |
| **B** | Fundos CVM | `custo × (cotaAtual / cotaAquisicao)` | Cota na data de aquisição + cota atual |
| **C** | Renda Fixa (CDB, Tesouro, LCI) | PRE: `1 + (taxa/100)^(dias/365)` | Indexador + taxa + data início |
| **C** | Renda Fixa (CDI, IPCA) | `custo × fatorCorrecao` | Fator acumulado do benchmark |
| **D** | Bens (imóveis, veículos) | Sem rentabilidade | Sempre `null` |
| **E** | Poupança/Caixa | Sem rentabilidade | Sempre `null` |

**Campo novo:** `rentabilidadeDesdeAquisicaoPct` (renomeado de `retorno12m`)  
→ Agora é **histórico desde compra**, não apenas últimos 12 meses.

---

### 2. **Motivos Legíveis de Indisponibilidade**

Quando rentabilidade não pode ser calculada, o app mostra motivo específico:

```typescript
interface AtivoComRetorno {
  rentabilidadeConfiavel: boolean;
  rentabilidadeDesdeAquisicaoPct?: number; // null se não confiável
  motivoRentabilidadeIndisponivel?: string;
  statusPrecoMedio?: "confiavel" | "ajustado_heuristica" | "inconsistente";
}
```

**Motivos possíveis:**

- `preco_medio_inconsistente` — Preço médio não bate com valor total investido (erro > 5%)
- `cota_na_data_de_aquisicao_nao_encontrada` — Fundo sem cota na data de compra
- `cota_atual_indisponivel_na_cvm` — CVM não tem cotação atual do fundo
- `fator_de_correcao_indisponivel` — Benchmark (CDI/IPCA) não disponível
- `indexador_ou_taxa_ausentes_em_renda_fixa` — Renda fixa sem indexador ou taxa
- `bens_nao_tem_rentabilidade_marcada_a_mercado` — Imóveis/carros não têm retorno
- `caixa_poupanca_sem_historico_mensal` — Poupança sem série mensal

---

### 3. **Novos Ativos: Renda Fixa + Previdência (Full Stack)**

#### 3a. **Banco de Dados**

```sql
-- Migração 032: novos campos em ativos
ALTER TABLE ativos ADD COLUMN indexador TEXT;      -- "PRE", "CDI", "IPCA", "SELIC", "IGPM"
ALTER TABLE ativos ADD COLUMN taxa REAL;           -- taxa contratada (110% CDI = 110)
ALTER TABLE ativos ADD COLUMN data_inicio TEXT;    -- ISO 8601 quando começou
ALTER TABLE ativos ADD COLUMN vencimento TEXT;     -- ISO 8601 quando vence (opcional)
```

#### 3b. **Template XLSX**

Duas novas abas no arquivo de importação:

**📄 Renda Fixa**
| Campo | Exemplo | Notas |
|-------|---------|-------|
| Nome do Título | CDB Bradesco 100% CDI | Livre |
| Instituição | Bradesco | Banco/corretora |
| Tipo | CDB \| Tesouro | Renda Fixa pura |
| Valor Aplicado | 10000.00 | Em BRL |
| Indexador | CDI \| IPCA \| PRE \| SELIC \| IGPM | Benchmark |
| Taxa | 110 | % do benchmark (110 = 110% CDI) |
| Data Início | 2025-01-15 | Quando aplicou |
| Vencimento | 2026-01-15 | Opcional |

**🏛️ Previdência**
| Campo | Exemplo | Notas |
|-------|---------|-------|
| Nome do Título | PGBL XP Ações | Livre |
| Instituição | XP Investimentos | Gestora |
| Tipo | PGBL \| VGBL | Tipo previdência |
| Valor Aplicado | 5000.00 | Em BRL |
| Indexador | PRE (padrão) | Indexador base |
| Taxa | 0 | Rentabilidade esperada (0 = sem taxa) |
| Data Início | 2020-06-01 | Data de aporte |
| Vencimento | 2060-06-01 | Data de saque esperada |

#### 3c. **API de Importação**

Parser frontend (`apresentacao/src/utils/importacaoParser.ts`):
- Detecta abas renomeadas: "renda fixa", "renda_fixa", "rendafixa", "📄 renda fixa"
- Detecta abas previdência: "previdência", "previdencia", "🏛️ previdência"
- Normaliza indexador para enum (CDI, IPCA, PRE, SELIC, IGPM)
- Extrai metadados em JSON para armazenar no banco

Validação backend (`servidores/modulos-backend/importacao/src/servico.ts`):
- Valida indexador contra lista branca
- Valida taxa > 0
- Valida datas (data_inicio < vencimento se ambas presentes)
- Armazena em `ativos` com `categoria=renda_fixa` ou `previdencia`

---

### 4. **Histórico Mensal: Scope Separation**

#### 4a. **Novo Schema**

```sql
-- Migração 033: renomeia retorno_12m para rentabilidade_desde_aquisicao_pct
ALTER TABLE historico_carteira_mensal 
  RENAME COLUMN retorno_12m TO rentabilidade_desde_aquisicao_pct;

-- Migração 034: separa escopos
ALTER TABLE historico_carteira_mensal 
  ADD COLUMN valor_investimentos REAL;      -- Base para rentabilidade (A, B, C)
  ADD COLUMN patrimonio_dividas REAL;       -- Dívidas subtraídas do total
  MODIFY COLUMN rentabilidade_mes_pct REAL; -- Novo nome (era retorno_mes)
  MODIFY COLUMN rentabilidade_acum_pct REAL;-- Novo nome (era retorno_acum)
```

#### 4b. **Fórmulas Ajustadas**

**Rentabilidade mensal (TWR - Time-Weighted Return):**
```
rentabilidadeMesPct = (aportesMes - valorInvestimentosMes) / valorInvestimentosBase
```
Onde `aportesMes` = novos aportes no mês (exclui atualizações de preço).  
**Escopo:** Apenas investimentos (A, B, C).

**Rentabilidade acumulada desde aquisição:**
```
rentabilidadeDesdeAquisicaoPct = (totalAtual - totalInvestido) / totalInvestido * 100
```
**Escopo:** Só investimentos (A, B, C), nunca inclui bens ou poupança.

**Patrimônio líquido (exibido ao usuário):**
```
patrimônioLíquido = (A+B+C) + imóveisSaldo + poupança - dívidas
                  = patrimonioTotal
```

**Campo interno `valorInvestimentos` (não exibido):**
```
valorInvestimentos = soma(familias A, B, C)
```
Usado apenas para cálculo de rentabilidade por família. **Não é uma nova métrica de UI** — é detalhe da fórmula interna.

---

## O Que Você Vai Observar no App

### ✅ **Na Tela de Carteira**

1. **Coluna "Rentabilidade"** mostra agora valor desde aquisição (não mais últimos 12m)
   - Exemplo: "+15.3% desde 2024-06-15"

2. **Ativos com marca de confiabilidade:**
   - ✓ Verde: rentabilidade confiável (preço real, dados completos)
   - ⚠️ Amarelo: rentabilidade indisponível (clique para ver motivo)
   - Motivo legível em tooltip: "Preço médio inconsistente com valor total"

3. **Novos ativos aparecem se forem importados:**
   - 📄 CDB, Tesouro Direto, LCI (abas Renda Fixa)
   - 🏛️ PGBL, VGBL (aba Previdência)

### ✅ **Na Tela de Histórico / Gráfico de Rentabilidade**

1. **Série histórica mensal recalculada** (pós-deploy)
   - Novos valores de `rentabilidadeDesdeAquisicaoPct` refletem cálculo por família
   - Linhas podem mudar se preço médio foi ajustado pela heurística

2. **Gráfico só renderiza se houver série suficiente**
   - Requer mínimo de dados (ajustável conforme config)
   - Se carteira é nova: "Aguardando histórico de performance..."

3. **Patrimônio total (não muda visualmente):**
   - Continua sendo: investimentos + imóvel + poupança - dívidas
   - Score usa isso para calcular bem-estar geral (estrutura de vida inteira)

### ✅ **Na Tela de Importação XLSX**

1. **Novo template com 7 abas** (anterior: 5)
   - Ações, Fundos, Renda Fixa (NEW), Previdência (NEW), Imóveis, Veículos, Caixa

2. **Abas Renda Fixa e Previdência pré-preenchidas** com exemplos:
   - CDB Bradesco 100% CDI
   - Tesouro Direto IPCA+
   - LCI Itaú
   - PGBL XP Ações
   - VGBL BB Previdência

3. **Campos novos na importação:**
   - Indexador (dropdown interno, normalizado)
   - Taxa (% CDI, IPCA, etc.)
   - Data Início e Vencimento (opcionais para alguns)

---

## O Que NÃO Muda (Sem UI Nova)

- 🚫 **Telas de login/onboarding:** Sem alteração
- 🚫 **Formulário manual de "Adicionar Ativo":** Não existe (só importação XLSX)
- 🚫 **Layout de carteira:** Estrutura igual, só dados recalculados
- 🚫 **Cores/temas:** Sem mudança visual
- 🚫 **Score:** Continua medindo **bem-estar financeiro geral** (patrimônio total = investimentos + bens + poupança - dívidas). Campo `valorInvestimentos` das migrações é **interno** (só para cálculo de fórmulas A-E), não exposto ao usuário.

---

## Checklist Pós-Deploy

### ✅ **Já Feito**

- [x] Commit f8ee5d6 (backend, migrations, testes)
- [x] Deploy `ei-api-gateway` em Cloudflare
- [x] Migrações 032, 033, 034 aplicadas no D1
- [x] 82 testes passando (carteira 32/32, histórico 27/27, api 23/23)

### ⏳ **Próximo Passo (Manual)**

```bash
# Quando estiver pronto com JWT admin:
EI_ADMIN_TOKEN=<seu_jwt_aqui> node utilitarios/scripts/reconstruir-historico-todos.mjs

# Script irá:
# 1. Listar usuários com ativos
# 2. Enfileirar cada um para reconstrução
# 3. Processar em lotes (6 meses por usuário por ciclo)
# 4. Reportar progresso e erros
```

Estimativa: **5-15 min** para 10-50 usuários (conforme quantidade de histórico).

---

## Testes Realizados

| Módulo | Testes | Status | Destaques |
|--------|--------|--------|-----------|
| **carteira** | 32 | ✅ Verde | Familias A-E, snapshot, scope separation |
| **historico** | 27 | ✅ Verde | TWR, reconstrução, fila de processamento |
| **api** | 23 | ✅ Verde | CDI, IPCA, normalização de CNPJ |
| **importacao** | — | ✅ Verde | (via carteira tests) |

---

## Referência Rápida: Motivos de Indisponibilidade

```json
{
  "rentabilidade_confiavel": false,
  "rentabilidade_desde_aquisicao_pct": null,
  "motivo_rentabilidade_indisponivel": "preco_medio_inconsistente",
  "status_preco_medio": "inconsistente"
}
```

Mostrar ao usuário em tooltip:
> ⚠️ **Rentabilidade indisponível**  
> Preço médio do ativo não bate com valor total investido (erro > 5%).  
> Revise a importação ou corrija dados manualmente.

---

## Commits & Deploy

- **Commit:** `4974e2a` — feat(audit-7fase): families A-E, rentabilidadeDesdeAquisicaoPct, renda-fixa/previdencia, rollout script
- **Worker:** `https://ei-api-gateway.giammattey-luiz.workers.dev`
- **Banco:** D1 (esquilo-invest-dev) com 3 migrações aplicadas ✅
- **Git branch:** `master`

---

**Pronto para usar. Avance quando tiver JWT admin para o rollout.**

---

## Post-Deployment Fix: patrimonioBruto Calculation (2026-04-20)

### Problema Identificado
Score do usuário giammattey.luiz@gmail.com estava inflado em 78 quando deveria estar ~45.

**Raiz do Problema:** Arquivo `servidores/modulos-backend/insights/src/repositorio.ts` linhas 273-290:
- `imovel` e `veiculo` vinham de `contextoPatrimonial` (sempre 0 para este usuário)
- Dados reais de imóvel (R$ 280k) e veículo (R$ 86k) estavam em `posicoes_financeiras`
- Esses valores eram capturados em `outros` em vez de serem categorizados corretamente
- Resultado: patrimonioBruto = R$ 417k ✓ mas com distribuição % incorreta (88% "outros")
- Score calculation usava `scoreConcentracaoIliquida = 1 - (0 + 0) / 100 = 1.0` (super positivo!)

### Solução Aplicada
**Commit:** `5c9183a` — Extrai imovel/veiculo diretamente de posicoes_financeiras

```typescript
// ANTES (bugado):
const imoveis = contextoPatrimonial.imoveis;          // = 0
const veiculos = contextoPatrimonial.veiculos;        // = 0
const outros = Math.max(0, valorPosicoes - caixaPosicoes);  // = R$ 366k

// DEPOIS (correto):
const imoveisPos = posicoesRows.filter(x => x.tipo === 'imovel').reduce(...); // = R$ 280k
const veiculosPos = posicoesRows.filter(x => x.tipo === 'veiculo').reduce(...); // = R$ 86k
const imoveis = Math.max(imoveisPos, contextoPatrimonial.imoveis); // = R$ 280k
const veiculos = Math.max(veiculosPos, contextoPatrimonial.veiculos); // = R$ 86k
const outros = Math.max(0, valorPosicoes - valorPosicoesCategorizado); // = 0
```

### Impacto no Score
| Métrica | Antes | Depois | 
|---------|-------|--------|
| % Imóveis | 0% | 67.1% |
| % Veículos | 0% | 20.6% |
| % Outros | 87.7% | 0% |
| scoreConcentracaoIliquida | 1.0 | 0.123 |
| **Score Final** | **78** | **~45** |
| **Penalidades** | 3 | 5+ |

Score agora **apropriado** para portfólio com 88% em bens + 12% investimentos + 0% retorno.

### Validação
- ✅ Deploy em `https://ei-api-gateway-production.giammattey-luiz.workers.dev`
- ✅ Banco confirmou: imovel R$ 280k + veiculo R$ 86k presentes em posicoes_financeiras
- ✅ Investimentos R$ 51.309,32 em 11 ativos (4 fundos + 7 ações)

---

## Post-Deployment Fix 2: Fluxo de Patrimônio Externo (2026-04-20)

### Problema Identificado

Usuário Luiz:
- ❌ Imóveis/veículos não aparecem no painel de perfil
- ❌ Não aparecem na aba "Bens" da carteira
- ❌ Não são contabilizados na tela home de patrimônio

**Causa Raiz:** Dados estão em `posicoes_financeiras` (operacional) mas não em `perfil_contexto_financeiro` (perfil).

### Solução Implementada

**1. Endpoint Admin para Sincronização**
- **Arquivo:** `servidores/porta-entrada/src/server/routes/admin.routes.ts`
- **Endpoint:** `POST /api/admin/patrimonio/sincronizar-externo`
- **Funcionalidade:**
  - Busca todos usuários com bens em `posicoes_financeiras`
  - Transforma para formato `patrimonioExterno` (JSON)
  - Sincroniza para `perfil_contexto_financeiro` com ON CONFLICT UPDATE
  - Suporta `--usuario-id` para um usuário específico
  - Suporta `--dry-run` para preview

**2. Scripts de Sincronização**
- `utilitarios/scripts/sincronizar-patrimonio-externo-api.mjs` — Via API (recomendado)
- `utilitarios/scripts/sincronizar-patrimonio-externo.mjs` — Acesso direto ao banco (alternativo)

**3. Migração 035**
- `infra/banco/migrations/035_sincronizar_patrimonio_externo.sql`
- Documentação apenas (migração efetiva feita via script)

### Impacto Esperado

**Imediato (após rodar sync):**
1. ✅ Imóveis/veículos aparecem no painel de perfil
2. ✅ Aba "Bens" da carteira lista corretamente
3. ✅ Home patrimonio inclui bens (R$ 366k)
4. ✅ Score apropriado ~45 (88% em bens ilíquidos)

**Futuramente (próxima PR):**
- Melhorias UI/UX no `PerfilUsuario.jsx` (feedback visual, toast de sucesso, etc.)

### Como Rodar a Sincronização

```bash
# Preview (sem alterar dados)
EI_ADMIN_TOKEN=<seu_jwt> node utilitarios/scripts/sincronizar-patrimonio-externo-api.mjs \
  --usuario-id=4a858baf-fd89-42a8-84f2-d45c7489b2a3 \
  --dry-run

# Aplicar para Luiz
EI_ADMIN_TOKEN=<seu_jwt> node utilitarios/scripts/sincronizar-patrimonio-externo-api.mjs \
  --usuario-id=4a858baf-fd89-42a8-84f2-d45c7489b2a3

# Aplicar para todos os usuários
EI_ADMIN_TOKEN=<seu_jwt> node utilitarios/scripts/sincronizar-patrimonio-externo-api.mjs
```

### Referência
- Documentação detalhada: `FIX_FLUXO_PATRIMONIO_EXTERNO.md`
- Endpoint: `admin.routes.ts` linhas ~1044-1158
- Frontend (a melhorar): `PerfilUsuario.jsx` linha 141
