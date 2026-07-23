# Integração do Codex com D1 e Adaptação do AppsScript

## Objetivo do documento

Explicar como o Codex deverá atuar sobre a nova integração com o banco D1 e quais adaptações precisam acontecer no sistema atual para permitir uma transição segura, gradual e sustentável.

Este documento não redesenha o banco e não propõe reescrita total do backend.
O foco aqui é orientar a transição entre a comunicação atual do sistema e a nova base estruturante em Cloudflare D1.

Este material deve servir como base de implementação para o Codex, reduzindo risco de mudanças cegas, quebra de fluxos legados e criação de arquitetura inventada.

Critério de leitura deste documento:

- **Fato**: ponto sustentado pela documentação atual, pelo código existente ou pelos artefatos já produzidos.
- **Inferência**: conclusão técnica razoável a partir do que já existe.
- **Hipótese**: ponto ainda dependente de validação antes de implementação mais forte.

## Contexto atual da comunicação

### Visão geral atual

**Fato**

O sistema atual roda sobre Google Apps Script com interface HTML e fluxo legado fortemente apoiado em três camadas de dados:

- planilha operacional Google Sheets
- BigQuery
- lógica de leitura e consolidação dentro do próprio AppsScript

Pelos materiais atuais, o AppsScript continua sendo o backend de execução do dashboard e do endpoint mobile. Ele entrega HTML, expõe payload JSON para o app mobile e concentra a orquestração da leitura, consolidação, decisão e resposta da IA.

### Como o AppsScript se comunica hoje com os dados

**Fato**

Hoje a comunicação funciona assim:

- `Backend_Core.gs` orquestra o carregamento do dashboard
- `BigQueryService.gs` atua como fonte principal de leitura e escrita operacional
- `Sheet_Readers.gs` mantém compatibilidade com o contrato histórico e funciona como fallback e camada de normalização
- a planilha operacional continua aberta por `SpreadsheetApp.openById(...)` para fallback, cache de mercado, histórico de decisão e rotinas administrativas
- `BigQuery_Sync.gs` ainda existe como utilitário de push/pull tabular entre planilha e BigQuery

Em termos práticos, isso significa que o AppsScript hoje não conversa com uma única fonte simples e limpa. Ele convive com leitura estruturada via BigQuery e, ao mesmo tempo, preserva dependências relevantes de planilha.

### Onde entram planilhas

**Fato**

A planilha operacional ainda tem papel real no sistema atual. Ela não é apenas legado morto.

Ela continua sendo usada para:

- fallback do dashboard quando BigQuery falha
- cache de mercado
- histórico leve de decisão
- base administrativa para sync
- estrutura de abas que ainda sustenta parte do contrato esperado pelo AppsScript

**Inferência**

Isso cria forte acoplamento com nomes de abas, cabeçalhos e aliases legados. Mesmo quando a fonte principal é BigQuery, parte da lógica continua assumindo a estrutura histórica da planilha.

### Onde entra BigQuery

**Fato**

O BigQuery já é tratado como fonte principal do dashboard na arquitetura mais recente. O serviço atual:

- lê tabelas operacionais como `acoes`, `fundos`, `previdencia`, `pre_ordens`, `aportes` e `app_config`
- expõe operações de leitura estruturada e CRUD controlado
- monta aliases para manter compatibilidade com o contrato esperado por `Sheet_Readers.gs`

**Inferência**

BigQuery hoje já funciona como ponte de transição entre o mundo tabular legado e uma estrutura mais organizada. Ele já representa um passo fora da planilha, mas ainda não resolve completamente o acoplamento porque o contrato da aplicação continua herdando semântica e nomes do legado.

### Fragilidades estruturais do cenário atual

**Fato**

Os materiais atuais apontam fragilidades claras:

- dependência forte de consistência entre cabeçalhos e leitores do AppsScript
- coexistência de modelos de execução diferentes entre backend standalone e sync bound à planilha
- `Dashboard.html` ainda muito grande e centralizado
- persistência parcial de lógica e compatibilidade por alias legados
- stubs ainda existentes em partes não migradas
- existência de chave Gemini hardcoded em parte da base atual

