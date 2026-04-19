import assert from "node:assert/strict";
import test from "node:test";
import { BenchmarkService } from "../src/server/services/benchmark.service";

type FetchStub = (input: unknown) => Promise<Response>;

const comFetchMockado = async (stub: FetchStub, fn: () => Promise<void>): Promise<void> => {
  const original = globalThis.fetch;
  globalThis.fetch = stub as unknown as typeof fetch;
  try {
    await fn();
  } finally {
    globalThis.fetch = original;
  }
};

test("BenchmarkService.cdiReturnSince retorna 0 quando API do BCB falha", async () => {
  await comFetchMockado(
    async () => new Response("erro", { status: 500 }),
    async () => {
      const retorno = await new BenchmarkService().cdiReturnSince("2025-01-01");
      assert.equal(retorno, 0);
    },
  );
});

test("BenchmarkService.cdiReturnSince retorna 0 quando série está vazia", async () => {
  await comFetchMockado(
    async () => new Response(JSON.stringify([]), { status: 200 }),
    async () => {
      const retorno = await new BenchmarkService().cdiReturnSince("2025-01-01");
      assert.equal(retorno, 0);
    },
  );
});

test("BenchmarkService.cdiReturnSince acumula taxas diárias do BCB (valor real, não fake)", async () => {
  // Três dias com 0,05% cada: (1.0005)^3 - 1 ≈ 0,15%
  const serie = [{ valor: "0,05" }, { valor: "0,05" }, { valor: "0,05" }];
  await comFetchMockado(
    async () => new Response(JSON.stringify(serie), { status: 200 }),
    async () => {
      const retorno = await new BenchmarkService().cdiReturnSince("2025-01-01");
      assert.equal(retorno, 0.15);
    },
  );
});

test("BenchmarkService.cdiReturnSince ignora valores não numéricos no payload", async () => {
  const serie = [{ valor: "0,10" }, { valor: "xyz" }, { valor: "0,10" }];
  await comFetchMockado(
    async () => new Response(JSON.stringify(serie), { status: 200 }),
    async () => {
      const retorno = await new BenchmarkService().cdiReturnSince("2025-01-01");
      // (1.001)^2 - 1 ≈ 0,2%
      assert.equal(retorno, 0.2);
    },
  );
});

test("BenchmarkService.cdiReturnSince retorna 0 para data inválida sem chamar API", async () => {
  let chamou = false;
  await comFetchMockado(
    async () => {
      chamou = true;
      return new Response("[]", { status: 200 });
    },
    async () => {
      const retorno = await new BenchmarkService().cdiReturnSince("data-invalida");
      assert.equal(retorno, 0);
      assert.equal(chamou, false);
    },
  );
});
