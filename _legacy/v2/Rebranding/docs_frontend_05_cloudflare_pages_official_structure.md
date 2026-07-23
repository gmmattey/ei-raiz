# Estrutura oficial da nova web no Cloudflare Pages

## 1. Decisão oficial

A nova interface web hospedada no **Cloudflare Pages** deve adotar como base oficial a **arquitetura de navegação, hierarquia de informação e linguagem visual da versão mobile/Flutter**, e **não** o layout atual do `Dashboard.html` como referência principal de produto.

O `Dashboard.html` atual continua útil como:

- base técnica de extração
- fonte de componentes reaproveitáveis
- referência de payload
- referência de regras de renderização já prontas
- atalho para acelerar a primeira versão externa

Mas ele **não** deve definir a cara oficial do produto.

## 2. Objetivo da nova web

A nova web precisa cumprir 4 coisas ao mesmo tempo:

1. parecer um produto moderno e consistente
2. funcionar bem em desktop, webapp e mobile web
3. manter o backend atual o mais intacto possível
4. conversar com um público de carteira simples e pouco repertório financeiro

O produto não deve parecer:

- terminal técnico
- dashboard corporativo interno
- planilha premium fantasiada de app
- portal de notícias econômicas

O produto deve parecer:

- app de acompanhamento patrimonial simples
- central de leitura rápida
- carteira guiada
- produto confiável, acessível e contemporâneo

## 3. Princípio mestre da UX

A web deve seguir o princípio de **informação progressiva**.

Isso significa:

- mostrar primeiro o que importa
- esconder profundidade técnica até o usuário pedir
- separar resumo de detalhe
- evitar múltiplos blocos competindo ao mesmo tempo
- reduzir esforço cognitivo

Para esse produto, isso é mais importante do que “mostrar tudo”.

## 4. Diretriz de marca e identidade

Os três canais devem parecer o mesmo produto:

- mobile app
- webapp
- desktop web

Mesmo sem mexer agora na versão mobile, a nova web já deve nascer compatível com uma futura convergência visual.

### 4.1 Elementos que devem ser unificados

- nome do produto: **Esquilo Invest**
- tom visual escuro com destaque quente
- aparência premium acessível, não elitista
- cards com leitura simples
- categorias claras: ações, fundos, previdência
- linguagem direta, curta e não professoral
- foco em patrimônio, composição, status e direção

### 4.2 Sensação desejada

A sensação final precisa ser:

- simples sem parecer pobre
- moderna sem parecer infantil
- confiável sem parecer banco antigo
- guiada sem parecer engessada

## 5. Base oficial de estrutura de informação

A nova web deve ser organizada em **4 áreas principais**, herdadas da lógica do app Flutter:

1. **Início**
2. **Carteira**
3. **Radar**
4. **Base / Perfil**

Essa estrutura já é melhor que a versão HTML atual porque separa intenção de uso.

O usuário não entra na plataforma para ver “todos os cards”.
Ele entra para fazer uma destas coisas:

- entender como a carteira está
- olhar a carteira por categoria
- receber um direcionamento
- checar informações base e situação da conexão

A arquitetura da nova web deve respeitar isso.

## 6. Estrutura oficial da nova web

## 6.1 Rotas oficiais

A estrutura oficial da web deve usar estas rotas:

- `/` → Início
- `/carteira` → Carteira consolidada
- `/carteira/acoes` → Detalhe da categoria ações
- `/carteira/fundos` → Detalhe da categoria fundos
- `/carteira/previdencia` → Detalhe da categoria previdência
- `/radar` → Leitura estratégica e IA
- `/base` → Perfil, saúde da integração e informações operacionais

### 6.1.1 Regra importante

Mesmo que a primeira versão seja SPA simples, a arquitetura deve ser pensada como se essas rotas existissem de verdade.

Isso evita duas cagadas:

- entulhar tudo em uma única tela infinita
- deixar a navegação dependente de expansão local de card

## 6.2 Navegação oficial

A navegação da web deve ser:

- **top navigation** em desktop
- **bottom navigation** em mobile/webapp estreito
- com os mesmos 4 eixos do app: Início, Carteira, Radar, Base

### 6.2.1 Desktop

No desktop:

- header fixo leve
- marca à esquerda
- navegação principal no topo
- ação de atualizar à direita
- estado da integração ou da base em posição discreta

