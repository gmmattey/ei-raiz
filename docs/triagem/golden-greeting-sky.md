# Plano de Reconstrução — Esquilo Invest

## Contexto

A Esquilo Invest é uma plataforma de consolidação e tradução da vida financeira do investidor brasileiro. O projeto foi praticamente abandonado após desistência do CEO, e agora está sendo retomado com postura nova. Existe documentação robusta (brand book, design system, wireframes desktop, arquitetura), assets visuais (55+ ícones SVG, logos), mas **zero código-fonte neste repositório** — a pasta `dev/` está vazia.

**Decisões já tomadas pelo CEO:**
- Stack: **Cloudflare Workers + D1** (reaproveitar estrutura do projeto anterior)
- Tudo concentrado nesta pasta: `D:\Programação\Projetos\Esquilo Invest`
- Arquitetura de serviços desacoplados com contratos claros (problema do projeto anterior: tudo no mesmo código, contratos quebrados entre APIs)
- CEO quer visibilidade: épicos, features, user stories rastreáveis
- Cada sessão precisa ter entrega visível

---

## 1. O que eu entendi

### O produto
A Esquilo Invest é um **consolidador inteligente de carteira de investimentos**. Não é corretora, não executa ordens, não promete retorno. É um produto de **clareza financeira** que atende três verbos: **Consolidar, Traduzir, Orientar**.

- **Consolidar**: unificar posições de múltiplas corretoras (XP, Íon, BTG, Nubank, Clear, Rico, Modalmais, Genial e outras 40+) em uma visão única e confiável.
- **Traduzir**: transformar dados financeiros técnicos em linguagem humana, curta e prática.
- **Orientar**: destacar um problema principal e uma ação plausível por rodada. Sem sobrecarga.

### Posicionamento
"O tradutor da carteira, não corretora." Ocupa um espaço que nenhuma corretora quer preencher (elas querem que você opere, não que você entenda) e que os apps de controle financeiro genérico não conseguem ocupar (são rasos demais no domínio de investimentos).

### Público-alvo
Adulto 28-45 anos, já investe em 2-3 plataformas, entende pouco ou médio de finanças. Quer clareza sem precisar virar analista. Renda R$ 8-20k/mês, aportes regulares, horizonte 3-5 anos. Não é day trader. É a pessoa que tem ITSA4, um fundo e uma previdência mas não sabe se está concentrada demais.

