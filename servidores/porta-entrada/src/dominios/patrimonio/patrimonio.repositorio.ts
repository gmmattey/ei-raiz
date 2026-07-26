import type { Bd } from '../../infra/bd';

export interface LinhaResumo {
  usuario_id: string;
  patrimonio_bruto_brl: number;
  divida_brl: number;
  patrimonio_liquido_brl: number;
  quantidade_itens: number;
  score_total: number | null;
  score_faixa: string | null;
  score_calculado_em: string | null;
  aporte_mes_brl: number | null;
  rentabilidade_mes_pct: number | null;
}

export interface LinhaPosicao {
  item_id: string;
  usuario_id: string;
  tipo: string;
  origem: string;
  nome: string;
  ativo_id: string | null;
  corretora_id: string | null;
  corretora_nome: string | null;
  lifecycle_status: string;
  ticker: string | null;
  cnpj: string | null;
  classe: string | null;
  subclasse: string | null;
  quantidade: number | null;
  preco_medio_brl: number | null;
  valor_atual_brl: number | null;
  preco_atual_brl: number | null;
  preco_atualizado_em: string | null;
  preco_fonte: string | null;
  preco_referencia_em: string | null;
  preco_expira_em: string | null;
  rentabilidade_pct: number | null;
  criado_em: string;
  atualizado_em: string;
}

export interface LinhaAlocacao {
  usuario_id: string;
  tipo: string;
  classe: string | null;
  subclasse: string | null;
  quantidade_itens: number;
  valor_total_brl: number;
}

export interface LinhaEvolucao {
  usuario_id: string;
  ano_mes: string;
  patrimonio_bruto_brl: number;
  patrimonio_liquido_brl: number;
  divida_brl: number;
  aporte_mes_brl: number;
  rentabilidade_mes_pct: number | null;
  eh_confiavel: number;
}

export interface LinhaAporte {
  id: string;
  usuario_id: string;
  item_id: string | null;
  tipo: string;
  valor_brl: number;
  data: string;
  descricao: string | null;
  origem: string;
  criado_em: string;
}

export interface LinhaScoreAtual {
  id: string;
  usuario_id: string;
  calculado_em: string;
  score_total: number;
  faixa: string;
  confianca_pct: number | null;
  patrimonio_bruto_brl: number | null;
  patrimonio_liquido_brl: number | null;
  divida_brl: number | null;
  pilares_json: string;
  inputs_resumo_json: string;
}

export interface LinhaScoreHistorico {
  usuario_id: string;
  ano_mes: string;
  calculado_em: string;
  score_total: number;
  faixa: string;
}

export interface LinhaItemPatrimonio {
  id: string;
  usuario_id: string;
  ativo_id: string | null;
  tipo: string;
  origem: string;
  nome: string;
  quantidade: number | null;
  preco_medio_brl: number | null;
  valor_atual_brl: number | null;
  moeda: string;
  esta_ativo: number;
  dados_json: string;
  criado_em: string;
  atualizado_em: string;
}

export interface LinhaImportacao {
  id: string;
  usuario_id: string;
  origem: string;
  status: string;
  iniciado_em: string;
  concluido_em: string | null;
}

export interface LinhaItemImportacao {
  id: string;
  linha: number;
  tipo: string;
  resultado: string;
  dados_json: string;
}

export interface LinhaMovimentoPatrimonial {
  id: string;
  usuario_id: string;
  item_id: string;
  importacao_id: string | null;
  linha_importacao: number | null;
  tipo: string;
  quantidade: number | null;
  valor_brl: number | null;
  data: string;
  origem: string;
  dados_json: string;
  criado_em: string;
}

