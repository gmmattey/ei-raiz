import assert from 'node:assert/strict';
import test from 'node:test';
import type { Bd, Env } from '../src/infra/bd';
import { servicoDecisoes } from '../src/dominios/decisoes/decisoes.servico';

const linhaResumoAtual = {
  usuario_id: 'usuario-1',
  patrimonio_bruto_brl: 1000,
  divida_brl: 100,
  patrimonio_liquido_brl: 900,
  quantidade_itens: 3,
  score_total: 70,
  score_faixa: 'bom',
  score_calculado_em: '2026-07-20T10:00:00.000Z',
  aporte_mes_brl: 0,
  rentabilidade_mes_pct: null,
};

function bdComResumo(linhaResumo: typeof linhaResumoAtual | null): Bd {
  return {
    async primeiro(sql: string) {
      if (sql.includes('vw_patrimonio_resumo')) return linhaResumo as never;
      return null;
    },
    async consultar() { return []; },
    async executar() { return { sucesso: true, linhasAfetadas: 1 }; },
    async emLote() {},
  };
}

function bdIndisponivel(): Bd {
  return {
    async primeiro() { throw new Error('D1 indisponível'); },
    async consultar() { throw new Error('D1 indisponível'); },
    async executar() { return { sucesso: true, linhasAfetadas: 1 }; },
    async emLote() {},
  };
}

test('vera responde com IA e reporta confiança/versão do contexto financeiro', async () => {
  const bd = bdComResumo(linhaResumoAtual);
  const env: Env = { DB: {} as never, JWT_SECRET: 'segredo', AI: { run: async () => ({ response: 'Olá, tudo certo com seu patrimônio.' }) } };
  const resultado = await servicoDecisoes(bd, env).veraEnviarMensagem('usuario-1', { conversaId: null, mensagem: 'Como estou?' });
  assert.equal(resultado.ok, true, JSON.stringify(resultado));
  if (!resultado.ok) return;
  assert.equal(resultado.dados.baseadoEm, 'ia');
  assert.equal(resultado.dados.confiancaDados, 'atual');
  assert.ok(resultado.dados.contextoFinanceiroVersao);
  assert.equal(resultado.dados.resposta, 'Olá, tudo certo com seu patrimônio.');
});

test('vera degrada com segurança quando a IA está indisponível, sem bloquear a resposta', async () => {
  const bd = bdComResumo(linhaResumoAtual);
  const env: Env = { DB: {} as never, JWT_SECRET: 'segredo' }; // sem AI
  const resultado = await servicoDecisoes(bd, env).veraEnviarMensagem('usuario-1', { conversaId: null, mensagem: 'Como estou?' });
  assert.equal(resultado.ok, true);
  if (!resultado.ok) return;
  assert.equal(resultado.dados.baseadoEm, 'deterministico');
  assert.match(resultado.dados.resposta, /R\$\s?900,00/);
  assert.equal(resultado.dados.confiancaDados, 'atual');
});

test('vera degrada quando a IA lança erro em runtime', async () => {
  const bd = bdComResumo(linhaResumoAtual);
  const env: Env = { DB: {} as never, JWT_SECRET: 'segredo', AI: { run: async () => { throw new Error('modelo indisponível'); } } };
  const resultado = await servicoDecisoes(bd, env).veraEnviarMensagem('usuario-1', { conversaId: null, mensagem: 'Como estou?' });
  assert.equal(resultado.ok, true);
  if (!resultado.ok) return;
  assert.equal(resultado.dados.baseadoEm, 'deterministico');
  assert.match(resultado.dados.resposta, /patrimônio líquido atual/);
});

test('vera nunca bloqueia acesso ao diagnóstico quando o patrimônio está indisponível', async () => {
  const bd = bdIndisponivel();
  const env: Env = { DB: {} as never, JWT_SECRET: 'segredo', AI: { run: async () => ({ response: 'não deveria chegar aqui' }) } };
  const resultado = await servicoDecisoes(bd, env).veraEnviarMensagem('usuario-1', { conversaId: null, mensagem: 'Como estou?' });
  assert.equal(resultado.ok, true);
  if (!resultado.ok) return;
  assert.equal(resultado.dados.confiancaDados, 'indisponivel');
  assert.equal(resultado.dados.contextoFinanceiroVersao, null);
  assert.match(resultado.dados.resposta, /Não consegui acessar seus dados financeiros/);
});

test('vera reconhece usuário sem itens patrimoniais em vez de citar totais inexistentes', async () => {
  const bd = bdComResumo({ ...linhaResumoAtual, quantidade_itens: 0 });
  const env: Env = { DB: {} as never, JWT_SECRET: 'segredo' };
  const resultado = await servicoDecisoes(bd, env).veraEnviarMensagem('usuario-1', { conversaId: null, mensagem: 'Como estou?' });
  assert.equal(resultado.ok, true);
  if (!resultado.ok) return;
  assert.equal(resultado.dados.confiancaDados, 'sem_dados');
  assert.match(resultado.dados.resposta, /ainda não tem itens no patrimônio/);
});

test('mensagem vazia é rejeitada antes de consultar patrimônio ou IA', async () => {
  const bd = bdIndisponivel();
  const env: Env = { DB: {} as never, JWT_SECRET: 'segredo' };
  const resultado = await servicoDecisoes(bd, env).veraEnviarMensagem('usuario-1', { conversaId: null, mensagem: '   ' });
  assert.equal(resultado.ok, false);
  if (resultado.ok) return;
  assert.equal(resultado.codigo, 'mensagem_vazia');
});

test('simulação criada carrega a versão e confiança do resumo patrimonial usado', async () => {
  const inseridos: { valores: unknown[] }[] = [];
  const bd: Bd = {
    async primeiro(sql: string) {
      if (sql.includes('vw_patrimonio_resumo')) return linhaResumoAtual as never;
      if (sql.includes('decisoes_simulacoes')) {
        const [ultimo] = inseridos.slice(-1);
        return {
          id: ultimo?.valores[0], usuario_id: 'usuario-1', tipo: 'imovel',
          premissas_json: ultimo?.valores[3], resultado_json: ultimo?.valores[4],
          criado_em: '2026-07-26T10:00:00.000Z',
        } as never;
      }
      return null;
    },
    async consultar() { return []; },
    async executar(sql: string, ...valores: unknown[]) {
      if (sql.includes('INSERT INTO decisoes_simulacoes')) inseridos.push({ valores });
      return { sucesso: true, linhasAfetadas: 1 };
    },
    async emLote() {},
  };
  const env: Env = { DB: {} as never, JWT_SECRET: 'segredo' };
  const resultado = await servicoDecisoes(bd, env).criar('usuario-1', {
    tipo: 'imovel', premissasJson: { valorImovel: 500000 },
  });
  assert.equal(resultado.ok, true, JSON.stringify(resultado));
  if (!resultado.ok) return;
  const contexto = resultado.dados.resultadoJson.contextoFinanceiro as { versao: string; confianca: string };
  assert.ok(contexto.versao);
  assert.equal(contexto.confianca, 'atual');
});
