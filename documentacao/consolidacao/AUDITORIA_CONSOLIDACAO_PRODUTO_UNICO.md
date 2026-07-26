# Auditoria de Consolidação — Esquilo Wallet como Produto Único

Atualizado em: 2026-07-23

## 1. Decisão canônica

O repositório raiz `esquilo-wallet` é o único produto, runtime, frontend, backend, banco e pipeline de deploy válidos.

As pastas `_legacy/v1`, `_legacy/v2`, `_legacy/bridge`, `_legacy/vera-insights` e `_legacy/quanto` são fontes históricas para extração seletiva de regras, fluxos, integrações e casos de borda. Nenhuma delas deve voltar a executar, possuir deploy próprio ou ser importada diretamente pelo código ativo.

O Quanto deixa de ser tratado como produto separado. Sua tese funcional — responder “quanto eu tenho, de fato?” — passa a ser o núcleo do domínio patrimonial do Esquilo Wallet.

## 2. Produto unificado

O produto deve responder quatro perguntas:

1. **Quanto tenho?** Patrimônio consolidado, instituições, classes, ativos, bens, dívidas, saldos, cotações e frescor.
2. **Como estou?** Concentração, liquidez, risco, diversificação, desempenho, confiança e qualidade dos dados.
3. **O que mudou?** Aportes, retiradas, evolução mensal, mudanças de alocação e eventos patrimoniais.
4. **O que fazer?** Vera, simulações, explicações, alertas e próximos passos.

Fluxo canônico:

```text
Entradas e importações
        ↓
Catálogo de mercado + posições patrimoniais
        ↓
Movimentos e reconstrução
        ↓
Resumo, histórico e indicadores
        ↓
Vera e decisões
```

Vera não pode manter carteira, patrimônio ou cálculo paralelo.

## 3. Estado das gerações

| Fonte | Papel anterior | Destino no produto único | Situação |
|---|---|---|---|
| Raiz atual | Plataforma multiusuário completa | Runtime canônico | Manter e corrigir |
| Quanto | Consolidação patrimonial enxuta | Núcleo funcional de “Quanto tenho” | Absorver seletivamente |
| Vera Insights | IA financeira standalone | Domínio `decisoes/vera` | Parcialmente absorvido |
| v1 | Dashboard Apps Script | Referência de regras e UX | Arquivar após inventário |
| v2 | Apps Script, BigQuery e Flutter | Referência de integrações e fluxos | Arquivar após inventário |
| Bridge | Migração Apps Script → Cloudflare/D1 | Referência de adapters e migração | Arquivar após inventário |

## 4. Matriz funcional inicial

| Capacidade | Raiz atual | Quanto | Decisão |
|---|---|---|---|
| Patrimônio total | Sim | Sim | Raiz é canônica |
| Catálogo separado da posição | Sim | Não | Manter modelo da raiz |
| Ativos manuais | Sim | Sim | Unificar regra de saldo e atualização |
| Ativos com cotação | Sim | Sim | Manter provedores da raiz |
| Fundos CVM | Sim | Parcial | Manter raiz |
| Bens e dívidas | Sim | Sim, em evolução | Manter como itens patrimoniais tipados |
| Aportes e retiradas | Sim | Sim | Tratar como movimentos canônicos |
| Histórico mensal | Sim | Sim | Manter `patrimonio_historico_mensal` |
| Frescor do saldo manual | Não formalizado | Sim | Absorver do Quanto |
| Frescor por instituição | Não formalizado | Sim | Absorver do Quanto |
| Ocultar valores | Frontend | Sim | Manter como preferência global |
| Importação XLSX com revisão | Sim | Sim | Consolidar num único pipeline idempotente |
| Lifecycle de ativo | Parcial | Sim | Formalizar eventos e status |
| Offline/PWA | Sim | Sim | Manter raiz e validar cache seguro |
| Score e diagnóstico | Sim | Não | Manter raiz |
| Vera/IA | Sim | Não | Manter raiz sobre dados canônicos |
| Simulações | Sim | Não | Manter, sem duplicar cálculo patrimonial |
| Admin e telemetria | Sim | Não | Manter raiz |

## 5. Modelo de domínio canônico

### 5.1 Catálogo de mercado

`ativos` representa o instrumento público ou cadastral: ticker, CNPJ, nome, tipo, classe, moeda, indexador e vencimento.

Não contém quantidade, saldo ou propriedade de usuário.

### 5.2 Item patrimonial

`patrimonio_itens` representa uma posição ou bem pertencente ao usuário.

Deve possuir explicitamente:

- usuário;
- ativo de catálogo opcional;
- instituição/custodiante opcional;
- tipo e classe;
- nome exibido;
- quantidade;
- preço médio ou valor investido;
- valor manual atual, quando aplicável;
- data da última confirmação manual;
- origem;
- status/lifecycle;
- moeda;
- datas de criação e atualização.