### 6.2.2 Mobile web / webapp estreito

No mobile web:

- header enxuto
- navegação inferior fixa
- foco em 1 tela por vez
- scroll vertical natural

Essa navegação é muito mais forte para teu público do que um monte de card expansível na home.

## 7. Estrutura oficial por área

## 7.1 Início

A tela de Início deve ser a principal porta de entrada do produto.

### 7.1.1 Objetivo

Entregar em poucos segundos:

- patrimônio total
- status geral
- composição da carteira
- próximo foco
- leitura curta da rodada

### 7.1.2 Blocos obrigatórios do Início

#### A. Hero principal

Conteúdo:

- patrimônio total
- rentabilidade total
- status ou score geral
- última atualização

Comportamento:

- bloco de maior destaque visual da tela
- leitura rápida
- sem excesso de texto

#### B. Alocação por categorias

Conteúdo:

- ações
- fundos
- previdência
- percentual de cada uma
- cor própria por categoria

Comportamento:

- gráfico de anel ou barra segmentada
- legenda simples
- clique leva para a categoria correspondente

#### C. Categorias em destaque

Conteúdo:

- card de Ações
- card de Fundos
- card de Previdência

Cada card mostra só:

- nome
- participação
- rentabilidade resumida
- status ou recomendação curta

Comportamento:

- não expande inline na home
- clique abre página da categoria

#### D. Radar curto

Conteúdo:

- principal sinal atual
- principal recomendação
- eventual ordem sugerida
- leitura curta da IA ou fallback local

Comportamento:

- no máximo 3 a 4 linhas úteis
- CTA para abrir `/radar`

#### E. Missão / foco do momento

Conteúdo:

- o que o sistema entende como foco atual
- prioridade
- justificativa curta

Comportamento:

- bloco textual curto
- sem tese de investimento

### 7.1.3 O que não entra na home

Não colocar na home:

- tabela detalhada de holdings
- filtros avançados
- múltiplas linhas expansíveis
- detalhes operacionais de integração
- excesso de texto da IA
- subtelas embutidas

A home precisa respirar.

## 7.2 Carteira

A área Carteira deve concentrar visão consolidada e entrada para detalhes.

### 7.2.1 Objetivo

Permitir que o usuário veja a carteira sem se sentir soterrado.

### 7.2.2 Estrutura da tela `/carteira`

Blocos:

#### A. Resumo consolidado

- patrimônio total
- composição por categoria
- total de posições
- distribuição por instituição

#### B. Lista de categorias

Cada categoria com:

- total atual
- participação
- rentabilidade
- status
- CTA para abrir detalhe

#### C. Holdings mais relevantes

Lista resumida dos principais ativos/posições da carteira inteira.

Regra:

- mostrar poucos itens
- priorizar relevância e não quantidade
- desktop pode exibir mais que mobile

#### D. CTA de aprofundamento

- abrir ações
- abrir fundos
- abrir previdência

### 7.2.3 Estrutura das páginas de categoria

#### `/carteira/acoes`

Deve conter:

- resumo da categoria
- total alocado
- rentabilidade
- status e recomendação
- lista de ativos
- filtro simples por instituição ou recomendação
- detalhe por ativo sob demanda

#### `/carteira/fundos`

Deve conter:

- resumo da categoria
- lista de fundos
- classificação
- instituição
- saldo atual
- participação
- rentabilidade
- detalhe opcional do fundo

#### `/carteira/previdencia`

Deve conter:

- resumo da categoria
- lista de planos
- instituição
- saldo atual
- participação
- rentabilidade
- perfil/plano quando existir
- detalhe opcional do plano

### 7.2.4 Regra de detalhe

Detalhe pode ser feito de duas formas:

- drawer lateral no desktop
- painel expansível controlado ou nova tela no mobile

O que **não** deve acontecer:

- tabela inteira virando um carnaval de expansão ao mesmo tempo

## 7.3 Radar

A área Radar deve centralizar a camada de interpretação.

### 7.3.1 Objetivo

Dar direção, não dar aula.

### 7.3.2 Estrutura oficial do Radar

Blocos:

#### A. Leitura principal

- situação da carteira
- recomendação principal
- justificativa curta

#### B. Sinais importantes

- maior concentração
- maior risco
- melhor desempenho
- ponto de pressão

