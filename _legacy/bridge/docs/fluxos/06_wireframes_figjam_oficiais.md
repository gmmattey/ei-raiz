# Wireframes oficiais em FigJam por tela e macrofluxo

## Objetivo

Registrar os boards oficiais de wireframe estrutural da jornada completa do webapp.

Esta trilha complementa:
- `docs/fluxos/05_figjam_jornada_oficial.md`
- `docs/fluxos/03_webapp_estrutural_mapa_do_produto.md`
- `docs/fluxos/04_padrao_visual_base_webapp.md`
- `apps/web/jsfigma/esquilo_webapp_estrutural.js`

## Regra desta etapa

Os boards abaixo sao wireframes estruturais em FigJam.

Eles:
- descrevem hierarquia e conteudo por tela
- incluem excecoes e estados relevantes
- aplicam a base visual da marca Esquilo em nivel estrutural

Eles nao:
- sao arquivo `.fig`
- sao mock high fidelity
- sao prototipos interativos de clique

## Boards oficiais

### 1. Entrada, sessao e contexto
- Link: https://www.figma.com/online-whiteboard/create-diagram/72bbde3c-feab-4513-8e81-d60fb44a1038?utm_source=chatgpt&utm_content=edit_in_figjam&oai_id=&request_id=dd4f4ebf-f8cf-4b7c-b7f5-aad1b633caa9
- Cobre:
  - splash e gate de sessao
  - entrada / cadastro / recuperacao
  - onboarding financeiro
  - entrada da carteira
  - excecoes iniciais

### 2. Home, Carteira e Detalhe
- Link: https://www.figma.com/online-whiteboard/create-diagram/67126023-614e-4d4b-ab52-6e4e654a5145?utm_source=chatgpt&utm_content=edit_in_figjam&oai_id=&request_id=2868ee72-2ced-4340-851b-6ceec88462fe
- Cobre:
  - home vazia
  - home com carteira
  - carteira
  - detalhe do investimento
  - excecoes de leitura principal

### 3. Importacoes e excecoes operacionais
- Link: https://www.figma.com/online-whiteboard/create-diagram/b3973524-0a3f-4ff2-a43d-9800659df263?utm_source=chatgpt&utm_content=edit_in_figjam&oai_id=&request_id=8a34d116-de89-4c88-ad03-65a734e8131d
- Cobre:
  - central de importacoes
  - importar arquivo
  - preview da importacao
  - status operacional do motor
  - detalhe operacional do processamento
  - painel de conflitos
  - input manual
  - excecoes operacionais

### 4. Historico, Radar, Perfil e modulos futuros
- Link: https://www.figma.com/online-whiteboard/create-diagram/a471de76-d5e9-4750-b78e-1a9a2d89f519?utm_source=chatgpt&utm_content=edit_in_figjam&oai_id=&request_id=418440c8-631a-4d35-9ee2-75193f0f3472
- Cobre:
  - historico
  - radar
  - alertas dedicados
  - perfil
  - canais e preferencias
  - metas e simuladores
  - excecoes desta fase

## Base visual aplicada nos wireframes

Os boards seguem apenas a identidade existente no repositorio:
- fundo principal `#061018`
- cards `#0C1823`
- texto `#EFF5F7`
- texto de apoio `#9DB1BC`
- acao primaria `#56D5DE`
- acao de destaque `#F7B955`
- positivo `#7ED9A3`
- alerta `#FF6B6B`
- tipografia de titulo `Sora`
- tipografia de corpo e dados `Inter`

## Leitura tecnica obrigatoria junto com os boards

Para nao confundir wireframe com capacidade tecnica atual, sempre cruzar com:
- `docs/fluxos/03_webapp_estrutural_mapa_do_produto.md`

Motivo:
- alguns modulos aparecem na jornada final, mas ainda nao possuem backend e banco fechados

## Veredito

A jornada visual do produto agora esta detalhada em nivel de tela e macrofluxo.

Isso nao significa que todas as telas ja possam ser implementadas sem fechar antes os conflitos tecnicos de schema, sessao, importacao e modulos futuros.