### 5.3 Movimento

`patrimonio_aportes` deve evoluir conceitualmente para movimento patrimonial, cobrindo aporte, retirada, transferência, ajuste, compra, venda e resgate sem criar tabelas paralelas.

### 5.4 Cotação

`ativos_cotacoes_cache` continua global por ativo e fonte. Nunca deve armazenar saldo do usuário.

### 5.5 Histórico

`patrimonio_historico_mensal` é a fotografia agregada canônica. Deve ser idempotente e reconstruível a partir de itens, movimentos e cotações conhecidas.

### 5.6 Frescor e confiança

Absorver do Quanto:

- item manual possui `saldo_confirmado_em` ou equivalente;
- saldos antigos recebem estado de frescor;
- o resumo apresenta frescor por instituição e total;
- histórico e score indicam confiança dos dados;
- nenhum cálculo deve fingir precisão quando a base estiver desatualizada.

## 6. Conflitos encontrados

### 6.1 Quanto simplifica demais o domínio

O Quanto unifica catálogo e posição numa tabela `assets`. Isso não deve ser portado, pois impediria evolução consistente de cotações, aliases, fundos CVM e múltiplos usuários com o mesmo instrumento.

### 6.2 A raiz não representa instituição da posição com clareza

A raiz possui catálogo, corretoras e plataformas, mas `patrimonio_itens` não expõe uma instituição/custodiante direta. Essa lacuna prejudica agrupamento, frescor e importação.

### 6.3 Valor investido e valor atual estão ambíguos

`preco_medio_brl`, `quantidade` e `valor_atual_brl` não bastam para todos os ativos manuais, fundos, previdência, poupança, bens e dívidas. A regra de cálculo deve ser explícita por modo de avaliação.

### 6.4 Legacy contém decisões incompatíveis

Há documentos antigos que recomendam transformar Quanto no produto principal, remover multiusuário, Vera, score, admin e telemetria. Essas decisões estão revogadas.

### 6.5 Documentação e nomenclatura estão defasadas

Ainda existem nomes `Esquilo Invest`, `ei-raiz`, `@ei/*` e domínios antigos. A mudança de nome não deve quebrar runtime, mas precisa de plano de normalização técnica.

## 7. Regras de consolidação

1. Não copiar pastas completas de `_legacy`.
2. Não importar código legacy pelo runtime.
3. Não criar segunda tabela para o mesmo conceito.
4. Não criar novo cálculo financeiro antes de localizar o cálculo canônico.
5. Toda regra absorvida precisa de teste de caracterização.
6. Toda mudança de schema precisa de migration incremental; nunca reaplicar `100_rebuild_canonical.sql` em produção.
7. Toda leitura de usuário deve filtrar por `usuario_id`.
8. Vera e simulações só consomem contratos do domínio patrimonial.
9. O deploy deve falhar com typecheck, build ou testes quebrados.
10. Nenhuma nova feature visual tem prioridade sobre confiabilidade dos dados.

## 8. Plano por ondas

### Onda 0 — estabilização obrigatória

- remover `continue-on-error` do typecheck;
- executar testes de backend e domínio no CI;
- restaurar jobs e ingestões pausados;
- adicionar observabilidade e não engolir erros de cron;
- separar ambientes e revisar secrets;
- decidir privacidade/licença do repositório.

### Onda 1 — contrato patrimonial canônico

- documentar fórmula de saldo por tipo e modo de avaliação;
- adicionar instituição/custodiante ao item patrimonial;
- adicionar valor investido total quando necessário;
- adicionar confirmação/frescor de saldo manual;
- formalizar status e lifecycle;
- criar testes de soma, arredondamento, isolamento e fallback de cotação.

### Onda 2 — importação e movimentos

- unificar importadores;
- tornar lotes idempotentes;
- manter artefato bruto e linhas revisadas;
- impedir duplicidade de ativo e movimento;
- formalizar compra, venda, aporte, retirada, ajuste e transferência.

### Onda 3 — histórico e confiança

- reconstrução determinística;
- snapshot mensal idempotente;
- indicação de confiabilidade;
- comparação antes/depois de correções retroativas;
- frescor por instituição na Home e Carteira.

### Onda 4 — diagnóstico e Vera

- garantir que score e Vera consumam apenas contratos canônicos;
- remover cálculos duplicados do frontend e de `decisoes`;
- adicionar explicabilidade e origem dos dados;
- degradar com segurança quando IA ou mercado estiverem indisponíveis.

### Onda 5 — encerramento dos legados

Para cada pasta legacy, registrar funcionalidades como absorvidas, descartadas ou substituídas. Depois congelar `_legacy` e impedir alterações por CI ou CODEOWNERS.

## 9. Critérios de conclusão

A consolidação estará concluída quando:

