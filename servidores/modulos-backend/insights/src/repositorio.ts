import type { PerfilFinanceiro, ScoreCarteira } from "@ei/contratos";

export type MetricasCarteira = {
  patrimonioTotal: number;
  patrimonioBruto: number;
  patrimonioLiquido: number;
  ativosLiquidos: number;
  ativosIliquidos: number;
  passivoTotal: number;
  quantidadeAtivos: number;
  quantidadeCategorias: number;
  maiorParticipacao: number;
  top3Participacao: number;
  percentualRendaVariavel: number;
  percentualRendaFixa: number;
  percentualDefensivo: number;
  percentualInternacional: number;
  evolucaoPatrimonio6m: number;
  evolucaoPatrimonio12m: number;
  idadeCarteiraMeses: number;
  mesesComAporteUltimos6m: number;
  // "real" quando derivado da tabela `aportes`; "indireto" quando o sinal é
  // apenas crescimento patrimonial mês-a-mês (fallback histórico).
  fonteMesesComAporte?: "real" | "indireto";
  percentualLiquidezImediata: number;
  percentualDinheiroParado: number;
  percentualIliquido: number;
  percentualDividaSobrePatrimonio: number;
  percentualEmImoveis: number;
  percentualEmVeiculos: number;
  percentualEmInvestimentos: number;
  percentualEmCaixa: number;
  percentualEmOutros: number;
};

type SnapshotScorePersistido = {
  score: number;
  criadoEm: string;
};

type PilaresScore = ScoreCarteira["pilares"];
type Fator = { label: string; impacto: number };

export type ImpactoDecisoesRecentes = {
  quantidade: number;
  deltaMedio: number;
  deltaTotal: number;
};

export interface RepositorioInsights {
  obterPerfil(usuarioId: string): Promise<PerfilFinanceiro | null>;
  obterMetricasCarteira(usuarioId: string): Promise<MetricasCarteira>;
  obterConfiguracaoScore(): Promise<Record<string, unknown> | null>;
  obterUltimoSnapshotScore(usuarioId: string): Promise<SnapshotScorePersistido | null>;
  obterImpactoDecisoesRecentes(usuarioId: string): Promise<ImpactoDecisoesRecentes>;
  salvarSnapshotScore(
    usuarioId: string,
    payload: {
      score: number;
      faixa: ScoreCarteira["faixa"];
      riscoPrincipal: string;
      acaoPrioritaria: string;
      pilares: PilaresScore;
      fatoresPositivos: Fator[];
      fatoresNegativos: Fator[];
    },
  ): Promise<void>;
}

export class RepositorioInsightsD1 implements RepositorioInsights {
  constructor(private readonly db: D1Database) {}

  private async obterContextoPatrimonial(usuarioId: string): Promise<{
    imoveis: number;
    veiculos: number;
    caixa: number;
    dividas: number;
  }> {
    const row = await this.db
      .prepare("SELECT contexto_json FROM perfil_contexto_financeiro WHERE usuario_id = ? LIMIT 1")
      .bind(usuarioId)
      .first<{ contexto_json: string | null }>();
    if (!row?.contexto_json) return { imoveis: 0, veiculos: 0, caixa: 0, dividas: 0 };
    try {
      const parsed = JSON.parse(row.contexto_json) as {
        patrimonioExterno?: {
          imoveis?: Array<{ valorEstimado?: number; saldoFinanciamento?: number }>;
          veiculos?: Array<{ valorEstimado?: number }>;
          caixaDisponivel?: number;
        };
        dividas?: Array<{ saldoDevedor?: number }>;
      };
      const imoveisBruto = (parsed.patrimonioExterno?.imoveis ?? []).reduce((acc, item) => acc + Number(item.valorEstimado ?? 0), 0);
      const saldoImoveis = (parsed.patrimonioExterno?.imoveis ?? []).reduce((acc, item) => acc + Number(item.saldoFinanciamento ?? 0), 0);
      const veiculos = (parsed.patrimonioExterno?.veiculos ?? []).reduce((acc, item) => acc + Number(item.valorEstimado ?? 0), 0);
      const caixa = Number(parsed.patrimonioExterno?.caixaDisponivel ?? 0);
      const dividas = (parsed.dividas ?? []).reduce((acc, item) => acc + Number(item.saldoDevedor ?? 0), 0);
      return {
        imoveis: Math.max(0, imoveisBruto - saldoImoveis),
        veiculos: Math.max(0, veiculos),
        caixa: Math.max(0, caixa),
        dividas: Math.max(0, dividas + Math.max(0, saldoImoveis)),
      };
    } catch {
      return { imoveis: 0, veiculos: 0, caixa: 0, dividas: 0 };
    }
  }

