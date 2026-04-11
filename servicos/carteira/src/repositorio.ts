import type { CategoriaAtivo } from "@ei/contratos";

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
  retorno12m: number;
  dataCadastro: string | null;
  dataAquisicao: string | null;
  tickerCanonico: string | null;
  cnpjFundo: string | null;
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
  atualizarValorAtivo(ativoId: string, valorAtual: number, retorno12m: number): Promise<void>;
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

export class RepositorioCarteiraD1 implements RepositorioCarteira {
  constructor(private readonly db: D1Database) {}

  async listarAtivos(usuarioId: string): Promise<AtivoPersistido[]> {
    const result = await this.db
      .prepare(
        [
          "SELECT id, ticker, nome, categoria, plataforma, quantidade, preco_medio, valor_atual, participacao, retorno_12m, ticker_canonico, cnpj_fundo",
          ", data_cadastro, data_aquisicao",
          "FROM ativos",
          "WHERE usuario_id = ?",
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
        retorno_12m: number | null;
        data_cadastro: string | null;
        data_aquisicao: string | null;
        ticker_canonico: string | null;
        cnpj_fundo: string | null;
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
      retorno12m: row.retorno_12m ?? 0,
      dataCadastro: row.data_cadastro ?? null,
      dataAquisicao: row.data_aquisicao ?? null,
      tickerCanonico: row.ticker_canonico ?? null,
      cnpjFundo: row.cnpj_fundo ?? null,
    }));
  }

  async listarSnapshotsPatrimonio(usuarioId: string, limite: number): Promise<Array<{ data: string; valorTotal: number }>> {
    const result = await this.db
      .prepare("SELECT data, valor_total FROM snapshots_patrimonio WHERE usuario_id = ? ORDER BY data DESC LIMIT ?")
      .bind(usuarioId, limite)
      .all<{ data: string; valor_total: number }>();
    return (result.results ?? []).map((row) => ({ data: row.data, valorTotal: row.valor_total ?? 0 }));
  }

  async atualizarValorAtivo(ativoId: string, valorAtual: number, retorno12m: number): Promise<void> {
    await this.db
      .prepare("UPDATE ativos SET valor_atual = ?, retorno_12m = ? WHERE id = ?")
      .bind(valorAtual, retorno12m, ativoId)
      .run();
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
    return {
      precoAtual: row.preco_atual ?? null,
      variacaoPercentual: row.variacao_percentual ?? null,
      atualizadoEm: row.atualizado_em,
      expiraEm: row.expira_em,
      payload: row.payload_json ? JSON.parse(row.payload_json) : null,
    };
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
    return {
      precoAtual: row.preco_atual ?? null,
      variacaoPercentual: row.variacao_percentual ?? null,
      atualizadoEm: row.atualizado_em,
      expiraEm: row.expira_em,
      payload: row.payload_json ? JSON.parse(row.payload_json) : null,
    };
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
