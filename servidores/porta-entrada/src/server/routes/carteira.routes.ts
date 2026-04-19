import { RepositorioPerfilD1, ServicoPerfilPadrao } from "@ei/servico-perfil";
import { RepositorioInsightsD1, ServicoInsightsPadrao } from "@ei/servico-insights";
import type { CategoriaAtivo, SessaoUsuarioSaida } from "@ei/contratos";
import { z } from "zod";
import type { Env, ServiceResponse } from "../types/gateway";
import { parseJsonBody, sucesso, erro } from "../types/gateway";
import { PortfolioViewService } from "../services/portfolio-view.service";
import { UnifiedScoreService } from "../services/unified-score.service";
import { BenchmarkService } from "../services/benchmark.service";
import { construirServicoCarteira } from "../services/construir-servico-carteira";
import { orquestrarPosEscritaCarteira } from "../jobs/portfolio-orchestrator.job";

const categoriasPermitidas: CategoriaAtivo[] = ["acao", "fundo", "previdencia", "renda_fixa", "poupanca", "bens"];

const atualizarDataAquisicaoSchema = z.object({
  dataAquisicao: z.string().min(8),
});

const vincularMovimentacaoSchema = z.object({
  ativoOrigemId: z.string().min(3),
  ativoDestinoId: z.string().min(3),
  valor: z.number().positive(),
  dataMovimentacao: z.string().min(8),
  observacao: z.string().optional(),
});

const registrarAporteSchema = z.object({
  valorAporte: z.number().positive(),
  quantidade: z.number().positive().optional(),
  precoUnitario: z.number().positive().optional(),
  dataOperacao: z.string().min(8).optional(),
  observacao: z.string().optional(),
});

const excluirAtivoSchema = z.object({
  motivo: z.string().min(5).max(280),
});

type StatusAtualizacaoMercado = "atualizado" | "atrasado" | "indisponivel";
type FonteMercado = "brapi" | "cvm" | "nenhuma";
type AtivoComMercado = {
  id: string;
  ticker: string;
  nome: string;
  categoria: CategoriaAtivo;
  plataforma: string;
  precoAtual?: number;
  variacaoPercentual?: number;
  ganhoPerda?: number;
  ganhoPerdaPercentual?: number;
  ultimaAtualizacao?: string;
  fontePreco?: FonteMercado;
  statusAtualizacao?: StatusAtualizacaoMercado;
  dataCadastro?: string;
  dataAquisicao?: string;
  valorAtual: number;
  participacao: number;
  rentabilidadeDesdeAquisicaoPct: number | null;
  rentabilidadeConfiavel: boolean;
  motivoRentabilidadeIndisponivel?: string;
  statusPrecoMedio?: "confiavel" | "ajustado_heuristica" | "inconsistente";
};

const serializarAtivoMercado = (ativo: AtivoComMercado) => ({
  ...ativo,
  fonte_preco: ativo.fontePreco,
  status_atualizacao: ativo.statusAtualizacao,
  ultima_atualizacao: ativo.ultimaAtualizacao,
  data_cadastro: ativo.dataCadastro,
  data_aquisicao: ativo.dataAquisicao || ativo.dataCadastro,
  rentabilidade_desde_aquisicao_pct: ativo.rentabilidadeDesdeAquisicaoPct,
  rentabilidade_confiavel: ativo.rentabilidadeConfiavel,
  motivo_rentabilidade_indisponivel: ativo.motivoRentabilidadeIndisponivel,
  status_preco_medio: ativo.statusPrecoMedio,
});