#### C. IA / leitura expandida

- análise remota quando existir
- fallback local quando não existir
- botão claro para atualizar leitura

#### D. Próxima ação

- foco sugerido
- prioridade
- impacto esperado

### 7.3.3 Regra editorial do Radar

A linguagem deve ser:

- curta
- orientativa
- sem jargão excessivo
- sem cara de research house

## 7.4 Base

A área Base deve funcionar como área de contexto operacional e perfil.

### 7.4.1 Objetivo

Mostrar o que é útil sem poluir o resto do produto.

### 7.4.2 Conteúdo

- squad/perfil
- status da conexão
- fonte dos dados
- versão do app
- saúde da integração
- mensagens de fallback
- ações utilitárias como atualizar

Essa área é importante, mas não deve roubar espaço das telas principais.

## 8. Modelo oficial por breakpoint

## 8.1 Mobile web

### Público

- jovem
- rápido
- impaciente
- baixa tolerância a ruído

### Modelo ideal

- navegação inferior
- uma coluna
- home muito enxuta
- cards grandes e tocáveis
- detalhes em tela própria ou expansão curta

### Prioridades

- patrimônio
- categorias
- radar
- direção prática

### O que evitar

- tabela larga
- microtexto
- múltiplos filtros simultâneos
- excesso de densidade visual

## 8.2 Webapp

### Público

- meio termo
- acostumado a usar web no celular e no notebook
- aceita mais informação que no mobile, mas ainda quer experiência fluida

### Modelo ideal

- mesma lógica do mobile
- duas colunas em alguns blocos
- navegação que ainda pareça app
- home modular
- densidade controlada

### Prioridades

- consistência
- rapidez
- clareza
- sensação de app real

### O que evitar

- cara de site institucional
- cara de planilha
- modais excessivos

## 8.3 Desktop

### Público

- mais velho
- maior tolerância a dados simultâneos
- tende a valorizar clareza e estabilidade

### Modelo ideal

- header superior
- grid aproveitando largura
- área de resumo forte
- detalhes laterais ou abaixo com boa organização
- tabela só onde fizer sentido

### Prioridades

- legibilidade
- confiança
- previsibilidade
- escaneabilidade

### O que evitar

- cockpit exagerado
- excesso de glow, efeito e textura
- múltiplas áreas gritando ao mesmo tempo

## 9. O que é oficialmente reaproveitável

## 9.1 Reaproveitar da versão Flutter

Como base de produto:

- arquitetura de navegação
- divisão em áreas
- lógica de home
- hierarquia de informação
- sensação de app moderno
- organização por jornada de uso
- tema visual de referência

## 9.2 Reaproveitar do HTML atual

Como base de implementação:

- payload e contratos já usados
- lógica de renderização
- helpers de formatação
- filtros locais
- parte dos cards
- tabela de holdings
- lógica de atualização e loading
- camada de integração já conhecida com backend

## 9.3 Reaproveitamento recomendado por componente

### Pode reaproveitar quase direto

- formatação de moeda e percentual
- helpers de estado
- leitura de payload
- renderização de listas
- tabelas de ações/fundos/previdência
- comportamento de loading
- atualização manual

### Deve ser refeito visualmente

- home atual
- header atual
- distribuição dos cards
- hierarquia da página principal
- layout mobile do HTML atual
- excesso de expansões inline

### Deve ser simplificado

- blocos de resumo executivo muito fragmentados
- duplicidade entre home, cards e radar
- textos redundantes
- excesso de meta pills e microestados

## 10. Design system mínimo oficial

A nova web deve nascer com um design system mínimo, suficiente para manter consistência.

## 10.1 Tokens base

### Cores

- fundo principal escuro
- fundo secundário escuro
- cor de marca quente
- neutros claros para texto
- cor própria para ações
- cor própria para fundos
- cor própria para previdência
- verde para positivo
- vermelho para negativo
- amarelo/dourado para atenção

### Tipografia

- título de marca com identidade própria
- corpo principal altamente legível
- labels curtas em estilo tático discreto
- números com leitura forte

### Espaçamento

- blocos generosos
- respiro entre seções
- padding consistente
- áreas tocáveis confortáveis

### Componentes base

- top bar
- bottom nav
- card hero
- card de categoria
- status chip
- bloco de insight
- tabela responsiva
- empty state
- error state
- loading state
- botão primário
- botão secundário