  async obterPerfil(usuarioId: string): Promise<PerfilFinanceiro | null> {
    const [row, contextoRow] = await Promise.all([
      this.db
        .prepare(
          "SELECT id, usuario_id, renda_mensal, aporte_mensal, horizonte, perfil_risco, objetivo, maturidade FROM perfil_financeiro WHERE usuario_id = ?",
        )
        .bind(usuarioId)
        .first<{
          id: string;
          usuario_id: string;
          renda_mensal: number;
          aporte_mensal: number;
          horizonte: string;
          perfil_risco: string;
          objetivo: string;
          maturidade: number;
        }>(),
      this.db
        .prepare("SELECT contexto_json FROM perfil_contexto_financeiro WHERE usuario_id = ? LIMIT 1")
        .bind(usuarioId)
        .first<{ contexto_json: string | null }>()
        .catch(() => null),
    ]);

    if (!row) return null;

    let faixaEtaria: string | undefined;
    if (contextoRow?.contexto_json) {
      try {
        const ctx = JSON.parse(contextoRow.contexto_json) as { faixaEtaria?: string };
        faixaEtaria = ctx.faixaEtaria;
      } catch {
        // noop
      }
    }

    return {
      id: row.id,
      usuarioId: row.usuario_id,
      rendaMensal: row.renda_mensal ?? 0,
      aporteMensal: row.aporte_mensal ?? 0,
      horizonte: row.horizonte ?? "",
      perfilRisco: row.perfil_risco ?? "",
      objetivo: row.objetivo ?? "",
      maturidade: row.maturidade ?? 1,
      faixaEtaria,
    };
  }

  async obterMetricasCarteira(usuarioId: string): Promise<MetricasCarteira> {
    const [ativos, posicoesRaw, perfil, contextoPatrimonial] = await Promise.all([
      this.db
      .prepare(
        "SELECT ticker, categoria, valor_atual, participacao FROM ativos WHERE usuario_id = ? ORDER BY valor_atual DESC",
      )
      .bind(usuarioId)
      .all<{ ticker: string | null; categoria: string; valor_atual: number; participacao: number }>(),
      (async () => {
        try {
          return await this.db
            .prepare("SELECT tipo, valor_atual, liquidez FROM posicoes_financeiras WHERE usuario_id = ? AND ativo = 1")
            .bind(usuarioId)
            .all<{ tipo: string; valor_atual: number; liquidez: string }>();
        } catch {
          return { results: [] as Array<{ tipo: string; valor_atual: number; liquidez: string }> };
        }
      })(),
      this.obterPerfil(usuarioId),
      this.obterContextoPatrimonial(usuarioId),
    ]);

    const linhas = ativos.results ?? [];
    const patrimonioTotal = linhas.reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);
    const quantidadeAtivos = linhas.length;
    const categorias = new Set(linhas.map((item) => item.categoria));
    const quantidadeCategorias = categorias.size;
    const linhasComParticipacao = linhas.map((item) => {
      const valor = Number(item.valor_atual ?? 0);
      const participacaoCalculada = patrimonioTotal > 0 ? (valor / patrimonioTotal) * 100 : 0;
      return { ...item, participacaoCalculada };
    });
    const maiorParticipacao = linhasComParticipacao.reduce((max, item) => Math.max(max, item.participacaoCalculada), 0);
    const top3Participacao = linhasComParticipacao.slice(0, 3).reduce((acc, item) => acc + item.participacaoCalculada, 0);

