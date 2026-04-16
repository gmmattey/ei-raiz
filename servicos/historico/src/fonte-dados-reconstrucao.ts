import type {
  AtivoParaReconstrucao,
  ContextoReconstrucao,
  FonteDadosReconstrucao,
} from "./reconstrucao";

type LinhaAtivo = {
  id: string;
  ticker: string | null;
  nome: string;
  categoria: string;
  quantidade: number | null;
  preco_medio: number | null;
  data_aquisicao: string | null;
  data_cadastro: string | null;
  cnpj_fundo: string | null;
};

type LinhaContexto = {
  contexto_json: string | null;
};

type ContextoJson = {
  patrimonioExterno?: {
    imoveis?: Array<{ valorEstimado?: number; saldoFinanciamento?: number }>;
    veiculos?: Array<{ valorEstimado?: number }>;
    poupanca?: number;
    caixaDisponivel?: number;
  };
};

/**
 * Adapter que lê direto do D1 (ativos + perfil_contexto_financeiro) e
 * entrega os dados no formato esperado pelo ServicoReconstrucaoCarteiraPadrao.
 *
 * Mantido no pacote de histórico para que a reconstrução não dependa do
 * serviço de carteira completo (que carrega cálculos de cotação em tempo real).
 */
export class FonteDadosReconstrucaoD1 implements FonteDadosReconstrucao {
  constructor(private readonly db: D1Database) {}

  async listarAtivos(usuarioId: string): Promise<AtivoParaReconstrucao[]> {
    const result = await this.db
      .prepare(
        [
          "SELECT id, ticker, nome, categoria, quantidade, preco_medio,",
          "data_aquisicao, data_cadastro, cnpj_fundo",
          "FROM ativos",
          "WHERE usuario_id = ?",
        ].join(" "),
      )
      .bind(usuarioId)
      .all<LinhaAtivo>();

    return (result.results ?? [])
      .map((row): AtivoParaReconstrucao | null => {
        const data = row.data_aquisicao ?? row.data_cadastro;
        if (!data) return null;
        const cnpjDigitos = row.cnpj_fundo
          ? row.cnpj_fundo.replace(/\D/g, "")
          : null;
        return {
          id: row.id,
          ticker: row.ticker,
          nome: row.nome,
          categoria: row.categoria,
          quantidade: Number(row.quantidade ?? 0),
          precoMedio: Number(row.preco_medio ?? 0),
          dataAquisicao: data,
          cnpj: cnpjDigitos && cnpjDigitos.length === 14 ? cnpjDigitos : null,
        };
      })
      .filter((a): a is AtivoParaReconstrucao => a !== null);
  }

  async obterContexto(usuarioId: string): Promise<ContextoReconstrucao> {
    const row = await this.db
      .prepare(
        "SELECT contexto_json FROM perfil_contexto_financeiro WHERE usuario_id = ?",
      )
      .bind(usuarioId)
      .first<LinhaContexto>();

    if (!row?.contexto_json) {
      return { imoveis: [], veiculos: [], poupanca: 0 };
    }

    try {
      const parsed = JSON.parse(row.contexto_json) as ContextoJson;
      const externo = parsed.patrimonioExterno ?? {};
      return {
        imoveis: (externo.imoveis ?? []).map((i) => ({
          valorEstimado: Number(i.valorEstimado ?? 0),
          saldoFinanciamento: Number(i.saldoFinanciamento ?? 0),
        })),
        veiculos: (externo.veiculos ?? []).map((v) => ({
          valorEstimado: Number(v.valorEstimado ?? 0),
        })),
        poupanca: Number(externo.poupanca ?? externo.caixaDisponivel ?? 0),
      };
    } catch {
      return { imoveis: [], veiculos: [], poupanca: 0 };
    }
  }
}
