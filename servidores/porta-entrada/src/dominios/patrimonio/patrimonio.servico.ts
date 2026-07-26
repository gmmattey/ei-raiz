import type {
  ItemPatrimonioSaida, ItemPatrimonioCriarEntrada, ItemPatrimonioAtualizarEntrada,
  AporteSaida, AporteCriarEntrada, TipoAporte,
  HistoricoMensalSaida, HistoricoMensalItem,
  PatrimonioResumoSaida, AlocacaoClasse,
  PatrimonioScoreSaida, ScoreFaixa, ScorePilar,
  TipoItemPatrimonio, OrigemItemPatrimonio,
  ImportacaoSaida, ImportacaoCriarEntrada, ImportacaoConfirmarSaida,
  MovimentoPatrimonialSaida, TipoMovimentoPatrimonial,
} from '@ei/contratos';
import type { Bd } from '../../infra/bd';
import { gerarId } from '../../infra/bd';
import { erro, sucesso, type ServiceResponse } from '../../infra/http';
import { calcularAlocacao } from './calculos/alocacao';
import {
  repositorioPatrimonio, type LinhaAlocacao, type LinhaAporte,
  type LinhaEvolucao, type LinhaPosicao, type LinhaResumo, type LinhaScoreAtual,
  type LinhaMovimentoPatrimonial,
} from './patrimonio.repositorio';

const paraItemSaida = (l: LinhaPosicao, totalBrl: number): ItemPatrimonioSaida => {
  const valor = l.valor_atual_brl ?? 0;
  const peso = totalBrl > 0 ? (valor / totalBrl) * 100 : null;
  const estadoValor = l.preco_atual_brl !== null && l.quantidade !== null
    ? 'cotacao'
    : l.valor_atual_brl !== null ? 'manual' : 'indisponivel';
  return {
    id: l.item_id,
    usuarioId: l.usuario_id,
    ativoId: l.ativo_id,
    tipo: l.tipo as TipoItemPatrimonio,
    origem: l.origem as OrigemItemPatrimonio,
    nome: l.nome,
    ticker: l.ticker,
    cnpj: l.cnpj,
    classeAtivo: l.classe,
    subclasseAtivo: l.subclasse,
    quantidade: l.quantidade,
    precoMedioBrl: l.preco_medio_brl,
    precoAtualBrl: l.preco_atual_brl,
    valorAtualBrl: l.valor_atual_brl,
    estadoValor,
    fonteCotacao: l.preco_fonte,
    cotacaoAtualizadaEm: l.preco_atualizado_em,
    cotacaoReferenciaEm: l.preco_referencia_em ?? l.preco_atualizado_em,
    cotacaoExpiraEm: l.preco_expira_em,
    rentabilidadePct: l.rentabilidade_pct,
    pesoPct: peso,
    moeda: 'BRL',
    criadoEm: l.criado_em,
    atualizadoEm: l.atualizado_em,
  };
};

const paraAporteSaida = (l: LinhaAporte): AporteSaida => ({
  id: l.id,
  usuarioId: l.usuario_id,
  itemId: l.item_id,
  tipo: l.tipo as TipoAporte,
  valorBrl: l.valor_brl,
  data: l.data,
  descricao: l.descricao,
  origem: l.origem,
  criadoEm: l.criado_em,
});

const paraMovimentoSaida = (l: LinhaMovimentoPatrimonial): MovimentoPatrimonialSaida => ({
  id: l.id,
  usuarioId: l.usuario_id,
  itemId: l.item_id,
  importacaoId: l.importacao_id,
  linhaImportacao: l.linha_importacao,
  tipo: l.tipo as TipoMovimentoPatrimonial,
  quantidade: l.quantidade,
  valorBrl: l.valor_brl,
  data: l.data,
  origem: l.origem as OrigemItemPatrimonio,
  dadosJson: JSON.parse(l.dados_json) as Record<string, unknown>,
  criadoEm: l.criado_em,
});