- existir somente um cálculo para cada indicador;
- raiz for o único runtime e deploy;
- nenhuma dependência apontar para `_legacy`;
- toda funcionalidade relevante do Quanto estiver classificada (Vera removida do produto em
  2026-07-26, ver §11.3 — critério não se aplica mais);
- patrimônio da Home, Carteira, Histórico e Score derivar da mesma fonte;
- testes cobrirem isolamento por usuário e cálculos financeiros;
- jobs críticos estiverem operacionais e observáveis;
- documentação antiga conflitante estiver marcada como revogada.

## 10. Prioridade imediata

Não iniciar nova migração de tela. O próximo trabalho deve ser a Onda 0 e, em paralelo, a especificação executável da Onda 1. O produto já possui interface suficiente; falta garantir que todos os números exibidos tenham uma única origem e uma regra verificável.

## 11. Onda 5 — Inventário e encerramento de `_legacy` (issue #115)

Atualizado em: 2026-07-26. **Status: em andamento, não concluído.** Reconfirmado por grep que
`apresentacao/src`, `servidores` e `bibliotecas` não importam nada de `_legacy` (nenhuma
ocorrência da string `_legacy` fora da própria pasta).

Cobertura desta rodada: **v1** e **vera-insights** inventariados por completo, item a item.
**v2, bridge e quanto ainda não foram inventariados** — ver §11.5. Não fechar #115 até os cinco
legados estarem cobertos e `_legacy` estar congelado.

### 11.1 `_legacy/v1` — Esquilo Invest (Google Apps Script, dashboard estático)

546 KB, 21 arquivos. HTML/CSS/JS servido via `doGet()` do Apps Script, lendo abas de uma planilha
Google (`Dashboard`, `Acoes`, `Pré-Ordens`, `Fundos`, `Previdência`, `Recomendações`, `Aportes`) e
com IA (ChatGPT/Gemini) para análise textual. Não executa ordens (nunca simulou compra/venda real).

| Item | Classificação | Destino / evidência |
|---|---|---|
| Consolidação por categoria (Ações/Fundos/Previdência) com totais | Absorvido | `patrimonio_itens` + `vw_patrimonio_alocacao`, endpoint `GET /api/patrimonio/resumo` |
| Ghost mode (ocultar valores sensíveis sem alterar dado em memória) | Absorvido | `apresentacao/src/components/base/ValorOcultavel.jsx` + `context/ModoVisualizacaoContext.jsx`, usado em Home/Carteira/Insights/Histórico |
| Manifest PWA + ícones iOS/Android (`manifest.webmanifest`, apple-touch-icon) | Absorvido | `apresentacao/vite.config.ts` (`VitePWA`) + `apresentacao/public/manifest.webmanifest` próprio |
| Ícone de instituição por lista hardcoded (Ion/Itaú/XP) | Descartado | Contraria regra de núcleo único sem hardcode de marca; raiz usa `corretoras` como tabela, não constante de código |
| Score de portfólio: pilar de **diversificação por nº de instituições distintas** | Substituído | `calculos/score.ts` usa nº de classes de ativo (`numeroClassesAlocadas/5`), não nº de instituições — decisão já tomada na Onda 1, não é gap |
| Score de portfólio: pilar de **performance** (retorno acumulado) e **consistência de aportes** | Substituído | `calculos/score.ts` pilar "disciplina" (razão aporte/renda) cobre consistência; performance de carteira vive em `calculos/rentabilidade.ts`, fora do score — separação intencional |
| Score de portfólio: **concentração máxima em um único ativo** (`maxShare`) e **saúde por % de posições negativas** | **Pendente** | Ausente na raiz — nem `score.ts` nem `alocacao.ts` calculam concentração por ativo individual (só por classe) ou proporção de posições no vermelho. Candidato a evolução do pilar "diversificação" de `calculos/score.ts` quando Insights for revisado. Não implementado nesta sessão — sem necessidade confirmada, ver regra "não criar feature sem necessidade real" |
| Perfil gamificado "Squad" (Conservador/Balanceado/Agressivo) + "Nível" 1-10 | Descartado | Linguagem de gamificação de v1, incompatível com a marca atual; perfil de investidor real já existe em `perfis_financeiros` |
| Alertas de risco (stop-loss atingido, queda >5%/15%, concentração) | **Pendente** | Não existe conceito de alerta/aviso na raiz hoje (nem tabela, nem view, nem endpoint). Mesma lacuna do item de concentração acima — candidato a feature de Insights, não criar agora |
| Recomendação tática por ativo (Vender/Revisar/Monitorar/Manter) | Descartado | Sugestão de trade individual está fora do escopo do produto (consolidação patrimonial, sem execução de ordens) — mesma limitação que v1 já declarava no seu próprio README |
| IA lendo todas as abas da planilha em texto bruto no prompt | Descartado | Prática abandonada — PR #168 (contexto financeiro canônico) proíbe explicitamente a IA de receber ou recalcular dados brutos; usa resumo estruturado e versionado |
| Chart URL para Google Finance por ticker | Descartado | Raiz tem provedor de cotação próprio (BRAPI) via `dominios/mercado/provedores/brapi.ts`, sem necessidade de link externo |
| Auto-refresh do dashboard a cada 60s | Apenas referência | Sem gap funcional relevante hoje; não avaliado como prioridade |

