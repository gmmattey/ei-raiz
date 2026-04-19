import assert from "node:assert/strict";
import test from "node:test";
import {
  planejarBackfill,
  reduzirFechamentoMensalPorCnpj,
  gerarMesesEntre,
  subtrairMeses,
  anoMesUtc,
  normalizarCnpj14,
} from "../src/server/services/cvm-backfill-planner";

const HOJE = new Date(Date.UTC(2026, 3, 19)); // 2026-04-19

test("anoMesUtc formata com padding", () => {
  assert.equal(anoMesUtc(new Date(Date.UTC(2026, 0, 5))), "2026-01");
  assert.equal(anoMesUtc(new Date(Date.UTC(2026, 11, 31))), "2026-12");
});

test("subtrairMeses atravessa ano corretamente", () => {
  assert.equal(subtrairMeses("2026-04", 1), "2026-03");
  assert.equal(subtrairMeses("2026-04", 4), "2025-12");
  assert.equal(subtrairMeses("2026-01", 13), "2024-12");
});

test("gerarMesesEntre inclui extremos e falha-seguro quando invertido", () => {
  assert.deepEqual(gerarMesesEntre("2026-03", "2026-05"), ["2026-03", "2026-04", "2026-05"]);
  assert.deepEqual(gerarMesesEntre("2026-05", "2026-03"), []);
  assert.deepEqual(gerarMesesEntre("2025-12", "2026-02"), ["2025-12", "2026-01", "2026-02"]);
  assert.equal(gerarMesesEntre("2026-01", "2026-01").length, 1);
});

test("normalizarCnpj14 exige 14 dígitos", () => {
  assert.equal(normalizarCnpj14("17.454.259/0001-05"), "17454259000105");
  assert.equal(normalizarCnpj14("123"), null);
});

test("planner prioriza intervalo override (independe de data_aquisicao)", () => {
  const p = planejarBackfill({
    hoje: HOJE,
    menorDataAquisicao: "2020-01-01",
    intervaloInicial: "2023-06",
    intervaloFinal: "2023-08",
    cnpjsDisponiveis: ["17454259000105"],
  });
  assert.equal(p.origem, "override");
  assert.equal(p.intervaloInicial, "2023-06");
  assert.equal(p.intervaloFinal, "2023-08");
  assert.equal(p.totalMesesPrevistos, 3);
});

test("planner usa menor data_aquisicao com margem default de 2 meses", () => {
  const p = planejarBackfill({
    hoje: HOJE,
    menorDataAquisicao: "2024-05-15",
    cnpjsDisponiveis: ["17454259000105"],
  });
  assert.equal(p.origem, "data_aquisicao");
  assert.equal(p.intervaloInicial, "2024-03"); // 2024-05 - 2 meses
  assert.equal(p.intervaloFinal, "2026-04");
});

test("planner respeita margem customizada", () => {
  const p = planejarBackfill({
    hoje: HOJE,
    menorDataAquisicao: "2024-05-15",
    margemMeses: 6,
    cnpjsDisponiveis: ["17454259000105"],
  });
  assert.equal(p.intervaloInicial, "2023-11");
});

test("planner sem data_aquisicao usa janela padrão de 60 meses", () => {
  const p = planejarBackfill({
    hoje: HOJE,
    menorDataAquisicao: null,
    cnpjsDisponiveis: ["17454259000105"],
  });
  assert.equal(p.origem, "janela_padrao");
  assert.equal(p.intervaloFinal, "2026-04");
  assert.equal(p.intervaloInicial, "2021-05"); // 60 meses incluindo o fim
  assert.equal(p.totalMesesPrevistos, 60);
});

test("planner respeita janelaPadraoMeses custom", () => {
  const p = planejarBackfill({
    hoje: HOJE,
    janelaPadraoMeses: 12,
    cnpjsDisponiveis: ["17454259000105"],
  });
  assert.equal(p.intervaloInicial, "2025-05");
  assert.equal(p.totalMesesPrevistos, 12);
});

test("planner normaliza e deduplica CNPJs", () => {
  const p = planejarBackfill({
    hoje: HOJE,
    menorDataAquisicao: "2025-12-01",
    cnpjsDisponiveis: ["17.454.259/0001-05", "17454259000105", "abc", "42229399000127"],
  });
  assert.deepEqual(p.cnpjs.sort(), ["17454259000105", "42229399000127"]);
});

test("planner usa cnpjsOverride quando fornecido", () => {
  const p = planejarBackfill({
    hoje: HOJE,
    cnpjsDisponiveis: ["17454259000105"],
    cnpjsOverride: ["42229399000127"],
  });
  assert.deepEqual(p.cnpjs, ["42229399000127"]);
});

test("reduzirFechamentoMensalPorCnpj mantém maior dataRef por CNPJ", () => {
  const linhas = [
    { cnpj: "A", dataRef: "2026-03-10", vlQuota: 1.0 },
    { cnpj: "A", dataRef: "2026-03-27", vlQuota: 1.2 },
    { cnpj: "A", dataRef: "2026-03-15", vlQuota: 1.1 },
    { cnpj: "B", dataRef: "2026-03-05", vlQuota: 2.0 },
  ];
  const out = reduzirFechamentoMensalPorCnpj(linhas);
  const byCnpj = Object.fromEntries(out.map((l) => [l.cnpj, l]));
  assert.equal(byCnpj.A.dataRef, "2026-03-27");
  assert.equal(byCnpj.A.vlQuota, 1.2);
  assert.equal(byCnpj.B.dataRef, "2026-03-05");
});

test("planner com intervalo invertido colapsa para o mês final (não explode)", () => {
  const p = planejarBackfill({
    hoje: HOJE,
    intervaloInicial: "2027-01",
    intervaloFinal: "2026-01",
  });
  assert.equal(p.intervaloInicial, "2026-01");
  assert.equal(p.intervaloFinal, "2026-01");
  assert.equal(p.totalMesesPrevistos, 1);
});