    const valorRendaVariavel = linhas
      .filter((item) => item.categoria === "acao")
      .reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);
    const valorDefensivo = linhas
      .filter((item) => item.categoria === "renda_fixa" || item.categoria === "previdencia")
      .reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);
    const valorRendaFixa = linhas
      .filter((item) => item.categoria === "renda_fixa")
      .reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);

    // Ativos internacionais: BDRs (ticker termina em 34 ou 35) e ETFs globais conhecidos.
    const ETF_INTERNACIONAIS = new Set([
      "IVVB11", "BNDX11", "XINA11", "HBHB11", "NASD11", "HASH11", "WRLD11",
      "SPXI11", "GOLD11", "ACWI11", "EURP11", "USDR11", "SMAL11",
    ]);
    const ehInternacional = (ticker: string | null): boolean => {
      if (!ticker) return false;
      const t = ticker.toUpperCase().trim();
      if (ETF_INTERNACIONAIS.has(t)) return true;
      // BDRs: padrão XXXX34 ou XXXX35 (4 letras + 34 ou 35)
      if (/^[A-Z]{4}3[45]$/.test(t)) return true;
      return false;
    };
    const valorInternacional = linhas
      .filter((item) => ehInternacional(item.ticker))
      .reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);

    let hist: Array<{ data: string; valor_total: number }> = [];
    try {
      const snapshots = await this.db
        .prepare(
          "SELECT data, valor_total FROM snapshots_patrimonio WHERE usuario_id = ? ORDER BY data DESC LIMIT 12",
        )
        .bind(usuarioId)
        .all<{ data: string; valor_total: number }>();
      hist = snapshots.results ?? [];
    } catch {
      hist = [];
    }

    const atual = hist[0]?.valor_total ?? patrimonioTotal;
    const seisMeses = hist[5]?.valor_total ?? atual;
    const dozeMeses = hist[11]?.valor_total ?? atual;
    const evolucaoPatrimonio6m = seisMeses > 0 ? ((atual - seisMeses) / seisMeses) * 100 : 0;
    const evolucaoPatrimonio12m = dozeMeses > 0 ? ((atual - dozeMeses) / dozeMeses) * 100 : 0;
    const idadeCarteiraMeses = hist.length;
    // ATENÇÃO: isto NÃO mede aportes reais. Mede quantos meses consecutivos o
    // patrimônio observado cresceu em relação ao snapshot anterior. Crescimento
    // por valorização de mercado, recompra de cota, importação retroativa — tudo
    // conta aqui como se fosse aporte. Trate como sinal de tendência patrimonial,
    // não como evidência transacional de depósito. O nome da chave permanece por
    // retrocompatibilidade interna, mas os consumidores devem ler como "meses
    // com crescimento patrimonial observado nos últimos 6 meses".
    // Tenta contagem real: meses distintos com registros em `aportes`
    // nos últimos 6 meses. Se a tabela não existir ainda (ambientes antigos
    // sem migração 028) ou se não houver nenhum aporte registrado, faz
    // fallback para o sinal indireto de crescimento patrimonial.
    let mesesComAporteReais: number | null = null;
    try {
      const aportes = await this.db
        .prepare(
          "SELECT DISTINCT substr(data_aporte, 1, 7) AS mes FROM aportes WHERE usuario_id = ? AND date(data_aporte) >= date('now', '-6 months')",
        )
        .bind(usuarioId)
        .all<{ mes: string }>();
      const linhas = aportes.results ?? [];
      if (linhas.length > 0) mesesComAporteReais = linhas.length;
    } catch {
      mesesComAporteReais = null;
    }

    const mesesComAporteIndireto = hist.slice(0, 6).filter((item, index) => {
      const anterior = hist[index + 1];
      if (!anterior) return false;
      return (item.valor_total ?? 0) > (anterior.valor_total ?? 0);
    }).length;

    const mesesComAporteUltimos6m = mesesComAporteReais ?? mesesComAporteIndireto;
    const fonteMesesComAporte: "real" | "indireto" = mesesComAporteReais !== null ? "real" : "indireto";

    const posicoesRows = posicoesRaw.results ?? [];
    const caixaPerfil = Number(perfil?.reservaCaixa ?? 0);
    const investimentos = patrimonioTotal;

    // Extrai imovel, veiculo, caixa, e divida de posicoes_financeiras
    // para evitar dupla contagem ou misclassificacao entre posicoes_financeiras e contextoPatrimonial
    const imoveisPos = posicoesRows
      .filter((item) => item.tipo === "imovel")
      .reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);
    const veiculosPos = posicoesRows
      .filter((item) => item.tipo === "veiculo")
      .reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);
    const caixaPosicoes = posicoesRows
      .filter((item) => item.tipo === "caixa" || item.tipo === "poupanca" || item.tipo === "cofrinho")
      .reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);
    const dividasPos = posicoesRows
      .filter((item) => item.tipo === "divida")
      .reduce((acc, item) => acc + Math.abs(item.valor_atual ?? 0), 0);

    // Usa posicoes_financeiras como fonte primaria, contextoPatrimonial como fallback
    const caixaContexto = contextoPatrimonial.caixa;
    const imoveis = Math.max(imoveisPos, contextoPatrimonial.imoveis);
    const veiculos = Math.max(veiculosPos, contextoPatrimonial.veiculos);
    const caixa = Math.max(caixaContexto, caixaPosicoes, caixaPerfil);
    const passivoTotal = Math.max(dividasPos, contextoPatrimonial.dividas);

    // Calcula "outros" excluindo categorias ja contabilizadas
    const valorPosicoesCategorizado = investimentos + imoveisPos + veiculosPos + caixaPosicoes + dividasPos;
    const valorPosicoes = posicoesRows.reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);
    const outros = Math.max(0, valorPosicoes - valorPosicoesCategorizado);

    const ativosLiquidos = investimentos + caixa;
    const ativosIliquidos = imoveis + veiculos;
    const patrimonioBruto = investimentos + imoveis + veiculos + caixa + outros;
    const patrimonioLiquido = patrimonioBruto - passivoTotal;
    const patrimonioComPosicoes = Math.max(0, patrimonioBruto);
    const valorLiquidezImediata = posicoesRows
      .filter((item) => item.liquidez === "imediata")
      .reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);
    const valorDinheiroParado = posicoesRows
      .filter((item) => item.tipo === "caixa" || item.tipo === "poupanca" || item.tipo === "cofrinho")
      .reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);
    const valorIliquido = posicoesRows
      .filter((item) => item.tipo === "imovel" || item.tipo === "veiculo" || item.liquidez === "baixa")
      .reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);
    const valorDivida = posicoesRows
      .filter((item) => item.tipo === "divida")
      .reduce((acc, item) => acc + Math.abs(item.valor_atual ?? 0), 0);

    return {
      patrimonioTotal,
      patrimonioBruto,
      patrimonioLiquido,
      ativosLiquidos,
      ativosIliquidos,
      passivoTotal,
      quantidadeAtivos,
      quantidadeCategorias,
      maiorParticipacao,
      top3Participacao,
      percentualRendaVariavel: patrimonioTotal > 0 ? (valorRendaVariavel / patrimonioTotal) * 100 : 0,
      percentualRendaFixa: patrimonioTotal > 0 ? (valorRendaFixa / patrimonioTotal) * 100 : 0,
      percentualDefensivo: patrimonioTotal > 0 ? (valorDefensivo / patrimonioTotal) * 100 : 0,
      percentualInternacional: patrimonioTotal > 0 ? (valorInternacional / patrimonioTotal) * 100 : 0,
      evolucaoPatrimonio6m,
      evolucaoPatrimonio12m,
      idadeCarteiraMeses,
      mesesComAporteUltimos6m,
      fonteMesesComAporte,
      percentualLiquidezImediata: patrimonioComPosicoes > 0 ? (valorLiquidezImediata / patrimonioComPosicoes) * 100 : 0,
      percentualDinheiroParado: patrimonioComPosicoes > 0 ? (valorDinheiroParado / patrimonioComPosicoes) * 100 : 0,
      percentualIliquido: patrimonioComPosicoes > 0 ? (valorIliquido / patrimonioComPosicoes) * 100 : 0,
      percentualDividaSobrePatrimonio: patrimonioComPosicoes > 0 ? (valorDivida / patrimonioComPosicoes) * 100 : 0,
      percentualEmImoveis: patrimonioBruto > 0 ? (imoveis / patrimonioBruto) * 100 : 0,
      percentualEmVeiculos: patrimonioBruto > 0 ? (veiculos / patrimonioBruto) * 100 : 0,
      percentualEmInvestimentos: patrimonioBruto > 0 ? (investimentos / patrimonioBruto) * 100 : 0,
      percentualEmCaixa: patrimonioBruto > 0 ? (caixa / patrimonioBruto) * 100 : 0,
      percentualEmOutros: patrimonioBruto > 0 ? (outros / patrimonioBruto) * 100 : 0,
    };
  }

  async obterConfiguracaoScore(): Promise<Record<string, unknown> | null> {
    let row: { valor_json: string } | null = null;
    try {
      row = await this.db
        .prepare("SELECT valor_json FROM configuracoes_produto WHERE chave = 'score.v1' LIMIT 1")
        .first<{ valor_json: string }>();
    } catch {
      return null;
    }
    if (!row?.valor_json) return null;
    try {
      const parsed = JSON.parse(row.valor_json) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
      return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  async obterUltimoSnapshotScore(usuarioId: string): Promise<SnapshotScorePersistido | null> {
    let row: { score: number; criado_em: string } | null = null;
    try {
      row = await this.db
        .prepare("SELECT score, criado_em FROM snapshots_score WHERE usuario_id = ? ORDER BY criado_em DESC LIMIT 1")
        .bind(usuarioId)
        .first<{ score: number; criado_em: string }>();
    } catch {
      return null;
    }
    if (!row) return null;
    return {
      score: row.score ?? 0,
      criadoEm: row.criado_em,
    };
  }

  async obterImpactoDecisoesRecentes(usuarioId: string): Promise<ImpactoDecisoesRecentes> {
    let deltas: number[] = [];
    try {
      const rows = await this.db
        .prepare("SELECT delta_score FROM simulacoes WHERE usuario_id = ? AND status = 'salva' ORDER BY atualizado_em DESC LIMIT 5")
        .bind(usuarioId)
        .all<{ delta_score: number | null }>();
      deltas = (rows.results ?? [])
        .map((row) => row.delta_score)
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    } catch {
      return { quantidade: 0, deltaMedio: 0, deltaTotal: 0 };
    }

    if (deltas.length === 0) {
      return { quantidade: 0, deltaMedio: 0, deltaTotal: 0 };
    }

    const deltaTotal = deltas.reduce((acc, item) => acc + item, 0);
    return {
      quantidade: deltas.length,
      deltaTotal,
      deltaMedio: deltaTotal / deltas.length,
    };
  }

  async salvarSnapshotScore(
    usuarioId: string,
    payload: {
      score: number;
      faixa: ScoreCarteira["faixa"];
      riscoPrincipal: string;
      acaoPrioritaria: string;
      pilares: PilaresScore;
      fatoresPositivos: Fator[];
      fatoresNegativos: Fator[];
    },
  ): Promise<void> {
    try {
      await this.db
        .prepare(
          [
            "INSERT INTO snapshots_score",
            "(id, usuario_id, score, faixa, risco_principal, acao_prioritaria, blocos_json, fatores_positivos_json, fatores_negativos_json, criado_em)",
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          ].join(" "),
        )
        .bind(
          crypto.randomUUID(),
          usuarioId,
          payload.score,
          payload.faixa,
          payload.riscoPrincipal,
          payload.acaoPrioritaria,
          JSON.stringify(payload.pilares),
          JSON.stringify(payload.fatoresPositivos),
          JSON.stringify(payload.fatoresNegativos),
          new Date().toISOString(),
        )
        .run();
    } catch {
      // Snapshot é auxiliar e não deve derrubar os endpoints de insights.
    }
  }
}