### Riscos de segurança

**Fato**

Existe pelo menos um risco explícito já documentado: presença de chave hardcoded em integração de IA.

**Inferência**

Além disso, quanto mais o AppsScript conhecer detalhes diretos de múltiplas fontes físicas, maior o risco de espalhar segredos, IDs de projeto, nomes de dataset, contratos de tabela e regras de acesso por vários arquivos. Isso aumenta custo de manutenção e risco operacional.

### Acoplamentos fortes hoje

**Fato**

Há acoplamento forte entre:

- AppsScript e estrutura física do BigQuery
- AppsScript e contratos herdados da planilha
- BigQueryService e aliases necessários para manter compatibilidade com o formato histórico
- regras do dashboard e payloads ainda presos ao contrato legado

**Inferência**

Esse modelo dificulta migração porque qualquer mudança estrutural no armazenamento tende a exigir ajustes simultâneos em vários pontos do AppsScript.

### Limitações atuais que impactam a migração

**Fato**

A migração não parte de um backend limpo e modular. Parte de um backend em funcionamento, com responsabilidades já distribuídas entre AppsScript, BigQuery e planilha.

**Inferência**

Por isso, a entrada do D1 não deve ser tratada como simples troca de banco.
Ela impacta:

- fonte de leitura
- estratégia de escrita
- contrato de compatibilidade
- camada de acesso a dados
- rastreabilidade de importação e snapshot

**Hipótese**

Enquanto não houver data mapping final consolidado e definição operacional fechada dos fluxos prioritários, qualquer tentativa de substituir BigQuery e planilha de uma vez tende a quebrar o que hoje ainda funciona.

## Objetivo da nova comunicação

### O que deve mudar com a entrada do D1

**Fato**

O D1 já foi definido como base estruturante da nova direção. O schema inicial foi modelado para suportar a evolução do produto com estrutura mais clara, menos dependente do contrato físico da planilha e mais adequada ao contexto Cloudflare.

**Inferência**

Com a entrada do D1, a comunicação deveria migrar gradualmente de:

- leitura baseada em tabelas legadas com aliases para contrato histórico
- fallback fortemente dependente de planilha
- múltiplos pontos de acesso a dados espalhados

ao invés disso, caminhar para:

- leitura e escrita a partir de uma camada mais centralizada
- menor dependência de estrutura tabular herdada
- separação mais clara entre armazenamento, adaptação e regra de negócio

### O que deve melhorar em estrutura, segurança e manutenção

**Inferência**

A nova comunicação com D1 deve melhorar principalmente estes pontos:

- **estrutura**: reduzir dependência de cabeçalho, alias e convenções herdadas de planilha
- **segurança**: evitar espalhar credenciais, detalhes físicos de banco e integrações sensíveis por vários pontos do AppsScript
- **manutenção**: diminuir o custo de alterar persistência sem reescrever toda a aplicação
- **clareza de fluxo**: deixar mais explícito quem lê, quem escreve, quem adapta e quem aplica regra de negócio
- **rastreabilidade**: melhorar capacidade de entender origem da importação, snapshots e eventos operacionais

### O que ainda pode permanecer temporariamente

**Fato**

A migração foi assumida como gradual e sem reescrita total do backend agora.

Por isso, ainda pode permanecer temporariamente:

- o AppsScript como backend funcional do dashboard e do endpoint mobile
- a planilha como apoio de contingência enquanto fluxos críticos não forem estabilizados no novo modelo
- partes do contrato legado enquanto a aplicação ainda depender dele
- mecanismos de compatibilidade para leitura, quando necessários para reduzir impacto imediato

### O que não deve continuar no médio prazo

**Inferência**

Mesmo numa migração progressiva, alguns padrões não devem continuar no médio prazo:

- dependência estrutural de planilha como base operacional principal
- aliases legados espalhados por múltiplos pontos da aplicação
- acesso direto da regra de negócio a detalhes físicos do banco
- coexistência indefinida de múltiplas fontes tratadas como equivalentes sem critério claro
- credenciais, IDs e detalhes sensíveis hardcoded no código