export const repositorioPatrimonio = (bd: Bd) => ({
  async usuarioPossuiCorretora(usuarioId: string, corretoraId: string): Promise<boolean> {
    return (await bd.primeiro<{ id: string }>(
      `SELECT id FROM usuario_plataformas
        WHERE usuario_id = ? AND corretora_id = ? AND status = 'ativa' LIMIT 1`,
      usuarioId, corretoraId,
    )) !== null;
  },

  async buscarAtivoPorCnpj(cnpj: string) {
    return bd.primeiro<{ id: string }>(`SELECT id FROM ativos WHERE cnpj = ? LIMIT 1`, cnpj);
  },

  async inserirAtivoComCnpj(id: string, cnpj: string, tipo: string, nome: string): Promise<void> {
    await bd.executar(
      `INSERT INTO ativos (id, cnpj, nome, tipo)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(cnpj) DO NOTHING`,
      id, cnpj, nome, tipo,
    );
  },

  async resumo(usuarioId: string) {
    return bd.primeiro<LinhaResumo>(
      `SELECT * FROM vw_patrimonio_resumo WHERE usuario_id = ? LIMIT 1`,
      usuarioId,
    );
  },

  async posicoes(usuarioId: string): Promise<LinhaPosicao[]> {
    return bd.consultar<LinhaPosicao>(
      `SELECT
         i.id AS item_id, i.usuario_id, i.tipo, i.origem, i.nome, i.ativo_id, i.corretora_id,
         c.nome AS corretora_nome, i.lifecycle_status,
         a.ticker, a.cnpj, a.classe, a.subclasse, i.quantidade, i.preco_medio_brl,
         COALESCE(c_cvm.preco_brl, c_brapi.preco_brl) AS preco_atual_brl,
         COALESCE(c_cvm.cotado_em, c_brapi.cotado_em) AS preco_atualizado_em,
         COALESCE(c_cvm.fonte, c_brapi.fonte) AS preco_fonte,
         COALESCE(json_extract(c_cvm.dados_json, '$.referenciaEm'), json_extract(c_brapi.dados_json, '$.referenciaEm')) AS preco_referencia_em,
         COALESCE(c_cvm.expira_em, c_brapi.expira_em) AS preco_expira_em,
         CASE
           WHEN i.quantidade IS NOT NULL AND COALESCE(c_cvm.preco_brl, c_brapi.preco_brl) IS NOT NULL
             THEN i.quantidade * COALESCE(c_cvm.preco_brl, c_brapi.preco_brl)
           ELSE i.valor_atual_brl
         END AS valor_atual_brl,
         CASE
           WHEN i.preco_medio_brl IS NULL OR i.preco_medio_brl = 0 THEN NULL
           WHEN COALESCE(c_cvm.preco_brl, c_brapi.preco_brl) IS NOT NULL
             THEN ((COALESCE(c_cvm.preco_brl, c_brapi.preco_brl) - i.preco_medio_brl) / i.preco_medio_brl) * 100
           WHEN i.valor_atual_brl IS NOT NULL AND i.quantidade IS NOT NULL AND i.quantidade <> 0
             THEN (((i.valor_atual_brl / i.quantidade) - i.preco_medio_brl) / i.preco_medio_brl) * 100
           ELSE NULL
         END AS rentabilidade_pct,
         i.criado_em, i.atualizado_em
       FROM patrimonio_itens i
       LEFT JOIN ativos a ON a.id = i.ativo_id
       LEFT JOIN corretoras c ON c.id = i.corretora_id
       LEFT JOIN ativos_cotacoes_cache c_cvm ON c_cvm.ativo_id = i.ativo_id AND c_cvm.fonte = 'cvm'
       LEFT JOIN ativos_cotacoes_cache c_brapi ON c_brapi.ativo_id = i.ativo_id AND c_brapi.fonte = 'brapi'
       WHERE i.usuario_id = ? AND i.esta_ativo = 1
       ORDER BY valor_atual_brl DESC, i.nome`,
      usuarioId,
    );
  },

  async alocacao(usuarioId: string): Promise<LinhaAlocacao[]> {
    return bd.consultar<LinhaAlocacao>(
      `SELECT usuario_id, tipo, classe, subclasse, quantidade_itens, valor_total_brl
         FROM vw_patrimonio_alocacao WHERE usuario_id = ?`,
      usuarioId,
    );
  },

  async evolucao(usuarioId: string, limiteMeses = 24): Promise<LinhaEvolucao[]> {
    return bd.consultar<LinhaEvolucao>(
      `SELECT usuario_id, ano_mes, patrimonio_bruto_brl, patrimonio_liquido_brl,
              divida_brl, aporte_mes_brl, rentabilidade_mes_pct, eh_confiavel
         FROM vw_patrimonio_evolucao_mensal
         WHERE usuario_id = ?
         ORDER BY ano_mes DESC LIMIT ?`,
      usuarioId, limiteMeses,
    );
  },

  async buscarItemDetalhe(usuarioId: string, id: string) {
    return bd.primeiro<LinhaPosicao>(
      `SELECT * FROM vw_patrimonio_posicoes WHERE usuario_id = ? AND item_id = ? LIMIT 1`,
      usuarioId, id,
    );
  },

  async buscarItemBruto(usuarioId: string, id: string) {
    return bd.primeiro<LinhaItemPatrimonio>(
      `SELECT * FROM patrimonio_itens WHERE usuario_id = ? AND id = ? LIMIT 1`,
      usuarioId, id,
    );
  },

  async listarMovimentosItem(usuarioId: string, itemId: string, limite = 200): Promise<LinhaMovimentoPatrimonial[]> {
    return bd.consultar<LinhaMovimentoPatrimonial>(
      `SELECT id, usuario_id, item_id, importacao_id, linha_importacao, tipo, quantidade,
              valor_brl, data, origem, dados_json, criado_em
         FROM patrimonio_movimentos
        WHERE usuario_id = ? AND item_id = ?
        ORDER BY data DESC, criado_em DESC LIMIT ?`,
      usuarioId, itemId, limite,
    );
  },

  async inserirMovimento(id: string, usuarioId: string, itemId: string, tipo: string, quantidade: number | null, valorBrl: number | null, data: string, dadosJson: string): Promise<void> {
    await bd.executar(`INSERT INTO patrimonio_movimentos (id, usuario_id, item_id, tipo, quantidade, valor_brl, data, origem, dados_json) VALUES (?, ?, ?, ?, ?, ?, ?, 'manual', ?)`, id, usuarioId, itemId, tipo, quantidade, valorBrl, data, dadosJson);
  },

  async inserirItem(
    id: string, usuarioId: string, ativoId: string | null, corretoraId: string | null, lifecycleStatus: string, tipo: string, origem: string,
    nome: string, quantidade: number | null, precoMedioBrl: number | null, valorAtualBrl: number | null,
    moeda: string, dadosJson: string,
  ): Promise<void> {
    await bd.executar(
      `INSERT INTO patrimonio_itens
         (id, usuario_id, ativo_id, corretora_id, lifecycle_status, tipo, origem, nome, quantidade, preco_medio_brl, valor_atual_brl, moeda, dados_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, usuarioId, ativoId, corretoraId, lifecycleStatus, tipo, origem, nome, quantidade, precoMedioBrl, valorAtualBrl, moeda, dadosJson,
    );
  },

  async inserirItemComMovimento(
    id: string, usuarioId: string, ativoId: string | null, corretoraId: string | null, lifecycleStatus: string, tipo: string, origem: string,
    nome: string, quantidade: number | null, precoMedioBrl: number | null, valorAtualBrl: number | null,
    moeda: string, dadosJson: string,
    movimentoId: string, tipoMovimento: string, dataMovimento: string,
  ): Promise<void> {
    await bd.emLote([
      {
        sql: `INSERT INTO patrimonio_itens
                (id, usuario_id, ativo_id, corretora_id, lifecycle_status, tipo, origem, nome, quantidade, preco_medio_brl, valor_atual_brl, moeda, dados_json)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        valores: [id, usuarioId, ativoId, corretoraId, lifecycleStatus, tipo, origem, nome, quantidade, precoMedioBrl, valorAtualBrl, moeda, dadosJson],
      },
      {
        sql: `INSERT INTO patrimonio_movimentos
                (id, usuario_id, item_id, tipo, quantidade, valor_brl, data, origem, dados_json)
              VALUES (?, ?, ?, ?, ?, ?, ?, 'manual', ?)`,
        valores: [movimentoId, usuarioId, id, tipoMovimento, quantidade, valorAtualBrl, dataMovimento, dadosJson],
      },
    ]);
  },

  async atualizarItem(
    id: string, usuarioId: string,
    campos: {
      ativoId?: string | null;
      corretoraId?: string | null; lifecycleStatus?: string;
      tipo?: string; nome?: string; quantidade?: number | null;
      precoMedioBrl?: number | null; valorAtualBrl?: number | null;
      moeda?: string; estaAtivo?: boolean; dadosJson?: string;
    },
  ): Promise<void> {
    const partes: string[] = [];
    const vals: unknown[] = [];
    const set = (col: string, v: unknown) => { partes.push(`${col} = ?`); vals.push(v); };
    if (campos.ativoId !== undefined) set('ativo_id', campos.ativoId);
    if (campos.corretoraId !== undefined) set('corretora_id', campos.corretoraId);
    if (campos.lifecycleStatus !== undefined) set('lifecycle_status', campos.lifecycleStatus);
    if (campos.tipo !== undefined) set('tipo', campos.tipo);
    if (campos.nome !== undefined) set('nome', campos.nome);
    if (campos.quantidade !== undefined) set('quantidade', campos.quantidade);
    if (campos.precoMedioBrl !== undefined) set('preco_medio_brl', campos.precoMedioBrl);
    if (campos.valorAtualBrl !== undefined) set('valor_atual_brl', campos.valorAtualBrl);
    if (campos.moeda !== undefined) set('moeda', campos.moeda);
    if (campos.estaAtivo !== undefined) set('esta_ativo', campos.estaAtivo ? 1 : 0);
    if (campos.dadosJson !== undefined) set('dados_json', campos.dadosJson);
    if (partes.length === 0) return;
    partes.push("atualizado_em = datetime('now')");
    vals.push(id, usuarioId);
    await bd.executar(
      `UPDATE patrimonio_itens SET ${partes.join(', ')} WHERE id = ? AND usuario_id = ?`,
      ...vals,
    );
  },

  async atualizarItemComMovimento(
    id: string, usuarioId: string,
    campos: {
      ativoId?: string | null;
      corretoraId?: string | null; lifecycleStatus?: string;
      tipo?: string; nome?: string; quantidade?: number | null;
      precoMedioBrl?: number | null; valorAtualBrl?: number | null;
      moeda?: string; estaAtivo?: boolean; dadosJson?: string;
    },
    movimento: { id: string; quantidade: number | null; valorBrl: number | null; data: string; dadosJson: string },
  ): Promise<void> {
    const partes: string[] = [];
    const vals: unknown[] = [];
    const set = (col: string, v: unknown) => { partes.push(`${col} = ?`); vals.push(v); };
    if (campos.ativoId !== undefined) set('ativo_id', campos.ativoId);
    if (campos.corretoraId !== undefined) set('corretora_id', campos.corretoraId);
    if (campos.lifecycleStatus !== undefined) set('lifecycle_status', campos.lifecycleStatus);
    if (campos.tipo !== undefined) set('tipo', campos.tipo);
    if (campos.nome !== undefined) set('nome', campos.nome);
    if (campos.quantidade !== undefined) set('quantidade', campos.quantidade);
    if (campos.precoMedioBrl !== undefined) set('preco_medio_brl', campos.precoMedioBrl);
    if (campos.valorAtualBrl !== undefined) set('valor_atual_brl', campos.valorAtualBrl);
    if (campos.moeda !== undefined) set('moeda', campos.moeda);
    if (campos.estaAtivo !== undefined) set('esta_ativo', campos.estaAtivo ? 1 : 0);
    if (campos.dadosJson !== undefined) set('dados_json', campos.dadosJson);
    partes.push("atualizado_em = datetime('now')");
    vals.push(id, usuarioId);
    await bd.emLote([
      {
        sql: `UPDATE patrimonio_itens SET ${partes.join(', ')} WHERE id = ? AND usuario_id = ?`,
        valores: vals,
      },
      {
        sql: `INSERT INTO patrimonio_movimentos
                (id, usuario_id, item_id, tipo, quantidade, valor_brl, data, origem, dados_json)
              VALUES (?, ?, ?, 'correcao', ?, ?, ?, 'manual', ?)`,
        valores: [movimento.id, usuarioId, id, movimento.quantidade, movimento.valorBrl, movimento.data, movimento.dadosJson],
      },
    ]);
  },

  async desativarItemComMovimento(
    id: string, usuarioId: string,
    movimento: { id: string; quantidade: number | null; valorBrl: number | null; data: string; dadosJson: string },
  ): Promise<void> {
    await bd.emLote([
      {
        sql: `UPDATE patrimonio_itens
                SET esta_ativo = 0, atualizado_em = datetime('now')
              WHERE id = ? AND usuario_id = ?`,
        valores: [id, usuarioId],
      },
      {
        sql: `INSERT INTO patrimonio_movimentos
                (id, usuario_id, item_id, tipo, quantidade, valor_brl, data, origem, dados_json)
              VALUES (?, ?, ?, 'retirada', ?, ?, ?, 'manual', ?)`,
        valores: [movimento.id, usuarioId, id, movimento.quantidade, movimento.valorBrl, movimento.data, movimento.dadosJson],
      },
    ]);
  },

  async listarAportes(usuarioId: string, limite = 200): Promise<LinhaAporte[]> {
    return bd.consultar<LinhaAporte>(
      `SELECT id, usuario_id, item_id, tipo, valor_brl, data, descricao, origem, criado_em
         FROM patrimonio_aportes WHERE usuario_id = ? ORDER BY data DESC, criado_em DESC LIMIT ?`,
      usuarioId, limite,
    );
  },

  async inserirAporte(
    id: string, usuarioId: string, itemId: string | null, tipo: string,
    valorBrl: number, data: string, descricao: string | null, origem: string,
  ): Promise<void> {
    await bd.executar(
      `INSERT INTO patrimonio_aportes
         (id, usuario_id, item_id, tipo, valor_brl, data, descricao, origem)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id, usuarioId, itemId, tipo, valorBrl, data, descricao, origem,
    );
  },

  async removerAporte(id: string, usuarioId: string): Promise<void> {
    await bd.executar(`DELETE FROM patrimonio_aportes WHERE id = ? AND usuario_id = ?`, id, usuarioId);
  },

  async scoreAtual(usuarioId: string) {
    return bd.primeiro<LinhaScoreAtual>(
      `SELECT * FROM vw_patrimonio_score_atual WHERE usuario_id = ? LIMIT 1`,
      usuarioId,
    );
  },

  async scoreHistorico(usuarioId: string, limite = 24): Promise<LinhaScoreHistorico[]> {
    return bd.consultar<LinhaScoreHistorico>(
      `SELECT usuario_id, ano_mes, calculado_em, score_total, faixa
         FROM vw_patrimonio_score_historico WHERE usuario_id = ?
         ORDER BY ano_mes DESC LIMIT ?`,
      usuarioId, limite,
    );
  },

  async inserirImportacao(id: string, usuarioId: string, origem: string, chaveIdempotencia: string): Promise<void> {
    await bd.executar(
      `INSERT INTO importacoes (id, usuario_id, origem, status, chave_idempotencia) VALUES (?, ?, ?, 'pendente', ?)`,
      id, usuarioId, origem, chaveIdempotencia,
    );
  },

  async buscarImportacaoPorChave(usuarioId: string, chaveIdempotencia: string) {
    return bd.primeiro<LinhaImportacao>(
      `SELECT id, usuario_id, origem, status, iniciado_em, concluido_em
         FROM importacoes WHERE usuario_id = ? AND chave_idempotencia = ? LIMIT 1`,
      usuarioId, chaveIdempotencia,
    );
  },

  async inserirItemImportacao(id: string, importacaoId: string, linha: number, tipo: string, dadosJson: string): Promise<void> {
    await bd.executar(
      `INSERT INTO importacao_itens (id, importacao_id, linha, tipo, dados_json) VALUES (?, ?, ?, ?, ?)`,
      id, importacaoId, linha, tipo, dadosJson,
    );
  },

  async buscarImportacao(id: string, usuarioId: string) {
    return bd.primeiro<LinhaImportacao>(
      `SELECT id, usuario_id, origem, status, iniciado_em, concluido_em
         FROM importacoes WHERE id = ? AND usuario_id = ? LIMIT 1`,
      id, usuarioId,
    );
  },

  async listarItensImportacao(importacaoId: string): Promise<LinhaItemImportacao[]> {
    return bd.consultar<LinhaItemImportacao>(
      `SELECT id, linha, tipo, resultado, dados_json
         FROM importacao_itens WHERE importacao_id = ? ORDER BY linha ASC`,
      importacaoId,
    );
  },

  async reservarImportacao(id: string, usuarioId: string): Promise<boolean> {
    const resultado = await bd.executar(
      `UPDATE importacoes SET status = 'validado'
         WHERE id = ? AND usuario_id = ? AND status IN ('pendente', 'falhou')`,
      id, usuarioId,
    );
    return resultado.linhasAfetadas === 1;
  },

  async concluirImportacao(id: string, usuarioId: string): Promise<void> {
    await bd.executar(
      `UPDATE importacoes SET status = 'confirmado', concluido_em = datetime('now')
         WHERE id = ? AND usuario_id = ?`,
      id, usuarioId,
    );
  },

  async falharImportacao(id: string, usuarioId: string): Promise<void> {
    await bd.executar(
      `UPDATE importacoes SET status = 'falhou' WHERE id = ? AND usuario_id = ?`,
      id, usuarioId,
    );
  },

  async resumoItensImportacao(importacaoId: string): Promise<{ aceitos: number; rejeitados: number }> {
    const linhas = await bd.consultar<{ resultado: string; quantidade: number }>(
      `SELECT resultado, COUNT(*) AS quantidade FROM importacao_itens
         WHERE importacao_id = ? GROUP BY resultado`,
      importacaoId,
    );
    return {
      aceitos: linhas.find((linha) => linha.resultado === 'aceito')?.quantidade ?? 0,
      rejeitados: linhas.find((linha) => linha.resultado === 'rejeitado')?.quantidade ?? 0,
    };
  },
});