const resumirAtualizacaoMercado = (ativos: AtivoComMercado[]) => {
  const total = ativos.length;
  const coberturaPorStatus: Record<StatusAtualizacaoMercado, number> = { atualizado: 0, atrasado: 0, indisponivel: 0 };
  const fontesMap = new Map<FonteMercado, number>();
  let ultimaAtualizacao: string | null = null;

  for (const ativo of ativos) {
    const status = ativo.statusAtualizacao ?? "indisponivel";
    coberturaPorStatus[status] += 1;
    const fonte = ativo.fontePreco ?? "nenhuma";
    fontesMap.set(fonte, (fontesMap.get(fonte) ?? 0) + 1);
    if (ativo.ultimaAtualizacao && (!ultimaAtualizacao || ativo.ultimaAtualizacao > ultimaAtualizacao)) {
      ultimaAtualizacao = ativo.ultimaAtualizacao;
    }
  }

  const cobertura = total > 0 ? Number(((coberturaPorStatus.atualizado / total) * 100).toFixed(2)) : 0;
  let statusGeral: StatusAtualizacaoMercado = "indisponivel";
  if (coberturaPorStatus.atualizado > 0) statusGeral = "atualizado";
  else if (coberturaPorStatus.atrasado > 0) statusGeral = "atrasado";

  const fontes = Array.from(fontesMap.entries()).map(([fonte, quantidade]) => ({ fonte, quantidade }));
  return {
    cobertura,
    statusGeral,
    ultimaAtualizacao,
    fontes,
    coberturaPorStatus,
    cobertura_por_status: coberturaPorStatus,
    status_geral: statusGeral,
    ultima_atualizacao: ultimaAtualizacao,
  };
};

type ItemPatrimonioDashboard = {
  id: string;
  nome: string;
  categoria: CategoriaAtivo;
  valor: number;
  percentual: number;
};

const calcularPercentuais = (itensBase: Array<Omit<ItemPatrimonioDashboard, "percentual">>): ItemPatrimonioDashboard[] => {
  const total = itensBase.reduce((acc, item) => acc + item.valor, 0);
  return itensBase.map((item) => ({
    ...item,
    percentual: total > 0 ? Number(((item.valor / total) * 100).toFixed(4)) : 0,
  }));
};

