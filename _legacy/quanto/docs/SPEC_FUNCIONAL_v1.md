# QUANTO — Especificacao Funcional v1.3

> "Quanto voce tem, de fato."

**Data:** 2026-06-13
**Status:** Em revisao (feedback de UX incorporado — v1.3)

---

## 1. Visao do Produto

### 1.1 Problema

Investidores pessoa fisica com ativos distribuidos em multiplas instituicoes (corretoras, bancos, previdencia corporativa) nao conseguem responder a uma pergunta simples: **qual e o valor total do meu patrimonio hoje?**

Os apps de cada instituicao mostram apenas seus proprios numeros. Planilhas ficam desatualizadas. Consolidadores de mercado exigem integracao Open Finance, cobram assinatura, e adicionam complexidade desnecessaria (proventos, IR, recomendacoes).

### 1.2 Solucao

O Quanto e uma PWA de consolidacao de patrimonio que:

- Agrega ativos de todas as instituicoes em **um unico numero**
- Atualiza **cotacoes de acoes/FIIs automaticamente** (B3 via BRAPI)
- Usa **saldo manual** para fundos, previdencia e renda fixa (digitados mensalmente pelo usuario)
- Mostra **quando cada grupo de ativos foi atualizado** (indicador de frescor)
- Tira **foto mensal automatica** do patrimonio (historico)
- Permite **importar ativos via planilha XLSX** (onboarding rapido)

### 1.3 Proposta de valor

| Aspecto | Quanto | Planilha | Consolidadores |
|---------|--------|----------|----------------|
| Tempo para ver o numero | 10 segundos | 5+ minutos | 30+ segundos + login |
| Custo | R$ 0 | R$ 0 | R$ 15-50/mes |
| Integracao bancaria | Nao (manual + cotacao auto) | Nao | Sim (Open Finance) |
| Complexidade | 4 telas | Infinita | 20+ telas |
| Offline | Sim (PWA) | Depende | Nao |
| Privacidade | Dados proprios (Cloudflare) | Local | Terceiros |

### 1.4 Anti-escopo (o que o Quanto NAO faz)

Estas funcionalidades estao **fora do escopo por decisao de produto**, nao por limitacao tecnica:

- **Proventos, dividendos e IR** — apps das corretoras ja fazem isso melhor
- **Preco medio por trade** — requer historico de operacoes, complexidade desproporcional
- **Metas e rebalanceamento** — implica opiniao sobre alocacao, fora do proposito
- **Recomendacoes de investimento** — responsabilidade regulatoria
- **Open Finance / B3 / CEI** — integracao fragil, custo de manutencao alto; import XLSX resolve
- **Notificacoes push** — nao ha evento que justifique interromper o usuario
- **Login proprio** — Cloudflare Access cuida de auth com zero codigo
- **Simuladores e IA** — feature creep; o app responde UMA pergunta
- **Perfil editavel / configuracoes avancadas** — simplicidade intencional

---

## 2. Personas e Contextos de Uso

### 2.1 Persona primaria: Investidor autonomo

**Perfil:** Pessoa fisica com patrimonio distribuido em 2-4 instituicoes. Investe em acoes, fundos, previdencia e renda fixa. Nao e trader — faz aportes mensais e acompanha o total, nao operacoes individuais.

**Dor principal:** "Preciso abrir 3 apps diferentes e somar na cabeca pra saber quanto tenho."

**Comportamento:**
- Consulta o patrimonio 2-4x por semana (10 segundos cada)
- Atualiza saldos manuais 1x por mes (4 minutos)
- Adiciona/remove ativos raramente (1-2x por trimestre)
- Usa celular Android como dispositivo principal

### 2.2 Contextos de uso

| Contexto | Frequencia | Duracao | Fluxo |
|----------|-----------|---------|-------|
| Consulta rapida | 2-4x/semana | 10s | Abrir app > ver numero > fechar |
| Atualizacao mensal | 1x/mes | 4min | Card frescor > ativos vencidos > digitar saldo > salvar |
| Onboarding | 1x | 10min | Cadastrar ativos um a um OU importar planilha |
| Gestao de ativos | Esporadico | 2min | Adicionar, editar ou remover ativo |
| Consulta historica | 1-2x/mes | 30s | Ver evolucao do patrimonio |
| Privacidade em publico | Situacional | 2s | Ocultar valores > consultar > revelar |

---

## 3. Funcionalidades

### 3.1 Consolidacao de patrimonio (F-CORE)

**Descricao:** O sistema agrega todos os ativos do usuario em um numero total unico, calculado em tempo real a partir de cotacoes automaticas (acoes/FIIs) e saldos manuais (demais ativos).

**Regras de negocio:**

- **RN-01:** O total do patrimonio inclui APENAS ativos com `status = active`
- **RN-02:** Ativos com `status = redeeming` sao exibidos separadamente com nota "nao contabilizado"
- **RN-03:** Ativos com `status = archived` sao invisiveis em todas as telas (soft delete)
- **RN-04:** Ativos com ticker (modo auto) tem saldo calculado como `quantidade x cotacao`
- **RN-05:** Ativos sem ticker (modo manual) tem saldo igual ao `manual_balance` informado
- **RN-06:** Se a cotacao de um ativo auto estiver indisponivel, usa o ultimo valor em cache; se nunca houve cotacao, usa `invested` como fallback
- **RN-07:** Ganho = total - invested. Ganho % = ((total / invested) - 1) x 100. Se invested = 0 ou null, nao exibe ganho
- **RN-08:** Ativos manuais sem `invested` informado contribuem para o total mas nao para o calculo de ganho agregado (invested do ativo = 0 na soma)

### 3.2 Cotacoes automaticas (F-QUOTE)

**Descricao:** O sistema busca cotacoes de acoes e FIIs listados na B3 automaticamente, usando a API BRAPI.

**Regras de negocio:**

- **RN-09:** Cotacoes sao cacheadas por 15 minutos. Apos expirar, a proxima requisicao ao portfolio dispara refresh
- **RN-10:** O refresh de cotacoes e em lote — todos os tickers distintos em uma unica chamada BRAPI
- **RN-11:** Se a BRAPI retornar erro ou timeout, o sistema usa o cache anterior sem interromper a experiencia
- **RN-12:** Tickers nao encontrados na BRAPI sao marcados como `priceUnavailable: true` e mantem ultimo preco conhecido
- **RN-13:** O cron diario (12h UTC = 9h BRT) renova cotacoes independente de acessos
- **RN-14:** A tela Hoje exibe "cotacoes ha X min" baseado no campo `fetched_at` mais recente do cache

### 3.3 Indicador de frescor (F-FRESH)

**Descricao:** O sistema indica ha quanto tempo os saldos manuais de cada instituicao foram atualizados, incentivando o usuario a manter os dados frescos.

**Regras de negocio:**

- **RN-15:** Frescor se aplica APENAS a ativos manuais (sem ticker) com `status = active`
- **RN-16:** Um ativo manual e considerado "fresco" se `balance_updated_at` tem 30 dias ou menos
- **RN-17:** Um ativo manual e considerado "vencido" (stale) se `balance_updated_at` tem mais de 30 dias
- **RN-18:** O indicador de frescor e agrupado por instituicao: "Onze: 2 de 3 em dia"
- **RN-19:** Instituicoes com todos os ativos frescos aparecem com indicador verde
- **RN-20:** Instituicoes com ao menos um ativo vencido exibem alerta ambar com o nome do ativo mais antigo e ha quantos dias
- **RN-21:** O card de frescor exibe barra de progresso: total de manuais frescos / total de manuais
- **RN-22:** Ativos automaticos (com ticker) NAO participam do calculo de frescor

### 3.4 CRUD de ativos (F-CRUD)

**Descricao:** O usuario pode adicionar, editar, atualizar saldo e remover ativos do seu portfolio.

#### 3.4.1 Adicionar ativo

**Campos obrigatorios:**
- Instituicao (XP | Itau | Onze | Outros — ver RN-79)
- Classe (Acao/FII | Fundo | Previdencia | Tesouro | Renda Fixa | Poupanca | Cofrinho)
- Nome do ativo (texto livre)
- Modo: Automatico (ticker B3) ou Manual (saldo digitado)

**Campos condicionais:**
- Modo automatico: ticker (texto, ex: CPLE3), quantidade (decimal), valor aplicado (opcional)
- Modo manual: saldo atual (decimal obrigatorio), valor aplicado (opcional)
- Instituicao "Outros": nome da instituicao (texto livre, ex: "Nubank", "BTG")

**Regras de negocio:**

- **RN-23:** Ao criar ativo manual, `balance_updated_at` e preenchido automaticamente com a data/hora atual
- **RN-24:** Ao criar ativo auto, o sistema valida que ticker e quantidade estao preenchidos
- **RN-25:** Nome e texto livre — nao ha validacao de unicidade (usuario pode ter 2 fundos com nomes similares)
- **RN-26:** Todo ativo novo nasce com `status = active`
- **RN-27:** Ao criar, o sistema tenta buscar cotacao imediata para tickers novos (nao espera o cron)
- **RN-79:** Ao selecionar instituicao "Outros", aparece campo de texto para o nome da instituicao (ex: "Nubank", "BTG", "Rico"). Esse nome e armazenado no campo `institution_name` e usado no agrupamento da Carteira e nas barras de alocacao. Institucoes nomeadas aparecem com seu nome proprio, nao como "Outros"
- **RN-80:** Ao cadastrar, se ja existe um ativo com nome similar (distancia Levenshtein <= 3) na mesma instituicao do usuario, o sistema exibe aviso nao-bloqueante: "Voce ja tem um ativo parecido: [nome]. Deseja continuar?" O usuario pode confirmar ou cancelar

