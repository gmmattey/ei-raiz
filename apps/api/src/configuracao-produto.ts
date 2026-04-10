type MenuConfig = {
  chave: string;
  label: string;
  path: string;
  ordem: number;
  visivel: boolean;
};

type AppConfig = {
  score: unknown;
  flags: Record<string, boolean>;
  menus: MenuConfig[];
};

export type BlocoConteudo = {
  chave: string;
  modulo: string;
  tipo: "texto" | "markdown" | "json" | "boolean";
  valor: string;
  visivel: boolean;
  ordem: number;
  atualizadoEm: string | null;
};

type BlocoConteudoEntrada = Omit<BlocoConteudo, "atualizadoEm">;

export type CorretoraSuportada = {
  codigo: string;
  nome: string;
  status: "ativo" | "beta" | "planejado";
  mensagemAjuda: string;
  atualizadoEm: string | null;
};

type CorretoraSuportadaEntrada = Omit<CorretoraSuportada, "atualizadoEm">;

export type AdminUsuario = {
  email: string;
  ativo: boolean;
  concedidoPor: string | null;
  atualizadoEm: string | null;
};

export type LogAuditoriaAdmin = {
  id: string;
  acao: string;
  alvo: string;
  payloadJson: string;
  autorEmail: string;
  criadoEm: string;
};

const defaultMenus: MenuConfig[] = [
  { chave: "home", label: "Home", path: "/home", ordem: 1, visivel: true },
  { chave: "dashboard", label: "Dashboard", path: "/dashboard", ordem: 2, visivel: true },
  { chave: "carteira", label: "Carteira", path: "/carteira", ordem: 3, visivel: true },
  { chave: "aportes", label: "Aportes", path: "/aportes", ordem: 4, visivel: true },
  { chave: "insights", label: "Insights", path: "/insights", ordem: 5, visivel: true },
  { chave: "historico", label: "Histórico", path: "/historico", ordem: 6, visivel: true },
  { chave: "importar", label: "Importar", path: "/importar", ordem: 7, visivel: true },
];

const defaultFlags: Record<string, boolean> = {
  insights_historico: true,
  telegram_alertas: false,
  score_unico_v1: true,
  landing_faq: true,
  landing_proposta: true,
  home_quick_actions: true,
  importacao_bloco_corretoras: true,
};

const defaultScoreConfig = {
  pesos: {
    aderenciaPerfil: 25,
    qualidadeCarteira: 25,
    consistenciaAportes: 15,
    adequacaoObjetivo: 15,
    historicoMomentoVida: 20,
  },
  thresholds: {
    criticoMax: 39,
    fragilMax: 59,
    regularMax: 74,
    bomMax: 89,
  },
  penalidades: {
    perfilConservadorRvAlto: 10,
    perfilModeradoRvAlto: 6,
    perfilArrojadoRvBaixo: 4,
    horizonteCurtoAgressivo: 5,
    rendaBaixaVolatilidadeAlta: 4,
    maiorAtivoAlto: 6,
    top3Concentrado: 5,
    classeUnica: 6,
    poucosAtivos: 4,
    semDefensivo: 4,
    objetivoPreservacaoRisco: 7,
    objetivoCrescimentoDefensivo: 5,
    objetivoRendaSemBase: 4,
    objetivoAposentadoriaSemConsistencia: 3,
  },
};

