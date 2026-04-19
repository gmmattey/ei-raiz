import test from "node:test";
import assert from "node:assert/strict";
import { calcularSnapshotConsolidado, type AtivoParaSnapshot } from "../src/snapshot-consolidado";
import type { ContextoFinanceiroUsuario } from "@ei/contratos";

const ativoBase = (overrides: Partial<AtivoParaSnapshot> = {}): AtivoParaSnapshot => ({
  id: "a1",
  ticker: "PETR4",
  nome: "Petrobras",
  categoria: "acao",
  valorAtual: 1000,
  quantidade: 10,
  precoMedio: 80,
  rentabilidadeDesdeAquisicaoPct: 25,
  rentabilidadeConfiavel: true,
  participacao: 0,
  ...overrides,
});

const contextoVazio: ContextoFinanceiroUsuario = {
  usuarioId: "u1",
  patrimonioExterno: { imoveis: [], veiculos: [], poupanca: 0, caixaDisponivel: 0 },
  dividas: [],
};

test("calcularSnapshotConsolidado: soma investimentos e calcula retorno total", () => {
  const ativos = [
    ativoBase({ valorAtual: 1000, quantidade: 10, precoMedio: 80 }),
    ativoBase({ id: "a2", ticker: "VALE3", valorAtual: 500, quantidade: 5, precoMedio: 90 }),
  ];

  const snap = calcularSnapshotConsolidado(ativos, contextoVazio);

  assert.equal(snap.totalAtual, 1500);
  assert.equal(snap.totalInvestido, 1250);
  assert.ok(Math.abs(snap.retornoTotal - 20) < 0.01);
  assert.equal(snap.payload.valorInvestimentos, 1500);
  assert.equal(snap.payload.patrimonioInvestimentos, 1500);
  assert.equal(snap.payload.patrimonioTotal, 1500);
  assert.equal(snap.payload.confiavel, true);
});

test("calcularSnapshotConsolidado: inclui imóveis líquidos (valor - financiamento)", () => {
  const ctx: ContextoFinanceiroUsuario = {
    ...contextoVazio,
    patrimonioExterno: {
      imoveis: [
        { id: "i1", tipo: "casa", valorEstimado: 500_000, saldoFinanciamento: 200_000, geraRenda: false },
      ],
      veiculos: [{ id: "v1", tipo: "carro", valorEstimado: 50_000, quitado: true }],
      poupanca: 10_000,
      caixaDisponivel: 0,
    },
  };

  const snap = calcularSnapshotConsolidado([ativoBase({ valorAtual: 100_000 })], ctx);

  assert.equal(snap.payload.patrimonioBens, 350_000);
  assert.equal(snap.payload.patrimonioPoupanca, 10_000);
  assert.equal(snap.payload.patrimonioTotal, 460_000);
  assert.equal(snap.payload.valorInvestimentos, 100_000);
});

test("calcularSnapshotConsolidado: escopo de rentabilidade é só investimentos (não patrimônio total)", () => {
  // Bug central #19: rentabilidade diluída por bens/poupança.
  // Com 100k investidos (rentab. 10%) + 500k em bens, snapshot deve reportar
  // retornoTotal ~= 10% — NÃO ~= 1.7% (que seria ganho/patrimônio total).
  const ativo = ativoBase({ valorAtual: 110_000, quantidade: 1, precoMedio: 100_000 });
  const ctx: ContextoFinanceiroUsuario = {
    ...contextoVazio,
    patrimonioExterno: {
      imoveis: [{ id: "i1", tipo: "casa", valorEstimado: 500_000, saldoFinanciamento: 0, geraRenda: false }],
      veiculos: [], poupanca: 0, caixaDisponivel: 0,
    },
  };

  const snap = calcularSnapshotConsolidado([ativo], ctx);

  assert.ok(Math.abs(snap.retornoTotal - 10) < 0.01, `retornoTotal=${snap.retornoTotal}, esperado ~10%`);
  assert.equal(snap.totalAtual, 110_000);
  assert.equal(snap.payload.valorInvestimentos, 110_000);
  assert.equal(snap.payload.patrimonioTotal, 610_000);
});