#### 3.4.2 Editar ativo

**Campos editaveis:** nome, instituicao, classe, valor aplicado, e:
- Modo auto: ticker, quantidade
- Status: ativo / em resgate (apenas via edicao completa)

**Regras de negocio:**

- **RN-28:** O modo do ativo (auto/manual) e determinado pela presenca de ticker — nao e campo editavel diretamente
- **RN-29:** Se o usuario remover o ticker de um ativo auto, ele se torna manual e precisa de `manual_balance`
- **RN-30:** Alterar status para `redeeming` remove o ativo do total principal imediatamente
- **RN-31:** Alterar status de `redeeming` de volta para `active` reincorpora o ativo no total (util quando resgate e cancelado ou dinheiro retorna para o mesmo ativo)
- **RN-81:** O fluxo completo de resgate tem 3 desfechos possiveis: (a) dinheiro volta para o mesmo ativo → status volta para `active` com saldo atualizado; (b) dinheiro liquidado e usuario nao quer rastrear → status muda para `archived`; (c) dinheiro cai como caixa na corretora → status muda para `archived` E usuario cria novo ativo manual (ex: "Caixa XP") com o saldo recebido. A Sheet B deve orientar o usuario com texto: "O resgate foi concluido?" + opcoes "Sim, remover" / "Voltou para ativo" / "Ainda em andamento"

#### 3.4.3 Atualizar saldo (rapido)

**Descricao:** Atalho para atualizar apenas o `manual_balance` de um ativo manual, sem passar pela edicao completa.

**Regras de negocio:**

- **RN-32:** Disponivel apenas para ativos manuais (sem ticker) com `status != archived`
- **RN-33:** Ao salvar o saldo, `balance_updated_at` e atualizado automaticamente para now()
- **RN-34:** O saldo anterior e a data da ultima atualizacao sao exibidos como referencia
- **RN-35:** O input aceita valores decimais nao-negativos (inputmode=decimal). Zero e valido (ex: poupanca sacada que o usuario quer manter rastreada)

#### 3.4.4 Remover ativo

**Regras de negocio:**

- **RN-36:** Remocao e sempre soft delete: `status = archived`
- **RN-37:** Ativo arquivado nao aparece em nenhuma tela, nao entra em calculos, mas permanece no banco
- **RN-38:** Snapshots historicos (fotos mensais) NAO sao afetados pela remocao — o total daquele mes permanece inalterado
- **RN-39:** Remocao exige confirmacao inline com a mensagem "Remover? Historico nao e afetado."
- **RN-40:** Nao ha funcionalidade de desfazer remocao (mas o dado existe no banco para recovery manual)

### 3.4.5 Visualizacao e filtros da Carteira (F-VIEW)

**Descricao:** A Carteira oferece modos de agrupamento, sub-agrupamento por classe e filtros para que o usuario encontre e organize seus ativos com clareza.

**Regras de negocio:**

- **RN-85:** A Carteira suporta dois modos de agrupamento primario: **por instituicao** (padrao) e **por classe**. O toggle fica no topo da lista, abaixo do header
- **RN-86:** No modo "por instituicao", os ativos dentro de cada grupo sao **sub-agrupados por classe** (ex: XP > Acoes, XP > Fundos, XP > Previdencia). Sub-grupos com apenas 1 ativo exibem o label de classe mas sem separador visual extra
- **RN-87:** No modo "por classe", os ativos sao agrupados por classe no nivel primario (ex: Acoes, Fundos, Previdencia). Cada ativo exibe a instituicao como metadado secundario (badge ou texto)
- **RN-88:** Filtros por chips horizontais scrollaveis ficam abaixo do toggle de agrupamento. Opcoes: `Todos` (default) | filtros por instituicao (XP, Itau, Onze, etc.) | filtros por classe (Acao, Fundo, Prev, etc.)
- **RN-89:** Filtros sao mutuamente exclusivos dentro de cada dimensao — selecionar "XP" filtra apenas ativos da XP; selecionar "Todos" remove o filtro
- **RN-90:** O modo de agrupamento e o filtro selecionado sao persistidos em `localStorage` — sobrevivem a reloads
- **RN-91:** Se nenhum ativo corresponde ao filtro ativo, exibir mensagem: "Nenhum ativo encontrado com esse filtro" + botao "Limpar filtro"
- **RN-92:** O grupo "Em resgate" aparece sempre no final da lista, independente do modo de agrupamento, e nao e afetado por filtros de instituicao/classe (sempre visivel quando existem ativos redeeming)
- **RN-93:** Sub-totais sao recalculados conforme o filtro ativo — ex: ao filtrar por "XP", o total do header mostra apenas a soma dos ativos XP
- **RN-94:** A tela Hoje exibe um **donut chart SVG** de alocacao com toggle "Por instituicao" / "Por classe". O centro do donut mostra o total do patrimonio. Toque em fatia destaca e exibe tooltip com nome, valor e percentual. Cores fixas por grupo (nao mudam entre renders)
- **RN-95:** Abaixo do donut, legenda com bolinha de cor + nome + valor (ordenada decrescente). A legenda substitui as listas de barras/texto anteriores — o donut e a visualizacao primaria, a legenda e o detalhe
- **RN-96:** A tela Carteira exibe uma **barra horizontal empilhada** compacta (8px altura) abaixo dos filtros e acima da lista. As cores seguem o modo de agrupamento ativo (por instituicao ou por classe). Funciona como "mapa visual" do portfolio. Respeita filtros ativos — se filtrado, barra mostra apenas o subset
- **RN-97:** Se houver mais de 5 segmentos no donut ou na barra empilhada, os menores sao agrupados em "Outros" (cor cinza) para manter legibilidade
- **RN-98:** No estado mascarado (ocultar valores), o donut mantem suas proporcoes/fatias mas valores no centro e na legenda sao mascarados. A barra empilhada mantem cores e proporcoes normalmente (proporcoes nao revelam valores absolutos)

### 3.5 Snapshot mensal (F-SNAP)

**Descricao:** O sistema tira uma foto mensal automatica do patrimonio, registrando total e invested. Essa foto alimenta o historico.

**Regras de negocio:**

- **RN-41:** O snapshot e executado automaticamente no dia 1 de cada mes as 12h UTC (9h BRT)
- **RN-42:** O snapshot calcula total e invested somando APENAS ativos com `status = active` do usuario
- **RN-43:** O snapshot e idempotente: se ja existe um para o mes corrente, faz update (nao duplica)
- **RN-44:** Snapshots sao por usuario — cada usuario tem sua propria serie historica
- **RN-45:** O mes do snapshot e armazenado como string 'YYYY-MM' (ex: '2026-06')
- **RN-46:** Existe endpoint manual para forcar snapshot (debug/admin) — nao exposto na UI
- **RN-82:** No primeiro acesso com ativos (apos onboarding), o sistema cria automaticamente um snapshot do mes corrente. Isso garante que o historico comece imediatamente, sem esperar o dia 1 do proximo mes

### 3.6 Import XLSX (F-IMPORT)

**Descricao:** O usuario pode importar ativos em lote a partir de uma planilha Excel, acelerando o onboarding.

#### Fluxo do wizard (3 etapas):

**Etapa 1 — Upload:**
- Dropzone com drag & drop + botao de selecao de arquivo
- Aceita .xlsx e .xls
- Exibe nome e tamanho do arquivo selecionado
- Link para baixar template modelo
- Botao "Processar" avanca para etapa 2

**Etapa 2 — Revisao:**
- Tabela com ativos parseados da planilha
- Cada linha tem badge de status:
  - **OK** (verde): todos os campos validos
  - **Alerta** (ambar): campo opcional ausente ou valor suspeito (ex: saldo = 0)
  - **Erro** (vermelho): campo obrigatorio ausente ou valor invalido
- Edicao inline de campos problematicos
- Linhas com erro bloqueiam a confirmacao ate correcao ou exclusao da linha
- Contadores: "X prontos / Y alertas / Z erros"

**Etapa 3 — Confirmacao:**
- Resumo: "N ativos serao criados, M ignorados"
- Detalhamento por instituicao e classe
- Botao "Confirmar importacao" envia ao backend
- Feedback: toast "N ativos importados"

**Regras de negocio:**

- **RN-47:** O parse da planilha e 100% client-side (SheetJS) — nenhum dado e enviado ao servidor ate a confirmacao
- **RN-48:** O template modelo tem 7 abas: Acoes/FIIs, Fundos, Previdencia, Tesouro, Renda Fixa, Poupanca, Cofrinhos
- **RN-49:** Cada aba tem colunas especificas (ver secao 3.6.1)
- **RN-50:** O parser identifica a classe do ativo pela aba de origem
- **RN-51:** Ativos importados nascem com `status = active` e `balance_updated_at = now()`
- **RN-52:** Nao ha deteccao de duplicatas — se o usuario importar a mesma planilha 2x, tera ativos duplicados
- **RN-53:** O usuario pode remover linhas individuais na etapa de revisao antes de confirmar
- **RN-83:** O template XLSX e servido como asset estatico em `/template-quanto.xlsx`, versionado no repositorio em `public/template-quanto.xlsx`
- **RN-84:** Durante o parse da planilha (entre "Processar" e a etapa 2), o sistema exibe loading state com spinner e texto "Processando planilha..." — o parse client-side pode levar segundos em planilhas grandes

#### 3.6.1 Colunas do template por aba

