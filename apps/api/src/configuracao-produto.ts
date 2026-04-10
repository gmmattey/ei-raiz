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

export async function obterAppConfig(db: D1Database): Promise<AppConfig> {
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
  for (const item of flagsRows) {
    flags[item.chave] = Boolean(item.habilitada);
  }

  const menusBase = menusRows.length ? menusRows : defaultMenus;
  const menus = menusBase
    .map((item) => ({
      chave: item.chave,
      label: item.label,
      path: item.path,
      ordem: item.ordem,
      visivel: Boolean(item.visivel),
    }))
    .filter((item) => item.visivel)
    .sort((a, b) => a.ordem - b.ordem);

  return { score, flags, menus };
}

export async function atualizarScoreConfig(db: D1Database, valor: unknown): Promise<void> {
  try {
    await db
      .prepare(
        [
          "INSERT INTO configuracoes_produto (chave, tipo, valor_json, atualizado_em)",
          "VALUES ('score.v1', 'json', ?, ?)",
          "ON CONFLICT(chave) DO UPDATE SET valor_json = excluded.valor_json, atualizado_em = excluded.atualizado_em",
        ].join(" "),
      )
      .bind(JSON.stringify(valor), new Date().toISOString())
      .run();
  } catch {
    throw new Error("MODULO_ADM_NAO_DISPONIVEL");
  }
}

export async function atualizarFeatureFlags(db: D1Database, flags: Record<string, boolean>): Promise<void> {
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
        .bind(chave, habilitada ? 1 : 0, new Date().toISOString()),
    );
    if (statements.length) await db.batch(statements);
  } catch {
    throw new Error("MODULO_ADM_NAO_DISPONIVEL");
  }
}

export async function atualizarMenus(db: D1Database, menus: Array<{ chave: string; label: string; path: string; ordem: number; visivel: boolean }>): Promise<void> {
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
        .bind(crypto.randomUUID(), menu.chave, menu.label, menu.path, menu.ordem, menu.visivel ? 1 : 0, new Date().toISOString()),
    );
    if (statements.length) await db.batch(statements);
  } catch {
    throw new Error("MODULO_ADM_NAO_DISPONIVEL");
  }
}