const defaultBlocosConteudo: BlocoConteudo[] = [
  { chave: "landing.hero.titulo", modulo: "landing", tipo: "texto", valor: "Sua carteira merece", visivel: true, ordem: 1, atualizadoEm: null },
  { chave: "landing.hero.titulo_destaque", modulo: "landing", tipo: "texto", valor: "consolidação e clareza.", visivel: true, ordem: 2, atualizadoEm: null },
  { chave: "landing.hero.subtitulo", modulo: "landing", tipo: "texto", valor: "Consolidação real, diagnóstico claro e decisão orientada.", visivel: true, ordem: 3, atualizadoEm: null },
  { chave: "landing.hero.descricao", modulo: "landing", tipo: "texto", valor: "Centralize seus ativos, entenda concentração e risco da carteira e receba uma orientação objetiva do próximo passo.", visivel: true, ordem: 4, atualizadoEm: null },
  { chave: "landing.hero.cta_primario", modulo: "landing", tipo: "texto", valor: "Ver como funciona", visivel: true, ordem: 5, atualizadoEm: null },
  { chave: "landing.hero.cta_secundario", modulo: "landing", tipo: "texto", valor: "Saber mais sobre a gente", visivel: true, ordem: 6, atualizadoEm: null },
  { chave: "landing.como_funciona.titulo", modulo: "landing", tipo: "texto", valor: "Entenda como a gente te ajuda", visivel: true, ordem: 10, atualizadoEm: null },
  { chave: "landing.proposta.titulo", modulo: "landing", tipo: "texto", valor: "Acesso apenas leitura. Zero execução.", visivel: true, ordem: 20, atualizadoEm: null },
  { chave: "landing.footer.cta_titulo", modulo: "landing", tipo: "texto", valor: "O diagnóstico leva menos de 5 minutos.", visivel: true, ordem: 30, atualizadoEm: null },
  { chave: "landing.footer.cta_descricao", modulo: "landing", tipo: "texto", valor: "Crie sua conta, importe seu CSV e tenha uma leitura clara da sua carteira em minutos.", visivel: true, ordem: 31, atualizadoEm: null },
  { chave: "landing.footer.cta_botao", modulo: "landing", tipo: "texto", valor: "Acessar plataforma", visivel: true, ordem: 32, atualizadoEm: null },
  { chave: "home.cartao_principal.titulo", modulo: "home", tipo: "texto", valor: "Patrimônio Total", visivel: true, ordem: 100, atualizadoEm: null },
  { chave: "home.cartao_principal.sem_base", modulo: "home", tipo: "texto", valor: "Sua carteira ainda está vazia. Importe um CSV em /importar para liberar Home, Carteira, Insights e Histórico com dados reais.", visivel: true, ordem: 101, atualizadoEm: null },
  { chave: "home.quick_actions.titulo", modulo: "home", tipo: "texto", valor: "Acesso Rápido", visivel: true, ordem: 102, atualizadoEm: null },
  { chave: "importacao.upload.titulo", modulo: "importacao", tipo: "texto", valor: "Atualizar Carteira", visivel: true, ordem: 200, atualizadoEm: null },
  { chave: "importacao.upload.descricao", modulo: "importacao", tipo: "texto", valor: "Envie seu CSV e valide linha por linha antes de confirmar.", visivel: true, ordem: 201, atualizadoEm: null },
  { chave: "importacao.corretoras.titulo", modulo: "importacao", tipo: "texto", valor: "Integrações bancárias", visivel: true, ordem: 202, atualizadoEm: null },
  { chave: "importacao.corretoras.descricao", modulo: "importacao", tipo: "texto", valor: "Fluxo atual da plataforma: importação por CSV com revisão linha a linha antes de confirmar.", visivel: true, ordem: 203, atualizadoEm: null },
];

const defaultCorretoras: CorretoraSuportada[] = [
  { codigo: "xp", nome: "XP Investimentos", status: "ativo", mensagemAjuda: "Suportado via CSV padrão Esquilo.", atualizadoEm: null },
  { codigo: "rico", nome: "Rico", status: "ativo", mensagemAjuda: "Suportado via CSV padrão Esquilo.", atualizadoEm: null },
  { codigo: "itau", nome: "Itaú", status: "beta", mensagemAjuda: "Suporte parcial, revisar preview antes de confirmar.", atualizadoEm: null },
  { codigo: "nubank", nome: "Nubank", status: "planejado", mensagemAjuda: "Mapeado para evolução de integração.", atualizadoEm: null },
];

const nowIso = (): string => new Date().toISOString();