### O que o branding revela
O branding é surpreendentemente maduro:
- **Arquétipo Sábio + Cuidador contido**: autoridade calma sem arrogância
- **Paleta funcional**: Orange (#F56A2A) assinatura, Deep Graphite (#0B1218) âncora, superfícies claras, cores de estado com função específica
- **Tipografia**: Sora display/títulos, Inter UI/dados. Escala tipográfica com 12 níveis
- **Iconografia proprietária**: 55+ SVGs grid 24x24, stroke 1.5, round cap/join
- **Linguagem gráfica própria**: recorte diagonal, moldura de canto, faixa de dado, grid de pontos

### O que o wireframe desktop revela
11 telas com densidade real — dados financeiros de verdade:
1. Dashboard/Home — patrimônio, score, problema + ação, distribuição
2. Carteira Consolidada — tabela densa com filtros e ordenação
3. Detalhe Ações — concentração e alertas por categoria
4. Detalhe Fundos & Previdência — gestão passiva/longo prazo
5. Importar Extrato — wizard 3 passos com drag-and-drop
6. Revisão da Importação — preview com status por linha
7. Insights / Esquilo IA — diagnóstico traduzido com score
8. Histórico & Evolução — gráfico temporal + snapshots
9. Perfil & Configurações — contexto financeiro + plataformas
10. Estados do Sistema — Empty, Loading, Error, Success, No Results
11. Visão do Sistema Completo

Navegação desktop: sidebar 200px, 6 itens (Início, Carteira, Importar, Insights, Histórico, Perfil). Top bar com busca e avatar. Grid 12 colunas, gutter 24px.

### Problemas implícitos e riscos
- **Arquitetura backend do diagrama é enterprise demais para MVP**: Billing, Tributação, RBAC, Filas, Search Index. Isso é sistema de R$ 5M.
- **40+ corretoras**: parsear extratos de corretoras brasileiras é engenharia pesada. Cada corretora tem formato diferente.
- **IA sem definição técnica**: "Esquilo IA" aparece nos wireframes mas não há spec de como funciona.
- **Score sem definição de cálculo**: aparece em várias telas, nunca é explicado.
- **Modelo de negócio vago**: "Plano Gratuito" sem definição de tiers.

### O que muda com a retomada
- **Confiança frágil**: entregas que demoram ou parecem inúteis reforçam a dúvida
- **Valor tangível rápido**: o produto precisa mostrar algo real logo
- **Risco de scope creep por ansiedade**: querer fazer tudo ao mesmo tempo
- **Oportunidade**: começar limpo sem código legado amarrando decisões ruins

---

## 2. Diagnóstico franco do cenário atual

### O que está bom
- Documentação de marca excelente (Brand Book, Sistema Executável, Telas Desktop)
- Wireframes desktop densos e realistas
- 55+ ícones SVG coerentes e prontos
- Posicionamento claro e diferenciado
- Estados de tela (Empty/Error/Loading/Success) definidos com copy

### O que está fraco
- **Zero código no repositório**. Pasta dev/ vazia.
- Arquitetura backend overengineered para o estágio
- Sem stack técnica implementada (Cloudflare + D1 é decisão, não implementação)
- Sem modelo de dados
- Sem backend, API ou autenticação

### O que estava errado no projeto anterior (lição aprendida)
- **Tudo no mesmo código**: sem separação entre serviços, causando acoplamento
- **Contratos entre APIs quebravam**: sem tipagem compartilhada ou versionamento
- **Refatoração impossível**: mudar um serviço quebrava outro
- **Bug fixing arriscado**: não dava para isolar o problema

Isso define uma restrição arquitetural obrigatória: **cada serviço é um módulo independente com contrato tipado**.

### O que está confuso
- 17 telas (markdown) vs 11 telas (PDF desktop) — qual é a prioridade?
- "Radar" vs "Insights" — nomenclatura inconsistente
- Navegação mobile (4 itens) vs desktop (6 itens) — estruturas diferentes

### O que está incompleto
- Fluxo de autenticação sem wireframe desktop
- Onboarding ausente no desktop
- Detalhe de ativo individual (ex: tela do ITSA4)
- Wireframes responsive não existem

---

## 3. Visão ambiciosa da nova plataforma

### Que tipo de produto
Webapp desktop-first que faz três coisas excepcionalmente bem:
1. Importa e consolida posições de investimento de múltiplas corretoras
2. Apresenta visão clara, densa e navegável da carteira consolidada
3. Traduz dados financeiros em orientações acionáveis

### Percepção desejada no usuário
- "Finalmente eu entendo o que eu tenho"
- "Isso é limpo e profissional, mas não é intimidador"
- "Eu confio nessa leitura"
- "Eu sei o que fazer em seguida"

### Atributos da experiência
- **Clareza**: cada tela tem propósito imediato
- **Densidade útil**: dados financeiros precisam de densidade legível
- **Confiança**: contraste correto, tipografia precisa, estados claros
- **Orientação**: aponta caminho, não despeja dados

### Pilares de decisão
1. Clareza acima de completude
2. Dado real acima de feature
3. Qualidade de UI acima de velocidade de feature
4. Serviços desacoplados com contratos tipados
5. Português rigoroso em tudo

---

## 4. Estratégia de reconstrução do zero

### Stack definida
- **Frontend**: React 18+ / TypeScript strict / Vite / CSS Modules + variáveis CSS
- **Backend**: Cloudflare Workers (edge functions)
- **Banco de dados**: Cloudflare D1 (SQLite distribuído)
- **Armazenamento**: Cloudflare R2 (para extratos importados, se necessário)
- **Deploy**: Cloudflare Pages (frontend) + Workers (API)
- **Monorepo**: tudo dentro de `D:\Programação\Projetos\Esquilo Invest`

### Arquitetura de serviços desacoplados

O problema do projeto anterior foi tudo acoplado. A nova arquitetura obriga separação:

```
esquilo-invest/
├── apps/
│   ├── web/                        # Frontend React (Cloudflare Pages)
│   │   ├── src/
│   │   │   ├── componentes/        # Design system
│   │   │   ├── telas/              # Páginas
│   │   │   ├── cliente-api/        # Cliente tipado da API
│   │   │   ├── estado/             # Estado local
│   │   │   ├── hooks/              # Hooks customizados
│   │   │   └── estilos/            # CSS tokens
│   │   └── ...
│   └── api/                        # API Gateway (Cloudflare Worker)
│       ├── src/
│       │   ├── roteador.ts         # Roteador principal
│       │   ├── middleware/         # Auth, CORS, validação
│       │   └── gateway.ts         # Despacha para serviços
│       └── wrangler.toml
│
├── servicos/                       # CADA SERVIÇO É INDEPENDENTE
│   ├── autenticacao/               # Login, registro, JWT
│   │   ├── src/
│   │   │   ├── contrato.ts        # Interface pública (tipada)
│   │   │   ├── servico.ts         # Implementação
│   │   │   └── repositorio.ts    # Acesso a dados
│   │   └── testes/
│   │
│   ├── carteira/                   # Consolidação de ativos
│   │   ├── src/
│   │   │   ├── contrato.ts
│   │   │   ├── servico.ts
│   │   │   └── repositorio.ts
│   │   └── testes/
│   │
│   ├── importacao/                 # Parser de extratos (PLUGÁVEL)
│   │   ├── src/
│   │   │   ├── contrato.ts
│   │   │   ├── servico.ts
│   │   │   ├── parsers/           # Um parser por corretora
│   │   │   │   ├── csv-generico.ts
│   │   │   │   ├── xp.ts         # futuro
│   │   │   │   └── ion.ts        # futuro
│   │   │   └── repositorio.ts
│   │   └── testes/
│   │
│   ├── perfil/                     # Contexto financeiro do usuário
│   │   ├── src/
│   │   │   ├── contrato.ts
│   │   │   ├── servico.ts
│   │   │   └── repositorio.ts
│   │   └── testes/
│   │
│   ├── insights/                   # Score + diagnóstico + recomendações
│   │   ├── src/
│   │   │   ├── contrato.ts
│   │   │   ├── servico.ts
│   │   │   ├── regras/            # Motor de regras
│   │   │   │   ├── concentracao.ts
│   │   │   │   ├── diversificacao.ts
│   │   │   │   └── score.ts
│   │   │   └── repositorio.ts
│   │   └── testes/
│   │
│   └── historico/                  # Snapshots e evolução temporal
│       ├── src/
│       │   ├── contrato.ts
│       │   ├── servico.ts
│       │   └── repositorio.ts
│       └── testes/
│
├── pacotes/
│   ├── contratos/                  # TIPOS COMPARTILHADOS (a cola)
│   │   ├── autenticacao.ts
│   │   ├── carteira.ts
│   │   ├── importacao.ts
│   │   ├── perfil.ts
│   │   ├── insights.ts
│   │   ├── historico.ts
│   │   └── index.ts
│   ├── validacao/                  # Schemas Zod compartilhados
│   └── utilitarios/               # Formatadores (moeda, data, %)
│
├── banco/                          # Migrations D1
│   ├── migrations/
│   │   ├── 0001_criar_usuarios.sql
│   │   ├── 0002_criar_ativos.sql
│   │   └── ...
│   └── seed.sql
│
├── assets/                         # Já existe — ícones e logos
├── leia-me/                        # Já existe — documentação
└── .github/                        # Issues, Projects (tracking)
```

### Princípio arquitetural: Contratos como fronteira

Cada serviço expõe um `contrato.ts` com:
- Tipos de entrada e saída
- Interface do serviço
- Nenhuma dependência de implementação

O API Gateway importa os contratos e despacha. O frontend importa os contratos para tipar o cliente. **Se alguém muda a implementação de um serviço, o contrato garante que nada quebra.** Se o contrato muda, TypeScript grita em todos os consumidores.

```typescript
// pacotes/contratos/carteira.ts
export interface AtivoResumo {
  id: string;
  ticker: string;
  nome: string;
  categoria: 'acao' | 'fundo' | 'previdencia' | 'renda_fixa';
  plataforma: string;
  valorAtual: number;
  participacao: number;
  retorno12m: number;
}

export interface ServicoCarteira {
  listarAtivos(usuarioId: string): Promise<AtivoResumo[]>;
  obterResumo(usuarioId: string): Promise<ResumoCarteira>;
  obterDetalhePorCategoria(usuarioId: string, categoria: string): Promise<DetalheCategoria>;
}
```

### Modelo de dados D1 (SQLite)

```sql
-- usuarios
CREATE TABLE usuarios (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  nome TEXT NOT NULL,
  criado_em TEXT DEFAULT (datetime('now'))
);

-- perfil_financeiro
CREATE TABLE perfil_financeiro (
  id TEXT PRIMARY KEY,
  usuario_id TEXT REFERENCES usuarios(id),
  renda_mensal REAL,
  aporte_mensal REAL,
  horizonte TEXT,
  perfil_risco TEXT,
  objetivo TEXT,
  maturidade INTEGER DEFAULT 1
);

-- plataformas_vinculadas
CREATE TABLE plataformas_vinculadas (
  id TEXT PRIMARY KEY,
  usuario_id TEXT REFERENCES usuarios(id),
  nome TEXT NOT NULL,
  ultimo_import TEXT,
  status TEXT DEFAULT 'ativo'
);

-- ativos
CREATE TABLE ativos (
  id TEXT PRIMARY KEY,
  usuario_id TEXT REFERENCES usuarios(id),
  ticker TEXT,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  plataforma TEXT,
  quantidade REAL,
  preco_medio REAL,
  valor_atual REAL,
  participacao REAL,
  retorno_12m REAL
);

-- importacoes
CREATE TABLE importacoes (
  id TEXT PRIMARY KEY,
  usuario_id TEXT REFERENCES usuarios(id),
  arquivo_nome TEXT,
  status TEXT DEFAULT 'pendente',
  total_linhas INTEGER,
  conflitos INTEGER DEFAULT 0,
  erros INTEGER DEFAULT 0,
  validos INTEGER DEFAULT 0,
  criado_em TEXT DEFAULT (datetime('now'))
);

-- itens_importacao
CREATE TABLE itens_importacao (
  id TEXT PRIMARY KEY,
  importacao_id TEXT REFERENCES importacoes(id),
  ticker TEXT,
  categoria TEXT,
  plataforma TEXT,
  valor REAL,
  status TEXT DEFAULT 'ok',
  observacao TEXT
);

-- snapshots_patrimonio
CREATE TABLE snapshots_patrimonio (
  id TEXT PRIMARY KEY,
  usuario_id TEXT REFERENCES usuarios(id),
  data TEXT NOT NULL,
  valor_total REAL,
  variacao_percentual REAL
);
```

---

## 5. Épicos, Features e User Stories

### Estrutura de tracking

Vou usar **GitHub Issues + GitHub Projects** (board Kanban) dentro do próprio repositório. O CEO pode ver o progresso a qualquer momento.

---

### ÉPICO 1: Fundação técnica
> Como desenvolvedor, preciso da estrutura base do projeto para que todas as features subsequentes tenham onde morar.

**Features:**
- **F1.1 — Estrutura do monorepo**
  - US: Como dev, quero o monorepo configurado com apps/web, apps/api, servicos/, pacotes/ e banco/ para que cada parte do sistema tenha seu lugar definido
  - Critério: `npm run dev` funciona, TypeScript compila sem erros

- **F1.2 — Design System como código**
  - US: Como dev, quero todos os tokens do brand book (cores, tipografia, espaçamento, sombras, border-radius) implementados como CSS variables para que toda tela use a mesma base visual
  - Critério: Variáveis CSS aplicadas, componentes base renderizam no browser

- **F1.3 — Componentes base**
  - US: Como dev, quero Botao, CampoTexto, Cartao, Selo, Divisor prontos com todas as variantes para compor as telas sem reinventar
  - Critério: Storybook ou página de demonstração com todas as variantes

- **F1.4 — Layout shell**
  - US: Como usuário, quero ver a sidebar com navegação, barra superior com busca e área de conteúdo para navegar entre as seções
  - Critério: Navegação funcional entre rotas vazias

- **F1.5 — Pacote de contratos**
  - US: Como dev, quero os tipos TypeScript de todos os contratos entre serviços definidos em um pacote compartilhado para que nenhuma integração quebre silenciosamente
  - Critério: Pacote contratos/ com interfaces de todos os 6 serviços

---

### ÉPICO 2: Visão da carteira
> Como investidor, quero ver minha carteira consolidada de forma clara para entender o que tenho.

**Features:**
- **F2.1 — Tela Início (Dashboard)**
  - US: Como investidor, quero ver meu patrimônio total, score, retorno 12M, número de ativos, problema principal e ação recomendada ao entrar no app
  - US: Como investidor, quero ver a distribuição da minha carteira por categoria em uma barra visual
  - Critério: Home renderiza idêntica ao wireframe desktop com dados mock

- **F2.2 — Tela Carteira Consolidada**
  - US: Como investidor, quero ver todos os meus ativos em uma tabela com categoria, plataforma, valor, participação e retorno
  - US: Como investidor, quero filtrar meus ativos por tipo (Ações, Fundos, Previdência, Renda Fixa)
  - US: Como investidor, quero ordenar a tabela por participação, valor ou retorno
  - Critério: Tabela funcional com filtros e ordenação

- **F2.3 — Detalhe por categoria**
  - US: Como investidor, quero ver o drill-down de uma categoria (ex: Ações) com concentração, lista de ativos e alertas de risco
  - US: Como investidor, quero ver a visão de Fundos e Previdência separadamente
  - Critério: 2 telas de detalhe navegáveis a partir da Carteira

---

### ÉPICO 3: Autenticação e backend
> Como usuário, preciso criar conta e entrar com segurança para ter meus dados protegidos.

**Features:**
- **F3.1 — Serviço de autenticação** (módulo independente)
  - US: Como usuário, quero criar uma conta com nome, e-mail e senha
  - US: Como usuário, quero entrar com e-mail e senha
  - US: Como sistema, preciso validar JWT em todas as rotas protegidas
  - Critério: Registro + login funcionais, JWT válido retornado

- **F3.2 — Tela de Login**
  - US: Como usuário, quero uma tela de login limpa com campos de e-mail e senha
  - Critério: Login integrado end-to-end com o serviço de auth

- **F3.3 — API Gateway**
  - US: Como dev, quero um gateway que despacha requests para os serviços corretos via contratos tipados
  - Critério: Gateway funcional com middleware de auth

- **F3.4 — Banco de dados D1**
  - US: Como dev, quero o schema D1 com migrations e seed de dados de exemplo
  - Critério: Migrations rodam, seed popula dados do Luiz Mendonça (wireframe)

- **F3.5 — Integração frontend-backend**
  - US: Como dev, quero o cliente API tipado consumindo dados reais do backend
  - Critério: Home e Carteira mostram dados do banco, não mais mock

---

### ÉPICO 4: Importação de dados
> Como investidor, quero importar meus extratos de corretoras para consolidar minha carteira.

**Features:**
- **F4.1 — Serviço de importação** (módulo independente, PLUGÁVEL)
  - US: Como dev, quero um serviço de importação com interface para plugar parsers de diferentes corretoras
  - US: Como sistema, quero aceitar CSV genérico com colunas padronizadas como primeiro parser
  - Critério: Serviço processa CSV, gera preview, confirma importação

- **F4.2 — Tela Importar Extrato**
  - US: Como investidor, quero arrastar um arquivo para importar meu extrato
  - US: Como investidor, quero ver quais corretoras são suportadas
  - US: Como investidor, quero um stepper visual mostrando onde estou no processo (Upload → Revisão → Confirmação)
  - Critério: Drag-and-drop funcional com feedback visual

- **F4.3 — Tela Revisão da Importação**
  - US: Como investidor, quero ver cada linha do extrato importado com status (ok, conflito, erro)
  - US: Como investidor, quero ver contadores (total de linhas, conflitos, erros, válidos)
  - US: Como investidor, quero confirmar apenas os itens válidos
  - Critério: Tabela de preview com status, confirmação persiste no banco

---

### ÉPICO 5: Contexto e histórico
> Como investidor, quero acompanhar minha evolução e manter meu contexto financeiro atualizado.

**Features:**
- **F5.1 — Serviço de perfil** (módulo independente)
  - US: Como sistema, quero armazenar e servir o contexto financeiro do usuário separadamente
  - Critério: CRUD de perfil financeiro via contrato tipado

- **F5.2 — Tela Perfil**
  - US: Como investidor, quero ver e editar meu contexto financeiro (renda, aporte, horizonte, risco, objetivo)
  - US: Como investidor, quero ver minhas plataformas vinculadas com data do último import
  - Critério: Perfil editável integrado com backend

- **F5.3 — Serviço de histórico** (módulo independente)
  - US: Como sistema, quero registrar snapshots mensais do patrimônio automaticamente
  - Critério: Snapshots armazenados e servidos via contrato

- **F5.4 — Tela Histórico**
  - US: Como investidor, quero ver um gráfico da evolução do meu patrimônio ao longo do tempo
  - US: Como investidor, quero ver snapshots mensais com valor e variação
  - US: Como investidor, quero ver eventos relevantes na linha do tempo
  - Critério: Gráfico + snapshots + eventos, filtros de período (3M, 6M, 12M)

- **F5.5 — Estados do sistema**
  - US: Como investidor, quero feedback claro quando não há dados, quando está carregando, quando há erro e quando algo deu certo
  - Critério: 5 estados globais (Empty, Loading, Error, Success, No Results) com copy do brand book

---

### ÉPICO 6: Inteligência e orientação
> Como investidor, quero que o Esquilo me diga o que está errado e o que fazer.

**Features:**
- **F6.1 — Serviço de insights** (módulo independente)
  - US: Como sistema, quero calcular um score de saúde da carteira baseado em regras de diversificação e concentração
  - US: Como sistema, quero identificar o risco principal e a ação prioritária
  - Critério: Motor de regras funcional com score calculado

- **F6.2 — Tela Insights**
  - US: Como investidor, quero ver meu diagnóstico traduzido: risco principal, ação prioritária, ponto positivo
  - US: Como investidor, quero ver meu score atual com barra de progresso e meta
  - Critério: Tela de insights integrada com o serviço

---

### ÉPICO 7: Deploy e primeiro uso
> Como produto, preciso estar no ar e funcional para o primeiro usuário.

**Features:**
- **F7.1 — Deploy Cloudflare**
  - US: Como dev, quero deploy automatizado do frontend (Pages) e backend (Workers)
  - Critério: Produto acessível via URL pública

- **F7.2 — Tela de Registro**
  - US: Como novo usuário, quero criar minha conta com nome, e-mail e senha
  - Critério: Registro funcional com validação

- **F7.3 — Onboarding**
  - US: Como novo usuário, quero um fluxo guiado que pergunta como eu invisto para personalizar minha experiência
  - Critério: 5 passos de onboarding → dados salvos no perfil

- **F7.4 — Fluxo de primeiro uso**
  - US: Como novo usuário, quero ser guiado de Registro → Onboarding → Importar primeiro extrato → Home com dados reais
  - Critério: Fluxo completo end-to-end funcional

---

## 6. Plano de trabalho por sessões

### Sessão 1 — Fundação + Design System + Contratos
**Épico**: 1 (Fundação técnica)
**Features**: F1.1, F1.2, F1.3, F1.4, F1.5

**Entregas**:
- Monorepo configurado (apps/web, apps/api, servicos/, pacotes/, banco/)
- CSS variables com todos os tokens do brand book
- Componentes base: Botao (4 variantes), CampoTexto (4 estados), Cartao (3 variantes), Selo (4 tipos)
- Layout shell: NavegacaoLateral + BarraSuperior + AreaConteudo com rotas
- Pacote contratos/ com interfaces de todos os 6 serviços
- Ícones SVG integrados
- Git repo inicializado

**CEO vê**: Layout do app navegável com sidebar, componentes base renderizando, identidade visual aplicada.
**Dependências**: Nenhuma
**Riscos**: Configuração do monorepo com Cloudflare pode ter fricção
**Critério de conclusão**: `npm run dev` funciona, componentes renderizam, rotas navegam

### Sessão 2 — Home + Carteira (dados mock)
**Épico**: 2 (Visão da carteira)
**Features**: F2.1, F2.2, F2.3

**Entregas**:
- Tela Início completa com todos os blocos do wireframe
- Componentes compostos: CartaoKPI, CartaoAlerta, BarraDistribuicao
- Tela Carteira com tabela, filtros e ordenação
- Telas de detalhe (Ações, Fundos & Previdência)
- Dados mock realistas (R$ 328.420, Score 72, ITSA4, etc.)
- Estados de loading (skeleton)

**CEO vê**: Dashboard completo + carteira navegável. Visual profissional fiel ao wireframe.
**Dependências**: Sessão 1
**Riscos**: Muitos componentes visuais — pode precisar dividir em 2 sessões
**Critério de conclusão**: 4 telas renderizam identicamente aos wireframes

### Sessão 3 — Backend + Auth + D1 + Integração
**Épico**: 3 (Autenticação e backend)
**Features**: F3.1, F3.2, F3.3, F3.4, F3.5

**Entregas**:
- Cloudflare Worker como API Gateway
- Serviço de autenticação (módulo isolado com contrato)
- Schema D1 + migrations + seed
- Tela de Login
- Cliente API tipado
- Home e Carteira consumindo dados do D1 (não mais mock)

**CEO vê**: Login funcional → dados reais na Home e Carteira. Primeiro fluxo end-to-end.
**Dependências**: Sessões 1-2
**Riscos**: Setup D1 local (miniflare) pode ter complexidade
**Critério de conclusão**: Login → Home com dados do banco

### Sessão 4 — Importação completa
**Épico**: 4 (Importação de dados)
**Features**: F4.1, F4.2, F4.3

**Entregas**:
- Serviço de importação (módulo isolado, parser plugável)
- Parser CSV genérico
- Tela Importar com drag-and-drop e stepper
- Tela Revisão com tabela de preview e confirmação
- Dados importados aparecem na Carteira

**CEO vê**: Importa um CSV → vê preview → confirma → dados aparecem na carteira. A feature que torna o produto real.
**Dependências**: Sessão 3
**Riscos**: Parser de CSV pode ter edge cases. Limitar ao formato genérico na MVP.
**Critério de conclusão**: Fluxo Upload → Preview → Confirmar → dados no banco

### Sessão 5 — Perfil + Histórico + Estados
**Épico**: 5 (Contexto e histórico)
**Features**: F5.1, F5.2, F5.3, F5.4, F5.5

**Entregas**:
- Serviço de perfil (módulo isolado)
- Tela Perfil editável
- Serviço de histórico (módulo isolado)
- Tela Histórico com gráfico, snapshots e eventos
- 5 estados globais do sistema (Empty, Loading, Error, Success, No Results)

**CEO vê**: Perfil editável + gráfico de evolução. Estados consistentes em toda a app.
**Dependências**: Sessão 3
**Riscos**: Biblioteca de gráfico pode exigir configuração
**Critério de conclusão**: Perfil salva, Histórico renderiza, estados aplicados em todas as telas

### Sessão 6 — Insights + Score + Polish
**Épico**: 6 (Inteligência)
**Features**: F6.1, F6.2

**Entregas**:
- Serviço de insights (módulo isolado, motor de regras)
- Regras de concentração e diversificação
- Cálculo de score
- Tela Insights com diagnóstico traduzido
- Polish visual: transições, skeleton refinado, ajustes de UI

**CEO vê**: Tela de Insights funcionando com diagnóstico real baseado nos dados da carteira.
**Dependências**: Sessões 4-5
**Riscos**: Regras de Score precisam de definição de produto
**Critério de conclusão**: Score calculado, diagnóstico gerado, tela renderiza

### Sessão 7 — Deploy + Registro + Onboarding + Primeiro uso
**Épico**: 7 (Deploy e primeiro uso)
**Features**: F7.1, F7.2, F7.3, F7.4

**Entregas**:
- Deploy Cloudflare Pages + Workers
- Tela de Registro
- Onboarding (5 passos)
- Fluxo completo: Registro → Onboarding → Importar → Home
- Testes manuais do fluxo completo

**CEO vê**: Produto no ar, acessível por URL. Um novo usuário consegue se registrar, fazer onboarding, importar dados e ver sua carteira.
**Dependências**: Sessões 1-6
**Riscos**: DNS, domínio, config de produção
**Critério de conclusão**: URL pública funcional com fluxo de primeiro uso completo

---

## 7. Ordem ideal de execução

```
Sessão 1: Fundação + Design System + Contratos
    ↓
Sessão 2: Home + Carteira (mock) ← CEO vê o visual
    ↓
Sessão 3: Backend + Auth + D1 ← CEO vê dados reais
    ↓
Sessão 4: Importação ← CEO vê a feature-chave
    ↓
Sessão 5: Perfil + Histórico + Estados ← CEO vê completude
    ↓
Sessão 6: Insights + Score ← CEO vê inteligência
    ↓
Sessão 7: Deploy + Primeiro uso ← CEO vê produto no ar
```

**Justificativa**: Cada sessão entrega algo visível e incrementa sobre a anterior. O CEO nunca fica mais de 1 sessão sem ver progresso tangível.

**Risco de retrabalho**: Se o formato de importação mudar radicalmente, o serviço de importação é isolado — não afeta o resto. Se regras de score mudarem, o serviço de insights é isolado. Essa é a vantagem da arquitetura desacoplada.

---

## 8. Regras obrigatórias de nomenclatura e linguagem

### Princípio
Todo nome que o usuário vê: português. Todo código de domínio: português. Apenas framework/lib: inglês.

**Telas** (PascalCase PT): `TelaInicio`, `TelaCarteira`, `TelaDetalheAcoes`, `TelaImportar`, `TelaInsights`, `TelaHistorico`, `TelaPerfil`, `TelaEntrar`, `TelaCriarConta`

**Menus**: `Início`, `Carteira`, `Importar`, `Insights`, `Histórico`, `Perfil`

**Campos**: `Patrimônio total`, `Score`, `Retorno 12M`, `Renda mensal`, `Aporte mensal`, `E-mail`, `Senha`

**Componentes**: `Botao`, `CampoTexto`, `Cartao`, `Selo`, `NavegacaoLateral`, `BarraSuperior`, `CartaoKPI`, `TabelaAtivos`, `ZonaUpload`

**Serviços**: `autenticacao/`, `carteira/`, `importacao/`, `perfil/`, `insights/`, `historico/`

**Entidades banco**: `usuarios`, `ativos`, `perfil_financeiro`, `importacoes`, `snapshots_patrimonio`

**Ações**: `Entrar`, `Criar conta`, `Importar extrato`, `Confirmar`, `Ver carteira`, `Editar contexto`, `Sair`

**Mensagens**: "142 posições importadas." / "Algo deu errado. Tente novamente." / "Nenhum investimento ainda." / "Lendo sua carteira..."

**Exceções em inglês**: hooks React, nomes de libs, HTTP verbs, tipos nativos, config files

---

## 9. Como vou conduzir o trabalho

### Tracking
GitHub Issues + Projects (Kanban board) no repositório. Cada sessão fecha issues e move cards. CEO pode ver o board a qualquer momento.

### Cada sessão
1. Recapitulo o que foi feito e o que vem agora
2. Executo as features do plano
3. Fecho com demonstração do que foi entregue
4. Atualizo o board de tracking

### Regras
- Se não está no plano da sessão, não entra
- Se surgir ideia boa, anoto para sessão futura
- Se encontrar ambiguidade de produto, pergunto antes de implementar
- Se algo parece errado na documentação, digo
- Se um prazo vai estourar, aviso antes

### Validação dos contratos
Antes de integrar qualquer serviço, o contrato TypeScript é escrito e revisado. Implementação só começa depois do contrato aprovado. Isso evita o problema do projeto anterior.

---

## 10. Próximos passos imediatos

1. **Confirmar com o CEO**: Onde está o projeto anterior com Cloudflare/D1? Preciso ver a configuração existente para reaproveitar.
2. **Inicializar git** nesta pasta
3. **Criar estrutura do monorepo** com a arquitetura de serviços desacoplados
4. **Implementar design system** como código
5. **Criar pacote de contratos** com interfaces tipadas de todos os serviços

A primeira entrega útil é: **layout shell navegável + design system + contratos tipados**. Isso é a fundação sobre a qual tudo se constrói.

---

## Arquivos de referência

| Arquivo | Conteúdo |
|---------|----------|
| `leia-me/Marca/Esquilo Invest BrandBook v2026.pdf` | Estratégia, logo, paleta, tipografia, tom de voz |
| `leia-me/Marca/Esquilo_Invest_SistemaExecutavel_v2026.pdf` | Tokens operacionais, contraste, UI system, componentes |
| `leia-me/Marca/Esquilo_Invest_WebappTelas_v2026_melhorado.pdf` | 11 telas desktop com densidade real |
| `leia-me/Marca/DESIGN_SYSTEM_COMPONENTS.md` | Especificação detalhada de componentes |
| `leia-me/Marca/SCREENS_BREAKDOWN.md` | Breakdown das 17 telas com layouts e APIs |
| `leia-me/Marca/ESQUILO_INVEST_DESIGN_SYSTEM.md` | Design system completo |
| `leia-me/Arquitetura/Arquitetura Esquilo Invest - Serviços Expandidos.pdf` | Arquitetura backend (referência) |
| `assets/icones/` | 55+ SVGs prontos |
| `assets/logo/` | Logos SVG |

## Verificação por sessão

1. `npm run dev` — frontend renderiza
2. Comparação visual com PDFs de wireframe
3. Verificar contratos TypeScript compilam sem erro
4. Navegação entre rotas funcionando
5. A partir da sessão 3: endpoints respondendo, dados do D1
6. A partir da sessão 7: URL pública funcional