## 11. Comportamentos oficiais

## 11.1 Regras de comportamento global

- evitar abrir muitos detalhes ao mesmo tempo
- evitar scroll infinito poluído
- cada ação deve ter destino claro
- filtros devem ser poucos e compreensíveis
- IA deve aparecer como apoio, não como protagonista excessivo
- atualização precisa parecer confiável e previsível

## 11.2 Regras de comportamento por elemento

### Cards de categoria

- clicáveis
- levam para página da categoria
- não expandem de forma caótica na home

### Holdings

- resumo na lista
- detalhe sob demanda
- mobile abre detalhe em nova tela ou sheet
- desktop pode abrir painel lateral ou expansão controlada

### Radar

- sempre curto primeiro
- expandido só quando o usuário quiser

### Tabelas

- desktop: tabela completa quando necessário
- mobile/webapp: lista adaptada, não tabela espremida

## 12. Estrutura oficial de implementação no Cloudflare Pages

## 12.1 Estrutura de arquivos recomendada

```text
frontend/
  index.html
  carteira.html
  radar.html
  base.html
  assets/
    css/
      tokens.css
      base.css
      components.css
      layouts.css
      responsive.css
    js/
      app-config.js
      api-client.js
      state.js
      router.js
      formatters.js
      ui/
        header.js
        nav.js
        hero.js
        category-cards.js
        holdings-list.js
        radar.js
        states.js
      pages/
        home-page.js
        carteira-page.js
        categoria-page.js
        radar-page.js
        base-page.js
    img/
      brand/
      icons/
```

## 12.2 Estratégia técnica oficial

### Primeira fase

Subir um front estático simples no Cloudflare Pages com:

- home
- carteira
- radar
- base
- navegação compartilhada
- integração via `fetch`

### Segunda fase

Adicionar páginas de categoria:

- ações
- fundos
- previdência

### Terceira fase

Refinar comportamento por breakpoint e detalhes.

## 13. Estratégia oficial de migração

A ordem certa de migração é esta.

## 13.1 Etapa 1

**Migrar a web primeiro para Cloudflare Pages.**

Mas não apenas copiar o HTML atual.

O correto é:

- extrair a base técnica
- manter integração atual com backend
- reorganizar a casca na nova arquitetura oficial

## 13.2 Etapa 2

**Implantar primeiro o Início e a navegação oficial.**

Motivo:

- define a cara do produto
- define percepção de qualidade
- evita gastar energia em detalhe antes da estrutura certa

## 13.3 Etapa 3

**Migrar a Carteira por categorias.**

Motivo:

- é o segundo principal fluxo de uso
- reaproveita muito do que já existe
- entrega valor rápido

## 13.4 Etapa 4

**Migrar o Radar.**

Motivo:

- consolida a camada interpretativa
- dá sensação de produto mais inteligente
- aproveita análise e fallback já existentes

## 13.5 Etapa 5

**Migrar a Base.**

Motivo:

- é útil, mas não é o coração da experiência

## 13.6 Etapa 6

**Só depois alinhar a versão mobile.**

Como a versão mobile não será mexida agora, a web deve nascer preparada para futura convergência, sem forçar refactor imediato no app.

## 14. Decisão final consolidada

### Base oficial para o Cloudflare Pages

**Arquitetura e linguagem visual da versão Flutter.**

### Base técnica de aceleração

**HTML atual extraído e reaproveitado em partes.**

### Melhor modelo por canal

- **mobile:** modelo atual do Flutter
- **webapp:** modelo híbrido com lógica do mobile e modularidade web
- **desktop:** modelo híbrido com lógica do mobile e densidade controlada do HTML atual

### O que deve parecer igual entre todos

- marca
- paleta
- hierarquia
- navegação conceitual
- nomes das áreas
- componentes base
- tom de interface

### O que muda entre os canais

- densidade
- número de colunas
- forma de abrir detalhes
- distribuição do espaço

## 15. Regra de implementação

Toda decisão futura de layout da nova web deve responder a esta pergunta:

**isso deixa a experiência mais clara para alguém com carteira simples e pouco repertório financeiro?**

Se a resposta for não, a decisão está errada.

Esse é o filtro certo para não virar nem painel técnico demais, nem app simplório demais.