| Aba | Colunas obrigatorias | Colunas opcionais |
|-----|---------------------|-------------------|
| Acoes/FIIs | Ticker, Nome, Quantidade, Instituicao | Valor Aplicado |
| Fundos | Nome, Saldo Atual, Instituicao | Valor Aplicado |
| Previdencia | Nome, Saldo Atual, Instituicao | Valor Aplicado |
| Tesouro | Nome, Saldo Atual, Instituicao | Valor Aplicado |
| Renda Fixa | Nome, Saldo Atual, Instituicao | Valor Aplicado |
| Poupanca | Nome, Saldo Atual, Instituicao | — |
| Cofrinhos | Nome, Saldo Atual, Instituicao | — |

### 3.7 Ocultar valores (F-HIDE)

**Descricao:** Toggle global que mascara todos os valores monetarios e percentuais em todas as telas, permitindo consultar o app em publico sem expor dados financeiros.

**Regras de negocio:**

- **RN-54:** O toggle fica no header global (icone de olho)
- **RN-55:** Quando ativo, TODOS os valores monetarios (R$) sao substituidos por `R$ *****,**`
- **RN-56:** Quando ativo, TODOS os percentuais de ganho/perda sao substituidos por `**%`
- **RN-57:** Graficos SVG mantem a forma/tendencia mas com opacidade reduzida
- **RN-58:** O estado (visivel/oculto) e persistido em localStorage — sobrevive a reloads e sessoes
- **RN-59:** O toggle afeta TODAS as telas e sheets simultaneamente
- **RN-60:** A mascara se aplica apenas a valores numericos — nomes de ativos, instituicoes e labels permanecem visiveis

### 3.8 Dark mode (F-DARK)

**Descricao:** O app segue a preferencia de tema do sistema operacional do usuario.

**Regras de negocio:**

- **RN-61:** Dark mode e ativado automaticamente quando `prefers-color-scheme: dark` esta ativo no SO
- **RN-62:** Nao ha toggle manual de tema — o app SEMPRE segue o sistema
- **RN-63:** Cores semanticas (petro, verde, vinho, amber) NAO mudam no dark mode
- **RN-64:** Cores de superficie (paper, ink, mist, slate, card) sao invertidas via CSS custom properties
- **RN-65:** Todas as telas, sheets e componentes devem ser legiveis em ambos os modos

### 3.9 Multi-user (F-AUTH)

**Descricao:** O app suporta multiplos usuarios isolados, com autenticacao delegada ao Cloudflare Access.

**Regras de negocio:**

- **RN-66:** O app NAO tem nenhum codigo de autenticacao proprio — zero telas de login/registro
- **RN-67:** Cloudflare Access intercepta toda request e exige OTP por email
- **RN-68:** O Worker extrai o email do JWT do header `Cf-Access-Jwt-Assertion`
- **RN-69:** No primeiro acesso, o usuario e criado automaticamente (upsert por email)
- **RN-70:** Todas as queries de dados filtram por `user_id` — nenhum usuario ve dados de outro
- **RN-71:** `quotes_cache` e compartilhado entre usuarios (cotacoes sao publicas)
- **RN-72:** Em ambiente de desenvolvimento, o header mock `X-Dev-Email` substitui o JWT

### 3.10 PWA e Offline (F-PWA)

**Descricao:** O app e instalavel como PWA e funciona offline com o ultimo estado carregado.

**Regras de negocio:**

- **RN-73:** O app e instalavel via `beforeinstallprompt` no Android
- **RN-74:** Shell (HTML/CSS/JS/fontes) usa estrategia cache-first — sempre disponivel offline
- **RN-75:** Dados (`/api/portfolio`, `/api/history`) usam estrategia network-first com fallback para cache
- **RN-76:** Em modo offline, o app exibe nota discreta "dados de [data do cache]"
- **RN-77:** Operacoes de escrita (criar, editar, remover ativos) requerem conexao — exibir mensagem se offline
- **RN-78:** Fontes (Archivo e Inter) sao self-hosted em woff2 — nao dependem de CDN

---

## 4. Telas, Campos e Interacoes

### 4.1 Estrutura geral

O app tem **4 telas** acessiveis via tab bar inferior e **4 sheets** (paineis deslizantes de baixo para cima).

**Tab bar:** Hoje | Carteira | Historico | Importar

#### Elementos globais (presentes em todas as telas)

| Elemento | Tipo | Origem | Comportamento |
|----------|------|--------|---------------|
| Logo Quanto | Icone Q + wordmark | Asset estatico (SVG inline) | Decorativo. Tamanho varia: 20x20 (status bar), 28x28 (header tela), 40x40 (Hoje) |
| Icone olho | Toggle | `localStorage('quanto-hide')` | Alterna ocultar/revelar valores. Estado persiste entre sessoes. Icone muda: olho aberto (visivel) / olho fechado (oculto) |
| Horario | Texto | `new Date()` client-side | Formato "HH:MM". Atualiza a cada renderizacao |
| Tab bar | Navegacao | Estado do app (client) | 4 itens: Hoje, Carteira, Historico, Importar. Aba ativa em --ink, inativas em --slate |

---

### 4.2 Tela Hoje

**Proposito:** Responder a pergunta "quanto eu tenho?" em 10 segundos.

**Fonte de dados:** `GET /api/portfolio`

**Layout:** O header (logo + data) tem padding generoso (>=16px abaixo) antes da saudacao, criando respiro visual entre branding e conteudo. A saudacao e uma linha propria, separada do label "Patrimonio total" por 4px.

#### Campos e origem dos dados

| # | Campo | Tipo | Origem | Calculo/Logica | Formato | Mascara (oculto) |
|---|-------|------|--------|----------------|---------|------------------|
| 1 | Saudacao | Texto | `new Date().getHours()` client-side | <12 → "Bom dia" / <18 → "Boa tarde" / else "Boa noite" | Inter 600, 15px. Linha propria acima do label | Nao mascara |
| 2 | Data por extenso | Texto | `new Date()` client-side | Formatado em pt-BR | "sexta, 13 de junho de 2026" — 11px, cor slate, dentro do header junto ao logo | Nao mascara |
| 3 | Label "Patrimonio total" | Texto fixo | — | — | Caixa alta, 11px, cor slate. Separado da saudacao por 4px | Nao mascara |
| 4 | **Numero-tese (total)** | Monetario | `portfolio.total` | Soma de `balance` de todos os ativos com `status = active`. Balance de auto = `qty * price(cache)`. Balance de manual = `manual_balance` | Archivo 700, 44px. Parte inteira em destaque (cor ink), centavos em tamanho menor (22px, cor slate). Separados visualmente: "R$ 159.153" grande + ",53" menor. Numero inteiro legivel a distancia — centavos sao secundarios | R$ \*\*\*\*\*,\*\* |
| 5 | Ganho absoluto | Monetario | `portfolio.gain` | `total - invested`. Se `invested = 0` ou `null` → nao exibe | "+ R$ 58.335" — 13.5px, cor verde/vinho. Linha propria | R$ \*\*\*\*\*,\*\* |
| 6 | Ganho percentual | Percentual | `portfolio.gainPct` | `((total / invested) - 1) * 100`. Se `invested = 0` ou `null` → nao exibe | "(57,9%) sobre o aplicado" — na mesma linha do ganho absoluto, como sufixo. Percentual entre parenteses para nao competir com o valor absoluto | \*\*% |
| 7 | Cor do ganho | Visual | Sinal do `gain` | gain > 0 → --verde / gain < 0 → --vinho / gain = 0 → --slate | — | — |
| 8 | Nota de resgate | Texto + valor | `portfolio.redeeming` | Soma de `balance` dos ativos com `status = redeeming`. So aparece se soma > 0 | "+ R$ 4.111,32 em resgate (nao contabilizado)" | Valor mascarado, texto visivel |
| 9 | Frescor: titulo | Texto | `portfolio.freshness` | "Saldos manuais" | Texto fixo | Nao mascara |
| 10 | Frescor: contagem | Texto | `freshness.ok` / `freshness.total` | Conta manuais com `balance_updated_at` <= 30 dias vs total de manuais (`status = active`, sem ticker) | "14 de 15 em dia" | Nao mascara |
| 11 | Frescor: barra | Barra visual | `freshness.ok / freshness.total` | Largura proporcional. Cor --petro | Barra 78% preenchida | Nao mascara |
| 12 | Frescor: alerta | Texto | `freshness.byInstitution[].staleAssets` | Para cada instituicao com stale: nome do ativo mais antigo + dias. Ex: "Onze: Icatu Vanguarda ha 35 dias" | Texto ambar | Nao mascara |
| 13 | Toggle alocacao | Selecao binaria | Estado local (client) | "Por instituicao" (padrao) / "Por classe". Alterna entre os dois modos do donut chart e da legenda abaixo. Persistido em `localStorage` | Toggle pill compacto acima do donut, 12px | Nao mascara |
| 14 | Donut chart | Grafico SVG | `portfolio.byInstitution` ou `portfolio.byClass` (conforme toggle) | Donut com fatias proporcionais ao saldo de cada grupo. **Centro:** valor total do patrimonio (Archivo 700, 20px) — reforça o numero-tese. **Fatias:** cores fixas por grupo (palette sequencial de 3-7 cores). **Interacao:** toque na fatia destaca e exibe tooltip com nome + valor + percentual. SVG inline, ~160x160px | Donut mantem forma; valores no centro e tooltip mascarados |
| 15 | Legenda do donut | Lista | Mesma fonte do donut | Abaixo do donut. Cada item: bolinha de cor + nome do grupo + valor R$ (direita). Sem barras de progresso — o donut ja e a visualizacao. Ordenada decrescente por valor | Valores mascarados, labels visiveis |
| 16 | Info cotacoes | Texto | `portfolio.quotesFetchedAt` | Diferenca entre agora e `max(fetched_at)` da `quotes_cache`. Se nenhum ticker existe: nao exibe | "cotacoes ha 3 min" | Nao mascara |