### Direção prática da nova comunicação

**Inferência**

A direção mais segura não é trocar tudo de uma vez. É criar uma transição em que o AppsScript deixe de conhecer aos poucos a estrutura física do legado e passe a depender de uma camada mais controlada de acesso a dados, preparada para conversar com o D1 como destino principal.

Isso reduz risco de quebra e cria espaço para evolução futura sem exigir reescrita imediata do sistema inteiro.

## Papel do Codex nesta etapa

### Regra central de atuação

O Codex não deve agir como se estivesse começando um sistema do zero.
Ele deve atuar sobre um sistema existente, com contratos já consumidos, comportamento em uso e partes legadas que ainda sustentam a operação atual.

### Como o Codex deve atuar

**Fato + diretriz operacional**

Nesta etapa, o Codex deve:

- ler a documentação principal antes de alterar código
- tratar o schema D1 já gerado como referência estrutural do destino
- respeitar que a migração é progressiva
- não romper fluxos atuais sem necessidade
- priorizar adaptações seguras, pequenas e reversíveis
- localizar dependências reais antes de propor refatorações maiores
- explicitar impactos quando a mudança tocar contrato, leitura ou escrita

### O que o Codex não deve fazer

**Diretriz operacional**

O Codex não deve:

- assumir reescrita completa do backend agora
- remover BigQuery, planilha ou compatibilidade de forma brusca
- espalhar acesso direto ao D1 por vários arquivos do AppsScript
- acoplar regra de negócio à estrutura física do novo banco
- criar componentes novos sem base suficiente no projeto
- substituir contratos atuais do frontend/mobile sem mapear impacto

### Prioridade correta do Codex

A prioridade não é “modernizar tudo”.
A prioridade é:

1. reduzir fragilidade
2. preparar a nova base
3. migrar fluxos prioritários
4. manter compatibilidade enquanto necessário
5. reduzir legado depois de validar a nova comunicação

### Como o Codex deve tratar fato, inferência e hipótese

Em propostas e implementações, o Codex deve separar:

- **fato**: ponto confirmado em código ou documentação
- **inferência**: recomendação sustentada pelo desenho atual
- **hipótese**: ponto dependente de validação antes de consolidar

Motivo: a transição ainda tem lacunas. Tratar hipótese como fato aumenta risco de adaptação errada.

## O que precisa mudar no AppsScript

### Ponto central da adaptação

O AppsScript hoje conhece demais a origem física dos dados.

Esse é o principal ponto que precisa começar a mudar.
A adaptação não exige desmontar o AppsScript inteiro, mas exige reduzir sua dependência direta de:

- estrutura física da planilha
- estrutura física do BigQuery
- aliases legados usados para sustentar contratos antigos

### Pontos que hoje dependem de planilhas

**Fato**

Hoje ainda dependem de planilha, total ou parcialmente:

- fallback de leitura do dashboard
- cache de mercado
- histórico de decisão
- rotinas administrativas de sync
- parte da normalização herdada da estrutura de abas e cabeçalhos

### Pontos que hoje dependem de BigQuery

**Fato**

Hoje o BigQuery é a fonte principal de leitura e escrita operacional por meio de `BigQueryService.gs`.
Isso afeta diretamente:

- leitura principal de ações, fundos, previdência, aportes e pré-ordens
- operações controladas de insert, update e delete
- montagem do contrato estruturado devolvido ao restante da aplicação

### Trechos que deverão passar a consumir nova camada de acesso a dados

**Inferência**

Os fluxos que mais claramente deveriam passar a consumir uma nova camada são:

- leitura principal da carteira para dashboard
- leitura usada pelo endpoint mobile
- operações controladas de CRUD operacional
- carregamento de snapshots e dados consolidados
- leituras analíticas persistidas, quando existirem

Motivo: são os pontos onde a origem dos dados precisa deixar de ser detalhe espalhado pelo código.

### O que pode ser mantido provisoriamente

