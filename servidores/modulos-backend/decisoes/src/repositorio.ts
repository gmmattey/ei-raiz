import type { HistoricoSimulacao, Simulacao, TipoSimulacao } from "@ei/contratos";

export type RegistroSimulacao = {
  id: string;
  usuarioId: string;
  tipo: TipoSimulacao;
  nome: string;
  status: "rascunho" | "salva";
  scoreAtual?: number;
  scoreProjetado?: number;
  deltaScore?: number;
  diagnosticoTitulo?: string;
  diagnosticoDescricao?: string;
  diagnosticoAcao?: string;
  resumoCurto?: string;
  premissas: Record<string, unknown>;
  resultado: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  criadoEm: string;
  atualizadoEm: string;
  salvoEm?: string;
};

export interface RepositorioDecisoes {
  obterContextoScore(usuarioId: string): Promise<{ scoreAtual: number; pilares: Record<string, number> }>;
  obterParametrosAtivos(): Promise<Record<string, Record<string, unknown>>>;
  salvar(simulacao: RegistroSimulacao): Promise<void>;
  atualizar(simulacao: RegistroSimulacao): Promise<void>;
  listar(usuarioId: string): Promise<Simulacao[]>;
  obter(usuarioId: string, simulacaoId: string): Promise<Simulacao | null>;
  listarHistorico(simulacaoId: string): Promise<HistoricoSimulacao[]>;
  salvarHistorico(simulacaoId: string, payload: { premissas: Record<string, unknown>; resultado: Record<string, unknown>; diagnostico: Record<string, unknown>; criadoPor: string }): Promise<void>;
}

const parseJson = (raw: string | null | undefined): Record<string, unknown> => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
};

const parseNumericJson = (raw: string | null | undefined): Record<string, number> => {
  const parsed = parseJson(raw);
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
  }
  return out;
};

export class RepositorioDecisoesD1 implements RepositorioDecisoes {
  constructor(private readonly db: D1Database) {}

  async obterContextoScore(usuarioId: string): Promise<{ scoreAtual: number; pilares: Record<string, number> }> {
    const row = await this.db
      .prepare("SELECT score, blocos_json FROM snapshots_score WHERE usuario_id = ? ORDER BY criado_em DESC LIMIT 1")
      .bind(usuarioId)
      .first<{ score: number | null; blocos_json: string | null }>();

    const pilares = parseNumericJson(row?.blocos_json ?? null);
    const scoreAtual = typeof row?.score === "number" ? row.score : 65;
    return { scoreAtual, pilares };
  }

  async obterParametrosAtivos(): Promise<Record<string, Record<string, unknown>>> {
    const rows = await this.db
      .prepare("SELECT chave, valor_json FROM simulacoes_parametros WHERE ativo = 1 ORDER BY chave ASC")
      .all<{ chave: string; valor_json: string | null }>();
    const out: Record<string, Record<string, unknown>> = {};
    for (const row of rows.results ?? []) {
      out[row.chave] = parseJson(row.valor_json ?? null);
    }
    return out;
  }

