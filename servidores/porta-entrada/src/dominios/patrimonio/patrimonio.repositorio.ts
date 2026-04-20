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

export const repositorioPatrimonio = (bd: Bd) => ({
  async resumo(usuarioId: string) {
    return bd.primeiro<LinhaResumo>(
      `SELECT * FROM vw_patrimonio_resumo WHERE usuario_id = ? LIMIT 1`,
      usuarioId,
    );
  },

  async posicoes(usuarioId: string): Promise<LinhaPosicao[]> {
    return bd.consultar<LinhaPosicao>(
      `SELECT * FROM vw_patrimonio_posicoes WHERE usuario_id = ? ORDER BY valor_atual_brl DESC, nome`,
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

  async inserirItem(
    id: string, usuarioId: string, ativoId: string | null, tipo: string, origem: string,
    nome: string, quantidade: number | null, precoMedioBrl: number | null, valorAtualBrl: number | null,
    moeda: string, dadosJson: string,
  ): Promise<void> {
    await bd.executar(
      `INSERT INTO patrimonio_itens
         (id, usuario_id, ativo_id, tipo, origem, nome, quantidade, preco_medio_brl, valor_atual_brl, moeda, dados_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, usuarioId, ativoId, tipo, origem, nome, quantidade, precoMedioBrl, valorAtualBrl, moeda, dadosJson,
    );
  },

  async atualizarItem(
    id: string, usuarioId: string,
    campos: {
      tipo?: string; nome?: string; quantidade?: number | null;
      precoMedioBrl?: number | null; valorAtualBrl?: number | null;
      moeda?: string; estaAtivo?: boolean; dadosJson?: string;
    },
  ): Promise<void> {
    const partes: string[] = [];
    const vals: unknown[] = [];
    const set = (col: string, v: unknown) => { partes.push(`${col} = ?`); vals.push(v); };
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

  async removerItem(id: string, usuarioId: string): Promise<void> {
    await bd.executar(`DELETE FROM patrimonio_itens WHERE id = ? AND usuario_id = ?`, id, usuarioId);
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

  async inserirImportacao(id: string, usuarioId: string, origem: string): Promise<void> {
    await bd.executar(
      `INSERT INTO importacoes (id, usuario_id, origem, status) VALUES (?, ?, ?, 'pendente')`,
      id, usuarioId, origem,
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
});
