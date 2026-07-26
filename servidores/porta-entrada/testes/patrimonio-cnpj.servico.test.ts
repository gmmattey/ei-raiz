import assert from 'node:assert/strict';
import test from 'node:test';
import { servicoPatrimonio } from '../src/dominios/patrimonio/patrimonio.servico';

test('vincula um fundo manual ao ativo canônico pelo CNPJ', async () => {
  const execucoes: { sql: string; valores: unknown[] }[] = [];
  let buscasAtivo = 0;
  const bd = {
    consultar: async () => [{
      item_id: execucoes.at(-1)?.valores[0], usuario_id: 'usuario-1', tipo: 'fundo', origem: 'manual', nome: 'Fundo teste',
      ativo_id: 'ativo-1', ticker: null, cnpj: '12345678000190', classe: null, subclasse: null,
      quantidade: 1, preco_medio_brl: 10, valor_atual_brl: 10, preco_atual_brl: 10,
      preco_atualizado_em: null, preco_fonte: null, rentabilidade_pct: null,
      criado_em: '2026-07-25', atualizado_em: '2026-07-25',
    }],
    primeiro: async () => {
      buscasAtivo += 1;
      return buscasAtivo === 1 ? null : { id: execucoes[0].valores[0] as string };
    },
    executar: async (sql: string, ...valores: unknown[]) => {
      execucoes.push({ sql, valores });
      return { sucesso: true, linhasAfetadas: 1 };
    },
    emLote: async () => {},
  };

  const resultado = await servicoPatrimonio(bd).criarItem('usuario-1', {
    tipo: 'fundo', nome: 'Fundo teste', cnpj: '12.345.678/0001-90', quantidade: 1, valorAtualBrl: 10,
  });

  assert.equal(resultado.ok, true, JSON.stringify(resultado));
  assert.match(execucoes[0].sql, /INSERT INTO ativos/);
  assert.equal(execucoes[0].valores[1], '12345678000190');
  assert.match(execucoes[1].sql, /INSERT INTO patrimonio_itens/);
  assert.equal(execucoes[1].valores[2], execucoes[0].valores[0]);
});

test('rejeita CNPJ fora de fundo ou previdência', async () => {
  const bd = { consultar: async () => [], primeiro: async () => null, executar: async () => ({ sucesso: true, linhasAfetadas: 0 }), emLote: async () => {} };
  const resultado = await servicoPatrimonio(bd).criarItem('usuario-1', {
    tipo: 'acao', nome: 'Ação teste', cnpj: '12.345.678/0001-90',
  });
  assert.equal(resultado.ok, false);
  assert.equal(resultado.codigo, 'cnpj_tipo_invalido');
});

test('expõe valor calculado e frescor da cotação no contrato patrimonial', async () => {
  const bd = {
    consultar: async () => [{
      item_id: 'item-1', usuario_id: 'usuario-1', tipo: 'fundo', origem: 'manual', nome: 'Fundo teste',
      ativo_id: 'ativo-1', ticker: null, cnpj: '12345678000190', classe: null, subclasse: null,
      quantidade: 10, preco_medio_brl: 9, valor_atual_brl: 125, preco_atual_brl: 12.5,
      preco_atualizado_em: '2026-07-25T10:00:00.000Z', preco_fonte: 'cvm',
      preco_referencia_em: '2026-07-24', preco_expira_em: '2026-07-25T10:05:00.000Z',
      rentabilidade_pct: 38.8, criado_em: '2026-07-25', atualizado_em: '2026-07-25',
    }],
    primeiro: async () => null,
    executar: async () => ({ sucesso: true, linhasAfetadas: 0 }),
    emLote: async () => {},
  };
  const resultado = await servicoPatrimonio(bd).listarItens('usuario-1');
  assert.equal(resultado.ok, true);
  if (!resultado.ok) return;
  assert.deepEqual(resultado.dados.itens[0].estadoValor, 'cotacao');
  assert.equal(resultado.dados.itens[0].valorAtualBrl, 125);
  assert.equal(resultado.dados.itens[0].fonteCotacao, 'cvm');
  assert.equal(resultado.dados.itens[0].cotacaoReferenciaEm, '2026-07-24');
});