const paraEvolucaoSaida = (l: LinhaEvolucao): HistoricoMensalItem => ({
  anoMes: l.ano_mes,
  patrimonioBrutoBrl: l.patrimonio_bruto_brl,
  patrimonioLiquidoBrl: l.patrimonio_liquido_brl,
  dividaBrl: l.divida_brl,
  aporteMesBrl: l.aporte_mes_brl,
  rentabilidadeMesPct: l.rentabilidade_mes_pct,
  ehConfiavel: l.eh_confiavel === 1,
});

const paraAlocacaoSaida = (linhas: LinhaAlocacao[]): AlocacaoClasse[] => {
  const base = linhas.map((l) => ({
    tipo: l.tipo,
    classe: l.classe,
    subclasse: l.subclasse,
    quantidadeItens: l.quantidade_itens,
    valorBrl: l.valor_total_brl,
  }));
  const calculado = calcularAlocacao(base.map((b) => ({ classe: b.tipo, subclasse: b.subclasse, valorBrl: b.valorBrl })));
  return base.map((b, i) => ({ ...b, pesoPct: calculado[i].pesoPct }));
};

const normalizarCnpjPatrimonial = (valor: string): string | null => {
  const cnpj = valor.replace(/\D/g, '');
  return cnpj.length === 14 ? cnpj : null;
};

const aceitaCnpj = (tipo: TipoItemPatrimonio): boolean => tipo === 'fundo' || tipo === 'previdencia';

const tipoMovimentoInicial = (tipo: TipoItemPatrimonio): TipoMovimentoPatrimonial => {
  if (tipo === 'acao' || tipo === 'fii' || tipo === 'etf' || tipo === 'cripto') return 'compra';
  if (tipo === 'fundo' || tipo === 'previdencia' || tipo === 'renda_fixa' || tipo === 'poupanca' || tipo === 'caixa') return 'aporte';
  return 'ajuste';
};

const serializarEstavel = (valor: unknown): string => {
  if (Array.isArray(valor)) return `[${valor.map(serializarEstavel).join(',')}]`;
  if (valor && typeof valor === 'object') {
    const entradas = Object.entries(valor as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([chave, item]) => `${JSON.stringify(chave)}:${serializarEstavel(item)}`);
    return `{${entradas.join(',')}}`;
  }
  return JSON.stringify(valor);
};

const chaveIdempotenciaImportacao = async (itens: ImportacaoCriarEntrada['itens']): Promise<string> => {
  const conteudo = serializarEstavel(itens.map(({ linha, tipo, dadosJson }) => ({ linha, tipo, dadosJson })));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(conteudo));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

type ItemImportado = {
  tipo: TipoItemPatrimonio;
  nome: string;
  cnpj: string | null;
  quantidade: number | null;
  precoMedioBrl: number | null;
  valorAtualBrl: number | null;
  data: string;
  dadosJson: string;
};

const numeroPositivo = (valor: unknown): number | null => {
  const numero = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : null;
};

const textoObrigatorio = (valor: unknown): string | null => {
  const texto = typeof valor === 'string' ? valor.trim() : '';
  return texto || null;
};

const dataImportada = (...valores: unknown[]): string => {
  const data = valores.map(textoObrigatorio).find((valor) => /^\d{4}-\d{2}-\d{2}$/.test(valor ?? ''));
  return data ?? new Date().toISOString().slice(0, 10);
};