**Fato + inferência**

Pode ser mantido provisoriamente:

- AppsScript como backend de orquestração
- fallback controlado para planilha, enquanto necessário
- parte do contrato atual devolvido ao frontend
- compatibilidades temporárias via mapeamento ou views quando reduzirem impacto

### O que precisa ser desacoplado

**Inferência**

Precisa começar a ser desacoplado:

- acesso direto da regra de negócio a tabelas físicas específicas
- dependência de aliases legados em várias camadas
- mistura entre normalização de dados e regra operacional
- conhecimento distribuído da origem física dos dados

### O que deve deixar de existir no futuro

**Inferência**

No futuro, deveria deixar de existir:

- AppsScript conhecendo detalhes de cabeçalho e compatibilidade herdada como regra principal
- BigQuery como ponte obrigatória se o D1 já estiver consolidado
- duplicação prolongada de adaptações para sustentar simultaneamente estruturas antigas
- fallback permanente baseado em estrutura frágil sem critério de desligamento

## Adaptações mínimas, intermediárias e futuras

### Adaptações mínimas

Mudanças pequenas e pragmáticas para começar a usar a nova base sem quebrar o funcionamento atual.

#### 1. Mapear os pontos reais de acesso a dados no AppsScript

Antes de trocar qualquer origem, o Codex deve localizar exatamente:

- onde o dashboard lê dados
- onde o mobile lê dados
- onde o CRUD escreve dados
- onde o fallback entra
- onde aliases legados são aplicados

Motivo: sem esse mapa, qualquer troca de origem fica cega.

#### 2. Criar uma camada inicial de acesso a dados sem desmontar a orquestração atual

Essa camada inicial pode começar simples.
O objetivo não é sofisticar. É concentrar acesso.

Motivo: reduzir a quantidade de pontos do AppsScript que precisam saber se a origem é planilha, BigQuery ou D1.

#### 3. Manter o contrato externo o mais estável possível no começo

O payload esperado por frontend e mobile não deve ser alterado sem necessidade imediata.

Motivo: migrar armazenamento e contrato externo ao mesmo tempo aumenta muito o risco.

#### 4. Tratar D1 primeiro como nova base estruturante, não como gatilho para refatoração total

A entrada do D1 deve começar pelos fluxos prioritários e mais controláveis.

Motivo: trocar tudo de uma vez sem consolidar leituras prioritárias tende a quebrar dashboard, mobile e rotinas administrativas.

### Adaptações intermediárias

Mudanças para reduzir dependência do legado, melhorar organização e preparar o terreno para uma comunicação mais limpa.

#### 1. Substituir gradualmente leituras operacionais hoje centralizadas no BigQuery

Depois que a camada inicial existir, o passo intermediário é mover leituras prioritárias para a nova base.

Motivo: BigQuery hoje é fonte principal, mas não é o destino estruturante definido para a evolução.

#### 2. Reduzir compatibilidade herdada para pontos realmente necessários

Compatibilidade deve ser ferramenta de transição, não camada permanente em tudo.

Motivo: compatibilidade demais vira dívida estrutural.

#### 3. Isolar melhor planilha e sync administrativo

Planilha e rotinas de sync devem ficar mais claramente separadas do fluxo principal do produto.

Motivo: reduz risco de a contingência continuar mandando mais do que deveria na arquitetura.

#### 4. Revisar responsabilidade de normalização

Parte da normalização hoje existe para sustentar o contrato histórico.
No estágio intermediário, isso precisa ser revisto para que o sistema normalize com foco no novo modelo, não apenas para imitar o legado.

### Adaptações futuras

Mudanças que fazem sentido depois que o D1 estiver consolidado e a camada antiga puder ser reduzida ou removida.

#### 1. Reduzir ou remover dependência operacional de BigQuery

Quando os fluxos principais estiverem estáveis sobre a nova base, BigQuery deve deixar de ser caminho central do produto.

#### 2. Reduzir planilha a papel residual ou encerrar seu uso operacional

