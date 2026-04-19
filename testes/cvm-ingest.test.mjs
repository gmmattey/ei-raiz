import assert from "node:assert/strict";
import test from "node:test";

import { normalizarCnpj, normalizarDataRef, parseLinhaCvm } from "../utilitarios/scripts/ingest-cvm-funds.mjs";

test("normalizarCnpj remove máscara e valida 14 dígitos", () => {
  assert.equal(normalizarCnpj("17.454.259/0001-05"), "17454259000105");
  assert.equal(normalizarCnpj("17454259000105"), "17454259000105");
  assert.equal(normalizarCnpj(" 17454259000105 "), "17454259000105");
});

test("normalizarCnpj rejeita entradas inválidas", () => {
  assert.equal(normalizarCnpj(null), null);
  assert.equal(normalizarCnpj(undefined), null);
  assert.equal(normalizarCnpj(""), null);
  assert.equal(normalizarCnpj("123"), null);
  assert.equal(normalizarCnpj("abc"), null);
  assert.equal(normalizarCnpj("174542590001055"), null); // 15 dígitos
});

test("normalizarDataRef aceita ISO e dd/mm/yyyy", () => {
  assert.equal(normalizarDataRef("2026-03-15"), "2026-03-15");
  assert.equal(normalizarDataRef("15/03/2026"), "2026-03-15");
});

test("normalizarDataRef rejeita formatos desconhecidos", () => {
  assert.equal(normalizarDataRef(""), null);
  assert.equal(normalizarDataRef("15-03-2026"), null);
  assert.equal(normalizarDataRef("abc"), null);
  assert.equal(normalizarDataRef(null), null);
});

test("parseLinhaCvm converte linha válida (CNPJ_FUNDO)", () => {
  const out = parseLinhaCvm({
    CNPJ_FUNDO: "17.454.259/0001-05",
    DT_COMPTC: "2026-03-14",
    VL_QUOTA: "1.23",
    VL_PATRIM_LIQ: "1000000",
    NR_COTST: "42",
  });
  assert.equal(out.ok, true);
  assert.deepEqual(out.item, {
    cnpj: "17454259000105",
    dataRef: "2026-03-14",
    vlQuota: 1.23,
    vlPatrimLiq: 1000000,
    nrCotst: 42,
  });
});

test("parseLinhaCvm aceita schema novo CNPJ_FUNDO_CLASSE e vírgula decimal", () => {
  const out = parseLinhaCvm({
    CNPJ_FUNDO_CLASSE: "17454259000105",
    DT_COMPTC: "14/03/2026",
    VL_QUOTA: "1,234567",
    VL_PATRIM_LIQ: "",
    NR_COTST: "",
  });
  assert.equal(out.ok, true);
  assert.equal(out.item.vlQuota, 1.234567);
  assert.equal(out.item.dataRef, "2026-03-14");
  assert.equal(out.item.vlPatrimLiq, undefined);
  assert.equal(out.item.nrCotst, undefined);
});

test("parseLinhaCvm rejeita vl_quota não-positivo", () => {
  const out = parseLinhaCvm({
    CNPJ_FUNDO: "17454259000105",
    DT_COMPTC: "2026-03-14",
    VL_QUOTA: "0",
  });
  assert.equal(out.ok, false);
  assert.equal(out.motivo, "vl_quota_invalido");
});

test("parseLinhaCvm rejeita data inválida", () => {
  const out = parseLinhaCvm({
    CNPJ_FUNDO: "17454259000105",
    DT_COMPTC: "14-03-2026",
    VL_QUOTA: "1.23",
  });
  assert.equal(out.ok, false);
  assert.equal(out.motivo, "data_invalida");
});

test("parseLinhaCvm rejeita CNPJ inválido", () => {
  const out = parseLinhaCvm({ CNPJ_FUNDO: "123", DT_COMPTC: "2026-03-14", VL_QUOTA: "1.23" });
  assert.equal(out.ok, false);
  assert.equal(out.motivo, "cnpj_invalido");
});
