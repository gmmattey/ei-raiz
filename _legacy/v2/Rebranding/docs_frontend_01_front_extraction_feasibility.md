# 01. Viabilidade de extração do front atual

## Visão geral do front atual

O front atual é um dashboard web em **arquivo único**, com HTML, CSS e JavaScript concentrados no mesmo arquivo. A interface já roda como aplicação de navegador comum em boa parte da camada visual:

- layout e componentes estão no próprio HTML
- estilos estão inline no mesmo arquivo
- a renderização é feita em JavaScript puro no browser
- há uso de bibliotecas externas acessadas por CDN, como Tailwind e Google Fonts
- os assets visuais principais já estão em URLs externas

Na prática, isso significa que o front **não depende estruturalmente do Apps Script para renderizar a tela**, mas depende dele para **buscar dados e disparar ações**.

## Onde o HTML está hoje

O front atual está em:

- `Esquilo-Invest-2.0/frontend/html/Dashboard.html`

Esse arquivo é hoje servido pelo Apps Script via `doGet()`, usando `HtmlService`.

## Dependências do HTML Service

A dependência mais importante do HTML Service não está no markup em si, mas na forma como o front conversa com o backend.

Hoje o fluxo é:

1. o Apps Script publica o web app
2. o `doGet()` serve `Dashboard.html`
3. o JavaScript do front usa a ponte nativa do Apps Script para pedir dados ao backend

O HTML atual **não foi escrito como front estático desacoplado**. Ele foi escrito como front hospedado dentro do ecossistema Google Apps Script.

Dependências práticas observadas:

- entrega do HTML pelo `HtmlService`
- detecção de bridge do Apps Script no browser
- chamadas assíncronas via ponte nativa Google
- expectativa de que o ambiente tenha `google.script.run`

O que **não** apareceu como dependência crítica:

- includes server-side complexos
- template HTML com injeção pesada de variáveis do GAS
- manipulação estrutural de DOM feita pelo backend

Isso é bom, porque reduz bastante a dificuldade da extração.

## Existência ou não de `google.script.run`

**Existe, e é dependência central.**

O front atual usa `google.script.run` diretamente em pontos críticos. Pelo menos estes fluxos estão acoplados a isso:

- carga inicial do dashboard
- solicitação de análise da Esquilo IA
- refresh parcial do snapshot de ações

Em termos práticos, hoje o front chama funções do Apps Script como se estivesse “dentro” dele. Fora do Apps Script isso **não existe**.

Então o ponto principal da migração não é copiar HTML e CSS. Isso é a parte fácil. O ponto real é substituir a ponte `google.script.run` por chamadas HTTP `fetch` para endpoints JSON.

## O que pode ser extraído sem impacto

Pode sair quase sem impacto:

- estrutura HTML
- CSS atual
- JS de renderização de cards, tabelas, filtros e estados visuais
- navegação visual e comportamento de expandir/recolher blocos
- modo ghost, popups, filtros locais e renderizações derivadas do payload
- assets externos já referenciados por URL

Em resumo: a **camada visual e de renderização** é amplamente reaproveitável.

## O que exige adaptação

Aqui está o que realmente precisa mudar.

### 1. Bootstrap do front

Hoje a aplicação sobe assumindo que está dentro do Apps Script. Fora dele, o boot precisa passar a usar:

- `fetch()`
- URL base configurável do backend
- tratamento de erro HTTP real
- fallback quando o backend responder HTML de login ou erro de publicação

### 2. Troca de `google.script.run` por HTTP

As chamadas atuais precisam ser adaptadas.

Hoje:

- `getDashboardData()` via `google.script.run`
- `getPortfolioAIAnalysis()` via `google.script.run`
- `getDashboardActionsSnapshot()` via `google.script.run`

No front externo:

- `fetch('/exec?format=json&resource=dashboard')`
- `fetch('/exec?format=json&resource=ai-analysis')`
- o snapshot de ações precisará de endpoint HTTP equivalente, se ainda não existir

### 3. Tratamento de autenticação/publicação do Apps Script

