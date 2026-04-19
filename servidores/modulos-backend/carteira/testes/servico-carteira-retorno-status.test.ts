import test from "node:test";
import assert from "node:assert/strict";
import { ServicoCarteiraPadrao } from "../src/servico";
import type { AtivoPersistido, CacheCotacaoPersistido, FonteMercado, RepositorioCarteira } from "../src/repositorio";

class RepoFake implements RepositorioCarteira {
  public ativos: AtivoPersistido[] = [];
  public atualizacoes: Array<{ id: string; valorAtual: number; retorno12m: number }> = [];

  async listarAtivos(): Promise<AtivoPersistido[]> {
    return this.ativos;
  }
  async atualizarValorAtivo(id: string, valorAtual: number, retorno12m: number): Promise<void> {
    this.atualizacoes.push({ id, valorAtual, retorno12m });
  }
  async lerCacheValido(_f: FonteMercado, _k: string): Promise<CacheCotacaoPersistido | null> {
    return null;
  }
  async lerUltimoCache(_f: FonteMercado, _k: string): Promise<CacheCotacaoPersistido | null> {
    return null;
  }
  async salvarCache(): Promise<void> {}
  async listarSnapshotsPatrimonio(): Promise<Array<{ data: string; valorTotal: number }>> {
    return [];
  }
}

const ativo = (overrides: Partial<AtivoPersistido> = {}): AtivoPersistido => ({
  id: "a1",
  ticker: "PETR4",
  nome: "Petrobras",
  categoria: "acao",
  plataforma: "XP",
  quantidade: 10,
  precoMedio: 20,
  valorAtual: 300,
  participacao: 100,
  retorno12m: 0,
  tickerCanonico: "PETR4",
  cnpjFundo: null,
  ...overrides,
});

test("retorno: expõe retornoDesdeAquisicao e mantém retorno12m legado com mesmo valor", async () => {
  const repo = new RepoFake();
  repo.ativos = [ativo()];
  const servico = new ServicoCarteiraPadrao({
    repositorio: repo,
    fetchFn: async () =>
      new Response(JSON.stringify({ results: [{ regularMarketPrice: 30 }] }), { status: 200 }),
  });
  const ativos = await servico.listarAtivos("u");
  const r = ativos[0];
  assert.equal(typeof r.retornoDesdeAquisicao, "number");
  assert.equal(r.retornoDesdeAquisicao, r.retorno12m);
  assert.equal(r.retorno_desde_aquisicao, r.retorno12m);
});

test("preco_medio: status=confiavel quando valor bate com quantidade x preco", async () => {
  const repo = new RepoFake();
  repo.ativos = [ativo({ precoMedio: 20, quantidade: 10, valorAtual: 200 })];
  const servico = new ServicoCarteiraPadrao({
    repositorio: repo,
    fetchFn: async () => new Response(JSON.stringify({ results: [{ regularMarketPrice: 20 }] }), { status: 200 }),
  });
  const [r] = await servico.listarAtivos("u");
  assert.equal(r.statusPrecoMedio, "confiavel");
});

test("preco_medio: status=ajustado_heuristica quando precoMedio veio como total investido", async () => {
  const repo = new RepoFake();
  // 200 total para 10 cotas deveria ser unitário 20. Enviam 200 no campo precoMedio.
  repo.ativos = [ativo({ precoMedio: 200, quantidade: 10, valorAtual: 200 })];
  const servico = new ServicoCarteiraPadrao({
    repositorio: repo,
    fetchFn: async () => new Response(JSON.stringify({ results: [{ regularMarketPrice: 20 }] }), { status: 200 }),
  });
  const [r] = await servico.listarAtivos("u");
  assert.equal(r.statusPrecoMedio, "ajustado_heuristica");
});

test("preco_medio: status=inconsistente quando não reconcilia com valor atual", async () => {
  const repo = new RepoFake();
  repo.ativos = [ativo({ precoMedio: 99999, quantidade: 10, valorAtual: 200 })];
  const servico = new ServicoCarteiraPadrao({
    repositorio: repo,
    fetchFn: async () => new Response(JSON.stringify({ results: [{ regularMarketPrice: 20 }] }), { status: 200 }),
  });
  const [r] = await servico.listarAtivos("u");
  assert.equal(r.statusPrecoMedio, "inconsistente");
});

test("resumo: retornoDesdeAquisicao presente e retorno12m espelha", async () => {
  const repo = new RepoFake();
  // valorAtual persistido bate com custo (caso clássico de import recente).
  repo.ativos = [ativo({ precoMedio: 20, quantidade: 10, valorAtual: 200 })];
  const servico = new ServicoCarteiraPadrao({
    repositorio: repo,
    fetchFn: async () => new Response(JSON.stringify({ results: [{ regularMarketPrice: 30 }] }), { status: 200 }),
  });
  const resumo = await servico.obterResumo("u");
  assert.equal(typeof resumo.retornoDesdeAquisicao, "number");
  assert.equal(resumo.retornoDesdeAquisicao, resumo.retorno12m);
  assert.ok(resumo.retornoDisponivel);
});

test("resumo: retornoDisponivel=false quando preço médio é inconsistente", async () => {
  const repo = new RepoFake();
  repo.ativos = [ativo({ precoMedio: 99999, quantidade: 10, valorAtual: 200 })];
  const servico = new ServicoCarteiraPadrao({
    repositorio: repo,
    fetchFn: async () => new Response(JSON.stringify({ results: [{ regularMarketPrice: 20 }] }), { status: 200 }),
  });
  const resumo = await servico.obterResumo("u");
  assert.equal(resumo.retornoDisponivel, false);
  assert.ok(resumo.motivoRetornoIndisponivel && resumo.motivoRetornoIndisponivel.length > 0);
});