**Estado vazio (zero ativos):**
- Numero-tese: exibe "R$ 0,00"
- Ganho: nao exibe (invested = 0)
- Card de frescor: oculto (nenhum manual para rastrear)
- Donut e legenda: ocultos (nada para agrupar)
- Info cotacoes: oculta (nenhum ticker)
- Mensagem contextual abaixo do numero-tese: "Adicione ativos na aba Carteira para comecar"

**Estado "todos em resgate":**
- Numero-tese: exibe "R$ 0,00"
- Nota de resgate: "+ R$ X em resgate (nao contabilizado)" — assume destaque visual maior neste cenario
- Card de frescor: oculto (sem ativos active manuais)

**Interacoes:**
- Toque no icone de olho → alterna ocultar valores
- Toque no card de frescor → navega para Carteira (ativos vencidos ficam destacados)
- Pull to refresh → recarrega portfolio (e renova cotacoes se cache > 15 min)

---

### 4.3 Tela Carteira

**Proposito:** Listar e gerenciar todos os ativos com hierarquia visual clara — agrupados, sub-agrupados e filtraveis.

**Fonte de dados:** `GET /api/portfolio` (mesma chamada da Hoje, cacheada no client)

#### Campos do header

| Campo | Tipo | Origem | Calculo | Formato |
|-------|------|--------|---------|---------|
| Titulo | Texto fixo | — | "Carteira" | Archivo 800, 20px. Padding generoso abaixo (>=12px) para respiro |
| Contagem de ativos | Texto | `portfolio.assets.length` | Total de ativos com `status = active` visiveis no filtro atual. Se filtro ativo, mostra contagem filtrada | "15 ativos" (ou "7 ativos" se filtrado) |
| Total do header | Monetario | `portfolio.total` ou soma filtrada | Se filtro ativo, mostra soma dos ativos filtrados (RN-93). Se nenhum filtro, mesmo calculo do numero-tese | "R$ 175.432,10" |

#### Controles de visualizacao (abaixo do header)

| Campo | Tipo | Comportamento | Formato |
|-------|------|---------------|---------|
| Toggle agrupamento | Selecao binaria | "Por instituicao" (padrao) / "Por classe". Muda o agrupamento primario da lista (RN-85). Persistido em localStorage (RN-90) | Toggle pill compacto, 12px, cor ink quando selecionado |
| Chips de filtro | Scroll horizontal | `Todos` (default) seguido de chips por instituicao (XP, Itau, Onze, etc.) e por classe (Acao, Fundo, Prev, etc.). Selecao unica — toque ativa/desativa. Persistido em localStorage (RN-90) | Chips 12px, borda mist, fundo ink quando selecionado. Scroll horizontal se nao couber |

#### Barra de distribuicao (abaixo dos filtros, acima da lista)

| Campo | Tipo | Origem | Calculo | Formato |
|-------|------|--------|---------|---------|
| Barra empilhada | SVG/HTML | `portfolio.byInstitution` ou `portfolio.byClass` | Barra horizontal de 8px, segmentos proporcionais ao saldo de cada grupo. Cores seguem o modo de agrupamento ativo. Se filtro ativo, mostra apenas o subset filtrado (RN-96) | Borda-radius 4px. Segmentos > 5 agrupados em "Outros" cinza (RN-97). Sem labels — funciona como mapa visual compacto |

#### Modo "Por instituicao" (padrao) — com sub-agrupamento por classe

**Hierarquia visual:** Instituicao > Classe > Ativo

| Nivel | Campo | Tipo | Calculo | Formato |
|-------|-------|------|---------|---------|
| **Grupo (instituicao)** | Label instituicao | Texto | Agrupamento por `institution`. Se `institution = 'OUTROS'` e `institution_name` preenchido, exibe o nome (ex: "NUBANK") | Caixa alta, 11px, peso 700, cor slate. Separador visual forte (linha + padding 16px acima) |
| | Total do grupo | Monetario | sum(balance) dos ativos `active` do grupo | Alinhado a direita, peso 600 |
| **Sub-grupo (classe)** | Label classe | Texto | Agrupamento por `class` dentro da instituicao. Usa label amigavel (ex: "Acoes", "Fundos", "Previdencia") | 10px, peso 600, cor slate, letra-spacing 0.06em. Sem separador se sub-grupo tem 1 ativo. Padding 8px acima se > 1 ativo |
| | Sub-total classe | Monetario | sum(balance) dos ativos da classe no grupo | 11px, alinhado a direita, cor slate |
| **Ativo** | (campos abaixo) | — | — | Mesmo layout da lista original |

**Exemplo visual (modo instituicao):**
```
XP                                R$ 20.748
  Acoes
    CPLE3 · Copel      [AUTO]    R$ 409  +9,5%
    ITSA4 · Itausa      [AUTO]    R$ 348  -6,8%
    RANI3 · Irani       [AUTO]    R$ 326  -12,6%
  Previdencia
    AZ Quest Luce Prev  [MANUAL]  R$ 12.362  +23,6%
  Fundos
    Western Asset US    [MANUAL]  R$ 4.563  +9,9%
    ACE Capital         [MANUAL]  R$ 1.478  +2,1%
    Trend Ouro FIF      [MANUAL]  R$ 1.262  +32,4%
```

#### Modo "Por classe"

**Hierarquia visual:** Classe > Ativo (com instituicao como metadado)

| Nivel | Campo | Tipo | Calculo | Formato |
|-------|-------|------|---------|---------|
| **Grupo (classe)** | Label classe | Texto | Agrupamento por `class` | Caixa alta, 11px, peso 700, mesmo estilo dos grupos de instituicao |
| | Total do grupo | Monetario | sum(balance) dos ativos da classe | Alinhado a direita |
| **Ativo** | Mesmos campos + instituicao visivel | — | Badge ou texto com nome da instituicao como metadado extra na linha meta | "XP" como badge secundario ao lado do badge auto/manual |

#### Campos de cada ativo na lista (ambos os modos)

| Campo | Tipo | Origem | Calculo/Logica | Formato | Mascara |
|-------|------|--------|----------------|---------|---------|
| Nome | Texto | `asset.name` | Direto do banco | 14px, peso 600, cor ink | Nao mascara |
| Badge modo | Tag | `asset.mode` | `ticker != null` → "AUTO" (cor petro) / `ticker == null` → "MANUAL" (cor verde se fresco, ambar se stale) | Tag 9.5px caixa alta | Nao mascara |
| Badge resgate | Tag | `asset.status` | `status == redeeming` → "EM RESGATE" (cor vermelha). Substitui badge de modo | Tag vermelha | Nao mascara |
| Meta (auto) | Texto | `asset.qty`, `asset.price` | `qty` cotas a R$ `price`. Ex: "28 cotas · R$ 14,61" | Texto secundario 11.5px | Valores mascarados |
| Meta (manual) | Texto | `asset.balanceUpdatedAt` | Diferenca em dias entre agora e `balance_updated_at`. "ha 1 dia". Se > 30 dias: cor ambar + "— atualize" | Texto 11.5px, ambar se stale | Nao mascara |
| Saldo | Monetario | `asset.balance` | Auto: `qty * price`. Manual: `manual_balance` | 14px, peso 600, alinhado a direita | R$ \*\*\*\*\*,\*\* |
| Ganho % | Percentual | `asset.gainPct` | `((balance / invested) - 1) * 100`. Se `invested` null/0 → nao exibe | "+12,3%" verde ou "-5,2%" vinho, 11.5px | \*\*% |
| Botao ... | Acao | — | Abre Sheet B para este ativo | Tres pontos, 28x28 | — |

#### Grupo "Em resgate" (presente em ambos os modos)

| Campo | Tipo | Origem | Calculo |
|-------|------|--------|---------|
| Label | Texto fixo | — | "Em resgate" — sempre no final da lista, independente do modo de agrupamento (RN-92) |
| Total | Monetario | sum(balance) dos redeeming | Alinhado a direita |
| Ativos | Lista | `portfolio.redeeming` | Ativos com `status = redeeming`, mesmos campos da lista acima. Cada ativo mostra instituicao como badge secundario |

**Interacoes:**
- Toggle agrupamento → alterna modo e re-renderiza lista imediatamente
- Chip de filtro → filtra lista, recalcula totais (RN-93)
- Toque no ativo manual → abre Sheet A (saldo rapido)
- Toque no ativo auto → sem acao (cotacao e automatica)
- Toque em `...` → abre Sheet B (edicao completa)
- Toque no FAB → abre Sheet C (cadastro)
- Pull to refresh → recarrega portfolio (mesmo comportamento da tela Hoje)

**Estado vazio:**
- Sem ativos: ilustracao simples + "Adicione seu primeiro ativo" + botao "Adicionar" que abre Sheet C
- Com filtro sem resultados: "Nenhum ativo encontrado com esse filtro" + botao "Limpar filtro" (RN-91)

---

### 4.4 Tela Historico

**Proposito:** Visualizar a evolucao do patrimonio ao longo dos meses.

**Fonte de dados:** `GET /api/history`

#### Campos do grafico

| Campo | Tipo | Origem | Calculo | Formato |
|-------|------|--------|---------|---------|
| Eixo X | Texto | `snapshots[].month` | Meses ordenados cronologicamente | "Jun", "Mai", "Abr"... |
| Eixo Y | Escala | min/max de `snapshots[].total` | Escala automatica com margem 10% acima e abaixo | Valores monetarios abreviados no eixo |
| Ponto do grafico | Coordenada | `snapshot.month` x `snapshot.total` | Posicao X = indice do mes, Y = total proporcional a escala | Circulo 6px cor petro |
| Linha | Traçado SVG | Sequencia de pontos | Conecta pontos em ordem cronologica | Stroke 2px cor petro |
| Area preenchida | SVG | Abaixo da linha | Gradiente de petro 20% opacidade ate transparente | Fill com gradiente |
| Tooltip | Popup | Toque no ponto | Exibe "Jun 2026: R$ 175.432,10" | Card flutuante proximo ao ponto |

