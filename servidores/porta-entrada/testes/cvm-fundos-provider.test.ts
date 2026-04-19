import assert from "node:assert/strict";
import test from "node:test";
import {
  CvmFundosProviderD1,
  normalizarCnpj,
} from "../src/server/services/provedor-cotacao-fundos-cvm";

// ─── Fake D1 mínimo, em memória ─────────────────────────────────────────────
// Reproduz apenas os endpoints do contrato D1Database que o provider usa.
// O objetivo NÃO é emular SQL — é verificar que o provider monta as queries
// corretas e traduz linhas→cotas como esperado.

type Linha = {
  cnpj: string;
  data_ref: string;
  vl_quota: number;
  vl_patrim_liq: number | null;
  nr_cotst: number | null;
};

function criarFakeDb(linhas: Linha[]) {
  return {
    prepare(sql: string) {
      const bindings: unknown[] = [];
      const api = {
        bind(...vals: unknown[]) {
          bindings.push(...vals);
          return api;
        },
        async first<T>(): Promise<T | null> {
          const filtrado = aplicar(sql, bindings, linhas);
          return (filtrado[0] as unknown as T) ?? null;
        },
        async all<T>(): Promise<{ results: T[] }> {
          const filtrado = aplicar(sql, bindings, linhas);
          // Simula o SELECT do provider que inclui substr(data_ref,1,7) AS ano_mes.
          const comAnoMes = filtrado.map((l) => ({ ...l, ano_mes: l.data_ref.slice(0, 7) }));
          return { results: comAnoMes as unknown as T[] };
        },
      };
      return api;
    },
  } as unknown as D1Database;
}

function aplicar(sql: string, bindings: unknown[], linhas: Linha[]): Linha[] {
  // Ordenação DESC por data_ref (é o que as queries do provider usam).
  let atuais = [...linhas].sort((a, b) => (a.data_ref < b.data_ref ? 1 : -1));
  if (sql.includes("WHERE cnpj = ? AND data_ref <= ?")) {
    const [cnpj, ate] = bindings as [string, string];
    atuais = atuais.filter((l) => l.cnpj === cnpj && l.data_ref <= ate);
  } else if (sql.includes("WHERE cnpj = ? ORDER BY data_ref DESC")) {
    const [cnpj] = bindings as [string];
    atuais = atuais.filter((l) => l.cnpj === cnpj);
  } else if (sql.includes("WHERE cnpj IN")) {
    const cnpjs = bindings.slice(0, bindings.length - 2) as string[];
    const [inicio, fim] = bindings.slice(-2) as [string, string];
    atuais = atuais.filter(
      (l) => cnpjs.includes(l.cnpj) && l.data_ref >= inicio && l.data_ref <= fim,
    );
    atuais.sort((a, b) =>
      a.cnpj === b.cnpj ? (a.data_ref < b.data_ref ? 1 : -1) : a.cnpj < b.cnpj ? -1 : 1,
    );
  }
  return atuais;
}

test("normalizarCnpj (provider) remove máscara e exige 14 dígitos", () => {
  assert.equal(normalizarCnpj("17.454.259/0001-05"), "17454259000105");
  assert.equal(normalizarCnpj("abc"), null);
  assert.equal(normalizarCnpj(null), null);
});

test("obterCotaMaisRecente retorna a cota mais nova sem filtro de data", async () => {
  const db = criarFakeDb([
    { cnpj: "17454259000105", data_ref: "2026-03-10", vl_quota: 1.1, vl_patrim_liq: null, nr_cotst: null },
    { cnpj: "17454259000105", data_ref: "2026-03-14", vl_quota: 1.3, vl_patrim_liq: 9, nr_cotst: 7 },
    { cnpj: "42229399000127", data_ref: "2026-03-14", vl_quota: 9.9, vl_patrim_liq: null, nr_cotst: null },
  ]);
  const provider = new CvmFundosProviderD1(db);
  const cota = await provider.obterCotaMaisRecente("17.454.259/0001-05");
  assert.deepEqual(cota, {
    cnpj: "17454259000105",
    dataRef: "2026-03-14",
    vlQuota: 1.3,
    vlPatrimLiq: 9,
    nrCotst: 7,
  });
});

test("obterCotaMaisRecente respeita ateData", async () => {
  const db = criarFakeDb([
    { cnpj: "17454259000105", data_ref: "2026-03-10", vl_quota: 1.1, vl_patrim_liq: null, nr_cotst: null },
    { cnpj: "17454259000105", data_ref: "2026-03-14", vl_quota: 1.3, vl_patrim_liq: null, nr_cotst: null },
  ]);
  const provider = new CvmFundosProviderD1(db);
  const cota = await provider.obterCotaMaisRecente("17454259000105", "2026-03-11");
  assert.equal(cota?.dataRef, "2026-03-10");
});

test("obterCotaMaisRecente devolve null para CNPJ inválido", async () => {
  const db = criarFakeDb([]);
  const provider = new CvmFundosProviderD1(db);
  assert.equal(await provider.obterCotaMaisRecente("abc"), null);
});

test("obterFechamentosMensais agrupa última cota de cada mês", async () => {
  const db = criarFakeDb([
    { cnpj: "17454259000105", data_ref: "2026-02-27", vl_quota: 2.0, vl_patrim_liq: null, nr_cotst: null },
    { cnpj: "17454259000105", data_ref: "2026-03-14", vl_quota: 2.3, vl_patrim_liq: null, nr_cotst: null },
    { cnpj: "17454259000105", data_ref: "2026-03-28", vl_quota: 2.5, vl_patrim_liq: null, nr_cotst: null },
  ]);
  const provider = new CvmFundosProviderD1(db);
  const m = await provider.obterFechamentosMensais(["17454259000105"], "2026-02", "2026-03");
  assert.equal(m.get("17454259000105")?.get("2026-02"), 2.0);
  assert.equal(m.get("17454259000105")?.get("2026-03"), 2.5);
});