Se contingência, cache e histórico já tiverem alternativas mais seguras, a planilha não deve continuar como eixo oculto do sistema.

#### 3. Revisar o papel do próprio AppsScript

Só depois da estabilização da nova base faz sentido discutir se o AppsScript continua como backend principal, como camada transitória ou como peça menor de compatibilidade.

## Nova camada de comunicação

### Direção recomendada

**Inferência**

A comunicação nova com o D1 não deveria ser feita por acesso direto espalhado dentro do AppsScript.
O caminho mais seguro é uma **camada intermediária de acesso a dados**.

Essa camada pode ser implementada de forma simples no início, mas precisa ter uma responsabilidade clara:

- concentrar leitura e escrita
- esconder detalhe físico da origem
- expor contratos previsíveis para o AppsScript
- permitir convivência temporária entre legado e nova base

### Acesso direto ou indireto

**Inferência**

Para esta etapa, a direção mais segura é **acesso indireto**.

Isso significa:

- o AppsScript não deveria conhecer o D1 em múltiplos pontos do código
- uma camada intermediária deveria conversar com o D1
- o restante do AppsScript deveria consumir essa camada, não o banco diretamente

Motivo: reduz acoplamento e torna a transição mais controlável.

### Endpoints, adapters, serviços ou wrappers

**Fato + inferência**

Já existe no projeto um padrão de serviços no AppsScript, como `BigQueryService.gs`.
Com base nisso, há sustentação para propor uma camada nova seguindo a mesma lógica de serviço/wrapper, sem inventar arquitetura extravagante.

A recomendação prática é:

- criar uma camada de acesso ao D1 em formato de serviço
- manter adaptação de contrato fora da regra de negócio principal
- evitar acesso direto ao D1 a partir de `Backend_Core.gs` e leitores de alto nível

### Como evitar hardcode de credencial

**Fato + diretriz operacional**

O projeto já tem histórico de risco com chave hardcoded.
A nova comunicação não deve repetir isso.

Por isso:

- credenciais e tokens não devem ser gravados diretamente no código
- detalhes sensíveis devem ficar em configuração segura, não em arquivos versionados
- o Codex não deve introduzir valores reais de segredo em implementação

### Como isolar responsabilidade de leitura e escrita

**Inferência**

A nova camada deveria separar, no mínimo:

- leitura operacional
- escrita operacional
- adaptação de compatibilidade
- tratamento de erro e rastreabilidade

Motivo: evita que leitura, escrita e transformação virem um bloco único difícil de substituir depois.

### Como reduzir acoplamento com a estrutura física do banco

**Inferência**

Para reduzir acoplamento, o Codex deve preferir:

- funções orientadas a domínio e não a tabela física
- centralização das queries em poucos pontos
- contratos retornados em formato estável para o restante da aplicação
- adaptação de nomes legados apenas na borda necessária

## Estratégia de convivência entre legado e nova base

### Como o AppsScript pode continuar funcionando enquanto a nova base entra

**Inferência**

O AppsScript pode continuar funcionando como orquestrador, desde que a origem dos dados seja trocada de forma progressiva e controlada.

Na prática, isso significa:

- manter os fluxos atuais ativos
- introduzir a nova camada de acesso
- migrar leitura e escrita por prioridade
- manter compatibilidade somente onde houver consumo real

### Quando faz sentido usar views de compatibilidade

**Fato + inferência**

Views de compatibilidade fazem sentido quando ajudam a preservar o contrato esperado pelo legado sem obrigar refatoração imediata do consumidor.

Elas são úteis quando:

- o AppsScript ainda espera nomes herdados
- a adaptação temporária evita mudanças simultâneas demais
- existe base suficiente para mapear com segurança os campos

Elas não são boas quando começam a esconder indefinidamente divergência entre modelo novo e modelo antigo.

### Quando faz sentido usar tabelas derivadas

**Hipótese controlada**

Tabelas derivadas só fazem sentido se houver necessidade operacional real de materializar leitura consolidada, snapshot ou apoio de transição.

Como não há documentação suficiente para institucionalizar isso agora, esse ponto deve ser validado antes de implementação forte.