#### Campos da lista mensal

| Campo | Tipo | Origem | Calculo | Formato | Mascara |
|-------|------|--------|---------|---------|---------|
| Mes/ano | Texto | `snapshot.month` | Parse de 'YYYY-MM' para nome do mes pt-BR + ano | "Jun 2026" | Nao mascara |
| Total do mes | Monetario | `snapshot.total` | Direto do snapshot | "R$ 175.432,10" | R$ \*\*\*\*\*,\*\* |
| Rendimento R$ | Monetario | Calculado | `snapshot[n].total - snapshot[n-1].total`. Primeiro mes: nao exibe | "+ R$ 3.200,50" | \*\*\*\*\*,\*\* |
| Rendimento % | Percentual | Calculado | `((total_atual / total_anterior) - 1) * 100`. Primeiro mes: nao exibe | "+1,86%" | \*\*% |
| Cor rendimento | Visual | Sinal | Positivo → --verde / Negativo → --vinho | — | — |

**Nota fixa:** "Foto automatica todo dia 1" — texto estatico 11px cor slate

**Estados por quantidade de snapshots:**
- **0 snapshots:** Mensagem "O historico comeca apos o primeiro mes. Foto automatica todo dia 1." Grafico oculto, lista oculta
- **1 snapshot:** Grafico exibe ponto unico (sem linha). Lista mostra 1 linha sem rendimento (primeiro mes nao tem referencia anterior)
- **2 snapshots:** Grafico exibe linha entre 2 pontos com area preenchida. Lista mostra 2 linhas, segunda com rendimento
- **3+ snapshots:** Comportamento normal — linha, pontos, area, lista completa

**Interacoes:**
- Scroll vertical na lista
- Toque em ponto do grafico → tooltip com valor do mes. Tooltip persiste ate o usuario tocar em outro ponto ou fora do grafico. Em mobile, scroll vertical nao dismiss o tooltip (apenas toque direto)

---

### 4.5 Tela Importar

**Proposito:** Permitir onboarding rapido via planilha Excel.

**Fonte de dados:** Arquivo XLSX local (client-side) → `POST /api/import` na confirmacao

**Estrutura:** Wizard de 3 etapas com indicador de progresso no topo.

#### Indicador de progresso (presente nas 3 etapas)

| Campo | Tipo | Origem | Calculo |
|-------|------|--------|---------|
| Passo 1 "Upload" | Estado | Etapa atual do wizard | Ativo (cor ink) / Concluido (cor verde) / Inativo (cor slate) |
| Passo 2 "Revisao" | Estado | Etapa atual | Idem |
| Passo 3 "Confirmar" | Estado | Etapa atual | Idem |
| Numero do passo | Texto | Indice | "1", "2", "3" — Archivo 700, 14px |

#### Etapa 1 — Upload

| Campo | Tipo | Origem | Comportamento |
|-------|------|--------|---------------|
| Icone upload | Decorativo | Asset estatico | Seta para cima, 36px, cor slate |
| Texto principal | Texto fixo | — | "Arraste sua planilha ou toque para selecionar" |
| Hint | Texto fixo | — | "Aceita .xlsx e .xls" |
| Link template | Link | `/template-quanto.xlsx` (asset estatico) | "Baixar template modelo" — download direto |
| Nome do arquivo | Texto | `File.name` do input | Aparece apos selecao. Ex: "meus-ativos.xlsx" |
| Tamanho | Texto | `File.size` do input | Formatado. Ex: "24 KB" |
| Botao "Processar" | Acao | — | Dispara parse SheetJS. Aparece apos selecao de arquivo |
| Loading | Estado | Parse em andamento | Spinner + "Processando planilha..." (RN-84) |

#### Etapa 2 — Revisao

| Campo (por linha) | Tipo | Origem | Calculo/Logica |
|-------------------|------|--------|----------------|
| Badge status | Tag | Validacao client | OK (verde): todos campos validos / Alerta (ambar): campo opcional vazio ou valor suspeito (saldo = 0) / Erro (vermelho): obrigatorio ausente ou invalido |
| Nome | Texto editavel | Celula da planilha | Mapeado da coluna "Nome" da aba correspondente |
| Classe | Texto editavel | Aba de origem | Aba "Acoes/FIIs" → ACAO, "Fundos" → FUNDO, etc. |
| Instituicao | Texto editavel | Celula da planilha | Coluna "Instituicao", validado contra XP/ITAU/ONZE/OUTROS |
| Saldo/Qtd | Numerico editavel | Celula da planilha | "Saldo Atual" (manuais) ou "Quantidade" (acoes). Deve ser > 0 |
| Ticker | Texto editavel | Celula da planilha | Somente na aba Acoes/FIIs. Texto maiusculo, 4-6 chars |
| Aplicado | Numerico editavel | Celula da planilha | "Valor Aplicado", opcional — pode ser vazio |
| Botao X | Acao | — | Remove a linha da revisao (nao sera importada) |

| Campo (totalizadores) | Tipo | Origem | Calculo |
|------------------------|------|--------|---------|
| Prontos | Contador | Contagem de linhas OK | Linhas sem erro e sem alerta |
| Alertas | Contador | Contagem de linhas alerta | Linhas com campo opcional vazio ou suspeito |
| Erros | Contador | Contagem de linhas erro | Linhas com campo obrigatorio ausente |
| Botao "Continuar" | Acao | Estado | Habilitado se erros == 0. Desabilitado se erros > 0 |

#### Etapa 3 — Confirmacao

| Campo | Tipo | Origem | Calculo |
|-------|------|--------|---------|
| Numero grande | Destaque | Contagem de linhas OK + alerta | Total de ativos que serao criados |
| Label | Texto fixo | — | "ativos serao criados" |
| Por instituicao | Breakdown | Agrupamento | Ex: "XP: 7 / Itau: 5" |
| Por classe | Breakdown | Agrupamento | Ex: "Fundos: 4 / Previdencia: 3 / Acoes: 5" |
| Ignorados | Texto | Linhas removidas | "2 ativos ignorados" — so aparece se > 0 |
| Botao "Confirmar" | Acao | — | Envia `POST /api/import` com itens confirmados. Apos sucesso: toast "N ativos importados" → navega para Carteira → wizard reseta ao estado inicial (etapa 1 vazia) |

**Estado especial — planilha vazia:**
- Se o parse nao encontrar linhas validas: permanece na etapa 1 com alerta "Nenhum ativo encontrado na planilha. Verifique o formato ou baixe o template modelo."

**Interacoes:**
- Drag & drop de arquivo na dropzone
- Toque na dropzone para selecionar arquivo
- Edicao inline nos campos da tabela de revisao
- Remocao de linhas individuais
- Navegacao entre etapas (voltar e avancar)

---

### 4.6 Sheet A — Saldo Rapido

**Proposito:** Atualizar o saldo de um ativo manual com o minimo de atrito.

**Acesso:** Toque no ativo manual na Carteira.

**Fonte de dados:** Ativo selecionado (ja carregado do portfolio). **Destino:** `PUT /api/assets/:id`

#### Campos

| # | Campo | Tipo | Origem | Calculo/Logica | Formato |
|---|-------|------|--------|----------------|---------|
| 1 | Logo strip | Decorativo | Asset estatico | Icone Q 32x32 + "Quanto." + "Atualizar saldo" | — |
| 2 | Grab handle | UI | — | Barra 38x4px para arrastar/fechar | — |
| 3 | Nome do ativo | Texto | `asset.name` | Direto do banco | Archivo 700, 17px |
| 4 | Dias desde atualizacao | Texto | `asset.balanceUpdatedAt` | `floor((now - balance_updated_at) / 86400000)` dias. Cor ambar se > 30 | "Atualizado ha 5 dias" |
| 5 | Input saldo | Input numerico | Vazio (usuario digita) | `inputmode=decimal`. Aceita apenas numeros e separador decimal. Valor minimo: 0 | Archivo 700, 32px. Prefixo "R$" fixo |
| 6 | Saldo anterior | Texto | `asset.manual_balance` | Ultimo valor salvo | "Ultimo: R$ 12.362,16" |
| 7 | Data anterior | Texto | `asset.balanceUpdatedAt` | Formatado pt-BR | "em 12/06/2026" |
| 8 | Botao "Salvar saldo" | Acao | — | Desabilitado ate usuario digitar valor. Envia `PUT /api/assets/:id { manual_balance: valor }` | Botao primario (ink) |
| 9 | Botao "Cancelar" | Acao | — | Fecha sheet sem alterar | Botao ghost (borda mist) |

**Dados enviados ao salvar:**

| Campo enviado | Valor | Regra |
|---------------|-------|-------|
| `manual_balance` | Valor digitado pelo usuario | Decimal positivo |
| `balance_updated_at` | — | Preenchido automaticamente pelo backend (now) |

**Interacoes:**
- Digitar valor → habilita botao salvar
- Salvar → PUT /api/assets/:id → toast "Saldo salvo - frescor renovado" → fecha sheet
- Cancelar → fecha sheet sem salvar
- Toque no overlay (fora da sheet) → fecha sem salvar

---

### 4.7 Sheet B — Edicao Completa

**Proposito:** Editar qualquer campo do ativo ou remove-lo.

**Acesso:** Botao `...` no ativo na Carteira.

**Fonte de dados:** Ativo selecionado (ja carregado). **Destino:** `PUT /api/assets/:id` ou `DELETE /api/assets/:id`

#### Campos

