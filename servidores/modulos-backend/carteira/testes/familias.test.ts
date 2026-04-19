import test from "node:test";
import assert from "node:assert/strict";
import {
  calcularFamiliaA,
  calcularFamiliaB,
  calcularFamiliaC,
  calcularFamiliaD,
  calcularFamiliaE,
  calcularPorFamilia,
  type EntradaAtivo,
  type MetaMercado,
} from "../src/familias";

const metaVazia: MetaMercado = {
  fonte: "nenhuma",
  status: "indisponivel",
  precoAtual: null,
  variacaoPercentual: null,
  atualizadoEm: null,
};

const ativoBase = (overrides: Partial<EntradaAtivo> = {}): EntradaAtivo => ({
  id: "a1",
  categoria: "acao",
  familia: "renda_variavel_listada",
  quantidade: 10,
  precoMedio: 20,
  valorAtualPersistido: 200,
  dataAquisicao: "2025-01-10",
  ...overrides,
});

// ─── Família A — renda variável listada ─────────────────────────────────────

test("Família A: valor de mercado = preço atual × quantidade; rentabilidade sobre custo", () => {
  const r = calcularFamiliaA(ativoBase(), { ...metaVazia, fonte: "brapi", status: "atualizado", precoAtual: 30 });
  assert.equal(r.valorAtual, 300);
  assert.equal(r.rentabilidadeConfiavel, true);
  assert.ok(Math.abs((r.rentabilidadeDesdeAquisicaoPct ?? 0) - 50) < 0.01);
  assert.equal(r.fontePreco, "brapi");
});

test("Família A: sem cotação mantém valor persistido; rentabilidade confiável quando custo reconcilia", () => {
  // precoMedio × quantidade = 200 (custo); valor persistido = 205 (erro 2.5%, dentro da tolerância)
  const r = calcularFamiliaA(ativoBase({ valorAtualPersistido: 205 }), metaVazia);
  assert.equal(r.valorAtual, 205);
  assert.equal(r.rentabilidadeConfiavel, true);
  // (205-200)/200 = 2.5%
  assert.ok(Math.abs((r.rentabilidadeDesdeAquisicaoPct ?? 0) - 2.5) < 0.01);
});

test("Família A: preço médio inconsistente → confiavel=false + motivo legível", () => {
  const r = calcularFamiliaA(
    ativoBase({ precoMedio: 99999, quantidade: 10, valorAtualPersistido: 200 }),
    { ...metaVazia, fonte: "brapi", status: "atualizado", precoAtual: 20 },
  );
  assert.equal(r.rentabilidadeConfiavel, false);
  assert.equal(r.motivoRentabilidadeIndisponivel, "preco_medio_inconsistente");
  assert.equal(r.statusPrecoMedio, "inconsistente");
});

// ─── Família B — fundo CVM ──────────────────────────────────────────────────

test("Família B: fórmula da cota — valor = custo × (cota_atual / cota_aquisicao)", () => {
  // custo total = 10.000; cota aquisição = 1.00; cota atual = 1.25 → 25% de retorno
  const r = calcularFamiliaB(
    ativoBase({ familia: "fundo_cvm", quantidade: 1, precoMedio: 10_000, valorAtualPersistido: 10_000 }),
    { ...metaVazia, fonte: "cvm", status: "atualizado", precoAtual: 1.25, cotaAquisicao: 1.0 },
  );
  assert.equal(r.rentabilidadeConfiavel, true);
  assert.ok(Math.abs((r.rentabilidadeDesdeAquisicaoPct ?? 0) - 25) < 0.01);
  assert.equal(r.valorAtual, 12_500);
});

test("Família B: sem cota de aquisição → confiavel=false, mantém valor persistido", () => {
  const r = calcularFamiliaB(
    ativoBase({ familia: "fundo_cvm", quantidade: 1, precoMedio: 10_000, valorAtualPersistido: 11_000 }),
    { ...metaVazia, fonte: "cvm", status: "atualizado", precoAtual: 1.25, cotaAquisicao: null },
  );
  assert.equal(r.rentabilidadeConfiavel, false);
  assert.equal(r.valorAtual, 11_000);
  assert.equal(r.motivoRentabilidadeIndisponivel, "cota_na_data_de_aquisicao_nao_encontrada");
});

test("Família B: cota atual ausente → confiavel=false com motivo específico", () => {
  const r = calcularFamiliaB(
    ativoBase({ familia: "fundo_cvm", quantidade: 1, precoMedio: 10_000, valorAtualPersistido: 10_000 }),
    { ...metaVazia, cotaAquisicao: 1.0 },
  );
  assert.equal(r.rentabilidadeConfiavel, false);
  assert.equal(r.motivoRentabilidadeIndisponivel, "cota_atual_indisponivel_na_cvm");
});

// ─── Família C — renda fixa contratada ──────────────────────────────────────

test("Família C: PRE calcula localmente sem fonte externa", () => {
  // Prefixado 10% a.a. contratado há exatamente 1 ano → fator ≈ 1.10.
  const agora = new Date("2026-04-19T12:00:00Z");
  const inicio = new Date("2025-04-19T12:00:00Z").toISOString();
  const r = calcularFamiliaC(
    ativoBase({
      familia: "renda_fixa_contratada",
      categoria: "renda_fixa",
      quantidade: 1,
      precoMedio: 10_000,
      valorAtualPersistido: 10_000,
      indexador: "PRE",
      taxa: 10,
      dataInicio: inicio,
    }),
    metaVazia,
    { fatorCorrecaoAcumulado: null },
    agora,
  );
  assert.equal(r.rentabilidadeConfiavel, true);
  assert.ok(Math.abs((r.rentabilidadeDesdeAquisicaoPct ?? 0) - 10) < 0.5);
  assert.ok(r.valorAtual >= 10_900 && r.valorAtual <= 11_100);
});

