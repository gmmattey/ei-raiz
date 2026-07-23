const esquiloWebappEstrutural = {
  meta: {
    name: 'Esquilo Invest - Webapp estrutural',
    purpose: 'Wirefront narrativo em jsFigma para mapear o produto final navegavel sem design final.',
    sourceOfTruth: [
      'docs/brand/esquilo_design_system.md',
      'docs/brand/esquilo_brand_guide.md',
      'docs/brand/esquilo_ui_examples.md',
      'docs/20_product/telas_e_servicos.md',
      'docs/product/e2e_user_stories_full.md',
      'services/api/openapi.yaml',
      'database/d1/schema.sql'
    ],
    constraints: [
      'Nao criar nova identidade visual.',
      'Nao transformar o wirefront em UI high fidelity.',
      'Nao prometer tela pronta sem lastro tecnico.'
    ]
  },
  visualBase: {
    gridBase: 8,
    containerPaddingMobile: 16,
    containerPaddingDesktop: 24,
    maxContentWidth: 1280,
    shell: {
      appFrameWidth: 1440,
      leftNavWidth: 248,
      topBarHeight: 72,
      contentGap: 24
    },
    colors: {
      background: '#061018',
      card: '#0C1823',
      text: '#EFF5F7',
      textMuted: '#9DB1BC',
      clarity: '#56D5DE',
      action: '#F7B955',
      positive: '#7ED9A3',
      alert: '#FF6B6B'
    },
    typography: {
      title: { family: 'Sora', size: 28, weight: 700 },
      sectionTitle: { family: 'Sora', size: 22, weight: 700 },
      body: { family: 'Inter', size: 14, weight: 400 },
      data: { family: 'Inter', size: 14, weight: 600, tabularNums: true }
    },
    components: {
      card: { radius: 16, padding: 16, background: '#0C1823' },
      primaryButton: { radius: 12, fill: '#56D5DE', text: '#061018' },
      secondaryButton: { radius: 12, stroke: '#56D5DE', fill: 'transparent' },
      dangerButton: { radius: 12, fill: '#FF6B6B', text: '#061018' },
      icons: { stroke: 1.5, corner: 'rounded', library: ['wallet', 'chart', 'alert', 'check', 'upload', 'history', 'user', 'asset'] }
    }
  },
  shell: {
    principle: 'Aplicacao logada com navegacao estavel, leitura vertical e modulos reaproveitaveis.',
    regions: [
      {
        id: 'left_nav',
        label: 'Navegacao principal',
        content: ['logo', 'home', 'carteira', 'importacoes', 'historico', 'radar', 'perfil']
      },
      {
        id: 'top_bar',
        label: 'Barra superior',
        content: ['titulo da tela', 'contexto do portfolio', 'acoes rapidas', 'status do sistema']
      },
      {
        id: 'content',
        label: 'Conteudo',
        content: ['hero ou resumo', 'bloco principal', 'bloco secundario', 'estados e acoes']
      },
      {
        id: 'right_rail_optional',
        label: 'Rail contextual opcional',
        content: ['atalhos', 'resumos curtos', 'ajuda operacional'],
        whenToUse: 'Somente em telas de leitura ou revisao com ganho real de contexto.'
      }
    ],
    mobileFutureGuardrails: [
      'Toda secao precisa funcionar empilhada.',
      'Nao depender de tabela larga como formato unico.',
      'A navegacao principal deve poder migrar para bottom nav.',
      'Cards e listas devem suportar expansao vertical.'
    ]
  },
  globalStates: [
    { id: 'loading', pattern: 'skeleton', rule: 'mostrar progresso sem travar leitura' },
    { id: 'empty', pattern: 'mensagem + proximo passo', rule: 'nunca deixar a tela vazia sem orientar' },
    { id: 'error', pattern: 'mensagem humana + acao de recuperacao', rule: 'nao expor erro tecnico cru' },
    { id: 'insufficient_data', pattern: 'contexto curto + CTA', rule: 'explicar o que falta para a analise existir' },
    { id: 'operational_review', pattern: 'lista de problemas + decisoes', rule: 'usado no fluxo de importacao e operacao' }
  ],
  screens: [
    {
      id: 'splash_gate',
      title: 'Splash e gate de sessao',
      route: '/app',
      area: 'entrada',
      purpose: 'Validar saude do ambiente, sessao e proxima rota.',
      layout: {
        structure: ['logo', 'mensagem curta', 'estado do carregamento', 'redirecionamento'],
        notes: 'Sem excesso visual. E uma tela de decisao de rota.'
      },
      backendCoverage: {
        status: 'parcial',
        endpoints: ['GET /v1/health', 'GET /v1/auth/session'],
        source: 'starter worker'
      },
      databaseCoverage: {
        status: 'conflitado',
        tables: ['users'],
        risks: ['starter usa auth_sessions, mas auth_sessions nao existe no schema oficial atual']
      },
      issueRefs: ['US002', 'E2E-001', 'TEC-008', 'TEC-032']
    },
    {
      id: 'auth_entry',
      title: 'Cadastro / entrada / recuperacao',
      route: '/entrar',
      area: 'entrada',
      purpose: 'Criar acesso, abrir sessao e recuperar conta.',
      layout: {
        structure: ['hero curto', 'tabs entrar/cadastrar', 'formulario', 'acao primaria', 'acao secundaria'],
        notes: 'Fluxo unico, simples e sem parecer banco.'
      },
      backendCoverage: {
        status: 'parcial',
        endpoints: ['POST /v1/auth/register', 'POST /v1/auth/login', 'POST /v1/auth/recover', 'POST /v1/auth/logout', 'GET /v1/auth/session'],
        source: 'starter worker'
      },
      databaseCoverage: {
        status: 'conflitado',
        tables: ['users'],
        risks: ['starter usa auth_sessions e colunas de portfolio principal ausentes no schema oficial']
      },
      issueRefs: ['US002', 'TEC-032']
    },
    {
      id: 'onboarding_flow',
      title: 'Onboarding financeiro',
      route: '/onboarding',
      area: 'contexto',
      purpose: 'Coletar renda, aporte, objetivo, horizonte e risco em poucas etapas.',
      layout: {
        structure: ['header simples', 'stepper curto', 'pergunta atual', 'ajuda contextual', 'acoes voltar/continuar'],
        notes: 'Pensado em etapas curtas e modulares para futura portabilidade mobile.'
      },
      backendCoverage: {
        status: 'parcial',
        endpoints: ['GET /v1/profile/context', 'PUT /v1/profile/context'],
        source: 'starter worker'
      },
      databaseCoverage: {
        status: 'parcial',
        tables: ['user_financial_context', 'users'],
        risks: ['persistencia de contexto existe, mas o gate de sessao continua dependendo de auth_sessions ausente']
      },
      issueRefs: ['US004-US010', 'UX-004', 'UX-005', 'UX-006', 'TEC-016']
    },
    {
      id: 'portfolio_entry_gate',
      title: 'Entrada da carteira',
      route: '/onboarding/portfolio-entry',
      area: 'contexto',
      purpose: 'Escolher como a carteira entra: importar arquivo ou inserir manualmente.',
      layout: {
        structure: ['contexto curto', 'duas acoes principais', 'bloco de confianca', 'atalho para pular e voltar depois'],
        notes: 'Tela de decisao operacional; precisa conectar onboarding e importacao.'
      },
      backendCoverage: {
        status: 'parcial',
        endpoints: ['GET /v1/onboarding/portfolio-entry'],
        source: 'starter worker'
      },
      databaseCoverage: {
        status: 'parcial',
        tables: ['user_financial_context', 'portfolios'],
        risks: ['decisao de rota depende de sessao e portfolio principal fora do schema oficial']
      },
      issueRefs: ['US011', 'US016', 'UX-006', 'E2E-001']
    },
    {
      id: 'home',
      title: 'Home',
      route: '/home',
      area: 'leitura principal',
      purpose: 'Dizer como a carteira esta, qual o principal problema e qual a proxima acao.',
      layout: {
        structure: ['hero com patrimonio, score e disponivel', 'problema principal', 'acao principal', 'distribuicao', 'insights', 'atalhos para areas relevantes'],
        notes: 'Leitura vertical forte. Nada de grafico decorativo.'
      },
      backendCoverage: {
        status: 'parcial',
        endpoints: ['GET /v1/dashboard/home', 'GET /v1/analysis'],
        source: 'starter worker'
      },
      databaseCoverage: {
        status: 'parcial',
        tables: ['portfolio_snapshots', 'portfolio_snapshot_positions', 'portfolio_analyses', 'analysis_insights', 'user_financial_context'],
        risks: ['consulta depende de auth_sessions e portfolio principal nao refletidos no schema oficial']
      },
      issueRefs: ['US020-US027', 'UX-007-UX-013', 'TEC-009', 'TEC-010', 'E2E-009']
    },
    {
      id: 'portfolio',
      title: 'Carteira',
      route: '/carteira',
      area: 'leitura principal',
      purpose: 'Listar holdings por categoria, permitir filtros e abrir detalhe.',
      layout: {
        structure: ['resumo da carteira', 'barra de filtros', 'grupos por categoria', 'lista de holdings', 'atalhos de acao'],
        notes: 'Evitar tabela larga como formato unico. Holdings devem funcionar como linhas expansivas.'
      },
      backendCoverage: {
        status: 'parcial',
        endpoints: ['GET /v1/portfolio'],
        source: 'starter worker'
      },
      databaseCoverage: {
        status: 'parcial',
        tables: ['portfolio_positions', 'assets', 'asset_types', 'platforms', 'portfolios'],
        risks: ['backend le por sessao autenticada que hoje nao esta refletida no schema oficial']
      },
      issueRefs: ['US028-US033', 'UX-014-UX-018', 'TEC-011', 'TEC-012', 'E2E-010', 'E2E-011']
    },
    {
      id: 'holding_detail',
      title: 'Detalhe do investimento',
      route: '/carteira/:holdingId',
      area: 'leitura principal',
      purpose: 'Aprofundar papel, metricas, sinais e recomendacao daquele ativo.',
      layout: {
        structure: ['cabecalho do ativo', 'metricas', 'contexto da categoria', 'sinais positivos e de atencao', 'recomendacao ligada ao alvo', 'origem e links externos quando existirem'],
        notes: 'Mesmo padrao para ativo, fundo e previdencia, com blocos especificos reaproveitaveis.'
      },
      backendCoverage: {
        status: 'parcial',
        endpoints: ['GET /v1/portfolio/{portfolioId}/holdings/{holdingId}'],
        source: 'starter worker'
      },
      databaseCoverage: {
        status: 'parcial',
        tables: ['portfolio_positions', 'assets', 'asset_types', 'platforms', 'portfolio_analyses'],
        risks: ['consegue sustentar leitura base; falta lastro claro para todas as variacoes especificas no schema oficial']
      },
      issueRefs: ['US033-US041', 'UX-019-UX-024', 'TEC-013', 'TEC-014', 'E2E-012-E2E-014']
    },
    {
      id: 'imports_center',
      title: 'Central de importacoes',
      route: '/importacoes',
      area: 'atualizacao de dados',
      purpose: 'Mostrar importacoes anteriores, seus resultados e o proximo passo operacional.',
      layout: {
        structure: ['resumo de importacoes', 'lista com status', 'atalho para nova importacao', 'atalho para revisar item aberto'],
        notes: 'Tela operacional, nao promocional.'
      },
      backendCoverage: {
        status: 'parcial',
        endpoints: ['GET /v1/history/imports'],
        source: 'starter worker'
      },
      databaseCoverage: {
        status: 'parcial',
        tables: ['imports', 'portfolio_snapshots'],
        risks: ['starter espera import_id em snapshots e sessao autenticada; schema oficial diverge nesses pontos']
      },
      issueRefs: ['US019', 'UX-035', 'UX-036']
    },
    {
      id: 'import_start',
      title: 'Importar arquivo',
      route: '/importacoes/nova',
      area: 'atualizacao de dados',
      purpose: 'Receber arquivo ou entrada inicial e disparar preview.',
      layout: {
        structure: ['explicacao curta', 'dropzone/upload', 'instrucoes', 'baixar templates', 'acao primaria'],
        notes: 'Precisa deixar claro que nada entra direto.'
      },
      backendCoverage: {
        status: 'parcial',
        endpoints: ['POST /v1/imports/start'],
        source: 'starter worker'
      },
      databaseCoverage: {
        status: 'parcial',
        tables: ['imports', 'import_rows'],
        risks: ['start persiste importacao, mas o pipeline completo ainda depende de colunas extras no schema do starter']
      },
      issueRefs: ['US011', 'UX-025', 'UX-026', 'TEC-018', 'TEC-021', 'E2E-004']
    },
    {
      id: 'import_preview',
      title: 'Preview da importacao',
      route: '/importacoes/:importId/preview',
      area: 'atualizacao de dados',
      purpose: 'Permitir revisao de linhas, conflitos e validade antes do commit.',
      layout: {
        structure: ['resumo da rodada', 'lista revisavel de linhas', 'warnings', 'conflitos', 'acoes corrigir/confirmar/cancelar'],
        notes: 'Essa e a tela central de confianca da importacao.'
      },
      backendCoverage: {
        status: 'parcial',
        endpoints: ['GET /v1/imports/{importId}/preview', 'PATCH /v1/imports/{importId}/rows/{rowId}', 'POST /v1/imports/{importId}/rows/{rowId}/duplicate-resolution', 'POST /v1/imports/{importId}/commit'],
        source: 'starter worker'
      },
      databaseCoverage: {
        status: 'conflitado',
        tables: ['imports', 'import_rows', 'assets', 'portfolio_positions', 'portfolio_snapshots', 'portfolio_snapshot_positions'],
        risks: ['commit e matching de ativos usam normalized_name e is_custom em assets, mas esses campos nao existem no schema oficial']
      },
      issueRefs: ['US012-US015', 'UX-027-UX-029', 'TEC-019', 'TEC-022-TEC-024', 'E2E-005-E2E-007']
    },
    {
      id: 'import_engine_status',
      title: 'Status operacional do motor',
      route: '/importacoes/:importId/status',
      area: 'atualizacao de dados',
      purpose: 'Mostrar em que estado o processamento esta e se ja pode seguir para revisao ou commit.',
      layout: {
        structure: ['headline do estado', 'contadores operacionais', 'estado do documento', 'atalhos para preview, detalhe e conflitos'],
        notes: 'Leitura curta e objetiva, pensada para operacao.'
      },
      backendCoverage: {
        status: 'parcial',
        endpoints: ['GET /v1/imports/{importId}/engine-status'],
        source: 'starter worker'
      },
      databaseCoverage: {
        status: 'conflitado',
        tables: ['imports', 'import_rows'],
        risks: ['dados base existem, mas o pipeline real continua afetado pelas divergencias de schema do starter']
      },
      issueRefs: ['TEC-052']
    },
    {
      id: 'import_operational_detail',
      title: 'Detalhe operacional do processamento',
      route: '/importacoes/:importId/detalhe',
      area: 'atualizacao de dados',
      purpose: 'Permitir leitura por documento, erros, conflitos, baixa confianca e decisoes tomadas.',
      layout: {
        structure: ['resumo operacional', 'issue summary', 'decision summary', 'lista detalhada de linhas', 'atalhos de intervencao futura'],
        notes: 'Base para futura acao manual. Ainda sem backoffice de edicao completo.'
      },
      backendCoverage: {
        status: 'parcial',
        endpoints: ['GET /v1/imports/{importId}/detail', 'GET /v1/imports/{importId}/conflicts'],
        source: 'starter worker'
      },
      databaseCoverage: {
        status: 'conflitado',
        tables: ['imports', 'import_rows'],
        risks: ['leitura ja existe, mas a cadeia completa continua presa a conflitos entre starter e schema oficial']
      },
      issueRefs: ['TEC-053']
    },
    {
      id: 'manual_input',
      title: 'Input manual de posicao',
      route: '/carteira/manual',
      area: 'atualizacao de dados',
      purpose: 'Permitir cadastro manual quando o arquivo nao for a melhor entrada.',
      layout: {
        structure: ['escolha do tipo de ativo', 'campos minimos', 'origem da posicao', 'confirmacao', 'atalho para revisar depois'],
        notes: 'Precisa usar a mesma logica de preview para nao criar dois mundos.'
      },
      backendCoverage: {
        status: 'sem_evidencia_suficiente',
        endpoints: [],
        source: 'somente ponte temporaria citada na documentacao'
      },
      databaseCoverage: {
        status: 'parcial',
        tables: ['portfolio_positions', 'assets', 'asset_types', 'platforms'],
        risks: ['o banco comporta posicao manual, mas falta contrato e fluxo oficial integrado']
      },
      issueRefs: ['US016-US018', 'UX-030', 'E2E-008']
    },
    {
      id: 'history',
      title: 'Historico',
      route: '/historico',
      area: 'leitura complementar',
      purpose: 'Mostrar snapshots, eventos e evolucao da carteira no tempo.',
      layout: {
        structure: ['hero de evolucao', 'linha do tempo de snapshots', 'eventos relevantes', 'atalhos para analise associada'],
        notes: 'Precisa sustentar comparacao e tendencia sem virar BI.'
      },
      backendCoverage: {
        status: 'parcial',
        endpoints: ['GET /v1/history/snapshots'],
        source: 'starter worker'
      },
      databaseCoverage: {
        status: 'parcial',
        tables: ['portfolio_snapshots', 'portfolio_analyses', 'operational_events'],
        risks: ['snapshots existem; trilha de eventos ainda nao esta fechada']
      },
      issueRefs: ['US067-US070', 'UX-034-UX-037', 'TEC-017', 'TEC-018', 'E2E-016-E2E-017']
    },
    {
      id: 'radar',
      title: 'Radar / analise',
      route: '/radar',
      area: 'leitura complementar',
      purpose: 'Aprofundar score, alertas, problema principal e acao principal.',
      layout: {
        structure: ['headline executiva', 'score e breakdown', 'lista priorizada de alertas', 'problema principal', 'acao principal', 'insights auxiliares'],
        notes: 'Evolucao natural da Home; nao deve repetir tudo sem filtro.'
      },
      backendCoverage: {
        status: 'parcial',
        endpoints: ['GET /v1/analysis'],
        source: 'starter worker + modulos isolados em backend/modules'
      },
      databaseCoverage: {
        status: 'parcial',
        tables: ['portfolio_analyses', 'analysis_insights', 'user_financial_context', 'portfolio_snapshots'],
        risks: ['modelo sustenta analise derivada, mas alertas detalhados e historico de alertas ainda nao tem persistencia fechada']
      },
      issueRefs: ['US042-US054', 'UX-038-UX-043', 'TEC-027-TEC-031', 'E2E-015']
    },
    {
      id: 'alerts',
      title: 'Alertas',
      route: '/radar/alertas',
      area: 'leitura complementar',
      purpose: 'Listar alertas ativos e abrir detalhe da acao recomendada.',
      layout: {
        structure: ['filtro por severidade', 'lista priorizada', 'acao sugerida por item', 'atalho para alvo relacionado'],
        notes: 'A lista precisa caber no web hoje e migrar para cards no mobile depois.'
      },
      backendCoverage: {
        status: 'sem_evidencia_suficiente',
        endpoints: [],
        source: 'alertas aparecem embutidos na analise, mas nao ha rota oficial dedicada'
      },
      databaseCoverage: {
        status: 'sem_evidencia_suficiente',
        tables: ['analysis_insights', 'operational_events'],
        risks: ['nao existe persistencia fechada de historico de alertas enviados e cooldown']
      },
      issueRefs: ['US048-US054', 'UX-041-UX-042', 'TEC-029', 'US090-US091']
    },
    {
      id: 'profile',
      title: 'Perfil e configuracao',
      route: '/perfil',
      area: 'leitura complementar',
      purpose: 'Revisar contexto salvo, ajustar preferencias e ver estado do sistema.',
      layout: {
        structure: ['cabecalho do perfil', 'contexto financeiro', 'preferencias visuais', 'saude do app', 'canais conectados'],
        notes: 'Uma tela so; subdividida em secoes reaproveitaveis.'
      },
      backendCoverage: {
        status: 'parcial',
        endpoints: ['GET /v1/profile/context', 'PUT /v1/profile/context', 'GET /v1/health'],
        source: 'starter worker'
      },
      databaseCoverage: {
        status: 'parcial',
        tables: ['user_financial_context', 'users'],
        risks: ['canais de notificacao e preferencias de entrega nao possuem modelo oficial no schema atual']
      },
      issueRefs: ['US075-US079', 'UX-031-UX-033', 'TEC-015-TEC-016', 'E2E-003']
    },
    {
      id: 'goals_and_simulators',
      title: 'Metas e simuladores',
      route: '/planejamento',
      area: 'evolucao futura',
      purpose: 'Simular meta, prazo, aporte e decisoes de vida sem quebrar o foco do produto.',
      layout: {
        structure: ['formulario curto', 'resultado projetado', 'gap para meta', 'ajuste recomendado'],
        notes: 'Blocos simples, sem calculadora gigante.'
      },
      backendCoverage: {
        status: 'sem_evidencia_suficiente',
        endpoints: [],
        source: 'somente backlog e wireframe'
      },
      databaseCoverage: {
        status: 'sem_evidencia_suficiente',
        tables: [],
        risks: ['nao ha modelo oficial de metas, simulacoes ou decisoes de vida no schema atual']
      },
      issueRefs: ['US055-US061', 'UX-044-UX-047']
    }
  ],
  executionPlan: [
    {
      order: 1,
      focus: 'Fechar shell do webapp e estados compartilhados',
      reason: 'Sem shell, navegacao e estados comuns, o produto nao fica coerente entre telas.',
      issues: ['UX-001', 'UX-003', 'TEC-038', 'TEC-039']
    },
    {
      order: 2,
      focus: 'Consolidar auth e sessao no schema oficial',
      reason: 'Hoje o starter depende de auth_sessions e portfolio principal que nao batem com o schema oficial.',
      issues: ['TEC-004', 'TEC-032']
    },
    {
      order: 3,
      focus: 'Integrar onboarding, perfil e entrada da carteira',
      reason: 'Esse bloco define a primeira jornada util do produto.',
      issues: ['UX-004-UX-006', 'TEC-015', 'TEC-016']
    },
    {
      order: 4,
      focus: 'Integrar Home, Carteira e Detalhe em apps/web',
      reason: 'Esse e o nucleo do webapp navegavel.',
      issues: ['UX-007-UX-024', 'TEC-009-TEC-014', 'TEC-040-TEC-042']
    },
    {
      order: 5,
      focus: 'Integrar fluxo completo de importacao',
      reason: 'Importacao e a principal entrada de dados do produto.',
      issues: ['UX-025-UX-030', 'TEC-018-TEC-024', 'TEC-043', 'TEC-052', 'TEC-053']
    },
    {
      order: 6,
      focus: 'Fechar Radar, alertas e Historico',
      reason: 'A experiencia analitica depende de leitura consistente apos a carteira existir.',
      issues: ['UX-034-UX-043', 'TEC-017', 'TEC-018', 'TEC-027-TEC-031', 'TEC-044']
    },
    {
      order: 7,
      focus: 'Fechar canais, notificacoes e operacao',
      reason: 'Nao faz sentido prometer notificacao ou monitoramento sem produto minimamente integrado.',
      issues: ['US071-US074', 'TEC-033', 'TEC-047-TEC-049']
    },
    {
      order: 8,
      focus: 'Abrir metas e simuladores',
      reason: 'Evolucao futura; nao sustenta o primeiro webapp navegavel.',
      issues: ['US055-US061', 'UX-044-UX-047']
    }
  ]
};

module.exports = {
  esquiloWebappEstrutural
};