| # | Campo | Tipo | Origem | Editavel? | Validacao | Enviado como |
|---|-------|------|--------|-----------|-----------|-------------|
| 1 | Logo strip | Decorativo | Asset | Nao | — | — |
| 2 | Nome | Input texto | `asset.name` | Sim | Obrigatorio, nao vazio | `name` |
| 3 | Chips instituicao | Selecao unica | `asset.institution` | Sim | Obrigatorio, 1 selecionado | `institution` |
| 3b | Nome instituicao | Input texto | `asset.institution_name` | Sim (se Outros) | Obrigatorio se inst = OUTROS | `institution_name` |
| 4 | Chips classe | Selecao unica | `asset.class` | Sim | Obrigatorio, 1 selecionado | `class` |
| 5 | Valor aplicado | Input decimal | `asset.invested` | Sim | Opcional, >= 0 | `invested` |
| 6 | Ticker | Input texto | `asset.ticker` | Sim (se auto) | 4-6 chars maiusculas. Se removido → ativo vira manual | `ticker` |
| 7 | Quantidade | Input decimal | `asset.qty` | Sim (se auto) | Obrigatorio se ticker presente, > 0 | `qty` |
| 8 | Status resgate | Opcoes | `asset.status` | Sim (se redeeming) | Ver RN-81: 3 desfechos | `status` |
| 9 | Botao "Remover" | Acao destrutiva | — | — | Exige confirmacao inline | `DELETE /api/assets/:id` |

**Logica condicional dos campos:**

| Condicao | Campos visiveis | Campos ocultos |
|----------|----------------|----------------|
| `asset.ticker != null` (modo auto) | Ticker, Quantidade | — |
| `asset.ticker == null` (modo manual) | — | Ticker, Quantidade |
| `asset.status == 'redeeming'` | Opcoes de desfecho do resgate | — |
| `asset.status == 'active'` | Chips status: "Ativo / Em resgate" | Opcoes de desfecho |

**Ao tocar "Remover ativo":**
- Aparece caixa de confirmacao inline (fundo --red-s)
- Texto: "Remover? Historico nao e afetado."
- Botoes: "Cancelar" | "Remover"
- "Remover" → DELETE /api/assets/:id → toast "Ativo removido" → fecha sheet

**Interacoes:**
- Alterar campos → habilita botao "Salvar alteracoes"
- Salvar → PUT /api/assets/:id → toast "Alteracoes salvas" → fecha sheet
- Cancelar/overlay → fecha sem salvar

---

### 4.8 Sheet C — Cadastro

**Proposito:** Adicionar um novo ativo ao portfolio.

**Acesso:** FAB (+) na Carteira.

**Fonte de dados:** Nenhuma (formulario vazio). **Destino:** `POST /api/assets`

#### Campos

| # | Campo | Tipo | Valor inicial | Obrigatorio? | Validacao | Enviado como |
|---|-------|------|---------------|-------------|-----------|-------------|
| 1 | Chips instituicao | Selecao unica | Nenhum selecionado | Sim | 1 selecionado | `institution` |
| 1b | Nome instituicao | Input texto | Vazio | Sim (se Outros) | Nao vazio | `institution_name` |
| 2 | Chips classe | Selecao unica | Nenhum selecionado | Sim | 1 selecionado | `class` |
| 3 | Toggle modo | Selecao binaria | "Manual" pre-selecionado | Sim | — | Determina campos 5-8. Nao e enviado — modo e derivado da presenca de ticker |
| 4 | Nome | Input texto | Vazio | Sim | Nao vazio. Warning se similar a existente (RN-80) | `name` |
| 5 | Ticker | Input texto | Vazio | Sim (se auto) | 4-6 chars, caixa alta | `ticker` |
| 6 | Quantidade | Input decimal | Vazio | Sim (se auto) | > 0 | `qty` |
| 7 | Saldo atual | Input decimal | Vazio | Sim (se manual) | > 0 | `manual_balance` |
| 8 | Valor aplicado | Input decimal | Vazio | Nao | >= 0 | `invested` |

**Logica condicional dos campos:**

| Toggle modo | Campos visiveis | Campos ocultos |
|-------------|----------------|----------------|
| Automatico (ticker B3) | Nome, Ticker, Quantidade, Valor aplicado | Saldo atual |
| Manual (saldo no app) | Nome, Saldo atual, Valor aplicado | Ticker, Quantidade |

**Dados preenchidos automaticamente pelo backend ao criar:**

| Campo | Valor | Regra |
|-------|-------|-------|
| `user_id` | ID do usuario logado | Extraido do JWT |
| `status` | `'active'` | Sempre (RN-26) |
| `balance_updated_at` | `datetime('now')` | Apenas se manual (RN-23) |
| `created_at` | `datetime('now')` | Sempre |

**Interacoes:**
- Selecionar chips → muda selecao (unica por grupo)
- Toggle modo → alterna campos visiveis
- Adicionar → POST /api/assets → toast "Ativo adicionado" → fecha sheet → Carteira atualiza
- Validacao: campos obrigatorios destacados em vermelho se vazios ao tentar salvar

---

### 4.9 Sheet D — Upload XLSX

**Proposito:** Receber o arquivo na tela Importar (etapa 1 do wizard).

**Nota:** Na implementacao, o upload e inline na tela Importar (dropzone direto) sem necessidade de sheet separada. A sheet D existe como opcao de UX se a dropzone nao funcionar bem em mobile — decisao de implementacao.

---

### 4.10 Mapeamento chips → banco

Os chips de selecao na UI usam labels amigaveis que mapeiam para valores do banco:

| Chip (UI) | Valor no banco (`class`) |
|-----------|-------------------------|
| Acao/FII | `ACAO` |
| Fundo | `FUNDO` |
| Previdencia | `PREVIDENCIA` |
| Tesouro | `TESOURO` |
| Renda Fixa | `RF` |
| Poupanca | `POUPANCA` |
| Cofrinho | `COFRINHO` |

| Chip (UI) | Valor no banco (`institution`) |
|-----------|-------------------------------|
| XP | `XP` |
| Itau | `ITAU` |
| Onze | `ONZE` |
| Outros | `OUTROS` (+ `institution_name` com nome customizado) |

**Ordem visual dos chips (mesma em todas as sheets e telas):**
- Instituicao: XP → Itau → Onze → Outros
- Classe: Acao/FII → Fundo → Previdencia → Tesouro → RF → Poupanca → Cofrinho

### 4.11 Campo `institution_name` (schema)

O campo `institution_name` deve existir na tabela `assets` do banco:

```
institution_name TEXT  -- nome customizado quando institution = 'OUTROS'
                       -- nullable, obrigatorio se institution = 'OUTROS'
                       -- usado no agrupamento da Carteira e nas barras de alocacao
                       -- ex: 'Nubank', 'BTG', 'Rico', 'Inter'
```

Na API, `GET /api/portfolio` deve retornar `institution_name` em cada ativo. O agrupamento na UI usa `institution_name` quando presente.

### 4.12 Edge cases transversais

| Cenario | Frescor (card) | Alocacao | Numero-tese |
|---------|---------------|----------|-------------|
| Zero ativos | Oculto | Oculta | R$ 0,00 + mensagem contextual |
| Todos auto (sem manuais) | Oculto (nenhum manual para rastrear) | Normal | Normal |
| Todos manuais (sem ticker) | Normal | Normal. Info cotacoes oculta | Normal |
| Todos em resgate | Oculto | Oculta | R$ 0,00 + nota de resgate em destaque |
| Ativo auto sem cotacao e sem invested | Balance = R$ 0,00 + badge "cotacao indisponivel" | Contribui com 0 | Contribui com 0 |
| Saldo zero digitado (Sheet A) | Aceito — RN-35 permite zero (ex: poupanca sacada). Ativo permanece `active` com balance 0. Se usuario quer remover, usar Sheet B | — | Contribui com 0 |

### 4.13 Refresh apos acoes nas sheets

| Acao | Comportamento pos-sheet |
|------|------------------------|
| Sheet A: salvar saldo | Carteira atualiza otimisticamente (valor novo no ativo). Hoje recalcula no proximo acesso ou pull to refresh |
| Sheet B: salvar edicao | Carteira atualiza otimisticamente. Se mudou instituicao/classe, ativo se move de grupo |
| Sheet B: remover ativo | Ativo desaparece da lista imediatamente |
| Sheet B: mudar status resgate | Ativo se move para/de grupo "Em resgate" imediatamente |
| Sheet C: adicionar ativo | Ativo aparece na lista imediatamente. Se auto, busca cotacao assincrona — saldo aparece apos retorno da BRAPI |
| Import: confirmar | Navega para Carteira. Carteira faz refresh completo (GET /api/portfolio) para carregar todos os novos ativos |

---

## 5. Fluxos Sistemicos

### 5.1 Primeiro acesso (onboarding)

```
Usuario                    Cloudflare Access           Worker              D1
   |                            |                       |                  |
   |--- acessa URL ------------>|                       |                  |
   |<-- tela OTP (email) -------|                       |                  |
   |--- digita codigo --------->|                       |                  |
   |<-- JWT + redirect -------->|                       |                  |
   |                            |--- request + JWT ---->|                  |
   |                            |                       |--- decode JWT -->|
   |                            |                       |--- upsert user ->|
   |                            |                       |<-- user_id ------|
   |                            |                       |--- GET assets -->|
   |                            |                       |<-- [] (vazio) ---|
   |<-- Carteira vazia ---------|--------------------<--|                  |
   |    "Adicione seu primeiro ativo"                   |                  |
   |--- FAB (+) ou Importar --->|                       |                  |
```

### 5.2 Consulta rapida (uso cotidiano)

