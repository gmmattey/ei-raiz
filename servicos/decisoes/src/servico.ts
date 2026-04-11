import type { CalcularSimulacaoEntrada, HistoricoSimulacao, ResultadoSimulacao, ServicoDecisoes, Simulacao, TipoSimulacao } from "@ei/contratos";
import type { RepositorioDecisoes } from "./repositorio";

type ContextoScore = { scoreAtual: number; pilares: Record<string, number> };
type ParametrosSimulacao = Record<string, Record<string, unknown>>;

type DecisionImpactService = {
  calcularImpacto(args: {
    tipo: TipoSimulacao;
    premissas: Record<string, unknown>;
    resultado: Omit<ResultadoSimulacao, "impactoScore">;
    contexto: ContextoScore;
  }): {
    scoreAtual: number;
    scoreProjetado: number;
    delta: number;
    pilares: Record<string, number>;
    regraDominante: string;
  };
};

const asNum = (v: unknown, fallback = 0): number => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const parsed = Number.parseFloat(v.replace(".", "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const moeda = (valor: number): string => `R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (valor: number): string => `${valor.toFixed(2)}%`;

class DecisionImpactServicePadrao implements DecisionImpactService {
  calcularImpacto({ tipo, premissas, resultado, contexto }: { tipo: TipoSimulacao; premissas: Record<string, unknown>; resultado: Omit<ResultadoSimulacao, "impactoScore">; contexto: ContextoScore; }) {
    let delta = 0;
    let regraDominante = "impacto_neutro";

    if (tipo === "imovel") {
      const entrada = asNum(premissas.entrada);
      const liquidez = asNum(premissas.liquidezAtual || premissas.reservaDisponivel);
      const comprometeLiquidez = liquidez > 0 && entrada / liquidez > 0.7;
      delta += comprometeLiquidez ? -7 : 3;
      regraDominante = comprometeLiquidez ? "liquidez_pressionada" : "liquidez_preservada";
    }

    if (tipo === "carro") {
      const depreciacao = asNum(premissas.depreciacaoAnual, 0.15);
      const custoMensal = asNum((resultado.cenarioA.find((c) => c.label.toLowerCase().includes("custo real mensal"))?.value ?? "0").replace(/[R$\s.]/g, "").replace(",", "."));
      const renda = asNum(premissas.rendaMensal, 0);
      const pressaoRenda = renda > 0 ? custoMensal / renda : 0;
      if (depreciacao > 0.15 || pressaoRenda > 0.25) {
        delta -= 5;
        regraDominante = "veiculo_acima_da_capacidade";
      } else {
        delta += 1;
        regraDominante = "veiculo_compatível";
      }
    }

    if (tipo === "reserva_ou_financiar") {
      const reserva = asNum(premissas.reservaDisponivel);
      const valor = asNum(premissas.valorCompra);
      const usaReservaDemais = reserva > 0 && valor / reserva > 0.8;
      delta += usaReservaDemais ? -6 : 2;
      regraDominante = usaReservaDemais ? "uso_excessivo_reserva" : "seguranca_financeira";
    }

    if (tipo === "gastar_ou_investir") {
      const valor = asNum(premissas.valor);
      const prazo = Math.max(1, asNum(premissas.prazoAnos || premissas.prazo, 5));
      const retorno = asNum(premissas.retornoEsperado, 0.1);
      const futuro = valor * Math.pow(1 + retorno, prazo);
      if (futuro > valor * 1.6) {
        delta += 4;
        regraDominante = "priorizar_investimento";
      } else {
        delta -= 1;
        regraDominante = "ganho_limitado";
      }
    }

    const scoreProjetado = Math.max(0, Math.min(100, Math.round(contexto.scoreAtual + delta)));
    const dist = this.distribuirDelta(delta);
    return {
      scoreAtual: contexto.scoreAtual,
      scoreProjetado,
      delta: scoreProjetado - contexto.scoreAtual,
      pilares: {
        estrategiaCarteira: dist.estrategiaCarteira,
        comportamentoFinanceiro: dist.comportamentoFinanceiro,
        estruturaPatrimonial: dist.estruturaPatrimonial,
        adequacaoMomentoVida: dist.adequacaoMomentoVida,
      },
      regraDominante,
    };
  }

  private distribuirDelta(delta: number): Record<string, number> {
    if (delta === 0) return { estrategiaCarteira: 0, comportamentoFinanceiro: 0, estruturaPatrimonial: 0, adequacaoMomentoVida: 0 };
    const estrutura = Math.trunc(delta * 0.4);
    const comportamento = Math.trunc(delta * 0.3);
    const adequacao = Math.trunc(delta * 0.2);
    const estrategia = delta - estrutura - comportamento - adequacao;
    return {
      estrategiaCarteira: estrategia,
      comportamentoFinanceiro: comportamento,
      estruturaPatrimonial: estrutura,
      adequacaoMomentoVida: adequacao,
    };
  }
}

export class ServicoDecisoesPadrao implements ServicoDecisoes {
  private readonly impactoService: DecisionImpactService;

  constructor(private readonly repositorio: RepositorioDecisoes, impactoService?: DecisionImpactService) {
    this.impactoService = impactoService ?? new DecisionImpactServicePadrao();
  }

  async calcular(usuarioId: string, entrada: CalcularSimulacaoEntrada): Promise<ResultadoSimulacao> {
    const premissas = entrada.premissas ?? {};
    const [contexto, parametros] = await Promise.all([
      this.repositorio.obterContextoScore(usuarioId),
      this.repositorio.obterParametrosAtivos(),
    ]);

    const resultado = this.calcularPorTipo(entrada.tipo, premissas, parametros);
    const impacto = this.impactoService.calcularImpacto({
      tipo: entrada.tipo,
      premissas,
      resultado,
      contexto,
    });

    return {
      ...resultado,
      impactoScore: impacto,
    };
  }

  async salvar(usuarioId: string, entrada: CalcularSimulacaoEntrada): Promise<Simulacao> {
    const resultado = await this.calcular(usuarioId, entrada);
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const simulacao: Simulacao = {
      id,
      usuarioId,
      tipo: entrada.tipo,
      nome: entrada.nome || `Simulação ${entrada.tipo}`,
      status: "salva",
      scoreAtual: resultado.impactoScore.scoreAtual,
      scoreProjetado: resultado.impactoScore.scoreProjetado,
      deltaScore: resultado.impactoScore.delta,
      diagnosticoTitulo: resultado.diagnostico.titulo,
      diagnosticoDescricao: resultado.diagnostico.descricao,
      diagnosticoAcao: resultado.diagnostico.acao,
      resumoCurto: `${resultado.diagnostico.titulo} (${resultado.impactoScore.delta >= 0 ? "+" : ""}${resultado.impactoScore.delta} pts)`,
      premissas: entrada.premissas,
      resultado: resultado as unknown as Record<string, unknown>,
      metadata: { regraDominante: resultado.impactoScore.regraDominante, pilares: resultado.impactoScore.pilares },
      criadoEm: now,
      atualizadoEm: now,
      salvoEm: now,
    };

    await this.repositorio.salvar({ ...simulacao });
    await this.repositorio.salvarHistorico(id, {
      premissas: simulacao.premissas,
      resultado: simulacao.resultado,
      diagnostico: resultado.diagnostico as unknown as Record<string, unknown>,
      criadoPor: usuarioId,
    });
    return simulacao;
  }

  async listar(usuarioId: string): Promise<Simulacao[]> {
    return this.repositorio.listar(usuarioId);
  }

  async obter(usuarioId: string, simulacaoId: string): Promise<Simulacao | null> {
    return this.repositorio.obter(usuarioId, simulacaoId);
  }

  async recalcular(usuarioId: string, simulacaoId: string): Promise<Simulacao | null> {
    const atual = await this.repositorio.obter(usuarioId, simulacaoId);
    if (!atual) return null;
    const calculado = await this.calcular(usuarioId, {
      tipo: atual.tipo,
      nome: atual.nome,
      premissas: atual.premissas,
    });

    const atualizado: Simulacao = {
      ...atual,
      scoreAtual: calculado.impactoScore.scoreAtual,
      scoreProjetado: calculado.impactoScore.scoreProjetado,
      deltaScore: calculado.impactoScore.delta,
      diagnosticoTitulo: calculado.diagnostico.titulo,
      diagnosticoDescricao: calculado.diagnostico.descricao,
      diagnosticoAcao: calculado.diagnostico.acao,
      resumoCurto: `${calculado.diagnostico.titulo} (${calculado.impactoScore.delta >= 0 ? "+" : ""}${calculado.impactoScore.delta} pts)`,
      resultado: calculado as unknown as Record<string, unknown>,
      metadata: { regraDominante: calculado.impactoScore.regraDominante, pilares: calculado.impactoScore.pilares },
      atualizadoEm: new Date().toISOString(),
      salvoEm: new Date().toISOString(),
    };
    await this.repositorio.atualizar(atualizado);
    await this.repositorio.salvarHistorico(simulacaoId, {
      premissas: atualizado.premissas,
      resultado: atualizado.resultado,
      diagnostico: calculado.diagnostico as unknown as Record<string, unknown>,
      criadoPor: usuarioId,
    });
    return atualizado;
  }

  async duplicar(usuarioId: string, simulacaoId: string): Promise<Simulacao | null> {
    const atual = await this.repositorio.obter(usuarioId, simulacaoId);
    if (!atual) return null;
    return this.salvar(usuarioId, {
      tipo: atual.tipo,
      nome: `${atual.nome} (cópia)`,
      premissas: atual.premissas,
    });
  }

  async listarHistorico(usuarioId: string, simulacaoId: string): Promise<HistoricoSimulacao[]> {
    const simulacao = await this.repositorio.obter(usuarioId, simulacaoId);
    if (!simulacao) return [];
    return this.repositorio.listarHistorico(simulacaoId);
  }

  private calcularPorTipo(tipo: TipoSimulacao, premissas: Record<string, unknown>, parametros: ParametrosSimulacao): Omit<ResultadoSimulacao, "impactoScore"> {
    if (tipo === "imovel") return this.calcularImovel(premissas, parametros);
    if (tipo === "carro") return this.calcularCarro(premissas, parametros);
    if (tipo === "reserva_ou_financiar") return this.calcularReservaFinanciamento(premissas, parametros);
    if (tipo === "gastar_ou_investir") return this.calcularGastarInvestir(premissas, parametros);
    return this.calcularLivre(premissas);
  }

  private calcularImovel(p: Record<string, unknown>, parametros: ParametrosSimulacao): Omit<ResultadoSimulacao, "impactoScore"> {
    const valorizacaoPadrao = asNum(parametros.imovel_valorizacao_padrao?.valor, 0.06);
    const reajustePadrao = asNum(parametros.reajuste_aluguel_padrao?.valor, 0.06);
    const retornoPadrao = asNum(parametros.retorno_investimento_padrao?.valor, 0.1);

    const valorImovel = asNum(p.valorImovel);
    const entrada = asNum(p.entrada);
    const prazo = Math.max(12, asNum(p.prazoMeses || p.prazo, 360));
    const jurosAa = asNum(p.jurosAnual, 0.1);
    const doc = asNum(p.custosDocumentacao);
    const manutencao = asNum(p.manutencaoMensal);
    const valorizacao = asNum(p.valorizacaoAnual, valorizacaoPadrao);
    const aluguel = asNum(p.aluguelMensal);
    const reajuste = asNum(p.reajusteAluguelAnual, reajustePadrao);
    const retorno = asNum(p.retornoInvestimentoAnual, retornoPadrao);

    const financiado = Math.max(0, valorImovel - entrada);
    const jurosMensal = jurosAa / 12;
    const parcela = jurosMensal > 0
      ? financiado * (jurosMensal * Math.pow(1 + jurosMensal, prazo)) / (Math.pow(1 + jurosMensal, prazo) - 1)
      : financiado / prazo;
    const custoCompraMensal = parcela + manutencao;
    const custoCompraTotal = custoCompraMensal * prazo + entrada + doc;
    const patrimonioCompra = valorImovel * Math.pow(1 + valorizacao, prazo / 12);

    const aluguelMedio = aluguel * (1 + reajuste * (prazo / 24));
    const custoAluguelTotal = aluguelMedio * prazo;
    const diferencaMensal = Math.max(0, custoCompraMensal - aluguelMedio);
    const investInicial = entrada + doc;
    const investMensal = diferencaMensal;
    const fatorMensal = retorno / 12;
    const investFinal = investInicial * Math.pow(1 + fatorMensal, prazo) + investMensal * ((Math.pow(1 + fatorMensal, prazo) - 1) / Math.max(fatorMensal, 0.0001));

    const alugarMelhor = investFinal > patrimonioCompra;
    const gap = Math.abs(investFinal - patrimonioCompra);

    return {
      cenarioA: [
        { label: "Custo mensal estimado", value: moeda(custoCompraMensal), description: "Parcela + manutenção" },
        { label: "Custo total projetado", value: moeda(custoCompraTotal), description: `Horizonte ${Math.round(prazo / 12)} anos` },
        { label: "Patrimônio projetado", value: moeda(patrimonioCompra), description: "Valor estimado do imóvel" },
      ],
      cenarioB: [
        { label: "Custo mensal estimado", value: moeda(aluguelMedio), description: "Aluguel médio reajustado" },
        { label: "Custo total projetado", value: moeda(custoAluguelTotal), description: `Horizonte ${Math.round(prazo / 12)} anos` },
        { label: "Patrimônio projetado", value: moeda(investFinal), description: "Entrada + diferença investida" },
      ],
      diagnostico: {
        titulo: alugarMelhor ? "Alugar e investir tende a gerar mais valor líquido" : "Comprar tende a fechar melhor no horizonte informado",
        descricao: alugarMelhor
          ? `Impacto concreto: o cenário de aluguel + investimento projeta ${moeda(gap)} a mais de patrimônio.`
          : `Impacto concreto: o cenário de compra projeta ${moeda(gap)} a mais de patrimônio no prazo informado.`,
        acao: alugarMelhor
          ? "Se não houver necessidade imediata de compra, preserve liquidez e reavalie em 12 meses."
          : "Siga para compra apenas se mantiver reserva mínima intacta após entrada e custos.",
      },
    };
  }

  private calcularCarro(p: Record<string, unknown>, parametros: ParametrosSimulacao): Omit<ResultadoSimulacao, "impactoScore"> {
    const depreciacaoPadrao = asNum(parametros.carro_depreciacao_padrao?.valor, 0.15);
    const retornoPadrao = asNum(parametros.retorno_investimento_padrao?.valor, 0.1);

    const valor = asNum(p.valorCarro || p.valor);
    const entrada = asNum(p.entrada);
    const prazo = Math.max(12, asNum(p.prazoMeses || p.prazo, 60));
    const jurosAa = asNum(p.jurosAnual, 0.16);
    const seguroAnual = asNum(p.seguroAnual);
    const manutencaoAnual = asNum(p.manutencaoAnual);
    const combustivelMensal = asNum(p.combustivelMensal);
    const depreciacaoAnual = asNum(p.depreciacaoAnual, depreciacaoPadrao);
    const retorno = asNum(p.retornoInvestimentoAnual, retornoPadrao);

    const financiado = Math.max(0, valor - entrada);
    const jurosMensal = jurosAa / 12;
    const parcela = jurosMensal > 0
      ? financiado * (jurosMensal * Math.pow(1 + jurosMensal, prazo)) / (Math.pow(1 + jurosMensal, prazo) - 1)
      : financiado / prazo;

    const custoMensal = parcela + (seguroAnual + manutencaoAnual) / 12 + combustivelMensal;
    const custoTotal = custoMensal * prazo + entrada;
    const valorRevenda = valor * Math.pow(1 - depreciacaoAnual, prazo / 12);
    const custoOportunidade = (valor * Math.pow(1 + retorno / 12, prazo)) - valor;
    const investimentoFinal = valor * Math.pow(1 + retorno / 12, prazo);
    const investirMelhor = investimentoFinal > valorRevenda;

    return {
      cenarioA: [
        { label: "Custo real mensal", value: moeda(custoMensal), description: "Posse + operação" },
        { label: "Custo total projetado", value: moeda(custoTotal), description: "Horizonte informado" },
        { label: "Valor de revenda", value: moeda(valorRevenda), description: "Após depreciação" },
      ],
      cenarioB: [
        { label: "Capital investido", value: moeda(valor), description: "Valor da compra aplicado" },
        { label: "Patrimônio projetado", value: moeda(investimentoFinal), description: "Investimento alternativo" },
        { label: "Custo de oportunidade", value: moeda(custoOportunidade), description: "Ganho potencial" },
      ],
      diagnostico: {
        titulo: investirMelhor ? "Investir o capital tende a preservar mais patrimônio" : "Compra pode ser viável com custo controlado",
        descricao: investirMelhor
          ? `Impacto concreto: a compra custa ${moeda(custoMensal)}/mês e sacrifica ${moeda(custoOportunidade)} de oportunidade.`
          : `Impacto concreto: diferença entre cenários está controlada para o prazo definido.`,
        acao: investirMelhor ? "Reavaliar faixa do veículo ou ampliar entrada para reduzir drenagem mensal." : "Executar compra com teto de custo mensal e revisão anual.",
      },
    };
  }

  private calcularReservaFinanciamento(p: Record<string, unknown>, parametros: ParametrosSimulacao): Omit<ResultadoSimulacao, "impactoScore"> {
    const retornoPadrao = asNum(parametros.retorno_investimento_padrao?.valor, 0.1);
    const valor = asNum(p.valorCompra || p.valor);
    const reserva = asNum(p.reservaDisponivel);
    const reservaMin = asNum(p.reservaMinimaDesejada, reserva * 0.4);
    const jurosAa = asNum(p.jurosAnual, 0.18);
    const prazo = Math.max(12, asNum(p.prazoMeses || p.prazo, 48));
    const retorno = asNum(p.retornoInvestimentoAnual, retornoPadrao);

    const jurosMensal = jurosAa / 12;
    const parcela = jurosMensal > 0
      ? valor * (jurosMensal * Math.pow(1 + jurosMensal, prazo)) / (Math.pow(1 + jurosMensal, prazo) - 1)
      : valor / prazo;
    const custoFinanciado = parcela * prazo;
    const reservaFinalVista = Math.max(0, reserva - valor);
    const reservaFinalFinanciando = reserva * Math.pow(1 + retorno / 12, prazo);
    const hibridoPagamento = Math.min(valor * 0.5, reserva * 0.5);
    const hibridoReserva = Math.max(0, reserva - hibridoPagamento);

    const usarReservaMelhor = reservaFinalVista >= reservaMin && valor < reserva * 0.7;

    return {
      cenarioA: [
        { label: "Custo total", value: moeda(valor), description: "Pagamento com reserva" },
        { label: "Liquidez final", value: moeda(reservaFinalVista), description: "Reserva remanescente" },
        { label: "Segurança financeira", value: reservaFinalVista >= reservaMin ? "Adequada" : "Pressionada", description: "Comparado à reserva mínima" },
      ],
      cenarioB: [
        { label: "Custo total", value: moeda(custoFinanciado), description: "Incluindo juros" },
        { label: "Parcela mensal", value: moeda(parcela), description: "Fluxo de caixa" },
        { label: "Liquidez final", value: moeda(reservaFinalFinanciando), description: "Reserva investida" },
      ],
      diagnostico: {
        titulo: usarReservaMelhor ? "Usar reserva parcial reduz custo sem desmontar proteção" : "Financiar preserva melhor sua segurança no curto prazo",
        descricao: usarReservaMelhor
          ? "Impacto concreto: você elimina juros relevantes e mantém reserva acima do mínimo seguro."
          : "Impacto concreto: pagar à vista derruba sua liquidez para nível de risco operacional.",
        acao: `Ajuste recomendado: cenário híbrido com ${moeda(hibridoPagamento)} de entrada e reserva final em ${moeda(hibridoReserva)}.`,
      },
    };
  }

  private calcularGastarInvestir(p: Record<string, unknown>, parametros: ParametrosSimulacao): Omit<ResultadoSimulacao, "impactoScore"> {
    const retornoPadrao = asNum(parametros.retorno_investimento_padrao?.valor, 0.1);
    const valor = asNum(p.valor);
    const prazo = Math.max(1, asNum(p.prazoAnos || p.prazo, 5));
    const retorno = asNum(p.retornoEsperado, retornoPadrao);

    const futuro = valor * Math.pow(1 + retorno, prazo);
    const custoOportunidade = futuro - valor;
    const investirMelhor = custoOportunidade > valor * 0.3;

    return {
      cenarioA: [
        { label: "Valor da decisão", value: moeda(valor), description: "Consumo imediato" },
        { label: "Valor futuro", value: moeda(0), description: "Sem capital acumulado" },
        { label: "Liquidez", value: "Reduzida", description: "Saída de caixa imediata" },
      ],
      cenarioB: [
        { label: "Valor investido", value: moeda(valor), description: "Aporte inicial" },
        { label: "Valor futuro", value: moeda(futuro), description: `Horizonte ${prazo} anos` },
        { label: "Ganho potencial", value: moeda(custoOportunidade), description: "Custo de oportunidade" },
      ],
      diagnostico: {
        titulo: investirMelhor ? "Investir agora protege melhor sua construção patrimonial" : "Diferença entre cenários é moderada neste prazo",
        descricao: investirMelhor
          ? `Impacto concreto: consumir agora custa ${moeda(custoOportunidade)} em valor futuro potencial.`
          : "Impacto concreto: o ganho financeiro adicional é baixo para o horizonte escolhido.",
        acao: "Decida com base em urgência real da compra e no efeito sobre sua reserva de segurança.",
      },
    };
  }

  private calcularLivre(p: Record<string, unknown>): Omit<ResultadoSimulacao, "impactoScore"> {
    const valorA = asNum(p.valorA || p.valor, 0);
    const valorB = asNum(p.valorB || p.valorAlternativo, valorA);
    const retornoA = asNum(p.retornoA, 0.04);
    const retornoB = asNum(p.retornoB, 0.08);
    const prazo = Math.max(1, asNum(p.prazoAnos || p.prazo, 3));

    const futuroA = valorA * Math.pow(1 + retornoA, prazo);
    const futuroB = valorB * Math.pow(1 + retornoB, prazo);

    return {
      cenarioA: [
        { label: "Valor inicial", value: moeda(valorA) },
        { label: "Retorno estimado", value: pct(retornoA * 100) },
        { label: "Valor projetado", value: moeda(futuroA), description: `${prazo} anos` },
      ],
      cenarioB: [
        { label: "Valor inicial", value: moeda(valorB) },
        { label: "Retorno estimado", value: pct(retornoB * 100) },
        { label: "Valor projetado", value: moeda(futuroB), description: `${prazo} anos` },
      ],
      diagnostico: {
        titulo: futuroB >= futuroA ? "Cenário B apresenta melhor projeção" : "Cenário A apresenta melhor projeção",
        descricao: "Impacto concreto: resultado comparativo orientado pelas premissas informadas manualmente.",
        acao: "Ajustar premissas críticas e testar sensibilidade antes de decidir.",
      },
    };
  }
}
