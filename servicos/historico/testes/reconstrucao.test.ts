import test from "node:test";
import assert from "node:assert/strict";
import {
  ServicoReconstrucaoCarteiraPadrao,
  montarPayloadMesHistorico,
  type AtivoParaReconstrucao,
  type ContextoReconstrucao,
  type FonteDadosReconstrucao,
  type RepositorioFilaReconstrucao,
} from "../src/reconstrucao";
import type { RepositorioHistoricoMensal } from "../src/historico-mensal";
import type {
  EstadoReconstrucaoCarteira,
  HistoricoMensalCompleto,
  OrigemHistoricoMensal,
  PayloadHistoricoMensal,
  PontoHistoricoMensal,
} from "@ei/contratos";

const ativo = (
  id: string,
  dataAquisicao: string,
  quantidade: number,
  precoMedio: number,
): AtivoParaReconstrucao => ({
  id,
  ticker: id.toUpperCase(),
  nome: id,
  categoria: "acao",
  quantidade,
  precoMedio,
  dataAquisicao,
});

const contextoVazio: ContextoReconstrucao = { imoveis: [], veiculos: [], poupanca: 0 };

test("montarPayloadMesHistorico: filtra ativos por data de aquisição", () => {
  const ativos = [
    ativo("a1", "2026-01-15T00:00:00Z", 10, 100), // existe a partir de jan/26
    ativo("a2", "2026-03-10T00:00:00Z", 5, 200),  // existe a partir de mar/26
  ];

  const jan = montarPayloadMesHistorico(ativos, contextoVazio, "2026-01");
  assert.equal(jan.ativos.length, 1);
  assert.equal(jan.patrimonioInvestimentos, 1000);

  const fev = montarPayloadMesHistorico(ativos, contextoVazio, "2026-02");
  assert.equal(fev.ativos.length, 1);
  assert.equal(fev.patrimonioInvestimentos, 1000);

  const mar = montarPayloadMesHistorico(ativos, contextoVazio, "2026-03");
  assert.equal(mar.ativos.length, 2);
  assert.equal(mar.patrimonioInvestimentos, 2000); // 1000 + 1000
});

test("montarPayloadMesHistorico: distribuição calculada com bens", () => {
  const ctx: ContextoReconstrucao = {
    imoveis: [{ valorEstimado: 500_000, saldoFinanciamento: 0 }],
    veiculos: [],
    poupanca: 0,
  };
  const payload = montarPayloadMesHistorico([ativo("a1", "2026-01-01T00:00:00Z", 1, 1000)], ctx, "2026-04");
  assert.equal(payload.patrimonioInvestimentos, 1000);
  assert.equal(payload.patrimonioBens, 500_000);
  assert.equal(payload.patrimonioTotal, 501_000);
});

// ─── Fakes para o serviço de reconstrução ────────────────────────────────────

class FilaFake implements RepositorioFilaReconstrucao {
  public estados: Map<string, EstadoReconstrucaoCarteira> = new Map();

  async obter(usuarioId: string): Promise<EstadoReconstrucaoCarteira | null> {
    return this.estados.get(usuarioId) ?? null;
  }

  async criar(usuarioId: string, anoMesInicial: string, anoMesFinal: string): Promise<EstadoReconstrucaoCarteira> {
    const estado: EstadoReconstrucaoCarteira = {
      usuarioId,
      status: "pendente",
      anoMesInicial,
      anoMesCursor: null,
      anoMesFinal,
      mesesProcessados: 0,
      mesesTotais: 0,
      iniciadoEm: null,
      concluidoEm: null,
      erroMensagem: null,
      tentativas: 0,
      atualizadoEm: new Date().toISOString(),
    };
    this.estados.set(usuarioId, estado);
    return estado;
  }

  async atualizar(usuarioId: string, patch: Partial<EstadoReconstrucaoCarteira>): Promise<EstadoReconstrucaoCarteira> {
    const atual = this.estados.get(usuarioId);
    if (!atual) throw new Error("não encontrado");
    const merged: EstadoReconstrucaoCarteira = { ...atual, ...patch, atualizadoEm: new Date().toISOString() };
    this.estados.set(usuarioId, merged);
    return merged;
  }
}

class HistoricoFake implements RepositorioHistoricoMensal {
  public pontos: Array<PontoHistoricoMensal & { payload: PayloadHistoricoMensal }> = [];