### Riscos de manter os dois mundos por muito tempo

**Inferência**

Os principais riscos são:

- divergência entre origem antiga e nova
- duplicação de lógica de adaptação
- aumento de custo de manutenção
- dificuldade para saber qual fonte é a verdade operacional
- lentidão para desligar legado depois

### Caminho mais seguro para reduzir dependência do legado

**Inferência**

O caminho mais seguro é:

- primeiro centralizar acesso a dados
- depois migrar fluxos prioritários
- depois manter compatibilidade apenas no que ainda for consumido
- por fim desligar dependências antigas com validação explícita

## Impactos técnicos esperados

### Mudanças em leitura de dados

- troca gradual da origem principal de leitura
- necessidade de adaptação de contrato em pontos ainda legados
- revisão das funções que hoje assumem formato vindo de BigQuery ou planilha

### Mudanças em escrita de dados

- revisão das rotinas hoje concentradas em `BigQueryService.gs`
- necessidade de nova camada de escrita voltada ao D1
- maior cuidado com integridade e rastreabilidade das mutações

### Mudanças em autenticação ou acesso

- necessidade de controlar melhor onde ficam segredos e credenciais
- possível revisão de como o AppsScript autentica chamadas para a nova camada
- eliminação de hardcodes sensíveis

### Mudanças em estrutura de queries

- queries deixam de ser centradas apenas nas tabelas físicas atuais do BigQuery
- maior centralização das consultas
- possível uso temporário de views de compatibilidade para reduzir impacto

### Mudanças em tratamento de erro

- necessidade de padronizar melhor falhas de leitura e escrita
- necessidade de distinguir erro de comunicação, erro de persistência e erro de compatibilidade
- necessidade de evitar falhas silenciosas na transição

### Mudanças em monitoramento e rastreabilidade

- necessidade de registrar melhor origem de leitura e escrita
- necessidade de rastrear importações, snapshots e eventos relevantes
- necessidade de enxergar divergências entre legado e nova base durante a convivência

## Regras para implementação pelo Codex

- antes de alterar, localizar dependências reais
- não substituir tudo de uma vez
- respeitar a ordem de migração
- não remover compatibilidade antes da validação
- não acoplar regra de negócio à estrutura física do banco
- não duplicar lógica sem necessidade
- centralizar acesso a dados quando fizer sentido
- preservar comportamento atual onde a regra de negócio exigir
- separar fato, inferência e hipótese ao propor mudanças
- não introduzir segredos ou credenciais no código versionado

## Riscos e pontos de atenção

- risco de quebrar fluxo atual por troca brusca de origem
- risco de adaptar código sem entender consumo real
- risco de manter legado demais e nunca concluir transição
- risco de criar camada intermediária confusa ou inchada
- risco de segurança se continuarem credenciais ou detalhes sensíveis expostos
- risco de divergência entre schema D1 e implementação efetiva
- risco de manter contrato legado por tempo demais e bloquear evolução

## Pendências para validação

- confirmar fluxos prioritários da primeira migração efetiva para D1
- consolidar data mapping final entre legado, BigQuery e schema D1
- confirmar quais contratos externos precisam permanecer estáveis no curto prazo
- validar se haverá serviço intermediário fora do AppsScript ou se a primeira camada ficará no próprio ecossistema atual
- validar estratégia de autenticação entre AppsScript e nova camada de dados
- validar até quando planilha e BigQuery continuarão como contingência operacional
- confirmar quais views de compatibilidade são realmente necessárias

## Recomendação prática de execução

1. revisar os pontos atuais de acesso a dados
2. mapear dependências reais no AppsScript
3. criar camada inicial de acesso a dados preparada para o D1
4. adaptar primeiro os fluxos prioritários de leitura
5. adaptar escrita controlada com rastreabilidade mínima
6. validar compatibilidade com frontend e mobile
7. reduzir dependência de BigQuery e planilha por etapas
8. revisar o que ainda precisa permanecer do legado
9. preparar a evolução futura só depois da estabilização da nova base

