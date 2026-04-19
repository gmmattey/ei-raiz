import test from "node:test";
import assert from "node:assert/strict";
import { ServicoCarteiraPadrao } from "../src/servico";
import type { AtivoPersistido, CacheCotacaoPersistido, FonteMercado, RepositorioCarteira } from "../src/repositorio";

class RepoFake implements RepositorioCarteira {
  public ativos: AtivoPersistido[] = [];
  public atualizacoes: Array<{ id: string; valorAtual: number; rentabilidade: number }> = [];

  async listarAtivos(): Promise<AtivoPersistido[]> {
    return this.ativos;
  }
  async listarSnapshotsPatrimonio(): Promise<Array<{ data: string; valorTotal: number }>> {
    return [];
  }
  async atualizarValorAtivo(id: string, valorAtual: number, rentabilidadeDesdeAquisicaoPct: number): Promise<void> {
    this.atualizacoes.push({ id, valorAtual, rentabilidade: rentabilidadeDesdeAquisicaoPct });
  }
  async somarDividas(): Promise<number> {
    return 0;
  }
  async lerCacheValido(_f: FonteMercado, _k: string): Promise<CacheCotacaoPersistido | null> {
    return null;
  }
  async lerUltimoCache(_f: FonteMercado, _k: string): Promise<CacheCotacaoPersistido | null> {
    return null;
  }
  async salvarCache(): Promise<void> {}
}

const ativo = (overrides: Partial<AtivoPersistido> = {}): AtivoPersistido => ({
  id: "a1",
  ticker: "PETR4",
  nome: "Petrobras",
  categoria: "acao",
  plataforma: "XP",
  quantidade: 10,
  precoMedio: 20,
  valorAtual: 200,
  participacao: 100,
  rentabilidadeDesdeAquisicaoPct: 0,
  dataCadastro: null,
  dataAquisicao: null,
  tickerCanonico: "PETR4",
  cnpjFundo: null,
  indexador: null,
  taxa: null,
  dataInicio: null,
  vencimento: null,
  ...overrides,
});

test("listar: expõe rentabilidadeDesdeAquisicaoPct canônico + confiavel", async () => {
  const repo = new RepoFake();
  repo.ativos = [ativo()];
  const servico = new ServicoCarteiraPadrao({
    repositorio: repo,
    brapiToken: "t",
    fetchFn: async () =>
      new Response(JSON.stringify({ results: [{ regularMarketPrice: 30 }] }), { status: 200 }),
  });
  const ativos = await servico.listarAtivos("u");
  const r = ativos[0]!;
  assert.equal(typeof r.rentabilidadeDesdeAquisicaoPct, "number");
  assert.equal(r.rentabilidadeConfiavel, true);
  // (30 - 20) / 20 = 50%
  assert.ok(Math.abs((r.rentabilidadeDesdeAquisicaoPct ?? 0) - 50) < 0.01);
});

test("preco_medio: status=confiavel quando valor bate com quantidade × preço", async () => {
  const repo = new RepoFake();
  repo.ativos = [ativo({ precoMedio: 20, quantidade: 10, valorAtual: 200 })];
  const servico = new ServicoCarteiraPadrao({
    repositorio: repo,
    brapiToken: "t",
    fetchFn: async () => new Response(JSON.stringify({ results: [{ regularMarketPrice: 20 }] }), { status: 200 }),
  });
  const [r] = await servico.listarAtivos("u");
  assert.equal(r!.statusPrecoMedio, "confiavel");
});

test("preco_medio: status=ajustado_heuristica quando precoMedio veio como total investido", async () => {
  const repo = new RepoFake();
  repo.ativos = [ativo({ precoMedio: 200, quantidade: 10, valorAtual: 200 })];
  const servico = new ServicoCarteiraPadrao({
    repositorio: repo,
    brapiToken: "t",
    fetchFn: async () => new Response(JSON.stringify({ results: [{ regularMarketPrice: 20 }] }), { status: 200 }),
  });
  const [r] = await servico.listarAtivos("u");
  assert.equal(r!.statusPrecoMedio, "ajustado_heuristica");
});

test("preco_medio: status=inconsistente quando não reconcilia com valor atual", async () => {
  const repo = new RepoFake();
  repo.ativos = [ativo({ precoMedio: 99999, quantidade: 10, valorAtual: 200 })];
  const servico = new ServicoCarteiraPadrao({
    repositorio: repo,
    brapiToken: "t",
    fetchFn: async () => new Response(JSON.stringify({ results: [{ regularMarketPrice: 20 }] }), { status: 200 }),
  });
  const [r] = await servico.listarAtivos("u");
  assert.equal(r!.statusPrecoMedio, "inconsistente");
});

test("resumo: confiável + rentabilidadeDesdeAquisicaoPct numérico no caso auditável", async () => {
  const repo = new RepoFake();
  repo.ativos = [ativo({ precoMedio: 20, quantidade: 10, valorAtual: 200 })];
  const servico = new ServicoCarteiraPadrao({
    repositorio: repo,
    brapiToken: "t",
    fetchFn: async () => new Response(JSON.stringify({ results: [{ regularMarketPrice: 30 }] }), { status: 200 }),
  });
  const resumo = await servico.obterResumo("u");
  assert.equal(resumo.rentabilidadeConfiavel, true);
  assert.equal(typeof resumo.rentabilidadeDesdeAquisicaoPct, "number");
  // (300 - 200)/200 = 50%
  assert.ok(Math.abs((resumo.rentabilidadeDesdeAquisicaoPct ?? 0) - 50) < 0.01);
});

test("resumo: rentabilidadeConfiavel=false quando preço médio é inconsistente", async () => {
  const repo = new RepoFake();
  repo.ativos = [ativo({ precoMedio: 99999, quantidade: 10, valorAtual: 200 })];
  const servico = new ServicoCarteiraPadrao({
    repositorio: repo,
    brapiToken: "t",
    fetchFn: async () => new Response(JSON.stringify({ results: [{ regularMarketPrice: 20 }] }), { status: 200 }),
  });
  const resumo = await servico.obterResumo("u");
  assert.equal(resumo.rentabilidadeConfiavel, false);
  assert.equal(resumo.rentabilidadeDesdeAquisicaoPct, null);
  assert.ok(
    resumo.motivoRentabilidadeIndisponivel && resumo.motivoRentabilidadeIndisponivel.length > 0,
    "deve conter motivo legível",
  );
});
