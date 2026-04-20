import type { Bd } from '../../infra/bd';

export interface LinhaAtivo {
  id: string;
  ticker: string | null;
  cnpj: string | null;
  isin: string | null;
  nome: string;
  tipo: string;
  classe: string | null;
  subclasse: string | null;
  moeda: string;
  indexador: string | null;
  taxa_pct: number | null;
  data_inicio: string | null;
  data_vencimento: string | null;
  aliases_json: string;
  atualizado_em: string;
}

export interface LinhaCotacaoCache {
  ativo_id: string;
  fonte: string;
  cotado_em: string;
  preco_brl: number;
  expira_em: string;
  dados_json: string;
}

export interface LinhaFundoCvm {
  cnpj: string;
  nome: string;
  classe: string | null;
  situacao: string | null;
  atualizado_em: string;
}

export interface LinhaCotaFundo {
  cnpj: string;
  data: string;
  valor_cota: number;
  patrimonio_liquido_brl: number | null;
}

export const repositorioMercado = (bd: Bd) => ({
  async buscarAtivoPorId(id: string) {
    return bd.primeiro<LinhaAtivo>(`SELECT * FROM ativos WHERE id = ? LIMIT 1`, id);
  },

  async buscarAtivoPorTicker(ticker: string) {
    return bd.primeiro<LinhaAtivo>(`SELECT * FROM ativos WHERE ticker = ? LIMIT 1`, ticker.toUpperCase());
  },

  async buscarAtivoPorCnpj(cnpj: string) {
    return bd.primeiro<LinhaAtivo>(`SELECT * FROM ativos WHERE cnpj = ? LIMIT 1`, cnpj.replace(/\D/g, ''));
  },

  async buscarAtivosPorTexto(termo: string, tipo: string | null, limite: number): Promise<LinhaAtivo[]> {
    const t = `%${termo.toLowerCase()}%`;
    const tNumerico = termo.replace(/[^0-9]/g, '');
    const tCnpj = tNumerico.length > 0 ? `%${tNumerico}%` : '__nunca__';
    if (tipo) {
      return bd.consultar<LinhaAtivo>(
        `SELECT * FROM ativos
          WHERE tipo = ? AND (lower(nome) LIKE ? OR lower(ticker) LIKE ? OR cnpj LIKE ?)
          ORDER BY ticker, nome LIMIT ?`,
        tipo, t, t, tCnpj, limite,
      );
    }
    return bd.consultar<LinhaAtivo>(
      `SELECT * FROM ativos
        WHERE (lower(nome) LIKE ? OR lower(ticker) LIKE ? OR cnpj LIKE ?)
        ORDER BY ticker, nome LIMIT ?`,
      t, t, tCnpj, limite,
    );
  },

  async buscarCotacao(ativoId: string, fonte: string) {
    return bd.primeiro<LinhaCotacaoCache>(
      `SELECT * FROM ativos_cotacoes_cache WHERE ativo_id = ? AND fonte = ? LIMIT 1`,
      ativoId, fonte,
    );
  },

  async buscarFundoCvm(cnpj: string) {
    return bd.primeiro<LinhaFundoCvm>(
      `SELECT * FROM fundos_cvm WHERE cnpj = ? LIMIT 1`,
      cnpj.replace(/\D/g, ''),
    );
  },

  async ultimaCota(cnpj: string) {
    return bd.primeiro<LinhaCotaFundo>(
      `SELECT cnpj, data, valor_cota, patrimonio_liquido_brl
         FROM fundos_cvm_cotas WHERE cnpj = ? ORDER BY data DESC LIMIT 1`,
      cnpj.replace(/\D/g, ''),
    );
  },
});