test("Família C: CDI/IPCA usa fator injetado pelo contexto", () => {
  const r = calcularFamiliaC(
    ativoBase({
      familia: "renda_fixa_contratada",
      categoria: "renda_fixa",
      quantidade: 1,
      precoMedio: 10_000,
      valorAtualPersistido: 10_000,
      indexador: "CDI",
      taxa: 110,
      dataInicio: "2025-01-01",
    }),
    metaVazia,
    { fatorCorrecaoAcumulado: 1.088 }, // simula CDI 8% × 110%
  );
  assert.equal(r.rentabilidadeConfiavel, true);
  assert.ok(Math.abs((r.rentabilidadeDesdeAquisicaoPct ?? 0) - 8.8) < 0.01);
  assert.equal(r.valorAtual, 10_880);
});

test("Família C: CDI sem fator no contexto → confiavel=false com motivo legível", () => {
  const r = calcularFamiliaC(
    ativoBase({
      familia: "renda_fixa_contratada",
      categoria: "renda_fixa",
      quantidade: 1,
      precoMedio: 10_000,
      valorAtualPersistido: 10_000,
      indexador: "CDI",
      taxa: 110,
      dataInicio: "2025-01-01",
    }),
    metaVazia,
    { fatorCorrecaoAcumulado: null },
  );
  assert.equal(r.rentabilidadeConfiavel, false);
  assert.equal(r.rentabilidadeDesdeAquisicaoPct, null);
  assert.ok(r.motivoRentabilidadeIndisponivel?.includes("fator_de_correcao_indisponivel"));
});

test("Família C: indexador ausente → confiavel=false, motivo='indexador_ou_taxa_ausentes_em_renda_fixa'", () => {
  const r = calcularFamiliaC(
    ativoBase({
      familia: "renda_fixa_contratada",
      categoria: "renda_fixa",
      quantidade: 1,
      precoMedio: 10_000,
      indexador: null,
      taxa: null,
      dataInicio: "2025-01-01",
    }),
    metaVazia,
    { fatorCorrecaoAcumulado: null },
  );
  assert.equal(r.rentabilidadeConfiavel, false);
  assert.equal(r.motivoRentabilidadeIndisponivel, "indexador_ou_taxa_ausentes_em_renda_fixa");
});

// ─── Família D — bens ──────────────────────────────────────────────────────

test("Família D: bens não têm rentabilidade marcada; preserva valor declarado", () => {
  const r = calcularFamiliaD(
    ativoBase({ familia: "bens", categoria: "imovel", quantidade: 1, precoMedio: 500_000, valorAtualPersistido: 520_000 }),
  );
  assert.equal(r.valorAtual, 520_000);
  assert.equal(r.rentabilidadeConfiavel, false);
  assert.equal(r.rentabilidadeDesdeAquisicaoPct, null);
  assert.equal(r.motivoRentabilidadeIndisponivel, "bens_nao_tem_rentabilidade_marcada_a_mercado");
});

// ─── Família E — caixa/poupança ─────────────────────────────────────────────

test("Família E: poupança sem histórico mensal → rentabilidade null", () => {
  const r = calcularFamiliaE(
    ativoBase({ familia: "caixa_poupanca", categoria: "poupanca", quantidade: 1, precoMedio: 5000, valorAtualPersistido: 5200 }),
  );
  assert.equal(r.valorAtual, 5200);
  assert.equal(r.rentabilidadeConfiavel, false);
  assert.equal(r.rentabilidadeDesdeAquisicaoPct, null);
  assert.equal(r.motivoRentabilidadeIndisponivel, "caixa_poupanca_sem_historico_mensal");
});

// ─── Dispatcher ─────────────────────────────────────────────────────────────

test("calcularPorFamilia: dispatch exaustivo por família", () => {
  const meta = { ...metaVazia, fonte: "brapi" as const, status: "atualizado" as const, precoAtual: 22 };
  const rA = calcularPorFamilia(ativoBase({ familia: "renda_variavel_listada" }), meta);
  assert.equal(rA.valorAtual, 220);

  const rB = calcularPorFamilia(
    ativoBase({ familia: "fundo_cvm", quantidade: 1, precoMedio: 1000, valorAtualPersistido: 1000 }),
    { ...meta, fonte: "cvm", precoAtual: 1.1, cotaAquisicao: 1.0 },
  );
  assert.equal(rB.valorAtual, 1100);

  const rD = calcularPorFamilia(ativoBase({ familia: "bens", valorAtualPersistido: 42 }), meta);
  assert.equal(rD.valorAtual, 42);
  assert.equal(rD.rentabilidadeConfiavel, false);

  const rE = calcularPorFamilia(ativoBase({ familia: "caixa_poupanca", valorAtualPersistido: 99 }), meta);
  assert.equal(rE.valorAtual, 99);
  assert.equal(rE.rentabilidadeConfiavel, false);
});