test("calcularSnapshotConsolidado: dívidas subtraem do patrimônio líquido", () => {
  const ativo = ativoBase({ valorAtual: 100_000, quantidade: 1, precoMedio: 100_000 });
  const ctx: ContextoFinanceiroUsuario = {
    ...contextoVazio,
    dividas: [{ id: "d1", tipo: "financiamento", descricao: "imóvel", saldoDevedor: 50_000 } as never],
  };

  const snap = calcularSnapshotConsolidado([ativo], ctx);

  assert.equal(snap.payload.patrimonioDividas, 50_000);
  assert.equal(snap.payload.patrimonioTotal, 50_000);
  assert.equal(snap.payload.valorInvestimentos, 100_000); // base de rentab. não muda
});

test("calcularSnapshotConsolidado: dividasTotais param tem precedência sobre contexto.dividas", () => {
  const ativo = ativoBase({ valorAtual: 10_000, quantidade: 1, precoMedio: 10_000 });
  const ctx: ContextoFinanceiroUsuario = {
    ...contextoVazio,
    dividas: [{ id: "d1", tipo: "financiamento", descricao: "imóvel", saldoDevedor: 99_999 } as never],
  };

  const snap = calcularSnapshotConsolidado([ativo], ctx, 3000);

  assert.equal(snap.payload.patrimonioDividas, 3000);
  assert.equal(snap.payload.patrimonioTotal, 7000);
});

test("calcularSnapshotConsolidado: distribuição inclui só categorias com valor > 0", () => {
  const snap = calcularSnapshotConsolidado([ativoBase({ valorAtual: 100 })], contextoVazio);
  assert.equal(snap.payload.distribuicaoPatrimonio.length, 1);
  assert.equal(snap.payload.distribuicaoPatrimonio[0]?.id, "investimentos");
  assert.equal(snap.payload.distribuicaoPatrimonio[0]?.percentual, 100);
});

test("calcularSnapshotConsolidado: carteira vazia retorna zeros sem dividir por zero", () => {
  const snap = calcularSnapshotConsolidado([], contextoVazio);
  assert.equal(snap.totalAtual, 0);
  assert.equal(snap.totalInvestido, 0);
  assert.equal(snap.retornoTotal, 0);
  assert.equal(snap.payload.distribuicaoPatrimonio.length, 0);
  assert.equal(snap.payload.confiavel, false); // sem ativos, não há rentab. auditável
});

test("calcularSnapshotConsolidado: aceita contexto null", () => {
  const snap = calcularSnapshotConsolidado([ativoBase({ valorAtual: 200 })], null);
  assert.equal(snap.payload.patrimonioBens, 0);
  assert.equal(snap.payload.patrimonioPoupanca, 0);
  assert.equal(snap.payload.patrimonioDividas, 0);
  assert.equal(snap.payload.patrimonioTotal, 200);
});

test("calcularSnapshotConsolidado: trata saldoFinanciamento maior que valor (bens > 0)", () => {
  const ctx: ContextoFinanceiroUsuario = {
    ...contextoVazio,
    patrimonioExterno: {
      imoveis: [{ id: "i1", tipo: "casa", valorEstimado: 100_000, saldoFinanciamento: 200_000, geraRenda: false }],
      veiculos: [],
      poupanca: 0,
      caixaDisponivel: 0,
    },
  };
  const snap = calcularSnapshotConsolidado([], ctx);
  assert.equal(snap.payload.patrimonioBens, 0);
});

test("calcularSnapshotConsolidado: confiavel=false se ao menos 1 ativo não for confiável", () => {
  const ativos = [
    ativoBase({ rentabilidadeConfiavel: true }),
    ativoBase({ id: "a2", rentabilidadeConfiavel: false, rentabilidadeDesdeAquisicaoPct: null }),
  ];
  const snap = calcularSnapshotConsolidado(ativos, contextoVazio);
  assert.equal(snap.payload.confiavel, false);
});