Esse ponto é crítico.

Já existe histórico no projeto de o `/exec` responder **HTML de login do Google** em vez de JSON quando a publicação/acesso do Web App não está correta.

Para um front no Cloudflare Pages, isso mata a integração.

Então a publicação do Apps Script precisa estar configurada para acesso externo compatível com o novo front.

### 4. Possível CORS e comportamento cross-origin

Como o front vai sair do domínio do Apps Script e passar a rodar em outro host, o comportamento cross-origin precisa ser validado na prática.

Apps Script não se comporta igual a um backend web tradicional. Então essa ponte precisa ser tratada como adaptação real, não como detalhe cosmético.

## Quais mudanças mínimas no backend serão inevitáveis

A prioridade aqui é mudar o mínimo possível. Mesmo assim, algumas mudanças são inevitáveis.

### Mudança inevitável 1: expor o dashboard por HTTP para o front web

A boa notícia é que isso já está parcialmente pronto por causa da camada mobile.

Hoje já existe trilha JSON no Apps Script com recursos como:

- `dashboard`
- `ai-analysis`
- `health`

Isso reduz muito o esforço.

### Mudança inevitável 2: expor endpoint HTTP para refresh parcial das ações

O front atual usa refresh parcial de ações sem recarregar o dashboard inteiro.

Se a intenção for preservar esse comportamento, será preciso expor um recurso HTTP equivalente ao atual `getDashboardActionsSnapshot()`.

Sem isso, há dois caminhos:

- ou o front passa a recarregar o dashboard completo
- ou o backend ganha um endpoint mínimo novo para snapshot parcial

A opção mais alinhada com “mudar pouco” é criar um recurso JSON específico para isso, reaproveitando a lógica que já existe no backend.

### Mudança inevitável 3: garantir publicação compatível com uso externo

O Apps Script precisará estar publicado de forma que:

- responda JSON real para chamadas externas
- não force login Google para o front hospedado no Pages
- aceite o modelo de consumo do novo front

### Mudança inevitável 4: opcionalmente padronizar contrato web

O backend mobile já resolve boa parte do problema. Mesmo assim, pode valer um ajuste pequeno para deixar o contrato mais claro para o front externo web.

Isso não exige reescrever regra de negócio. Exige só organizar melhor a porta de entrada HTTP.

## Avaliação objetiva: é viável migrar o front agora ou não?

**Sim, é viável migrar o front agora.**

Mas com uma leitura honesta:

- **é viável extrair a interface**
- **não é viável simplesmente copiar o HTML para o Cloudflare Pages e esperar que funcione**
- **a adaptação mínima obrigatória é substituir `google.script.run` por `fetch` e garantir endpoints HTTP compatíveis**

### Diagnóstico final

**Viabilidade:** alta

**Motivo:**

- o front atual já é majoritariamente browser-side
- o backend já tem trilha HTTP/JSON por causa do mobile
- a lógica de negócio continua no Apps Script
- a maior parte do esforço está na ponte de comunicação, não na interface

### O que pode impedir a migração agora

Os bloqueios reais não são de HTML. São estes:

1. o Apps Script não estar publicado com acesso externo correto
2. não existir endpoint HTTP para o snapshot parcial de ações
3. o consumo cross-origin do front externo não estar validado

### Decisão

**Recomendação objetiva:** migrar agora, usando estratégia de extração conservadora.

Ou seja:

- manter o Apps Script como backend
- tirar o `Dashboard.html` para um front estático externo
- trocar a ponte `google.script.run` por `fetch`
- reaproveitar os endpoints JSON já existentes
- adicionar só o mínimo que faltar no backend

Esse caminho é consistente com o estado atual do código e evita reescrever a aplicação inteira.

## Conclusão curta

O front atual **pode e deve** ser extraído do Apps Script, porque o acoplamento principal está na comunicação com o backend, não na renderização da UI.

A migração é **tecnicamente viável agora**, desde que seja feita como desacoplamento controlado da ponte Apps Script, e não como cópia cega do HTML para outro host.