export async function obterAppConfig(db: D1Database, options?: { incluirOcultos?: boolean }): Promise<AppConfig> {
  let scoreRow: { valor_json: string } | null = null;
  let flagsRows: Array<{ chave: string; habilitada: number }> = [];
  let menusRows: Array<{ chave: string; label: string; path: string; ordem: number; visivel: number }> = [];
  try {
    const [score, flags, menus] = await Promise.all([
      db.prepare("SELECT valor_json FROM configuracoes_produto WHERE chave = ? LIMIT 1").bind("score.v1").first<{ valor_json: string }>(),
      db.prepare("SELECT chave, habilitada FROM feature_flags").all<{ chave: string; habilitada: number }>(),
      db
        .prepare("SELECT chave, label, path, ordem, visivel FROM configuracoes_menu ORDER BY ordem ASC")
        .all<{ chave: string; label: string; path: string; ordem: number; visivel: number }>(),
    ]);
    scoreRow = score;
    flagsRows = flags.results ?? [];
    menusRows = menus.results ?? [];
  } catch {
    // Fallback completo para ambientes sem migração do módulo ADM.
  }

  let score = defaultScoreConfig;
  if (scoreRow?.valor_json) {
    try {
      score = { ...defaultScoreConfig, ...(JSON.parse(scoreRow.valor_json) as object) };
    } catch {
      score = defaultScoreConfig;
    }
  }

  const flags: Record<string, boolean> = { ...defaultFlags };
  for (const item of flagsRows) flags[item.chave] = Boolean(item.habilitada);

  const menusBase = menusRows.length ? menusRows : defaultMenus;
  const menusOrdenados = menusBase
    .map((item) => ({
      chave: item.chave,
      label: item.label,
      path: item.path,
      ordem: item.ordem,
      visivel: Boolean(item.visivel),
    }))
    .sort((a, b) => a.ordem - b.ordem);

  return {
    score,
    flags,
    menus: options?.incluirOcultos ? menusOrdenados : menusOrdenados.filter((item) => item.visivel),
  };
}

export async function obterConteudoApp(db: D1Database, options?: { incluirOcultos?: boolean }): Promise<{ blocos: BlocoConteudo[]; mapa: Record<string, string> }> {
  let rows: Array<{
    chave: string;
    modulo: string;
    tipo: string;
    valor: string;
    visivel: number;
    ordem: number;
    atualizado_em: string | null;
  }> = [];
  try {
    const resultado = await db
      .prepare("SELECT chave, modulo, tipo, valor, visivel, ordem, atualizado_em FROM content_blocks ORDER BY modulo ASC, ordem ASC, chave ASC")
      .all<{
        chave: string;
        modulo: string;
        tipo: string;
        valor: string;
        visivel: number;
        ordem: number;
        atualizado_em: string | null;
      }>();
    rows = resultado.results ?? [];
  } catch {
    rows = [];
  }

  const blocos = (rows.length
    ? rows.map((item) => ({
        chave: item.chave,
        modulo: item.modulo,
        tipo: (item.tipo as BlocoConteudo["tipo"]) || "texto",
        valor: item.valor,
        visivel: Boolean(item.visivel),
        ordem: item.ordem ?? 0,
        atualizadoEm: item.atualizado_em ?? null,
      }))
    : defaultBlocosConteudo
  )
    .filter((item) => options?.incluirOcultos || item.visivel)
    .sort((a, b) => a.ordem - b.ordem || a.chave.localeCompare(b.chave));

  const mapa: Record<string, string> = {};
  for (const bloco of blocos) mapa[bloco.chave] = bloco.valor;
  return { blocos, mapa };
}

export async function atualizarConteudoApp(db: D1Database, blocos: BlocoConteudoEntrada[], autorEmail: string): Promise<void> {
  try {
    const statements = blocos.map((bloco) =>
      db
        .prepare(
          [
            "INSERT INTO content_blocks (chave, modulo, tipo, valor, visivel, ordem, atualizado_em)",
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            "ON CONFLICT(chave) DO UPDATE SET",
            "modulo = excluded.modulo,",
            "tipo = excluded.tipo,",
            "valor = excluded.valor,",
            "visivel = excluded.visivel,",
            "ordem = excluded.ordem,",
            "atualizado_em = excluded.atualizado_em",
          ].join(" "),
        )
        .bind(bloco.chave, bloco.modulo, bloco.tipo, bloco.valor, bloco.visivel ? 1 : 0, bloco.ordem, nowIso()),
    );
    if (statements.length) await db.batch(statements);
    await registrarAuditoriaAdmin(db, "conteudo.atualizar", "content_blocks", { total: blocos.length }, autorEmail);
  } catch {
    throw new Error("MODULO_ADM_NAO_DISPONIVEL");
  }
}