### 11.2 `_legacy/vera-insights` — motor Vera standalone (React/Express/Cloudflare Workers)

1.1 MB, 77 arquivos. Protótipo de assistente financeiro com motor determinístico
(`src/lib/vera/`, `src/lib/esquilo/`) e cascata de provedores de IA (Cloudflare AI → OpenAI →
Gemini → Claude → fallback de regras). Relevância direta: é a origem conceitual do domínio
`decisoes/vera` ativo hoje na raiz, hoje afetado pela decisão de descontinuar a Vera como produto
(ver fechamento de #114).

| Item | Classificação | Destino / evidência |
|---|---|---|
| `VeraCoreEngine.calculateDebtPressure` (pressão de dívida: serviço mensal + dívida cara/patrimônio líquido) | **Pendente** | Ausente na raiz. `calculos/score.ts` tem pilar "endividamento" com fórmula mais simples (dívida/patrimônio bruto). Candidato a evolução do pilar, não a novo cálculo paralelo — não implementado |
| `VeraCoreEngine.calculateLiquidityAdequacy` (ativos líquidos / despesa × meses-alvo) | Substituído | `calculos/score.ts` pilar "proteção" já cobre o mesmo conceito (reserva em meses de renda) |
| `VeraCoreEngine.evaluateGoals` (viabilidade de meta via PMT financeiro) | **Pendente** | Nenhum motor de cálculo real para metas/simulações na raiz — confirma o gap já flagueado no PR #168 ("Fora de escopo... 5 motores de cálculo é escopo novo, não decidido sozinho"). Não construir agora — já está registrado como decisão pendente do Luiz |
| `PortfolioAnalysis`: concentração via índice de Herfindahl, risco 0-100 por perfil, retorno esperado/volatilidade/Sharpe, drift de alocação | **Pendente** | Ausente na raiz. `calculos/alocacao.ts` só calcula peso % por classe, sem concentração (Herfindahl), risco ou Sharpe. Mesma lacuna dos itens de concentração/alerta de v1 (§11.1) — não duplicar issue, é o mesmo gap visto por duas gerações diferentes |
| `RecommendationEngine`, `NarrativeGenerator`, `GoalsNarrative` (texto gerado por regras, sem IA) | Descartado | Específico da UX de companion contínuo da Vera standalone; produto Vera descontinuado (decisão do Luiz). O princípio de "fallback determinístico sem IA" já foi absorvido de forma equivalente e mais simples no PR #168 |
| Cascata de 4 provedores de IA (Cloudflare → OpenAI → Gemini → Claude) | Descartado | Raiz usa só o binding `AI` (Cloudflare Workers AI) com fallback determinístico único — decisão consciente de simplicidade operacional, não uma lacuna |
| Behavioral tracking (`vera_behavioral`: aceito/ignorado/adiado/completo por recomendação) | Descartado | Específico do loop de acompanhamento contínuo da Vera como companion — produto descontinuado, sem consumidor no domínio atual |
| `vera_snapshots` / `vera_monthly_trend` (histórico de score) | Substituído | `patrimonio_scores` + `patrimonio_historico_mensal` (idempotente, canônico) já cobrem histórico de score/patrimônio |
| `vera_cache` / `vera_data_audit` (cache com TTL de dados externos + auditoria de frescor) | Substituído | `ativos_cotacoes_cache` (D1) + KV cache (`infra/cache.ts`) na raiz |
| `BrapiClient`, `CvmClient`, `FipeClient` próprios | Substituído | `dominios/mercado/provedores/{brapi,cvm,fipe}.ts` |
| Endpoint único `/api/analyze` retornando recomendação de compra/venda/troca por ativo | Descartado | Sugestão de trade individual fora do escopo do produto (mesma decisão do item equivalente em v1) |
| `src/lib/studio/` (renderer.ts, store.ts) | Apenas referência | Sandbox de prototipagem visual, não avaliado em profundidade — sem sinal de valor de produto |
| `.wrangler/state`, `esquilo_master_pack.zip`, `server.log`, scripts `test-*.sh`/`test-*.ts` na raiz do pacote | Descartado | Artefatos operacionais do protótipo, sem valor de produto ou histórico |

### 11.3 `_legacy/v2` — Esquilo Invest v2 (Apps Script + BigQuery + app mobile Flutter)

8.5 MB, 160 arquivos. Segunda geração do mesmo produto de v1 (mesma base Apps Script/Planilha),
mas com Decision Engine mais elaborado, previdência e pré-ordens como categorias próprias,
sincronização estruturada com BigQuery e uma tentativa de app mobile nativo em Flutter
(`mobile_app/`) além de um frontend Cloudflare separado (`frontend/cloudflare/`). Ver
`docs/functional/functional_overview_legacy.md` e `docs/technical/technical_overview_legacy.md`
para a descrição completa do runtime.

| Item | Classificação | Destino / evidência |
|---|---|---|
| Consolidação por categoria (ações, fundos, previdência, pré-ordens, aportes) com Decision Engine (score, ranking, plano de ação, alertas) | Absorvido | Mesmo padrão já coberto em v1 (§11.1) — `patrimonio_itens`, `vw_patrimonio_resumo`, `calculos/score.ts`. Previdência já é tipo de `patrimonio_itens` (`tipo = 'previdencia'`) |
| Pré-ordens (ordem tática planejada, não executada: tipo, ativo, quantidade, preço-alvo, validade) | Descartado | Fora do escopo do produto — consolidação patrimonial sem simulação de ordem de compra/venda futura, mesma decisão já tomada para recomendação tática em v1/vera-insights |
| App mobile nativo em Flutter (`mobile_app/lib/`: dashboard, categoria, detalhe de holding, tema próprio) | Descartado | Stack incompatível — o épico #116/#117 já decidiu Android nativo em **Kotlin/Jetpack Compose**, não Flutter. Sem valor de porte de código, só de referência de fluxo (ver item de UX abaixo) |
| Fluxo de dashboard mobile: abas Home/Portfolio/Intelligence/Profile, ring de alocação, cards táticos | Apenas referência | UX offline-first de app nativo é relevante para #117/#120 (Home/Carteira/Detalhe/Histórico locais), mas como inspiração de fluxo, não código — Flutter não é portável para Compose |
| Sincronização com BigQuery por aba (leitura/escrita por tabela, compatibilidade por nome de cabeçalho) | Descartado | Sem consumidor no produto atual; a raiz não tem pipeline de BI externo e a direção do produto (épico #116) é local-first, não data warehouse |
| Exportação/importação CSV e exportação PDF do dashboard | **Pendente** (documentado como stub incompleto no próprio legado) | Raiz não tem exportação PDF de patrimônio. Importação (CSV/XLSX/OFX) já é escopo explícito de #119. Exportação PDF sem issue aberta hoje — não implementado |
| `Rebranding/` (tentativa de extrair frontend Apps Script para Cloudflare Pages estático) | Apenas referência | Precursor direto do que virou `_legacy/bridge` (ver §11.4) — mesma tentativa de migração, mais completa lá |
| Frontend HTML único acoplado ao backend Apps Script (`google.script.run`) | Descartado | Arquitetura incompatível com o runtime atual (React/Vite + Workers) — decisão já registrada em `docs/20_product/o_que_manter_do_legado.md` do próprio bridge (§11.4): "não manter Apps Script como base nova" |
| `docs/Critica e Decisoes.md`, `docs/Arquitetura e Fluxos.md` (autocrítica arquitetural da própria geração v2) | Apenas referência | Material de processo, sem funcionalidade de produto a extrair |

### 11.4 `_legacy/bridge` — pacote de migração Apps Script → Cloudflare/D1

6.3 MB, 564 arquivos — majoritariamente documentação de processo (`docs/`, 18 subpastas) mais três
starters de código nunca produtivizados (`04_STARTER_BACKEND/`) e um pacote `OLD/` com material
ainda mais antigo. É a tentativa mais madura, entre os legados, de planejar a própria migração para
o que hoje é a raiz — vale mais pelas decisões de produto registradas em `docs/product/` e
`docs/20_product/` do que pelo código.

| Item | Classificação | Destino / evidência |
|---|---|---|
| `docs/20_product/o_que_manter_do_legado.md` — lista curada do que preservar (home, carteira por categoria/ativo, detalhe, score, alertas, plano de ação, IA, histórico, preview antes de persistir importação) | Absorvido | Todos os itens dessa lista já existem na raiz, exceto alertas (ver linha própria abaixo) e plano de ação (ver linha própria abaixo) |
| `esquilo_extraction_engine` — extração de lançamentos de extrato/documento via IA com schema JSON estrito (`document`, `entries[]`, confiança, `sourceTrace`, múltiplos `parserMode`) | **Pendente, sem issue aberta** | Import da raiz (`patrimonio/importacoes`) e o escopo de #119 cobrem CSV/XLSX/OFX processados no aparelho, mas nenhum cobre extração assistida por IA de documento (PDF/imagem de extrato). Funcionalidade de valor real não coberta hoje — sinalizado, não implementado nem virou issue |
| `docs/product/alerts_and_notifications_mvp.md` — alertas com condição objetiva (queda de ativo, fundo abaixo do CDI, concentração >50%, falta de aporte), canal Telegram/e-mail, IA só traduz texto | Pendente | Mesma lacuna de v1/vera-insights (alerta de risco, §11.1/§11.2) — hoje coberta pelo escopo de **#128** (alertas locais), que já inclui concentração, dívida e perda relevante. Não duplicar: é o mesmo gap, agora com issue |
| `docs/product/goal_engine_rules.md` — motor de metas determinístico (aporte × meses × fator de rendimento por perfil, camadas por "maturidade") | Pendente | Mesmo gap de `VeraCoreEngine.evaluateGoals` já registrado em §11.2 — hoje coberto pelo escopo de **#127** (simulações locais). Não duplicar |
| `docs/product/score_and_profile_rules.md` — score com pilar extra "adequação à realidade" (cruza `toleranciaRisco`/renda do perfil com a composição real da carteira, penaliza incoerência) | **Pendente, sem issue aberta** | `calculos/score.ts` da raiz tem 4 pilares (disciplina, proteção, diversificação, endividamento) calculados só a partir do patrimônio — nenhum pilar cruza o resultado com `perfis_financeiros.toleranciaRisco`/objetivos para penalizar desalinhamento. Mais próximo do escopo de **#126** (diagnósticos determinísticos), mas #126 não menciona explicitamente esse cruzamento perfil×carteira — sinalizado, não uma issue existente |
| `docs/product/maturity_points_rules.md` — pontuação 0-3 de "prontidão" do usuário (organização, consistência de aporte, coerência da carteira), usada para liberar complexidade de metas gradualmente | **Pendente, sem issue aberta** | Sem equivalente na raiz. Documento é explícito que "não é gamificação" — é regra de personalização de UX. Relevante apenas se/quando #127 (simulações) for implementado, como forma de não expor complexidade cedo demais — não é bloqueio, só contexto para quando a issue for trabalhada |
| `docs/product/bonus_and_engagement_rules.md` — feedback contextual sem pontos/ranking (destaque de consistência de aporte, evolução de score, correção de risco) | Descartado | UX de reforço positivo pontual, sem modelo de dados associado — baixo valor isolado; se recriado, nasce como copy dentro de Insights, não como feature de backend |
| `resumo.acaoPrioritaria` / `resumo.insightPrincipal` em `Insights.jsx`/`InsightsMobile.jsx` (campo já existe no frontend, mas `composirResumoCanonico` sempre preenche como `null`) | **Achado nesta sessão, fora do escopo de `_legacy`** | Não é gap de legado — é código morto na raiz: a UI já tem layout pronto para "plano de ação prioritário" citado como valor a manter em `o_que_manter_do_legado.md`, mas o backend nunca alimenta esse campo. Documentado aqui porque apareceu durante a auditoria; não corrigido nesta sessão (fora do escopo de #115) |
| `database/d1/schema.sql`, `packages/contracts/`, `backend/modules/*_service.ts` (users, portfolios, positions, imports, snapshots, analyses/insights) | Substituído | Mesmo modelo de domínio, já implementado e mais maduro na raiz (`patrimonio_itens`, `patrimonio_aportes`, `patrimonio_historico_mensal`, `decisoes_simulacoes`) |
| `OLD/` (pacotes de prompt para Codex, boards visuais, banco legado, mocks) | Descartado | Material de processo de uma migração que não aconteceu como planejada ali — sem funcionalidade de produto isolada a extrair além do que já está nas linhas acima |

### 11.5 `_legacy/quanto` — consolidação patrimonial enxuta (Cloudflare Workers + Hono + D1)

6.3 MB, 228 arquivos. Já tem síntese em nível de matriz nas §§3-6 deste documento (fonte da decisão
de absorção seletiva da Onda 1, #111). Esta seção fecha o inventário item a item exigido por #115,
sem repetir o que §§3-6 já registraram.

| Item | Classificação | Destino / evidência |
|---|---|---|
| CRUD de ativo com saldo manual (previdência, cofrinhos, poupança) + cotação automática (BRAPI/CVM) | Absorvido | `patrimonio_itens` (`origem = 'manual'` vs. vinculado a `ativo_id`) + `dominios/mercado/provedores/{brapi,cvm}.ts` — Onda 1 |
| Lifecycle de ativo (`asset_lifecycle_events`: iniciar saída, cancelar saída, concluir venda) | Absorvido | `patrimonio_itens.lifecycle_status` (`ativo`, `em_resgate`, `em_saida`, `vendido`, `encerrado`, `arquivado`) — migration `105_lifecycle_e_custodia_patrimonial.sql`, PRs #163/#164 |
| Custódia/instituição por posição (`institution_name` livre no Quanto) | Absorvido | `patrimonio_itens.corretora_id` → `corretoras`, mesma migration `105` — fecha o gap descrito em §6.2 deste documento |
| Snapshot mensal automático (cron dia 1) | Absorvido | `patrimonio_historico_mensal` + `jobs/historico-mensal.job.ts` (cron `0 3 * * *`) |
| Import de planilha XLSX (wizard upload → parse → revisão → confirmar) | Absorvido | `patrimonio/importacoes` (`POST /api/patrimonio/importacoes` + `.../confirmar`), fluxo idempotente — migration `101_importacoes_idempotentes.sql` |
| Ocultar valores (privacidade em público) | Absorvido | `ModoVisualizacaoContext.jsx` + `ValorOcultavel.jsx`, já citado em §11.1 |
| **Frescor por instituição** (indicador de quando cada saldo manual foi confirmado pela última vez, por instituição) | **Pendente — não confirmado como absorvido, ao contrário do que o histórico da sessão anterior presumia** | Verificado nesta sessão: não existe coluna equivalente a `saldo_confirmado_em`/timestamp de confirmação manual em `patrimonio_itens` (só `atualizado_em`, genérico, que muda a cada edição de qualquer campo — não é "usuário confirmou que o saldo ainda está correto"). O que **foi** absorvido na Onda 1 é outra coisa: frescor do **resumo/score** (PR #145, `contexto-financeiro.ts`, `sem_dados/parcial/defasada/atual`) e frescor de **cotações** (PR #146). Granularidade por item/instituição não tem equivalente hoje. Mais próximo do escopo de #126 (diagnósticos: "detectar dados antigos, incompletos"), mas não é um item explícito lá — sinalizado, sem issue própria |
| `macro_cache` (SELIC, CDI, IPCA-12m via BRAPI, cron) | **Pendente, sem issue direta** | Sem equivalente na raiz — nem tabela nem endpoint de indicadores macro. Mais próximo de **#124** (distribuir catálogos/cotações públicas, que já cita "indicadores aprovados" no escopo), mas #124 não nomeia SELIC/CDI/IPCA explicitamente — sinalizado como candidato, não decidido |
| `POST /api/import/analyze` (classificação de linha de importação via IA, degradável) | **Pendente, mesmo padrão de `_legacy/bridge`** | Mesmo gap do `esquilo_extraction_engine` (§11.4) — classificação/extração assistida por IA no fluxo de importação. Um único achado visto em duas gerações diferentes, não dois separados |
| `POST /api/ai/analyze` (análise contextual textual via IA sobre o patrimônio) | Descartado | Equivalente funcional da Vera/`decisoes/vera`, removida do produto nesta sessão (§11.6) — mesma decisão se aplica |
| Anti-escopo explícito do Quanto (`CLAUDE.md` do legado): sem proventos/dividendos/IR/come-cotas, sem metas/rebalanceamento/recomendações, sem Open Finance, sem push, sem simuladores, sem chatbot generalista | Apenas referência | Registra uma tensão de produto: o Quanto decidiu conscientemente **não** ter metas/simuladores/alertas, enquanto o épico #116 (#127 simulações, #128 alertas) vai na direção oposta. Não é gap a preencher — é contexto para quem for implementar #127/#128 saber que já houve uma decisão consciente em sentido contrário numa geração anterior, e por quê (produto enxuto, "faz uma coisa bem") |
| `legacy/ei-raiz-reference/` (cópia congelada do Esquilo Invest dentro do próprio Quanto) | Descartado | Cópia de um legado dentro de outro legado — sem valor adicional além do que já está em `_legacy/v1`/`_legacy/v2` |
| Dark mode automático (`prefers-color-scheme`) | **Pendente, sem issue direta** | Raiz não tem dark mode hoje (só tema claro). Baixo custo, sem issue aberta cobrindo tema — sinalizado |

### 11.6 Vera removida do produto (executado em 2026-07-26)

Atualização de 2026-07-26: a decisão registrada abaixo (histórico, sessão anterior) mudou de
"manter o domínio ativo sobre dados canônicos" para **remoção completa**, autorizada explicitamente
pelo Luiz. Executado nesta sessão:

- Backend: rota `POST /api/decisoes/vera/mensagens` removida de `decisoes.rotas.ts`; método
  `servicoDecisoes.veraEnviarMensagem` (e os helpers exclusivos `montarPromptSistema`,
  `respostaDeterministica`, `moeda`) removidos de `decisoes.servico.ts`; binding `AI` removido de
  `Env` (`infra/bd.ts`) — não estava configurado em `wrangler.toml`, então a IA sempre operava em
  fallback determinístico em produção.
- `contexto-financeiro.ts` (cálculo puro de confiança/versão do resumo patrimonial, criado no PR
  #168) **mantido** — é consumido por `decisoes.servico.criar` (simulações), não só pela Vera.
- Frontend: hook `useVeraEvaluation` (no-op desde a sessão anterior) deletado, junto com toda
  ramificação condicional `veraPayload`/`veraSections` em `Insights.jsx` e `InsightsMobile.jsx` —
  as telas agora renderizam só o fallback (resumo canônico), que já era o único caminho real em
  produção. Cliente HTTP `enviarMensagemVera` removido de `cliente-api/decisoes.ts` (sem
  consumidor).
- Contratos: `VeraMensagemEntrada`/`VeraMensagemSaida` removidos de `bibliotecas/contratos/decisoes.ts`.
  `ConfiancaContextoFinanceiro` mantido (usado por simulações).
- Banco: nenhuma tabela/coluna exclusiva de Vera existia no schema canônico (confirmado por grep
  em `infra/banco/migrations/`) — sem migration de remoção necessária.
- Testes: `decisoes.servico.test.ts` — os 6 testes de `veraEnviarMensagem` removidos; mantido o
  teste de `criar` (simulação com contexto financeiro).

Decisão original (contexto, sessão anterior), preservada como histórico:

O domínio `decisoes/vera` vivo hoje em `servidores/porta-entrada/src/dominios/decisoes/` **não foi
tocado, removido ou marcado como legado** nesta sessão — a decisão do Luiz é que a Vera é
descontinuada **como produto**, não uma instrução para desmontar o código ativo. Essa decisão de
arquitetura (o que fazer com `decisoes/vera` daqui para frente) já está fora do escopo mecânico
desta issue e cabe ao Luiz decidir quando quiser, conforme registrado no fechamento de #114.

### 11.7 Padrão que se repete entre gerações

- **Concentração de risco (por ativo ou por Herfindahl) e alerta de risco**: v1, vera-insights e
  bridge, de formas diferentes, tinham esse conceito e a raiz não tem hoje. Mesma lacuna vista três
  vezes, não achados separados — hoje coberta pelo escopo de **#126** (diagnósticos) e **#128**
  (alertas locais), que nasceram depois desta auditoria começar e já fecham a lacuna com issue.
- **Motor de metas/simulação determinístico** (PMT financeiro): vera-insights (`evaluateGoals`) e
  bridge (`goal_engine_rules.md`) descreveram o mesmo motor de duas formas diferentes. Coberto por
  **#127** (simulações locais).
- **Extração/classificação de lançamento assistida por IA**: bridge (`esquilo_extraction_engine`,
  PDF/imagem de extrato) e quanto (`POST /api/import/analyze`) descrevem a mesma capacidade em dois
  produtos diferentes. **Sem issue aberta cobrindo isso hoje** — sinalizado uma única vez em §11.4
  e §11.5, não duas.
- **Companion de IA sobre o patrimônio** (Vera standalone, `/api/analyze` de v1/v2, `/api/ai/analyze`
  do Quanto): três gerações chegaram à mesma ideia por caminhos diferentes; a raiz teve sua versão
  (`decisoes/vera`) descontinuada e removida nesta sessão (§11.6) — decisão do Luiz, não lacuna.

### 11.8 Fechamento da Onda 5 — cinco legados inventariados, `_legacy` congelado

Cobertura completa: `_legacy/v1` e `_legacy/vera-insights` na sessão anterior (PR #169); `_legacy/v2`,
`_legacy/bridge` e `_legacy/quanto` nesta sessão (§§11.3-11.5). Vera removida do produto nesta sessão
(§11.6, PR #170).

Itens sinalizados como **pendentes sem issue aberta** (não decididos, não implementados, registrados
para o Luiz/Claudete avaliarem quando fizer sentido):
- Extração/classificação de lançamento assistida por IA no fluxo de importação (§11.4, §11.5).
- Pilar de score "adequação à realidade" (cruzar `toleranciaRisco`/perfil com a composição real da
  carteira) (§11.4).
- "Maturity points" — pontuação de prontidão do usuário para liberar complexidade de metas
  gradualmente (§11.4), relevante só quando #127 avançar.
- Frescor por instituição em nível de item (quando cada saldo manual foi confirmado) — granularidade
  hoje ausente, distinta do frescor de score/cotação já absorvido (§11.5).
- Indicadores macro (SELIC/CDI/IPCA) (§11.5), candidato a entrar no escopo de #124.
- Exportação de patrimônio em PDF (§11.3).
- Dark mode (§11.5).
- `resumo.acaoPrioritaria`/`resumo.insightPrincipal` nunca preenchidos pelo backend — código morto
  na raiz encontrado durante a auditoria, não um gap de legado (§11.4).

Nenhum desses itens virou issue nesta sessão — critério do Luiz: "se for algo valioso sem issue
nenhuma cobrindo, sinalize claramente no documento... criar issue nova é decisão da Claudete, não
sua".

`_legacy` congelado nesta sessão: ver `_legacy/README.md`.