  async listarPontos(): Promise<PontoHistoricoMensal[]> {
    return this.pontos.map(({ payload: _p, ...resto }) => resto);
  }
  async obterMes(): Promise<HistoricoMensalCompleto | null> {
    return null;
  }
  async obterMesAnterior(_u: string, anoMes: string): Promise<PontoHistoricoMensal | null> {
    const anteriores = this.pontos
      .filter((p) => p.anoMes < anoMes)
      .sort((a, b) => b.anoMes.localeCompare(a.anoMes));
    return anteriores[0] ?? null;
  }
  async obterMesMaisAntigo(): Promise<PontoHistoricoMensal | null> {
    const ord = [...this.pontos].sort((a, b) => a.anoMes.localeCompare(b.anoMes));
    return ord[0] ?? null;
  }
  async gravar(
    usuarioId: string,
    anoMes: string,
    dataFechamento: string,
    totalInvestido: number,
    totalAtual: number,
    retornoMes: number,
    retornoAcum: number,
    payload: PayloadHistoricoMensal,
    origem: OrigemHistoricoMensal,
  ): Promise<PontoHistoricoMensal> {
    const ponto: PontoHistoricoMensal = {
      id: `hist_${usuarioId}_${anoMes}`,
      usuarioId,
      anoMes,
      dataFechamento,
      totalInvestido,
      totalAtual,
      retornoMes,
      retornoAcum,
      origem,
    };
    this.pontos.push({ ...ponto, payload });
    return ponto;
  }
}

class FonteFake implements FonteDadosReconstrucao {
  constructor(private readonly ativos: AtivoParaReconstrucao[]) {}
  async listarAtivos(): Promise<AtivoParaReconstrucao[]> {
    return this.ativos;
  }
  async obterContexto(): Promise<ContextoReconstrucao> {
    return contextoVazio;
  }
}

test("ServicoReconstrucaoCarteiraPadrao: enfileirar identifica mês inicial pelo ativo mais antigo", async () => {
  const ativos = [
    ativo("a1", "2026-02-01T00:00:00Z", 1, 100),
    ativo("a2", "2025-11-15T00:00:00Z", 1, 200),
  ];
  const servico = new ServicoReconstrucaoCarteiraPadrao({
    fila: new FilaFake(),
    historicoMensal: new HistoricoFake(),
    fonte: new FonteFake(ativos),
  });

  const estado = await servico.enfileirar("u1");
  assert.equal(estado.status, "pendente");
  assert.equal(estado.anoMesInicial, "2025-11");
});

test("ServicoReconstrucaoCarteiraPadrao: processarProximoLote grava em chunks e atualiza cursor", async () => {
  const ativos = [ativo("a1", "2025-11-01T00:00:00Z", 10, 100)];
  const fila = new FilaFake();
  const historico = new HistoricoFake();
  const servico = new ServicoReconstrucaoCarteiraPadrao({
    fila,
    historicoMensal: historico,
    fonte: new FonteFake(ativos),
  });

  // Forçamos início e fim conhecidos (5 meses: 2025-11, 12, 2026-01, 02, 03)
  await fila.criar("u1", "2025-11", "2026-03");

  const estado1 = await servico.processarProximoLote("u1", 3);
  assert.equal(historico.pontos.length, 3);
  assert.equal(estado1.status, "pendente");
  assert.equal(estado1.mesesProcessados, 3);
  assert.equal(estado1.anoMesCursor, "2026-01");

  const estado2 = await servico.processarProximoLote("u1", 3);
  assert.equal(historico.pontos.length, 5);
  assert.equal(estado2.status, "concluido");
  assert.equal(estado2.anoMesCursor, "2026-03");
  assert.ok(estado2.concluidoEm !== null);
});

test("ServicoReconstrucaoCarteiraPadrao: processar com fila concluída é no-op", async () => {
  const fila = new FilaFake();
  const historico = new HistoricoFake();
  const servico = new ServicoReconstrucaoCarteiraPadrao({
    fila,
    historicoMensal: historico,
    fonte: new FonteFake([ativo("a1", "2026-01-01T00:00:00Z", 1, 100)]),
  });

  await fila.criar("u1", "2026-01", "2026-01");
  await fila.atualizar("u1", { status: "concluido", concluidoEm: new Date().toISOString() });

  const estado = await servico.processarProximoLote("u1");
  assert.equal(estado.status, "concluido");
  assert.equal(historico.pontos.length, 0);
});
