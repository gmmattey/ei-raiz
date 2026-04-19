import test from "node:test";
import assert from "node:assert/strict";
import { ServicoCarteiraPadrao } from "../src/servico";
import type { AtivoPersistido, CacheCotacaoPersistido, FonteMercado, RepositorioCarteira } from "../src/repositorio";

class RepoFake implements RepositorioCarteira {
  public ativos: AtivoPersistido[] = [];
  public cacheValido: CacheCotacaoPersistido | null = null;
  public ultimoCache: CacheCotacaoPersistido | null = null;
  public atualizacoes: Array<{ id: string; valorAtual: number; rentabilidade: number }> = [];

  async listarAtivos(): Promise<AtivoPersistido[]> {
    return this.ativos;
  }

  async listarSnapshotsPatrimonio(): Promise<Array<{ data: string; valorTotal: number }>> {
    return [];
  }

  async atualizarValorAtivo(ativoId: string, valorAtual: number, rentabilidadeDesdeAquisicaoPct: number): Promise<void> {
    this.atualizacoes.push({ id: ativoId, valorAtual, rentabilidade: rentabilidadeDesdeAquisicaoPct });
  }

  async somarDividas(): Promise<number> {
    return 0;
  }

  async lerCacheValido(_fonte: FonteMercado, _chaveAtivo: string): Promise<CacheCotacaoPersistido | null> {
    return this.cacheValido;
  }

  async lerUltimoCache(_fonte: FonteMercado, _chaveAtivo: string): Promise<CacheCotacaoPersistido | null> {
    return this.ultimoCache;
  }

  async salvarCache(): Promise<void> {
    return;
  }
}

const ativoBase = (): AtivoPersistido => ({
  id: "ativo_1",
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
});

test("mercado: deve usar cotacao em tempo real quando fonte responde", async () => {
  const repo = new RepoFake();
  repo.ativos = [ativoBase()];

  const servico = new ServicoCarteiraPadrao({
    repositorio: repo,
    brapiToken: "t",
    fetchFn: async () =>
      new Response(
        JSON.stringify({
          results: [{ regularMarketPrice: 30, regularMarketChangePercent: 2.5 }],
        }),
        { status: 200 },
      ),
  });

  const ativos = await servico.listarAtivos("user_1");
  assert.equal(ativos[0]!.statusAtualizacao, "atualizado");
  assert.equal(ativos[0]!.fontePreco, "brapi");
  assert.equal(ativos[0]!.precoAtual, 30);
  assert.equal(ativos[0]!.valorAtual, 300);
  assert.ok(repo.atualizacoes.length > 0);
});

test("mercado: deve cair para cache atrasado quando fonte falha", async () => {
  const repo = new RepoFake();
  repo.ativos = [ativoBase()];
  repo.ultimoCache = {
    precoAtual: 27,
    variacaoPercentual: 1.2,
    atualizadoEm: "2026-04-10T10:00:00.000Z",
    expiraEm: "2026-04-10T11:00:00.000Z",
    payload: { origem: "cache" },
  };

  const servico = new ServicoCarteiraPadrao({
    repositorio: repo,
    brapiToken: "t",
    fetchFn: async () => {
      throw new Error("network down");
    },
  });

  const ativos = await servico.listarAtivos("user_1");
  assert.equal(ativos[0]!.statusAtualizacao, "atrasado");
  assert.equal(ativos[0]!.fontePreco, "brapi");
  assert.equal(ativos[0]!.precoAtual, 27);
  assert.equal(ativos[0]!.valorAtual, 270);
});

test("mercado: deve sinalizar indisponivel quando fonte falha e nao ha cache", async () => {
  const repo = new RepoFake();
  repo.ativos = [ativoBase()];

  const servico = new ServicoCarteiraPadrao({
    repositorio: repo,
    brapiToken: "t",
    fetchFn: async () => {
      throw new Error("network down");
    },
  });

  const ativos = await servico.listarAtivos("user_1");
  assert.equal(ativos[0]!.statusAtualizacao, "indisponivel");
  assert.equal(ativos[0]!.fontePreco, "brapi");
  assert.equal(ativos[0]!.precoAtual, undefined);
  assert.equal(ativos[0]!.valorAtual, 200);
});