  async salvar(simulacao: RegistroSimulacao): Promise<void> {
    await this.db
      .prepare(
        [
          "INSERT INTO simulacoes",
          "(id, usuario_id, tipo, nome, status, score_atual, score_projetado, delta_score, diagnostico_titulo, diagnostico_descricao, diagnostico_acao, resumo_curto, premissas_json, resultado_json, metadata_json, criado_em, atualizado_em, salvo_em)",
          "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ].join(" "),
      )
      .bind(
        simulacao.id,
        simulacao.usuarioId,
        simulacao.tipo,
        simulacao.nome,
        simulacao.status,
        simulacao.scoreAtual ?? null,
        simulacao.scoreProjetado ?? null,
        simulacao.deltaScore ?? null,
        simulacao.diagnosticoTitulo ?? null,
        simulacao.diagnosticoDescricao ?? null,
        simulacao.diagnosticoAcao ?? null,
        simulacao.resumoCurto ?? null,
        JSON.stringify(simulacao.premissas ?? {}),
        JSON.stringify(simulacao.resultado ?? {}),
        JSON.stringify(simulacao.metadata ?? {}),
        simulacao.criadoEm,
        simulacao.atualizadoEm,
        simulacao.salvoEm ?? null,
      )
      .run();
  }

  async atualizar(simulacao: RegistroSimulacao): Promise<void> {
    await this.db
      .prepare(
        [
          "UPDATE simulacoes",
          "SET nome = ?, status = ?, score_atual = ?, score_projetado = ?, delta_score = ?,",
          "diagnostico_titulo = ?, diagnostico_descricao = ?, diagnostico_acao = ?, resumo_curto = ?,",
          "premissas_json = ?, resultado_json = ?, metadata_json = ?, atualizado_em = ?, salvo_em = ?",
          "WHERE id = ? AND usuario_id = ?",
        ].join(" "),
      )
      .bind(
        simulacao.nome,
        simulacao.status,
        simulacao.scoreAtual ?? null,
        simulacao.scoreProjetado ?? null,
        simulacao.deltaScore ?? null,
        simulacao.diagnosticoTitulo ?? null,
        simulacao.diagnosticoDescricao ?? null,
        simulacao.diagnosticoAcao ?? null,
        simulacao.resumoCurto ?? null,
        JSON.stringify(simulacao.premissas ?? {}),
        JSON.stringify(simulacao.resultado ?? {}),
        JSON.stringify(simulacao.metadata ?? {}),
        simulacao.atualizadoEm,
        simulacao.salvoEm ?? null,
        simulacao.id,
        simulacao.usuarioId,
      )
      .run();
  }

  async listar(usuarioId: string): Promise<Simulacao[]> {
    const rows = await this.db
      .prepare(
        "SELECT id, usuario_id, tipo, nome, status, score_atual, score_projetado, delta_score, diagnostico_titulo, diagnostico_descricao, diagnostico_acao, resumo_curto, premissas_json, resultado_json, metadata_json, criado_em, atualizado_em, salvo_em FROM simulacoes WHERE usuario_id = ? ORDER BY atualizado_em DESC",
      )
      .bind(usuarioId)
      .all<any>();
    return (rows.results ?? []).map((row) => this.mapRow(row));
  }

  async obter(usuarioId: string, simulacaoId: string): Promise<Simulacao | null> {
    const row = await this.db
      .prepare(
        "SELECT id, usuario_id, tipo, nome, status, score_atual, score_projetado, delta_score, diagnostico_titulo, diagnostico_descricao, diagnostico_acao, resumo_curto, premissas_json, resultado_json, metadata_json, criado_em, atualizado_em, salvo_em FROM simulacoes WHERE usuario_id = ? AND id = ? LIMIT 1",
      )
      .bind(usuarioId, simulacaoId)
      .first<any>();
    return row ? this.mapRow(row) : null;
  }

  async listarHistorico(simulacaoId: string): Promise<HistoricoSimulacao[]> {
    const rows = await this.db
      .prepare(
        "SELECT id, simulacao_id, versao, premissas_json, resultado_json, diagnostico_json, criado_em, criado_por FROM simulacoes_historico WHERE simulacao_id = ? ORDER BY versao DESC",
      )
      .bind(simulacaoId)
      .all<any>();
    return (rows.results ?? []).map((row) => ({
      id: row.id,
      simulacaoId: row.simulacao_id,
      versao: row.versao,
      premissas: parseJson(row.premissas_json),
      resultado: parseJson(row.resultado_json),
      diagnostico: parseJson(row.diagnostico_json),
      criadoEm: row.criado_em,
      criadoPor: row.criado_por,
    }));
  }

  async salvarHistorico(simulacaoId: string, payload: { premissas: Record<string, unknown>; resultado: Record<string, unknown>; diagnostico: Record<string, unknown>; criadoPor: string }): Promise<void> {
    const versaoAtual = await this.db
      .prepare("SELECT COALESCE(MAX(versao), 0) as versao FROM simulacoes_historico WHERE simulacao_id = ?")
      .bind(simulacaoId)
      .first<{ versao: number }>();
    const versao = (versaoAtual?.versao ?? 0) + 1;

    await this.db
      .prepare(
        [
          "INSERT INTO simulacoes_historico (id, simulacao_id, versao, premissas_json, resultado_json, diagnostico_json, criado_em, criado_por)",
          "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ].join(" "),
      )
      .bind(
        crypto.randomUUID(),
        simulacaoId,
        versao,
        JSON.stringify(payload.premissas ?? {}),
        JSON.stringify(payload.resultado ?? {}),
        JSON.stringify(payload.diagnostico ?? {}),
        new Date().toISOString(),
        payload.criadoPor,
      )
      .run();
  }

  private mapRow(row: any): Simulacao {
    return {
      id: row.id,
      usuarioId: row.usuario_id,
      tipo: row.tipo,
      nome: row.nome,
      status: row.status,
      scoreAtual: typeof row.score_atual === "number" ? row.score_atual : undefined,
      scoreProjetado: typeof row.score_projetado === "number" ? row.score_projetado : undefined,
      deltaScore: typeof row.delta_score === "number" ? row.delta_score : undefined,
      diagnosticoTitulo: row.diagnostico_titulo ?? undefined,
      diagnosticoDescricao: row.diagnostico_descricao ?? undefined,
      diagnosticoAcao: row.diagnostico_acao ?? undefined,
      resumoCurto: row.resumo_curto ?? undefined,
      premissas: parseJson(row.premissas_json),
      resultado: parseJson(row.resultado_json),
      metadata: parseJson(row.metadata_json),
      criadoEm: row.criado_em,
      atualizadoEm: row.atualizado_em,
      salvoEm: row.salvo_em ?? undefined,
    };
  }
}