```
Usuario              Service Worker         Worker              D1            BRAPI
   |                      |                   |                  |              |
   |--- abre app -------->|                   |                  |              |
   |<-- shell (cache) ----|                   |                  |              |
   |                      |--- /api/portfolio>|                  |              |
   |                      |                   |--- assets ------>|              |
   |                      |                   |<-- 19 ativos ----|              |
   |                      |                   |--- quotes_cache->|              |
   |                      |                   |<-- cache --------|              |
   |                      |                   |                  |              |
   |                      |                   |[cache > 15min?]  |              |
   |                      |                   |--- GET /quote -->|              |--- BRAPI
   |                      |                   |<-- cotacoes -----|              |
   |                      |                   |--- upsert cache->|              |
   |                      |                   |                  |              |
   |                      |                   |--- calcula total-|              |
   |                      |<-- JSON portfolio-|                  |              |
   |<-- tela Hoje --------|                   |                  |              |
   |    (numero-tese)     |                   |                  |              |
```

### 5.3 Atualizacao mensal de saldos

```
Usuario                                   Worker              D1
   |                                        |                  |
   |--- abre app (Hoje) ------------------>|                  |
   |<-- card frescor: "Onze: 1 de 3 vencido" -----------------|
   |                                        |                  |
   |--- toca card frescor → Carteira ------>|                  |
   |<-- Carteira com ativos ambar ----------|                  |
   |                                        |                  |
   |--- toca ativo manual (stale) --------->|                  |
   |<-- Sheet A: saldo rapido --------------|                  |
   |                                        |                  |
   |--- digita novo saldo ----------------->|                  |
   |--- "Salvar saldo" ------------------->|                  |
   |                                        |--- PUT assets -->|
   |                                        |    manual_balance |
   |                                        |    balance_updated_at = now()
   |                                        |<-- OK ----------|
   |<-- toast "Saldo salvo" + fecha --------|                  |
   |                                        |                  |
   |--- repete para outros ativos stale --->|                  |
   |                                        |                  |
   |--- volta para Hoje ------------------>|                  |
   |<-- card frescor: "3 de 3 em dia" -----| (tudo verde)     |
```

### 5.4 Adicionar ativo

```
Usuario                                   Worker              D1            BRAPI
   |                                        |                  |              |
   |--- FAB (+) na Carteira -------------->|                  |              |
   |<-- Sheet C: cadastro ------------------|                  |              |
   |                                        |                  |              |
   |--- seleciona instituicao (chip) ------>|                  |              |
   |--- seleciona classe (chip) ----------->|                  |              |
   |--- toggle "Automatico" --------------->|                  |              |
   |--- preenche: nome, ticker, qtd, inv -->|                  |              |
   |--- "Adicionar ativo" ---------------->|                  |              |
   |                                        |--- POST assets ->|              |
   |                                        |<-- {id, ...} ----|              |
   |                                        |--- GET /quote -->|--- BRAPI     |
   |                                        |<-- cotacao -------|              |
   |                                        |--- upsert cache->|              |
   |<-- toast "Ativo adicionado" + fecha ---|                  |              |
   |<-- Carteira atualizada (com novo) -----|                  |              |
```

### 5.5 Editar e remover ativo

```
Usuario                                   Worker              D1
   |                                        |                  |
   |--- toca "..." no ativo -------------->|                  |
   |<-- Sheet B: edicao completa -----------|                  |
   |                                        |                  |
   |  [Cenario: editar]                     |                  |
   |--- altera campos ------------------->|                  |
   |--- "Salvar alteracoes" -------------->|                  |
   |                                        |--- PUT assets -->|
   |                                        |<-- OK ----------|
   |<-- toast "Alteracoes salvas" + fecha --|                  |
   |                                        |                  |
   |  [Cenario: remover]                    |                  |
   |--- "Remover ativo" ------------------>|                  |
   |<-- confirmacao inline: "Remover?"------|                  |
   |--- "Remover" (confirma) -------------->|                  |
   |                                        |--- DELETE ------>|
   |                                        |    status=archived
   |                                        |<-- OK ----------|
   |<-- toast "Ativo removido" + fecha -----|                  |
   |<-- Carteira atualizada (sem o ativo) --|                  |
```

### 5.6 Import XLSX

```
Usuario                      Browser (SheetJS)         Worker              D1
   |                              |                      |                  |
   |--- Tela Importar ----------->|                      |                  |
   |<-- Etapa 1: Upload ----------|                      |                  |
   |                              |                      |                  |
   |--- arrasta .xlsx ----------->|                      |                  |
   |                              |--- parse XLSX ------>|                  |
   |                              |    (client-side)     |                  |
   |                              |--- valida campos --->|                  |
   |<-- Etapa 2: Revisao ---------|                      |                  |
   |    tabela com badges         |                      |                  |
   |                              |                      |                  |
   |--- corrige erros (inline) -->|                      |                  |
   |--- remove linhas invalidas ->|                      |                  |
   |--- "Continuar" ------------->|                      |                  |
   |                              |                      |                  |
   |<-- Etapa 3: Confirmacao -----|                      |                  |
   |    "12 ativos serao criados" |                      |                  |
   |                              |                      |                  |
   |--- "Confirmar importacao" -->|                      |                  |
   |                              |--- POST /api/import->|                  |
   |                              |                      |--- INSERT batch->|
   |                              |                      |<-- {created: 12} |
   |<-- toast "12 ativos importados" + navega Carteira --|                  |
```

### 5.7 Snapshot mensal (automatico)

```
Cron Trigger                    Worker              D1            BRAPI
   |                              |                  |              |
   |--- 0 12 1 * * ------------->|                  |              |
   |                              |                  |              |
   |  [Fase 1: cotacoes]         |                  |              |
   |                              |--- tickers ----->|              |
   |                              |<-- lista --------|              |
   |                              |--- GET /quote -->|--- BRAPI     |
   |                              |<-- precos -------|              |
   |                              |--- upsert cache->|              |
   |                              |                  |              |
   |  [Fase 2: snapshot por user] |                  |              |
   |                              |--- users ativos->|              |
   |                              |<-- [user1,user2] |              |
   |                              |                  |              |
   |                              |  [para cada user]|              |
   |                              |--- assets(user)->|              |
   |                              |<-- ativos -------|              |
   |                              |--- calcula total |              |
   |                              |--- UPSERT snap->|              |
   |                              |<-- OK ----------|              |
```

### 5.8 Cron diario de cotacoes

```
Cron Trigger                    Worker              D1            BRAPI
   |                              |                  |              |
   |--- 0 12 * * * ------------->|                  |              |
   |                              |--- SELECT DISTINCT ticker --->|
   |                              |<-- [CPLE3,ITSA4,RANI3,BRST3] -|
   |                              |--- GET /quote/CPLE3,ITSA4,...->|--- BRAPI
   |                              |<-- {results: [...]} ----------|
   |                              |--- UPSERT quotes_cache ------>|
   |                              |<-- OK -------------------------|
```

### 5.9 Ocultar/revelar valores

```
Usuario                      localStorage            Todas as telas
   |                              |                      |
   |--- toca icone olho --------->|                      |
   |                              |--- save "hidden"---->|
   |                              |                      |--- aplica mascara
   |                              |                      |    R$ → R$ *****,**
   |                              |                      |    % → **%
   |<-- todas as telas mascaradas |                      |
   |                              |                      |
   |--- toca icone olho --------->|                      |
   |                              |--- save "visible"--->|
   |                              |                      |--- remove mascara
   |<-- valores revelados --------|                      |
```

### 5.10 Fluxo de resgate de fundo (completo)

```
Usuario                                   Worker              D1
   |                                        |                  |
   |  [Fase 1: Marcar fundo em resgate]     |                  |
   |                                        |                  |
   |--- "..." no fundo ------------------->|                  |
   |<-- Sheet B: edicao --------------------|                  |
   |--- chips status: "Em resgate" -------->|                  |
   |--- "Salvar alteracoes" -------------->|                  |
   |                                        |--- PUT status=redeeming ->|
   |                                        |<-- OK --------------------|
   |<-- Carteira: fundo movido p/ "Em resgate" ---|                     |
   |<-- Hoje: total reduzido, nota "+R$ X em resgate" |                 |
   |                                        |                           |
   |  [Fase 2: Resgate concluido — 3 desfechos]                        |
   |                                        |                           |
   |--- "..." no fundo em resgate --------->|                           |
   |<-- Sheet B: "O resgate foi concluido?" |                           |
   |                                        |                           |
   |  [Desfecho A: "Sim, remover"]          |                           |
   |--- confirma remocao ----------------->|                           |
   |                                        |--- DELETE (archived) ---->|
   |<-- toast "Ativo removido" -------------|                           |
   |  (se dinheiro virou caixa: FAB + → novo ativo manual)              |
   |                                        |                           |
   |  [Desfecho B: "Voltou para ativo"]     |                           |
   |--- status volta para active ---------->|                           |
   |--- atualiza saldo se necessario ------>|                           |
   |                                        |--- PUT status=active ---->|
   |<-- fundo reincorporado no total -------|                           |
   |                                        |                           |
   |  [Desfecho C: "Ainda em andamento"]    |                           |
   |--- fecha sheet sem alteracao --------->|                           |
```

---

## 6. Estados da Aplicacao

### 6.1 Estado do ativo

```
                    +----------+
                    |  active  |  ← estado inicial
                    +----+-----+
                         |
              [editar status]
                         |
                    +----v-------+
                    | redeeming  |  ← fora do total, badge vermelho
                    +----+-------+
                         |
           [editar status de volta]
                         |
                    +----v-----+
                    |  active  |
                    +----+-----+
                         |
                  [remover ativo]
                         |
                    +----v------+
                    | archived  |  ← invisivel, soft delete
                    +-----------+
                    (sem retorno via UI)

Nota: redeeming → archived tambem e possivel (remover direto de resgate)
```