export async function handleCarteiraRoutes(
  pathname: string,
  request: Request,
  env: Env,
  sessao: SessaoUsuarioSaida | null,
  ctx: ExecutionContext,
): Promise<ServiceResponse<unknown> | null> {
  if (!sessao) return null;
  if (!pathname.startsWith("/api/carteira")) return null;

  const userId = sessao.usuario.id;
  const carteiraService = construirServicoCarteira(env);
  const perfilService = new ServicoPerfilPadrao(new RepositorioPerfilD1(env.DB));
  const insightsService = new ServicoInsightsPadrao(new RepositorioInsightsD1(env.DB));
  const portfolioView = new PortfolioViewService(env);

  // ─── Leituras: SEM refresh de mercado (usa snapshot ou valores cached no banco) ──

  /**
   * @deprecated Use `/api/financial-core/summary` — contrato canônico camelCase
   * com `returnSinceInception`, `officialScore`, `qualityFlags`, `benchmark`.
   * Mantido por retrocompatibilidade do frontend legado; shape de resposta preservado.
   */
  if (pathname === "/api/carteira/resumo" && request.method === "GET") {
    const resumoData = await portfolioView.getResumo(userId);
    let scoreOficial: unknown = null;
    try {
      scoreOficial = await new UnifiedScoreService(env.DB).calculateForUser(userId);
    } catch {
      scoreOficial = null;
    }
    return sucesso({
      ...(resumoData as Record<string, unknown>),
      // Score oficial do produto (canônico). O campo `score` raiz é legado/deprecated.
      scoreOficial,
      score_oficial: scoreOficial,
      scoreUnificado: scoreOficial,
      score_unificado: scoreOficial,
    });
  }

  /**
   * @deprecated Use `/api/financial-core/summary` — bloco `allocation.byClass`
   * traz o breakdown por categoria com o mesmo shape canônico.
   */
  if (pathname === "/api/carteira/dashboard" && request.method === "GET") {
    const ativos = (await carteiraService.listarAtivos(userId)) as AtivoComMercado[];
    const contexto = await perfilService.obterContextoFinanceiro(userId);

    const itensInvestimento = ativos
      .filter((a) => Number(a.valorAtual ?? 0) > 0)
      .map((a) => ({ id: a.id, nome: a.ticker || a.nome || "Ativo", categoria: a.categoria, valor: Number(a.valorAtual ?? 0) }));

    const itensBens = [
      ...(contexto?.patrimonioExterno?.imoveis ?? [])
        .map((i) => ({ id: i.id, nome: i.tipo || "Imóvel", categoria: "bens" as const, valor: Math.max(0, Number(i.valorEstimado ?? 0) - Number(i.saldoFinanciamento ?? 0)) }))
        .filter((i) => i.valor > 0),
      ...(contexto?.patrimonioExterno?.veiculos ?? [])
        .map((v) => ({ id: v.id, nome: v.tipo || "Veículo", categoria: "bens" as const, valor: Math.max(0, Number(v.valorEstimado ?? 0)) }))
        .filter((v) => v.valor > 0),
    ];

    const valorPoupanca = Number(contexto?.patrimonioExterno?.poupanca ?? contexto?.patrimonioExterno?.caixaDisponivel ?? 0);
    const itensPoupanca = valorPoupanca > 0 ? [{ id: "poupanca", nome: "Poupança", categoria: "poupanca" as const, valor: valorPoupanca }] : [];

    const todosBase = [...itensInvestimento, ...itensBens, ...itensPoupanca];
    const filtros = {
      todos: calcularPercentuais(todosBase),
      acao: calcularPercentuais(itensInvestimento.filter((i) => i.categoria === "acao")),
      fundo: calcularPercentuais(itensInvestimento.filter((i) => i.categoria === "fundo")),
      previdencia: calcularPercentuais(itensInvestimento.filter((i) => i.categoria === "previdencia")),
      renda_fixa: calcularPercentuais(itensInvestimento.filter((i) => i.categoria === "renda_fixa")),
      poupanca: calcularPercentuais(itensPoupanca),
      bens: calcularPercentuais(itensBens),
    };
    const totais = Object.fromEntries(
      Object.entries(filtros).map(([key, value]) => [key, Number(value.reduce((acc, item) => acc + item.valor, 0).toFixed(2))]),
    );

    return sucesso({ filtros, totais });
  }

  /**
   * @deprecated Use `/api/financial-core/summary` (bloco `benchmark`) e
   * `/api/financial-core/history?range=12m` para a série completa.
   */
  if (pathname === "/api/carteira/benchmark" && request.method === "GET") {
    const url = new URL(request.url);
    const meses = Number.parseInt(url.searchParams.get("meses") ?? "12", 10);
    const benchmark = await carteiraService.obterComparativoBenchmark(userId, Number.isNaN(meses) ? 12 : meses);
    return sucesso({
      ...benchmark,
      fonte_benchmark: benchmark.fonteBenchmark,
      status_atualizacao_benchmark: benchmark.statusAtualizacaoBenchmark,
      atualizado_em_benchmark: benchmark.atualizadoEmBenchmark,
    });
  }

  if (pathname === "/api/carteira/ativos" && request.method === "GET") {
    const ativos = (await carteiraService.listarAtivos(userId)) as AtivoComMercado[];
    return sucesso(ativos.map(serializarAtivoMercado));
  }

  /**
   * @deprecated Use `/api/financial-core/assets?class=<categoria>` —
   * contrato canônico com `qualityFlags` por ativo.
   */
  if (pathname.startsWith("/api/carteira/categoria/") && request.method === "GET") {
    const categoria = pathname.replace("/api/carteira/categoria/", "") as CategoriaAtivo;
    if (!categoriasPermitidas.includes(categoria)) {
      return erro("CATEGORIA_INVALIDA", "Categoria inválida");
    }

    if (categoria === "poupanca" || categoria === "bens") {
      const contexto = await perfilService.obterContextoFinanceiro(userId);
      const patrimonioInvestimentos = (await carteiraService.listarAtivos(userId)).reduce((acc, a) => acc + ((a as AtivoComMercado).valorAtual ?? 0), 0);
      const patrimonioBens =
        (contexto?.patrimonioExterno?.imoveis ?? []).reduce((acc, i) => acc + (i.valorEstimado ?? 0), 0) +
        (contexto?.patrimonioExterno?.veiculos ?? []).reduce((acc, v) => acc + (v.valorEstimado ?? 0), 0);
      const patrimonioPoupanca = Number(contexto?.patrimonioExterno?.poupanca ?? contexto?.patrimonioExterno?.caixaDisponivel ?? 0);
      const totalPatrimonio = patrimonioInvestimentos + patrimonioBens + patrimonioPoupanca;

      let ativos: AtivoComMercado[] = [];
      let valorTotal = 0;

      if (categoria === "poupanca") {
        valorTotal = patrimonioPoupanca;
        if (valorTotal > 0) {
          ativos.push({
            id: "poupanca_unica",
            ticker: "POUP",
            nome: "Reserva Financeira / Poupança",
            categoria: "poupanca",
            valorAtual: valorTotal,
            participacao: totalPatrimonio > 0 ? (valorTotal / totalPatrimonio) * 100 : 100,
            rentabilidadeDesdeAquisicaoPct: null,
            rentabilidadeConfiavel: false,
            motivoRentabilidadeIndisponivel: "Poupança não tem rentabilidade calculada pela carteira",
            plataforma: "Reserva em Caixa",
          } as AtivoComMercado);
        }
      } else {
        ativos = [
          ...(contexto?.patrimonioExterno?.imoveis ?? []).map((i) => ({
            id: i.id, ticker: "IMOVEL", nome: i.tipo, categoria: "bens" as CategoriaAtivo,
            valorAtual: i.valorEstimado, participacao: totalPatrimonio > 0 ? (i.valorEstimado / totalPatrimonio) * 100 : 0,
            rentabilidadeDesdeAquisicaoPct: null, rentabilidadeConfiavel: false,
            motivoRentabilidadeIndisponivel: "Bens não têm rentabilidade calculada pela carteira",
            plataforma: "Imóvel",
          } as AtivoComMercado)),
          ...(contexto?.patrimonioExterno?.veiculos ?? []).map((v) => ({
            id: v.id, ticker: "VEICULO", nome: v.tipo, categoria: "bens" as CategoriaAtivo,
            valorAtual: v.valorEstimado, participacao: totalPatrimonio > 0 ? (v.valorEstimado / totalPatrimonio) * 100 : 0,
            rentabilidadeDesdeAquisicaoPct: null, rentabilidadeConfiavel: false,
            motivoRentabilidadeIndisponivel: "Bens não têm rentabilidade calculada pela carteira",
            plataforma: "Veículo",
          } as AtivoComMercado)),
        ];
        valorTotal = patrimonioBens;
      }

      return sucesso({
        categoria,
        valorTotal,
        participacao: totalPatrimonio > 0 ? Number(((valorTotal / totalPatrimonio) * 100).toFixed(2)) : 0,
        ativos: ativos.map(serializarAtivoMercado),
      });
    }

    const detalhe = await carteiraService.obterDetalhePorCategoria(userId, categoria);
    return sucesso({ ...detalhe, ativos: (detalhe.ativos as AtivoComMercado[]).map(serializarAtivoMercado) });
  }

  if (pathname.startsWith("/api/carteira/ativo/") && request.method === "GET" && !pathname.endsWith("/data-aquisicao") && !pathname.endsWith("/aporte")) {
    const ticker = decodeURIComponent(pathname.replace("/api/carteira/ativo/", ""));
    const ativos = (await carteiraService.listarAtivos(userId)) as AtivoComMercado[];
    const ativo = ativos.find((item) => item.ticker === ticker);
    if (!ativo) return erro("ATIVO_NAO_ENCONTRADO", "Ativo não encontrado", 404);

    const baseComparacao = ativo.dataAquisicao || ativo.dataCadastro || new Date().toISOString().slice(0, 10);
    const inicio = new Date(baseComparacao);
    const hoje = new Date();
    const diffMeses = Math.max(1, (hoje.getFullYear() - inicio.getFullYear()) * 12 + (hoje.getMonth() - inicio.getMonth()) + 1);
    const benchmarkCarteira = await carteiraService.obterComparativoBenchmark(userId, diffMeses);
    const cdiRetornoPeriodo = await new BenchmarkService().cdiReturnSince(baseComparacao);
    const ativoRetornoPeriodo = typeof ativo.ganhoPerdaPercentual === "number" && Number.isFinite(ativo.ganhoPerdaPercentual) ? Number(ativo.ganhoPerdaPercentual.toFixed(2)) : 0;
    const benchmark = {
      ...benchmarkCarteira,
      carteiraRetornoPeriodo: ativoRetornoPeriodo,
      cdiRetornoPeriodo,
      excessoRetorno: Number((ativoRetornoPeriodo - cdiRetornoPeriodo).toFixed(2)),
    };

    const movimentos = await env.DB
      .prepare(
        "SELECT id, ativo_origem_id, ativo_destino_id, valor, data_movimentacao, observacao, criado_em FROM ativos_movimentacoes WHERE usuario_id = ? AND (ativo_origem_id = ? OR ativo_destino_id = ?) ORDER BY data_movimentacao DESC, criado_em DESC",
      )
      .bind(userId, ativo.id, ativo.id)
      .all<Record<string, unknown>>();

    const movimentosRows = movimentos.results ?? [];
    const serieTickerDesc: Array<{ data: string; valor: number }> = [
      { data: new Date().toISOString().slice(0, 10), valor: Number(ativo.valorAtual ?? 0) },
    ];
    let valorCorrente = Number(ativo.valorAtual ?? 0);
    for (const mov of movimentosRows) {
      const dataMov = String(mov.data_movimentacao ?? "").slice(0, 10);
      const valorMov = Number(mov.valor ?? 0);
      if (!dataMov || !Number.isFinite(valorMov) || valorMov <= 0) continue;
      if (mov.ativo_origem_id === ativo.id) valorCorrente += valorMov;
      else if (mov.ativo_destino_id === ativo.id) valorCorrente = Math.max(0, valorCorrente - valorMov);
      serieTickerDesc.push({ data: dataMov, valor: Number(valorCorrente.toFixed(2)) });
    }
    const serieTicker = [...serieTickerDesc]
      .sort((a, b) => (a.data < b.data ? -1 : 1))
      .filter((point, idx, arr) => idx === 0 || point.data !== arr[idx - 1].data);

    const importacoesAtivo = await env.DB
      .prepare(
        "SELECT imp.id, imp.criado_em, imp.arquivo_nome, imp.validos FROM importacoes imp INNER JOIN itens_importacao item ON item.importacao_id = imp.id WHERE imp.usuario_id = ? AND item.ticker = ? ORDER BY imp.criado_em DESC LIMIT 20",
      )
      .bind(userId, ativo.ticker)
      .all<{ id: string; criado_em: string; arquivo_nome: string | null; validos: number | null }>();

    const eventosTicker = [
      ...(importacoesAtivo.results ?? []).map((imp) => ({
        id: `import_${imp.id}`,
        data: imp.criado_em,
        tipo: "importacao",
        descricao: `Importação ${imp.arquivo_nome ?? "manual"} impactou ${ativo.ticker}`,
      })),
      ...movimentosRows.map((mov) => ({
        id: `mov_${mov.id}`,
        data: mov.data_movimentacao,
        tipo: mov.ativo_origem_id === ativo.id ? "rebalanceamento_saida" : "rebalanceamento_entrada",
        descricao: mov.ativo_origem_id === ativo.id
          ? `Movimentação de saída vinculada (${Number(mov.valor ?? 0).toFixed(2)})`
          : `Movimentação de entrada vinculada (${Number(mov.valor ?? 0).toFixed(2)})`,
      })),
    ].sort((a, b) => (String(a.data) < String(b.data) ? 1 : -1)).slice(0, 30);

    return sucesso({
      ...serializarAtivoMercado(ativo),
      benchmarkDesdeAquisicao: benchmark,
      benchmark_desde_aquisicao: benchmark,
      dataBaseComparacao: baseComparacao,
      data_base_comparacao: baseComparacao,
      movimentacoes: movimentosRows,
      serieTicker,
      serie_ticker: serieTicker,
      eventosTicker,
      eventos_ticker: eventosTicker,
    });
  }

  // ─── Escritas: disparam reprocessamento em background ─────────────────────

  if (pathname.startsWith("/api/carteira/ativo/") && pathname.endsWith("/data-aquisicao") && request.method === "PUT") {
    const ativoId = decodeURIComponent(pathname.replace("/api/carteira/ativo/", "").replace("/data-aquisicao", ""));
    const body = atualizarDataAquisicaoSchema.parse(await parseJsonBody(request));
    await env.DB
      .prepare("UPDATE ativos SET data_aquisicao = ? WHERE id = ? AND usuario_id = ?")
      .bind(body.dataAquisicao, ativoId, userId)
      .run();
    ctx.waitUntil(orquestrarPosEscritaCarteira(userId, env, { refrescarMercado: false }));
    return sucesso({ atualizado: true, mensagem: "Data de aquisição atualizada com sucesso. Comparativos recalculados." });
  }

  if (pathname === "/api/carteira/movimentacoes/vincular" && request.method === "POST") {
    const body = vincularMovimentacaoSchema.parse(await parseJsonBody(request));
    if (body.ativoOrigemId === body.ativoDestinoId) {
      return erro("MOVIMENTACAO_INVALIDA", "Origem e destino devem ser diferentes");
    }

    const origem = await env.DB
      .prepare("SELECT id, ticker, quantidade, preco_medio, valor_atual FROM ativos WHERE id = ? AND usuario_id = ? LIMIT 1")
      .bind(body.ativoOrigemId, userId)
      .first<{ id: string; ticker: string; quantidade: number | null; preco_medio: number | null; valor_atual: number | null }>();
    const destino = await env.DB
      .prepare("SELECT id, ticker, quantidade, preco_medio, valor_atual FROM ativos WHERE id = ? AND usuario_id = ? LIMIT 1")
      .bind(body.ativoDestinoId, userId)
      .first<{ id: string; ticker: string; quantidade: number | null; preco_medio: number | null; valor_atual: number | null }>();
    if (!origem || !destino) return erro("ATIVO_NAO_ENCONTRADO", "Origem ou destino não encontrado", 404);

    const qO = Number(origem.quantidade ?? 0);
    const qD = Number(destino.quantidade ?? 0);
    const pO = (Number(origem.preco_medio ?? 0) > 0 ? Number(origem.preco_medio) : undefined) ?? (qO > 0 ? Number(origem.valor_atual ?? 0) / qO : undefined);
    const pD = (Number(destino.preco_medio ?? 0) > 0 ? Number(destino.preco_medio) : undefined) ?? (qD > 0 ? Number(destino.valor_atual ?? 0) / qD : undefined);
    if (!pO || pO <= 0 || !pD || pD <= 0) {
      return erro("PRECO_REFERENCIA_INVALIDO", "Não foi possível calcular preço de referência para movimentação");
    }

    const qOMov = body.valor / pO;
    const qDMov = body.valor / pD;
    if (qOMov > qO) return erro("SALDO_INSUFICIENTE", `Saldo insuficiente em ${origem.ticker} para movimentar ${body.valor.toFixed(2)}`);

    const novaQO = Math.max(0, qO - qOMov);
    const novoCO = Math.max(0, qO * Number(origem.preco_medio ?? pO) - body.valor);
    const novoPO = novaQO > 0 ? novoCO / novaQO : 0;
    const novaQD = qD + qDMov;
    const novoCD = qD * Number(destino.preco_medio ?? pD) + body.valor;
    const novoPD = novaQD > 0 ? novoCD / novaQD : 0;

    const id = crypto.randomUUID();
    const agora = new Date().toISOString();
    await env.DB.batch([
      env.DB.prepare("UPDATE ativos SET quantidade = ?, preco_medio = ?, valor_atual = ?, rentabilidade_desde_aquisicao_pct = ? WHERE id = ? AND usuario_id = ?")
        .bind(novaQO, novoPO, novaQO * pO, novoCO > 0 ? ((novaQO * pO - novoCO) / novoCO) * 100 : 0, origem.id, userId),
      env.DB.prepare("UPDATE ativos SET quantidade = ?, preco_medio = ?, valor_atual = ?, rentabilidade_desde_aquisicao_pct = ? WHERE id = ? AND usuario_id = ?")
        .bind(novaQD, novoPD, novaQD * pD, novoCD > 0 ? ((novaQD * pD - novoCD) / novoCD) * 100 : 0, destino.id, userId),
      env.DB.prepare("INSERT INTO ativos_movimentacoes (id, usuario_id, ativo_origem_id, ativo_destino_id, valor, data_movimentacao, observacao, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(id, userId, body.ativoOrigemId, body.ativoDestinoId, body.valor, body.dataMovimentacao, body.observacao ?? "", agora),
    ]);
    ctx.waitUntil(orquestrarPosEscritaCarteira(userId, env, { refrescarMercado: false }));
    return sucesso({
      id,
      mensagem: "Movimentação vinculada e aplicada nas posições com sucesso.",
      impacto: {
        origem: { ativoId: origem.id, ticker: origem.ticker, quantidadeAnterior: qO, quantidadeAtual: novaQO },
        destino: { ativoId: destino.id, ticker: destino.ticker, quantidadeAnterior: qD, quantidadeAtual: novaQD },
      },
    });
  }

  if (pathname.startsWith("/api/carteira/ativo/") && pathname.endsWith("/aporte") && request.method === "POST") {
    const ativoId = decodeURIComponent(pathname.replace("/api/carteira/ativo/", "").replace("/aporte", ""));
    const body = registrarAporteSchema.parse(await parseJsonBody(request));
    const atual = await env.DB
      .prepare("SELECT id, quantidade, preco_medio, valor_atual FROM ativos WHERE id = ? AND usuario_id = ? LIMIT 1")
      .bind(ativoId, userId)
      .first<{ id: string; quantidade: number | null; preco_medio: number | null; valor_atual: number | null }>();
    if (!atual) return erro("ATIVO_NAO_ENCONTRADO", "Ativo não encontrado para aporte", 404);

    const ativosMercado = (await carteiraService.listarAtivos(userId)) as AtivoComMercado[];
    const ativoMercado = ativosMercado.find((item) => item.id === ativoId);
    const qAtual = Number(atual.quantidade ?? 0);
    const pMedio = Number(atual.preco_medio ?? 0);
    const pPorValor = qAtual > 0 ? Number(atual.valor_atual ?? 0) / qAtual : 0;
    const precoRef = body.precoUnitario ?? ativoMercado?.precoAtual ?? (pMedio > 0 ? pMedio : undefined) ?? (pPorValor > 0 ? pPorValor : 0);
    if (!Number.isFinite(precoRef) || precoRef <= 0) {
      return erro("PRECO_REFERENCIA_INVALIDO", "Preço de referência inválido para aporte");
    }

    const qAporte = body.quantidade ?? body.valorAporte / precoRef;
    const novaQ = qAtual + qAporte;
    const novoCusto = qAtual * Number(atual.preco_medio ?? 0) + body.valorAporte;
    const novoPMedio = novaQ > 0 ? novoCusto / novaQ : 0;
    const novoValor = novaQ * precoRef;
    const novoRetorno = novoCusto > 0 ? ((novoValor - novoCusto) / novoCusto) * 100 : 0;

    await env.DB
      .prepare("UPDATE ativos SET quantidade = ?, preco_medio = ?, valor_atual = ?, rentabilidade_desde_aquisicao_pct = ? WHERE id = ? AND usuario_id = ?")
      .bind(novaQ, novoPMedio, novoValor, novoRetorno, ativoId, userId)
      .run();

    ctx.waitUntil(orquestrarPosEscritaCarteira(userId, env));
    return sucesso({
      atualizado: true,
      mensagem: "Aporte registrado com sucesso.",
      data_operacao: body.dataOperacao ?? new Date().toISOString().slice(0, 10),
      observacao: body.observacao ?? "",
    });
  }

  if (pathname.startsWith("/api/carteira/ativo/") && request.method === "DELETE") {
    const ativoId = decodeURIComponent(pathname.replace("/api/carteira/ativo/", ""));
    const body = excluirAtivoSchema.parse(await parseJsonBody(request));
    const existe = await env.DB
      .prepare("SELECT id, ticker, nome, categoria, valor_atual, quantidade FROM ativos WHERE id = ? AND usuario_id = ? LIMIT 1")
      .bind(ativoId, userId)
      .first<{ id: string; ticker: string; nome: string; categoria: string; valor_atual: number | null; quantidade: number | null }>();
    if (!existe) return erro("ATIVO_NAO_ENCONTRADO", "Ativo não encontrado para exclusão", 404);

    await env.DB.prepare("DELETE FROM ativos WHERE id = ? AND usuario_id = ?").bind(ativoId, userId).run();
    try {
      await env.DB
        .prepare("INSERT INTO admin_auditoria (id, acao, alvo, payload_json, autor_email, criado_em) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(
          crypto.randomUUID(), "carteira.ativo.excluir", "ativos",
          JSON.stringify({ usuarioId: userId, ativoId, ticker: existe.ticker, nome: existe.nome, categoria: existe.categoria, valorAtual: existe.valor_atual ?? 0, quantidade: existe.quantidade ?? 0, motivo: body.motivo }),
          sessao.usuario.email, new Date().toISOString(),
        )
        .run();
    } catch {
      // auditoria não bloqueia exclusão
    }
    ctx.waitUntil(orquestrarPosEscritaCarteira(userId, env, { refrescarMercado: false }));
    return sucesso({ removido: true, mensagem: "Ativo excluído com sucesso." });
  }

  return null;
}
