import type {
  ItemPatrimonioSaida, ItemPatrimonioCriarEntrada, ItemPatrimonioAtualizarEntrada,
  AporteSaida, AporteCriarEntrada, TipoAporte,
  HistoricoMensalSaida, HistoricoMensalItem,
  PatrimonioResumoSaida, AlocacaoClasse,
  PatrimonioScoreSaida, ScoreFaixa, ScorePilar,
  TipoItemPatrimonio, OrigemItemPatrimonio,
  ImportacaoSaida, ImportacaoCriarEntrada,
} from '@ei/contratos';
import type { Bd } from '../../infra/bd';
import { gerarId } from '../../infra/bd';
import { erro, sucesso, type ServiceResponse } from '../../infra/http';
import { calcularAlocacao } from './calculos/alocacao';
import {
  repositorioPatrimonio, type LinhaAlocacao, type LinhaAporte,
  type LinhaEvolucao, type LinhaPosicao, type LinhaResumo, type LinhaScoreAtual,
} from './patrimonio.repositorio';

const paraItemSaida = (l: LinhaPosicao, totalBrl: number): ItemPatrimonioSaida => {
  const valor = l.valor_atual_brl ?? 0;
  const peso = totalBrl > 0 ? (valor / totalBrl) * 100 : null;
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

    async criarItem(usuarioId: string, e: ItemPatrimonioCriarEntrada): Promise<ServiceResponse<ItemPatrimonioSaida>> {
      if (!e.tipo || !e.nome) return erro('dados_incompletos', 'Tipo e nome são obrigatórios', 400);
      const id = gerarId();
      await repo.inserirItem(
        id, usuarioId, e.ativoId ?? null, e.tipo, 'manual', e.nome,
        e.quantidade ?? null, e.precoMedioBrl ?? null, e.valorAtualBrl ?? null,
        e.moeda ?? 'BRL', JSON.stringify(e.dadosJson ?? {}),
      );
      return this.obterItem(usuarioId, id);
    },

    async atualizarItem(usuarioId: string, id: string, e: ItemPatrimonioAtualizarEntrada): Promise<ServiceResponse<ItemPatrimonioSaida>> {
      const atual = await repo.buscarItemBruto(usuarioId, id);
      if (!atual) return erro('item_nao_encontrado', 'Item de patrimônio não encontrado', 404);
      await repo.atualizarItem(id, usuarioId, {
        ...e,
        dadosJson: e.dadosJson !== undefined ? JSON.stringify(e.dadosJson) : undefined,
      });
      return this.obterItem(usuarioId, id);
    },

    async removerItem(usuarioId: string, id: string): Promise<ServiceResponse<{ removido: true }>> {
      const atual = await repo.buscarItemBruto(usuarioId, id);
      if (!atual) return erro('item_nao_encontrado', 'Item de patrimônio não encontrado', 404);
      await repo.removerItem(id, usuarioId);
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
      const id = gerarId();
      await repo.inserirImportacao(id, usuarioId, e.origem);
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
  };
};