const materializarItemImportado = (dados: Record<string, unknown>): ItemImportado | null => {
  const aba = textoObrigatorio(dados.aba);
  const bruto = JSON.stringify(dados);
  if (aba === 'acoes') {
    const ticker = textoObrigatorio(dados.ticker);
    const quantidade = numeroPositivo(dados.quantidade);
    if (!ticker || !quantidade) return null;
    const precoMedioBrl = numeroPositivo(dados.precoMedio);
    const valorAtualBrl = numeroPositivo(dados.valorTotal) ?? (precoMedioBrl ? quantidade * precoMedioBrl : null);
    return { tipo: 'acao', nome: textoObrigatorio(dados.nome) ?? ticker, cnpj: null, quantidade, precoMedioBrl, valorAtualBrl, data: dataImportada(dados.dataCompra), dadosJson: bruto };
  }
  const mapeamento: Record<string, TipoItemPatrimonio> = {
    fundos: 'fundo', previdencia: 'previdencia', renda_fixa: 'renda_fixa',
    imoveis: 'imovel', veiculos: 'veiculo', poupanca: 'poupanca',
  };
  const tipo = aba ? mapeamento[aba] : undefined;
  if (!tipo) return null;
  const nome = textoObrigatorio(dados.nome)
    ?? textoObrigatorio(dados.descricao)
    ?? textoObrigatorio(dados.instituicao)
    ?? (tipo === 'veiculo' ? [textoObrigatorio(dados.montadora), textoObrigatorio(dados.modelo)].filter(Boolean).join(' ') : null);
  const valorAtualBrl = numeroPositivo(dados.valorAplicado)
    ?? numeroPositivo(dados.valorEstimado)
    ?? numeroPositivo(dados.valorReferencia)
    ?? numeroPositivo(dados.valorAtual);
  if (!nome || !valorAtualBrl) return null;
  const cnpjBruto = textoObrigatorio(dados.cnpj);
  const cnpj = cnpjBruto && aceitaCnpj(tipo) ? normalizarCnpjPatrimonial(cnpjBruto) : null;
  return {
    tipo, nome, cnpj, quantidade: null, precoMedioBrl: null, valorAtualBrl,
    data: dataImportada(dados.dataAplicacao, dados.dataInicio), dadosJson: bruto,
  };
};