export async function obterCorretorasSuportadas(db: D1Database): Promise<CorretoraSuportada[]> {
  let rows: Array<{ codigo: string; nome: string; status: string; mensagem_ajuda: string; atualizado_em: string | null }> = [];
  try {
    const resultado = await db
      .prepare("SELECT codigo, nome, status, mensagem_ajuda, atualizado_em FROM corretoras_suportadas ORDER BY nome ASC")
      .all<{ codigo: string; nome: string; status: string; mensagem_ajuda: string; atualizado_em: string | null }>();
    rows = resultado.results ?? [];
  } catch {
    rows = [];
  }

  return (rows.length
    ? rows.map((item) => ({
        codigo: item.codigo,
        nome: item.nome,
        status: item.status as CorretoraSuportada["status"],
        mensagemAjuda: item.mensagem_ajuda,
        atualizadoEm: item.atualizado_em ?? null,
      }))
    : defaultCorretoras
  ).sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function atualizarCorretorasSuportadas(db: D1Database, corretoras: CorretoraSuportadaEntrada[], autorEmail: string): Promise<void> {
  try {
    const statements = corretoras.map((corretora) =>
      db
        .prepare(
          [
            "INSERT INTO corretoras_suportadas (id, codigo, nome, status, mensagem_ajuda, atualizado_em)",
            "VALUES (?, ?, ?, ?, ?, ?)",
            "ON CONFLICT(codigo) DO UPDATE SET",
            "nome = excluded.nome, status = excluded.status, mensagem_ajuda = excluded.mensagem_ajuda, atualizado_em = excluded.atualizado_em",
          ].join(" "),
        )
        .bind(crypto.randomUUID(), corretora.codigo, corretora.nome, corretora.status, corretora.mensagemAjuda, nowIso()),
    );
    if (statements.length) await db.batch(statements);
    await registrarAuditoriaAdmin(db, "corretoras.atualizar", "corretoras_suportadas", { total: corretoras.length }, autorEmail);
  } catch {
    throw new Error("MODULO_ADM_NAO_DISPONIVEL");
  }
}

export async function listarAdmins(db: D1Database): Promise<AdminUsuario[]> {
  try {
    const resultado = await db
      .prepare("SELECT email, ativo, concedido_por, atualizado_em FROM admin_usuarios ORDER BY email ASC")
      .all<{ email: string; ativo: number; concedido_por: string | null; atualizado_em: string | null }>();
    const rows = resultado.results ?? [];
    return rows.map((item) => ({
      email: item.email,
      ativo: Boolean(item.ativo),
      concedidoPor: item.concedido_por ?? null,
      atualizadoEm: item.atualizado_em ?? null,
    }));
  } catch {
    return [];
  }
}

export async function definirAdmin(db: D1Database, email: string, ativo: boolean, concedidoPor: string): Promise<void> {
  try {
    await db
      .prepare(
        [
          "INSERT INTO admin_usuarios (email, ativo, concedido_por, atualizado_em)",
          "VALUES (?, ?, ?, ?)",
          "ON CONFLICT(email) DO UPDATE SET",
          "ativo = excluded.ativo, concedido_por = excluded.concedido_por, atualizado_em = excluded.atualizado_em",
        ].join(" "),
      )
      .bind(email.toLowerCase(), ativo ? 1 : 0, concedidoPor.toLowerCase(), nowIso())
      .run();
    await registrarAuditoriaAdmin(db, "admin.alterar", "admin_usuarios", { email, ativo }, concedidoPor);
  } catch {
    throw new Error("MODULO_ADM_NAO_DISPONIVEL");
  }
}

export async function usuarioEhAdmin(
  db: D1Database,
  email: string,
  options?: { adminTokenHeader?: string | null; adminTokenEnv?: string; adminEmailsEnv?: string },
): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return false;
  if (options?.adminTokenEnv && options.adminTokenHeader && options.adminTokenHeader === options.adminTokenEnv) return true;

  const adminsEnv = (options?.adminEmailsEnv ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (adminsEnv.includes(normalizedEmail)) return true;

  try {
    const row = await db
      .prepare("SELECT ativo FROM admin_usuarios WHERE email = ? LIMIT 1")
      .bind(normalizedEmail)
      .first<{ ativo: number }>();
    if (row) return Boolean(row.ativo);

    const total = await db.prepare("SELECT COUNT(*) AS total FROM admin_usuarios").first<{ total: number }>();
    const semAdmins = (total?.total ?? 0) === 0;
    if (semAdmins) {
      await definirAdmin(db, normalizedEmail, true, normalizedEmail);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export async function obterLogsAuditoriaAdmin(db: D1Database, limite = 50): Promise<LogAuditoriaAdmin[]> {
  try {
    const resultado = await db
      .prepare("SELECT id, acao, alvo, payload_json, autor_email, criado_em FROM admin_auditoria ORDER BY criado_em DESC LIMIT ?")
      .bind(Math.max(1, Math.min(200, limite)))
      .all<{
        id: string;
        acao: string;
        alvo: string;
        payload_json: string;
        autor_email: string;
        criado_em: string;
      }>();
    return (resultado.results ?? []).map((item) => ({
      id: item.id,
      acao: item.acao,
      alvo: item.alvo,
      payloadJson: item.payload_json,
      autorEmail: item.autor_email,
      criadoEm: item.criado_em,
    }));
  } catch {
    return [];
  }
}

export async function atualizarScoreConfig(db: D1Database, valor: unknown, autorEmail?: string): Promise<void> {
  try {
    await db
      .prepare(
        [
          "INSERT INTO configuracoes_produto (chave, tipo, valor_json, atualizado_em)",
          "VALUES ('score.v1', 'json', ?, ?)",
          "ON CONFLICT(chave) DO UPDATE SET valor_json = excluded.valor_json, atualizado_em = excluded.atualizado_em",
        ].join(" "),
      )
      .bind(JSON.stringify(valor), nowIso())
      .run();
    if (autorEmail) await registrarAuditoriaAdmin(db, "score.atualizar", "configuracoes_produto", { chave: "score.v1" }, autorEmail);
  } catch {
    throw new Error("MODULO_ADM_NAO_DISPONIVEL");
  }
}

export async function atualizarFeatureFlags(db: D1Database, flags: Record<string, boolean>, autorEmail?: string): Promise<void> {
  try {
    const statements = Object.entries(flags).map(([chave, habilitada]) =>
      db
        .prepare(
          [
            "INSERT INTO feature_flags (chave, habilitada, rollout_percentual, atualizado_em)",
            "VALUES (?, ?, 100, ?)",
            "ON CONFLICT(chave) DO UPDATE SET habilitada = excluded.habilitada, atualizado_em = excluded.atualizado_em",
          ].join(" "),
        )
        .bind(chave, habilitada ? 1 : 0, nowIso()),
    );
    if (statements.length) await db.batch(statements);
    if (autorEmail) await registrarAuditoriaAdmin(db, "flags.atualizar", "feature_flags", { total: Object.keys(flags).length }, autorEmail);
  } catch {
    throw new Error("MODULO_ADM_NAO_DISPONIVEL");
  }
}

export async function atualizarMenus(
  db: D1Database,
  menus: Array<{ chave: string; label: string; path: string; ordem: number; visivel: boolean }>,
  autorEmail?: string,
): Promise<void> {
  try {
    const statements = menus.map((menu) =>
      db
        .prepare(
          [
            "INSERT INTO configuracoes_menu (id, chave, label, path, ordem, visivel, atualizado_em)",
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            "ON CONFLICT(chave) DO UPDATE SET",
            "label = excluded.label, path = excluded.path, ordem = excluded.ordem, visivel = excluded.visivel, atualizado_em = excluded.atualizado_em",
          ].join(" "),
        )
        .bind(crypto.randomUUID(), menu.chave, menu.label, menu.path, menu.ordem, menu.visivel ? 1 : 0, nowIso()),
    );
    if (statements.length) await db.batch(statements);
    if (autorEmail) await registrarAuditoriaAdmin(db, "menus.atualizar", "configuracoes_menu", { total: menus.length }, autorEmail);
  } catch {
    throw new Error("MODULO_ADM_NAO_DISPONIVEL");
  }
}

async function registrarAuditoriaAdmin(
  db: D1Database,
  acao: string,
  alvo: string,
  payload: Record<string, unknown>,
  autorEmail: string,
): Promise<void> {
  try {
    await db
      .prepare("INSERT INTO admin_auditoria (id, acao, alvo, payload_json, autor_email, criado_em) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), acao, alvo, JSON.stringify(payload), autorEmail.toLowerCase(), nowIso())
      .run();
  } catch {
    // Não bloqueia operação principal se auditoria falhar.
  }
}