### 6.2 Estado de frescor

```
Ativo manual criado/atualizado
         |
         v
    [balance_updated_at = now()]
         |
         v
    +--------+     30 dias      +---------+
    | Fresco | ───────────────> |  Stale  |
    | (verde)|                  | (ambar) |
    +--------+                  +---------+
         ^                          |
         |    [atualizar saldo]     |
         +──────────────────────────+
```

### 6.3 Estado do cache de cotacoes

```
    [app acessado ou cron]
         |
         v
    +------------------+
    | Cache existente? |
    +--------+---------+
         |          |
        sim        nao
         |          |
         v          v
    +---------+   +--------+
    | > 15min?|   | BRAPI  |
    +----+----+   +---+----+
     |       |        |
    sim     nao       v
     |       |    [upsert cache]
     v       |        |
  +------+   |        v
  | BRAPI|   |   +---------+
  +--+---+   |   | Cached  |
     |       |   +---------+
     v       |
[upsert]     |
     |       |
     v       v
+---------+
| Cached  |  (fetched_at atualizado)
+---------+

Se BRAPI falhar → manter cache anterior, nao interromper UX
Se ticker nao encontrado → manter ultimo preco, marcar priceUnavailable
```

### 6.4 Estado offline

```
    [app aberto]
         |
         v
    +-----------+
    | Online?   |
    +-----+-----+
      |       |
     sim     nao
      |       |
      v       v
  [network  [cache
   first]    only]
      |       |
      v       v
  [dados    [ultimo
   frescos]  estado]
              |
              v
         [nota: "dados de DD/MM"]
              |
              v
         [escrita desabilitada]
         [msg: "sem conexao"]
```

---

## 7. Regras de Formatacao e Exibicao

### 7.1 Valores monetarios

- Formato: `R$ 123.456,78` (separador de milhar ponto, decimal virgula)
- Valores negativos: `- R$ 1.234,56` (sem parenteses)
- Arredondamento: 2 casas decimais
- Mascara (oculto): `R$ *****,**`

### 7.2 Percentuais

- Formato: `+12,34%` ou `-5,67%`
- Sinal explicito (+ ou -)
- 2 casas decimais
- Cor: verde (+) ou vinho (-)
- Mascara (oculto): `**%`

### 7.3 Datas

- Frescor: "ha 5 dias", "ha 2 meses" (relativo, humanizado)
- Historico: "Jun 2026", "Mai 2026" (mes abreviado + ano)
- Cotacao: "ha 3 min", "ha 1h" (relativo, curto)
- Data completa: "12 de junho de 2026" (header Hoje)

### 7.4 Numeros grandes

- Ate R$ 999.999,99: formato completo
- Acima: formato completo (nao abreviar — o usuario quer ver o numero exato)

---

## 8. Tratamento de Erros

### 8.1 Erros de rede

| Situacao | Comportamento |
|----------|--------------|
| BRAPI timeout/erro | Usa cache anterior; exibe "cotacoes de [data]" em vez de "ha X min" |
| API indisponivel (leitura) | Exibe dados do cache offline + nota "dados de [data]" |
| API indisponivel (escrita) | Toast: "Sem conexao. Tente novamente." Nao fecha sheet. |
| Primeiro acesso sem rede | Tela de erro: "Conecte-se a internet para comecar." |

### 8.2 Erros de dados

| Situacao | Comportamento |
|----------|--------------|
| Ticker invalido (BRAPI nao encontra) | Mantém último preco; badge "preco indisponivel" |
| Saldo negativo digitado | Nao aceita (input impede valores negativos) |
| Campos obrigatorios vazios | Destaque visual no campo + nao submete |
| Import com linhas invalidas | Badge erro na linha + bloqueio da confirmacao |

### 8.3 Erros de autenticacao

| Situacao | Comportamento |
|----------|--------------|
| JWT expirado | Cloudflare Access redireciona para OTP automaticamente |
| JWT invalido/ausente | Worker retorna 401; Cloudflare Access intercepta |
| Dev sem header mock | Worker retorna 401 com msg "Missing auth header" |

---

## 9. Metricas de Sucesso

### 9.1 Criterio de pronto (MVP)

- **F3 < 10s:** Do toque no icone ao numero na tela, incluindo offline
- **CRUD sem reload:** Todas as operacoes atualizam a UI imediatamente
- **Soft delete preserva historico:** Remover ativo nao altera snapshots passados
- **Ocultar valores sem vazamento:** Nenhum numero visivel com toggle ativo
- **Dark mode legivel:** Todas as telas e sheets legiveis em ambos os modos
- **Offline funcional:** Ultimo estado visivel sem conexao

### 9.2 Metricas de uso (pos-MVP)

- **Frequencia F3:** consultas rapidas por semana (meta: 3+)
- **Frescor medio:** dias desde ultima atualizacao de manuais (meta: < 15)
- **Cobertura:** % de manuais atualizados no mes (meta: > 80%)
- **Tempo F2:** duracao da atualizacao mensal (meta: < 5 min)

---

## 10. Glossario

| Termo | Definicao |
|-------|-----------|
| Ativo | Um investimento individual (acao, fundo, previdencia, etc.) |
| Ativo auto | Ativo com ticker B3 — cotacao buscada automaticamente |
| Ativo manual | Ativo sem ticker — saldo digitado pelo usuario |
| Frescor | Indicador de ha quanto tempo um ativo manual foi atualizado |
| Stale | Ativo manual com atualizacao > 30 dias |
| Numero-tese | O valor total consolidado exibido em destaque na tela Hoje |
| Snapshot | Foto mensal do patrimonio (total + invested) |
| Soft delete | Remocao logica (status=archived) sem apagar dados |
| Sheet | Painel deslizante de baixo para cima (bottom sheet) |
| FAB | Floating Action Button — botao circular flutuante |
| BRAPI | API gratuita de cotacoes da B3 (brapi.dev) |
| Redeeming | Status de ativo em processo de resgate na corretora |
| Institution name | Nome customizado para instituicoes "Outros" (ex: Nubank, BTG) |
| Tesouro | Titulos do Tesouro Direto (Selic, IPCA+, Prefixado) — classe separada de RF generico |
| Sub-agrupamento | Nivel hierarquico secundario na Carteira — classes de ativos dentro de cada instituicao |
| Modo de agrupamento | Toggle na Carteira que alterna entre agrupar por instituicao (padrao) ou por classe |
| Filtro de carteira | Chips horizontais que filtram a lista de ativos por instituicao ou classe |

---

## 11. Notas da Validacao de Produto

Validacao realizada em 2026-06-13 por agente especialista em produto (fintech/investimentos BR). Veredicto: **Aprovado com ressalvas** — ressalvas incorporadas nesta versao.

**Lacunas criticas resolvidas:**
- LC-1: Classe TESOURO adicionada a UI (ja existia no schema) — RN atualizado, chips e template XLSX atualizados
- LC-2: Warning de duplicata no CRUD manual — RN-80 adicionada
- LC-3: Fluxo de resgate documentado com 3 desfechos — RN-81 e fluxo 5.10 atualizados

**Melhorias incorporadas:**
- MR-1: Instituicoes extensiveis — "Outros" com campo de nome (RN-79)
- MR-2: Template XLSX como asset estatico versionado (RN-83)
- MR-3: Loading state durante parse da planilha (RN-84)
- MR-4: Pull to refresh na Carteira
- MR-5: Tooltip no grafico historico
- MR-6: Snapshot automatico no primeiro acesso com ativos (RN-82)

---

## Changelog

| Versao | Data | Autor | Mudancas |
|--------|------|-------|----------|
| v1 | 2026-06-13 | Claude + Luiz | Especificacao funcional completa derivada da spec tecnica v3 |
| v1.1 | 2026-06-13 | Claude + Luiz | Incorporacao das ressalvas da validacao de produto: classe Tesouro na UI, instituicoes extensiveis, warning de duplicata, fluxo de resgate completo, snapshot no onboarding, tooltip no historico, pull to refresh na Carteira, loading no import, template XLSX como asset |
| v1.2 | 2026-06-13 | Claude + Luiz | Dicionario de campos completo por tela/sheet: origem, calculo, formato, mascara. Mapeamento chips→banco. Campo institution_name documentado (schema). Edge cases: zero ativos, todos auto, todos manual, todos resgate, cotacao indisponivel, planilha vazia, saldo zero, grafico 0/1/2 pontos. Refresh pos-acoes nas sheets. Correcao mascara ganho absoluto. Clarificacao contagem Carteira (so active). |
| v1.3 | 2026-06-13 | Claude + Luiz | Feedback de UX: (1) Header da Hoje com respiro vertical generoso entre logo e conteudo; (2) Numero-tese com hierarquia tipografica clara — parte inteira em destaque, centavos secundarios; (3) Alocacao substituida por donut chart SVG com toggle instituicao/classe, total no centro, legenda abaixo com cor+nome+valor; (4) Carteira com sub-agrupamento por classe dentro das instituicoes (hierarquia Instituicao > Classe > Ativo); (5) Toggle de modo de agrupamento: por instituicao (padrao) vs por classe; (6) Chips de filtro horizontais scrollaveis na Carteira (por instituicao e por classe); (7) Barra empilhada horizontal 8px na Carteira como mapa de distribuicao visual; (8) Sub-totais recalculados conforme filtro ativo; (9) Grupo "Em resgate" sempre visivel no final independente de filtros. RNs adicionadas: RN-85 a RN-98 (14 regras novas). Secao 3.4.5 (F-VIEW) com regras de visualizacao, filtros e graficos. |
