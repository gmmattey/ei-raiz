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
- toda funcionalidade relevante do Quanto e Vera estiver classificada;
- patrimônio da Home, Carteira, Histórico, Score e Vera derivar da mesma fonte;
- testes cobrirem isolamento por usuário e cálculos financeiros;
- jobs críticos estiverem operacionais e observáveis;
- documentação antiga conflitante estiver marcada como revogada.

## 10. Prioridade imediata

Não iniciar nova migração de tela. O próximo trabalho deve ser a Onda 0 e, em paralelo, a especificação executável da Onda 1. O produto já possui interface suficiente; falta garantir que todos os números exibidos tenham uma única origem e uma regra verificável.