export const servicoPatrimonio = (bd: Bd) => {
  const repo = repositorioPatrimonio(bd);

  return {
    async resumo(usuarioId: string): Promise<ServiceResponse<PatrimonioResumoSaida>> {
      const [resumoLinha, aloc, posicoes, evolucao] = await Promise.all([
        repo.resumo(usuarioId),
        repo.alocacao(usuarioId),
        repo.posicoes(usuarioId),
        repo.evolucao(usuarioId, 24),
      ]);

      const baseResumo: LinhaResumo = resumoLinha ?? {
        usuario_id: usuarioId,
        patrimonio_bruto_brl: 0,
        divida_brl: 0,
        patrimonio_liquido_brl: 0,
        quantidade_itens: 0,
        score_total: null,
        score_faixa: null,
        score_calculado_em: null,
        aporte_mes_brl: 0,
        rentabilidade_mes_pct: null,
      };

      const totalBrl = posicoes.reduce((s, p) => s + (p.valor_atual_brl ?? 0), 0);
      const topN = [...posicoes]
        .sort((a, b) => (b.valor_atual_brl ?? 0) - (a.valor_atual_brl ?? 0))
        .slice(0, 5)
        .map((p) => paraItemSaida(p, totalBrl));

      return sucesso({
        patrimonioBrutoBrl: baseResumo.patrimonio_bruto_brl,
        patrimonioLiquidoBrl: baseResumo.patrimonio_liquido_brl,
        dividaBrl: baseResumo.divida_brl,
        quantidadeItens: baseResumo.quantidade_itens,
        aporteMesBrl: baseResumo.aporte_mes_brl ?? 0,
        rentabilidadeMesPct: baseResumo.rentabilidade_mes_pct,
        scoreTotal: baseResumo.score_total,
        scoreFaixa: baseResumo.score_faixa,
        scoreCalculadoEm: baseResumo.score_calculado_em,
        alocacao: paraAlocacaoSaida(aloc),
        evolucao: evolucao.map(paraEvolucaoSaida).reverse(),
        principaisAtivos: topN,
        atualizadoEm: new Date().toISOString(),
      });
    },

    async listarItens(usuarioId: string): Promise<ServiceResponse<{ itens: ItemPatrimonioSaida[] }>> {
      const posicoes = await repo.posicoes(usuarioId);
      const total = posicoes.reduce((s, p) => s + (p.valor_atual_brl ?? 0), 0);
      return sucesso({ itens: posicoes.map((p) => paraItemSaida(p, total)) });
    },

    async obterItem(usuarioId: string, id: string): Promise<ServiceResponse<ItemPatrimonioSaida>> {
      const posicoes = await repo.posicoes(usuarioId);
      const total = posicoes.reduce((s, p) => s + (p.valor_atual_brl ?? 0), 0);
      const alvo = posicoes.find((p) => p.item_id === id);
      if (!alvo) return erro('item_nao_encontrado', 'Item de patrimônio não encontrado', 404);
      return sucesso(paraItemSaida(alvo, total));
    },

    async listarMovimentosItem(usuarioId: string, itemId: string): Promise<ServiceResponse<{ itens: MovimentoPatrimonialSaida[] }>> {
      const item = await repo.buscarItemBruto(usuarioId, itemId);
      if (!item) return erro('item_nao_encontrado', 'Item de patrimônio não encontrado', 404);
      const movimentos = await repo.listarMovimentosItem(usuarioId, itemId);
      return sucesso({ itens: movimentos.map(paraMovimentoSaida) });
    },

    async criarItem(usuarioId: string, e: ItemPatrimonioCriarEntrada): Promise<ServiceResponse<ItemPatrimonioSaida>> {
      if (!e.tipo || !e.nome) return erro('dados_incompletos', 'Tipo e nome são obrigatórios', 400);
      let ativoId = e.ativoId ?? null;
      if (e.cnpj !== undefined && e.cnpj !== null) {
        if (!aceitaCnpj(e.tipo)) return erro('cnpj_tipo_invalido', 'CNPJ só pode ser usado em fundos ou previdência', 400);
        const cnpj = normalizarCnpjPatrimonial(e.cnpj);
        if (!cnpj) return erro('cnpj_invalido', 'Informe um CNPJ com 14 dígitos', 400);
        const existente = await repo.buscarAtivoPorCnpj(cnpj);
        if (existente) ativoId = existente.id;
        else {
          await repo.inserirAtivoComCnpj(gerarId(), cnpj, e.tipo, e.nome);
          const criado = await repo.buscarAtivoPorCnpj(cnpj);
          if (!criado) return erro('ativo_nao_encontrado', 'Não foi possível vincular o CNPJ ao ativo', 500);
          ativoId = criado.id;
        }
      }
      const id = gerarId();
      const dadosJson = JSON.stringify(e.dadosJson ?? {});
      await repo.inserirItemComMovimento(
        id, usuarioId, ativoId, e.tipo, 'manual', e.nome,
        e.quantidade ?? null, e.precoMedioBrl ?? null, e.valorAtualBrl ?? null,
        e.moeda ?? 'BRL', dadosJson,
        gerarId(), tipoMovimentoInicial(e.tipo), new Date().toISOString().slice(0, 10),
      );
      return this.obterItem(usuarioId, id);
    },

    async atualizarItem(usuarioId: string, id: string, e: ItemPatrimonioAtualizarEntrada): Promise<ServiceResponse<ItemPatrimonioSaida>> {
      const atual = await repo.buscarItemBruto(usuarioId, id);
      if (!atual) return erro('item_nao_encontrado', 'Item de patrimônio não encontrado', 404);
      let ativoId: string | null | undefined;
      if (e.cnpj !== undefined) {
        if (e.cnpj === null || e.cnpj.trim() === '') ativoId = null;
        else {
          const tipo = e.tipo ?? atual.tipo as TipoItemPatrimonio;
          if (!aceitaCnpj(tipo)) return erro('cnpj_tipo_invalido', 'CNPJ só pode ser usado em fundos ou previdência', 400);
          const cnpj = normalizarCnpjPatrimonial(e.cnpj);
          if (!cnpj) return erro('cnpj_invalido', 'Informe um CNPJ com 14 dígitos', 400);
          const existente = await repo.buscarAtivoPorCnpj(cnpj);
          if (existente) ativoId = existente.id;
          else {
            await repo.inserirAtivoComCnpj(gerarId(), cnpj, tipo, e.nome ?? atual.nome);
            const criado = await repo.buscarAtivoPorCnpj(cnpj);
            if (!criado) return erro('ativo_nao_encontrado', 'Não foi possível vincular o CNPJ ao ativo', 500);
            ativoId = criado.id;
          }
        }
      }
      const campos = {
        ...e,
        ativoId,
        dadosJson: e.dadosJson !== undefined ? JSON.stringify(e.dadosJson) : undefined,
      };
      const alteraValor = e.quantidade !== undefined || e.precoMedioBrl !== undefined || e.valorAtualBrl !== undefined;
      if (alteraValor) {
        const quantidade = e.quantidade !== undefined ? e.quantidade : atual.quantidade;
        const valorBrl = e.valorAtualBrl !== undefined ? e.valorAtualBrl : atual.valor_atual_brl;
        await repo.atualizarItemComMovimento(id, usuarioId, campos, {
          id: gerarId(), quantidade, valorBrl, data: new Date().toISOString().slice(0, 10),
          dadosJson: JSON.stringify({
            tipo: 'correcao_manual',
            anterior: { quantidade: atual.quantidade, precoMedioBrl: atual.preco_medio_brl, valorAtualBrl: atual.valor_atual_brl },
            novo: { quantidade, precoMedioBrl: e.precoMedioBrl !== undefined ? e.precoMedioBrl : atual.preco_medio_brl, valorAtualBrl: valorBrl },
          }),
        });
      } else {
        await repo.atualizarItem(id, usuarioId, campos);
      }
      return this.obterItem(usuarioId, id);
    },

    async removerItem(usuarioId: string, id: string): Promise<ServiceResponse<{ removido: true }>> {
      const atual = await repo.buscarItemBruto(usuarioId, id);
      if (!atual) return erro('item_nao_encontrado', 'Item de patrimônio não encontrado', 404);
      await repo.desativarItemComMovimento(id, usuarioId, {
        id: gerarId(), quantidade: atual.quantidade, valorBrl: atual.valor_atual_brl,
        data: new Date().toISOString().slice(0, 10),
        dadosJson: JSON.stringify({
          tipo: 'baixa_manual',
          quantidade: atual.quantidade,
          valorAtualBrl: atual.valor_atual_brl,
        }),
      });
      return sucesso({ removido: true });
    },

    async listarAportes(usuarioId: string): Promise<ServiceResponse<{ itens: AporteSaida[] }>> {
      const linhas = await repo.listarAportes(usuarioId);
      return sucesso({ itens: linhas.map(paraAporteSaida) });
    },

    async criarAporte(usuarioId: string, e: AporteCriarEntrada): Promise<ServiceResponse<AporteSaida>> {
      if (!e.tipo || !e.valorBrl || !e.data) return erro('dados_incompletos', 'tipo, valorBrl e data são obrigatórios', 400);
      const id = gerarId();
      await repo.inserirAporte(
        id, usuarioId, e.itemId ?? null, e.tipo, e.valorBrl, e.data, e.descricao ?? null, 'manual',
      );
      const linhas = await repo.listarAportes(usuarioId, 1);
      const recente = linhas.find((l) => l.id === id);
      if (!recente) return erro('aporte_nao_encontrado', 'Aporte recém-criado não encontrado', 500);
      return sucesso(paraAporteSaida(recente));
    },

    async removerAporte(usuarioId: string, id: string): Promise<ServiceResponse<{ removido: true }>> {
      await repo.removerAporte(id, usuarioId);
      return sucesso({ removido: true });
    },

    async historico(usuarioId: string): Promise<ServiceResponse<HistoricoMensalSaida>> {
      const linhas = await repo.evolucao(usuarioId, 24);
      return sucesso({ itens: linhas.map(paraEvolucaoSaida).reverse() });
    },

    async score(usuarioId: string): Promise<ServiceResponse<PatrimonioScoreSaida>> {
      const [atual, historico]: [LinhaScoreAtual | null, { ano_mes: string; score_total: number; faixa: string }[]] =
        await Promise.all([repo.scoreAtual(usuarioId), repo.scoreHistorico(usuarioId, 24)]);

      const pilares: ScorePilar[] = (() => {
        if (!atual?.pilares_json) return [];
        try {
          const bruto = JSON.parse(atual.pilares_json) as Record<string, { rotulo?: string; valor?: number; peso?: number }>;
          return Object.entries(bruto).map(([chave, v]) => ({
            chave,
            rotulo: v.rotulo ?? chave,
            valor: v.valor ?? 0,
            peso: v.peso ?? 0,
          }));
        } catch {
          return [];
        }
      })();

      return sucesso({
        scoreTotal: atual?.score_total ?? null,
        faixa: (atual?.faixa as ScoreFaixa | undefined) ?? null,
        pilares,
        historico: historico.map((h) => ({
          anoMes: h.ano_mes,
          score: h.score_total,
          faixa: h.faixa as ScoreFaixa,
        })).reverse(),
        calculadoEm: atual?.calculado_em ?? null,
      });
    },

    async criarImportacao(usuarioId: string, e: ImportacaoCriarEntrada): Promise<ServiceResponse<ImportacaoSaida>> {
      if (!e.origem || !Array.isArray(e.itens)) return erro('dados_incompletos', 'origem e itens são obrigatórios', 400);
      const chaveIdempotencia = await chaveIdempotenciaImportacao(e.itens);
      const existente = await repo.buscarImportacaoPorChave(usuarioId, chaveIdempotencia);
      if (existente) return this.obterImportacao(usuarioId, existente.id);
      const id = gerarId();
      await repo.inserirImportacao(id, usuarioId, e.origem, chaveIdempotencia);
      for (const item of e.itens) {
        await repo.inserirItemImportacao(
          gerarId(), id, item.linha, item.tipo, JSON.stringify(item.dadosJson ?? {}),
        );
      }
      return this.obterImportacao(usuarioId, id);
    },

    async obterImportacao(usuarioId: string, id: string): Promise<ServiceResponse<ImportacaoSaida>> {
      const l = await repo.buscarImportacao(id, usuarioId);
      if (!l) return erro('importacao_nao_encontrada', 'Importação não encontrada', 404);
      return sucesso({
        id: l.id,
        usuarioId: l.usuario_id,
        origem: l.origem,
        status: l.status as ImportacaoSaida['status'],
        iniciadoEm: l.iniciado_em,
        concluidoEm: l.concluido_em,
      });
    },

    async confirmarImportacao(usuarioId: string, id: string): Promise<ServiceResponse<ImportacaoConfirmarSaida>> {
      const importacao = await repo.buscarImportacao(id, usuarioId);
      if (!importacao) return erro('importacao_nao_encontrada', 'Importação não encontrada', 404);
      const resumoExistente = await repo.resumoItensImportacao(id);
      if (importacao.status === 'confirmado') {
        const existente = await this.obterImportacao(usuarioId, id);
        if (!existente.ok) return existente;
        return sucesso({ importacao: existente.dados, itensCriados: resumoExistente.aceitos, itensRejeitados: resumoExistente.rejeitados });
      }
      if (!(await repo.reservarImportacao(id, usuarioId))) {
        return erro('importacao_em_processamento', 'Importação já está sendo confirmada', 409);
      }

      try {
        const linhas = await repo.listarItensImportacao(id);
        const operacoes: { sql: string; valores: unknown[] }[] = [];
        const chavesLinhas = new Set<string>();
        const ativosPorCnpj = new Map<string, string>();
        const ativosNovos: { id: string; cnpj: string; tipo: TipoItemPatrimonio; nome: string }[] = [];
        const itensAceitos: { linhaId: string; linhaNumero: number; item: ItemImportado }[] = [];
        let aceitos = 0;
        let rejeitados = 0;
        for (const linha of linhas) {
          let dados: Record<string, unknown> | null = null;
          try { dados = JSON.parse(linha.dados_json) as Record<string, unknown>; } catch { dados = null; }
          const item = dados ? materializarItemImportado(dados) : null;
          const chaveLinha = item ? serializarEstavel({
            tipo: item.tipo, nome: item.nome.toLocaleUpperCase('pt-BR'), quantidade: item.quantidade,
            precoMedioBrl: item.precoMedioBrl, valorAtualBrl: item.valorAtualBrl,
          }) : null;
          if (!item || !chaveLinha || chavesLinhas.has(chaveLinha)) {
            rejeitados += 1;
            operacoes.push({ sql: `UPDATE importacao_itens SET resultado = 'rejeitado' WHERE id = ?`, valores: [linha.id] });
            continue;
          }
          chavesLinhas.add(chaveLinha);
          aceitos += 1;
          itensAceitos.push({ linhaId: linha.id, linhaNumero: linha.linha, item });
        }
        for (const { item } of itensAceitos) {
          if (!item.cnpj || ativosPorCnpj.has(item.cnpj)) continue;
          const existente = await repo.buscarAtivoPorCnpj(item.cnpj);
          if (existente) ativosPorCnpj.set(item.cnpj, existente.id);
          else {
            const ativoId = gerarId();
            ativosPorCnpj.set(item.cnpj, ativoId);
            ativosNovos.push({ id: ativoId, cnpj: item.cnpj, tipo: item.tipo, nome: item.nome });
          }
        }
        for (const ativo of ativosNovos) {
          operacoes.push({
            sql: `INSERT INTO ativos (id, cnpj, nome, tipo) VALUES (?, ?, ?, ?)`,
            valores: [ativo.id, ativo.cnpj, ativo.nome, ativo.tipo],
          });
        }
        for (const { linhaId, linhaNumero, item } of itensAceitos) {
          const ativoId = item.cnpj ? ativosPorCnpj.get(item.cnpj) ?? null : null;
          const itemId = gerarId();
          operacoes.push({
            sql: `INSERT INTO patrimonio_itens
                    (id, usuario_id, ativo_id, tipo, origem, nome, quantidade, preco_medio_brl, valor_atual_brl, moeda, dados_json)
                  VALUES (?, ?, ?, ?, 'importacao', ?, ?, ?, ?, 'BRL', ?)`,
            valores: [itemId, usuarioId, ativoId, item.tipo, item.nome, item.quantidade, item.precoMedioBrl, item.valorAtualBrl, item.dadosJson],
          });
          const tipoMovimento = item.tipo === 'acao' ? 'compra'
            : ['fundo', 'previdencia', 'renda_fixa', 'poupanca'].includes(item.tipo) ? 'aporte'
              : 'ajuste';
          operacoes.push({
            sql: `INSERT INTO patrimonio_movimentos
                    (id, usuario_id, item_id, importacao_id, linha_importacao, tipo, quantidade, valor_brl, data, origem, dados_json)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'importacao', ?)`,
            valores: [gerarId(), usuarioId, itemId, id, linhaNumero, tipoMovimento, item.quantidade, item.valorAtualBrl, item.data, item.dadosJson],
          });
          operacoes.push({ sql: `UPDATE importacao_itens SET resultado = 'aceito' WHERE id = ?`, valores: [linhaId] });
        }
        if (aceitos > 0) {
          operacoes.push({
            sql: `INSERT INTO patrimonio_fila_reconstrucao (id, usuario_id, motivo, status)
                  VALUES (?, ?, 'importacao_confirmada', 'pendente')
                  ON CONFLICT(usuario_id) DO UPDATE SET
                    motivo = excluded.motivo,
                    status = 'pendente',
                    agendado_em = datetime('now'),
                    iniciado_em = NULL,
                    processado_em = NULL,
                    erro = NULL`,
            valores: [gerarId(), usuarioId],
          });
        }
        await bd.emLote(operacoes);
        await repo.concluirImportacao(id, usuarioId);
        const confirmada = await this.obterImportacao(usuarioId, id);
        if (!confirmada.ok) return confirmada;
        return sucesso({ importacao: confirmada.dados, itensCriados: aceitos, itensRejeitados: rejeitados });
      } catch (causa) {
        await repo.falharImportacao(id, usuarioId);
        throw causa;
      }
    },
  };
};
