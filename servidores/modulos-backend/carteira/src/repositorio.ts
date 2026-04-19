import type { CategoriaAtivo, IndexadorRendaFixa } from "@ei/contratos";

export type FonteMercado = "brapi" | "cvm";

export type AtivoPersistido = {
  id: string;
  ticker: string;
  nome: string;
  categoria: CategoriaAtivo;
  plataforma: string;
  quantidade: number;
  precoMedio: number;
  valorAtual: number;
  participacao: number;
  /** Rentabilidade desde aquisição (persistida). Lê da coluna renomeada. */
  rentabilidadeDesdeAquisicaoPct: number;
  dataCadastro: string | null;
  dataAquisicao: string | null;
  tickerCanonico: string | null;
  cnpjFundo: string | null;
  // Campos de renda fixa contratada / previdência (nullable nas outras famílias)
  indexador: IndexadorRendaFixa | null;
  taxa: number | null;
  dataInicio: string | null;
  vencimento: string | null;
};

export type CacheCotacaoPersistido = {
  precoAtual: number | null;
  variacaoPercentual: number | null;
  atualizadoEm: string;
  expiraEm: string;
  payload: unknown;
};

export interface RepositorioCarteira {
  listarAtivos(usuarioId: string): Promise<AtivoPersistido[]>;
  listarSnapshotsPatrimonio(usuarioId: string, limite: number): Promise<Array<{ data: string; valorTotal: number }>>;
  atualizarValorAtivo(ativoId: string, valorAtual: number, rentabilidadeDesdeAquisicaoPct: number): Promise<void>;
  /** Soma dos saldos devedores de todas as posições tipo='divida' do usuário. */
  somarDividas(usuarioId: string): Promise<number>;
  lerCacheValido(fonte: FonteMercado, chaveAtivo: string, referenciaIso: string): Promise<CacheCotacaoPersistido | null>;
  lerUltimoCache(fonte: FonteMercado, chaveAtivo: string): Promise<CacheCotacaoPersistido | null>;
  salvarCache(
    fonte: FonteMercado,
    chaveAtivo: string,
    precoAtual: number | null,
    variacaoPercentual: number | null,
    payload: unknown,
    atualizadoEmIso: string,
    expiraEmIso: string,
    erro: string | null,
  ): Promise<void>;
}

const INDEXADORES_VALIDOS = new Set<IndexadorRendaFixa>(["CDI", "IPCA", "PRE", "SELIC", "IGPM"]);

const coerceIndexador = (raw: string | null): IndexadorRendaFixa | null => {
  if (!raw) return null;
  const normalizado = raw.toUpperCase().replace(/[^A-Z]/g, "") as IndexadorRendaFixa;
  return INDEXADORES_VALIDOS.has(normalizado) ? normalizado : null;
};

export class RepositorioCarteiraD1 implements RepositorioCarteira {
  constructor(private readonly db: D1Database) {}

  private mapCacheRow(row: {
    preco_atual: number | null;
    variacao_percentual: number | null;
    payload_json: string | null;
    atualizado_em: string;
    expira_em: string;
  }): CacheCotacaoPersistido {
    const payload = row.payload_json ? JSON.parse(row.payload_json) : null;
    const payloadObj = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
    const precoPayload = typeof payloadObj?.price === "number" ? payloadObj.price : null;
    const variacaoPayload = typeof payloadObj?.changePercent === "number" ? payloadObj.changePercent : null;
    return {
      precoAtual: row.preco_atual ?? precoPayload ?? null,
      variacaoPercentual: row.variacao_percentual ?? variacaoPayload ?? null,
      atualizadoEm: row.atualizado_em,
      expiraEm: row.expira_em,
      payload,
    };
  }

  async listarAtivos(usuarioId: string): Promise<AtivoPersistido[]> {
    const result = await this.db
      .prepare(
        [
          "SELECT id, ticker, nome, categoria, plataforma, quantidade, preco_medio, valor_atual,",
          "       participacao, rentabilidade_desde_aquisicao_pct, ticker_canonico, cnpj_fundo,",
          "       data_cadastro, data_aquisicao,",
          "       indexador, taxa, data_inicio, vencimento",
          "  FROM ativos",
          " WHERE usuario_id = ?",
        ].join(" "),
      )
      .bind(usuarioId)
      .all<{
        id: string;
        ticker: string;
        nome: string;
        categoria: CategoriaAtivo;
        plataforma: string;
        quantidade: number | null;
        preco_medio: number | null;
        valor_atual: number | null;
        participacao: number | null;
        rentabilidade_desde_aquisicao_pct: number | null;
        data_cadastro: string | null;
        data_aquisicao: string | null;
        ticker_canonico: string | null;
        cnpj_fundo: string | null;
        indexador: string | null;
        taxa: number | null;
        data_inicio: string | null;
        vencimento: string | null;
      }>();

    return (result.results ?? []).map((row) => ({
      id: row.id,
      ticker: row.ticker ?? "",
      nome: row.nome ?? "",
      categoria: row.categoria,
      plataforma: row.plataforma ?? "",
      quantidade: row.quantidade ?? 1,
      precoMedio: row.preco_medio ?? 0,
      valorAtual: row.valor_atual ?? 0,
      participacao: row.participacao ?? 0,
      rentabilidadeDesdeAquisicaoPct: row.rentabilidade_desde_aquisicao_pct ?? 0,
      dataCadastro: row.data_cadastro ?? null,
      dataAquisicao: row.data_aquisicao ?? null,
      tickerCanonico: row.ticker_canonico ?? null,
      cnpjFundo: row.cnpj_fundo ?? null,
      indexador: coerceIndexador(row.indexador),
      taxa: row.taxa ?? null,
      dataInicio: row.data_inicio ?? null,
      vencimento: row.vencimento ?? null,
    }));
  }

