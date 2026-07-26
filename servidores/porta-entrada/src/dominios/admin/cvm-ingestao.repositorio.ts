import type { Bd } from '../../infra/bd';

export interface CotaCvmPersistida {
  cnpj: string;
  data: string;
  valorCota: number;
  patrimonioLiquidoBrl: number | null;
}

export const repositorioCvmIngestao = (bd: Bd) => ({
  async listarCnpjsAlvo(): Promise<string[]> {
    const linhas = await bd.consultar<{ cnpj: string }>(
      `SELECT DISTINCT a.cnpj
         FROM ativos a
         INNER JOIN patrimonio_itens p ON p.ativo_id = a.id
        WHERE p.esta_ativo = 1
          AND a.tipo IN ('fundo', 'previdencia')
          AND a.cnpj IS NOT NULL
          AND length(trim(a.cnpj)) > 0`,
    );
    return linhas.map((linha) => linha.cnpj.replace(/\D/g, '')).filter((cnpj) => cnpj.length === 14);
  },

  async criarExecucao(id: string, parametrosJson: string): Promise<void> {
    await bd.executar(
      `INSERT INTO cvm_execucoes (id, modo, status, parametros_json)
       VALUES (?, 'ingestao', 'executando', ?)`,
      id,
      parametrosJson,
    );
  },

  async existeExecucao(id: string): Promise<boolean> {
    const execucao = await bd.primeiro<{ id: string }>(
      `SELECT id FROM cvm_execucoes WHERE id = ? AND modo = 'ingestao' LIMIT 1`,
      id,
    );
    return execucao != null;
  },

  async gravarCotas(itens: CotaCvmPersistida[], atualizadoEm: string): Promise<void> {
    const operacoes = itens.flatMap((item) => [
      {
        sql: `INSERT INTO fundos_cvm (cnpj, nome, situacao, atualizado_em)
              VALUES (?, ?, 'PENDENTE_CADASTRO', ?)
              ON CONFLICT(cnpj) DO NOTHING`,
        valores: [item.cnpj, `Fundo CVM ${item.cnpj}`, atualizadoEm],
      },
      {
        sql: `INSERT INTO fundos_cvm_cotas (cnpj, data, valor_cota, patrimonio_liquido_brl)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(cnpj, data) DO UPDATE SET
                valor_cota = excluded.valor_cota,
                patrimonio_liquido_brl = excluded.patrimonio_liquido_brl`,
        valores: [item.cnpj, item.data, item.valorCota, item.patrimonioLiquidoBrl],
      },
    ]);
    await bd.emLote(operacoes);
  },

  async finalizarExecucao(id: string, status: string, concluidoEm: string, resultadoJson: string, erro: string | null): Promise<boolean> {
    const atualizado = await bd.executar(
      `UPDATE cvm_execucoes
          SET status = ?, concluido_em = ?, resultado_json = ?, erro = ?
        WHERE id = ? AND modo = 'ingestao'`,
      status,
      concluidoEm,
      resultadoJson,
      erro,
      id,
    );
    return atualizado.linhasAfetadas > 0;
  },
});