  async listarSnapshotsPatrimonio(usuarioId: string, limite: number): Promise<Array<{ data: string; valorTotal: number }>> {
    const result = await this.db
      .prepare("SELECT data, valor_total FROM snapshots_patrimonio WHERE usuario_id = ? ORDER BY data DESC LIMIT ?")
      .bind(usuarioId, limite)
      .all<{ data: string; valor_total: number }>();
    return (result.results ?? []).map((row) => ({ data: row.data, valorTotal: row.valor_total ?? 0 }));
  }

  async atualizarValorAtivo(
    ativoId: string,
    valorAtual: number,
    rentabilidadeDesdeAquisicaoPct: number,
  ): Promise<void> {
    await this.db
      .prepare(
        "UPDATE ativos SET valor_atual = ?, rentabilidade_desde_aquisicao_pct = ? WHERE id = ?",
      )
      .bind(valorAtual, rentabilidadeDesdeAquisicaoPct, ativoId)
      .run();
  }

  async somarDividas(usuarioId: string): Promise<number> {
    const row = await this.db
      .prepare(
        [
          "SELECT COALESCE(SUM(valor_atual), 0) AS total",
          "  FROM posicoes_financeiras",
          " WHERE usuario_id = ? AND tipo = 'divida' AND ativo = 1",
        ].join(" "),
      )
      .bind(usuarioId)
      .first<{ total: number }>();
    return Number(row?.total ?? 0);
  }

  async lerCacheValido(fonte: FonteMercado, chaveAtivo: string, referenciaIso: string): Promise<CacheCotacaoPersistido | null> {
    const row = await this.db
      .prepare(
        [
          "SELECT preco_atual, variacao_percentual, payload_json, atualizado_em, expira_em",
          "FROM cotacoes_ativos_cache",
          "WHERE fonte = ? AND chave_ativo = ? AND expira_em > ?",
          "LIMIT 1",
        ].join(" "),
      )
      .bind(fonte, chaveAtivo, referenciaIso)
      .first<{
        preco_atual: number | null;
        variacao_percentual: number | null;
        payload_json: string | null;
        atualizado_em: string;
        expira_em: string;
      }>();
    if (!row) return null;
    return this.mapCacheRow(row);
  }

  async lerUltimoCache(fonte: FonteMercado, chaveAtivo: string): Promise<CacheCotacaoPersistido | null> {
    const row = await this.db
      .prepare(
        [
          "SELECT preco_atual, variacao_percentual, payload_json, atualizado_em, expira_em",
          "FROM cotacoes_ativos_cache",
          "WHERE fonte = ? AND chave_ativo = ?",
          "ORDER BY atualizado_em DESC",
          "LIMIT 1",
        ].join(" "),
      )
      .bind(fonte, chaveAtivo)
      .first<{
        preco_atual: number | null;
        variacao_percentual: number | null;
        payload_json: string | null;
        atualizado_em: string;
        expira_em: string;
      }>();
    if (!row) return null;
    return this.mapCacheRow(row);
  }

  async salvarCache(
    fonte: FonteMercado,
    chaveAtivo: string,
    precoAtual: number | null,
    variacaoPercentual: number | null,
    payload: unknown,
    atualizadoEmIso: string,
    expiraEmIso: string,
    erro: string | null,
  ): Promise<void> {
    await this.db
      .prepare(
        [
          "INSERT INTO cotacoes_ativos_cache",
          "(id, fonte, chave_ativo, preco_atual, variacao_percentual, payload_json, atualizado_em, expira_em, erro)",
          "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          "ON CONFLICT(fonte, chave_ativo) DO UPDATE SET",
          "preco_atual = excluded.preco_atual,",
          "variacao_percentual = excluded.variacao_percentual,",
          "payload_json = excluded.payload_json,",
          "atualizado_em = excluded.atualizado_em,",
          "expira_em = excluded.expira_em,",
          "erro = excluded.erro",
        ].join(" "),
      )
      .bind(
        crypto.randomUUID(),
        fonte,
        chaveAtivo,
        precoAtual,
        variacaoPercentual,
        JSON.stringify(payload ?? null),
        atualizadoEmIso,
        expiraEmIso,
        erro,
      )
      .run();
  }
}
