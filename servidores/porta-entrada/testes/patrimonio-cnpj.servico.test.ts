import assert from 'node:assert/strict';
import test from 'node:test';
import { servicoPatrimonio } from '../src/dominios/patrimonio/patrimonio.servico';

test('vincula um fundo manual ao ativo canônico pelo CNPJ', async () => {
  const execucoes: { sql: string; valores: unknown[] }[] = [];
  const lotes: { sql: string; valores: unknown[] }[][] = [];
  let buscasAtivo = 0;
  const bd = {
    consultar: async () => [{
      item_id: lotes[0]?.[0].valores[0], usuario_id: 'usuario-1', tipo: 'fundo', origem: 'manual', nome: 'Fundo teste',
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
    emLote: async (operacoes: { sql: string; valores: unknown[] }[]) => { lotes.push(operacoes); },
  };

  const resultado = await servicoPatrimonio(bd).criarItem('usuario-1', {
    tipo: 'fundo', nome: 'Fundo teste', cnpj: '12.345.678/0001-90', quantidade: 1, valorAtualBrl: 10,
  });

  assert.equal(resultado.ok, true, JSON.stringify(resultado));
  assert.match(execucoes[0].sql, /INSERT INTO ativos/);
  assert.equal(execucoes[0].valores[1], '12345678000190');
  assert.match(lotes[0][0].sql, /INSERT INTO patrimonio_itens/);
  assert.equal(lotes[0][0].valores[2], execucoes[0].valores[0]);
  assert.match(lotes[0][1].sql, /INSERT INTO patrimonio_movimentos/);
  assert.equal(lotes[0][1].valores[3], 'aporte');
});

test('cadastro manual de ação cria movimento de compra na mesma operação', async () => {
  const lotes: { sql: string; valores: unknown[] }[][] = [];
  const bd = {
    consultar: async () => [{
      item_id: lotes[0]?.[0].valores[0] ?? 'item-1', usuario_id: 'usuario-1', tipo: 'acao', origem: 'manual', nome: 'Ação teste',
      ativo_id: null, ticker: null, cnpj: null, classe: null, subclasse: null, quantidade: 2,
      preco_medio_brl: 10, valor_atual_brl: 20, preco_atual_brl: null, preco_atualizado_em: null,
      preco_fonte: null, rentabilidade_pct: null, criado_em: '2026-07-26', atualizado_em: '2026-07-26',
    }],
    primeiro: async () => null,
    executar: async () => ({ sucesso: true, linhasAfetadas: 1 }),
    emLote: async (operacoes: { sql: string; valores: unknown[] }[]) => { lotes.push(operacoes); },
  };
  const resultado = await servicoPatrimonio(bd).criarItem('usuario-1', {
    tipo: 'acao', nome: 'Ação teste', quantidade: 2, precoMedioBrl: 10, valorAtualBrl: 20,
  });
  assert.equal(resultado.ok, true, JSON.stringify(resultado));
  assert.match(lotes[0][0].sql, /INSERT INTO patrimonio_itens/);
  assert.match(lotes[0][1].sql, /INSERT INTO patrimonio_movimentos/);
  assert.equal(lotes[0][1].valores[3], 'compra');
  assert.equal(lotes[0][1].valores[4], 2);
  assert.equal(lotes[0][1].valores[5], 20);
});

test('rejeita CNPJ fora de fundo ou previdência', async () => {
  const bd = { consultar: async () => [], primeiro: async () => null, executar: async () => ({ sucesso: true, linhasAfetadas: 0 }), emLote: async () => {} };
  const resultado = await servicoPatrimonio(bd).criarItem('usuario-1', {
    tipo: 'acao', nome: 'Ação teste', cnpj: '12.345.678/0001-90',
  });
  assert.equal(resultado.ok, false);
  assert.equal(resultado.codigo, 'cnpj_tipo_invalido');
});

test('reenvio do mesmo lote reutiliza a importação sem gravar linhas novamente', async () => {
  const importacoes = new Map<string, { id: string; usuario_id: string; origem: string; status: string; iniciado_em: string; concluido_em: null; chave: string }>();
  let itensInseridos = 0;
  const bd = {
    consultar: async () => [],
    primeiro: async (_sql: string, ...valores: unknown[]) => {
      const [primeiro, segundo] = valores;
      if (_sql.includes('chave_idempotencia')) {
        return [...importacoes.values()].find((importacao) => importacao.usuario_id === primeiro && importacao.chave === segundo) ?? null;
      }
      return importacoes.get(primeiro as string) ?? null;
    },
    executar: async (sql: string, ...valores: unknown[]) => {
      if (sql.includes('INSERT INTO importacoes')) {
        const [id, usuarioId, origem, chave] = valores as string[];
        importacoes.set(id, { id, usuario_id: usuarioId, origem, status: 'pendente', iniciado_em: '2026-07-26', concluido_em: null, chave });
      }
      if (sql.includes('INSERT INTO importacao_itens')) itensInseridos += 1;
      return { sucesso: true, linhasAfetadas: 1 };
    },
    emLote: async () => {},
  };
  const servico = servicoPatrimonio(bd);
  const entrada = { origem: 'carteira.xlsx', itens: [{ linha: 1, tipo: 'desconhecido', dadosJson: { aba: 'acoes', ticker: 'PETR4', quantidade: 10 } }] };

  const primeiro = await servico.criarImportacao('usuario-1', entrada);
  const segundo = await servico.criarImportacao('usuario-1', entrada);

  assert.equal(primeiro.ok, true, JSON.stringify(primeiro));
  assert.equal(segundo.ok, true, JSON.stringify(segundo));
  if (!primeiro.ok || !segundo.ok) return;
  assert.equal(segundo.dados.id, primeiro.dados.id);
  assert.equal(itensInseridos, 1);
});

test('confirma um lote criando a posição canônica uma única vez', async () => {
  const lotes: { sql: string; valores: unknown[] }[][] = [];
  const importacao = {
    id: 'importacao-1', usuario_id: 'usuario-1', origem: 'carteira.xlsx', status: 'pendente',
    iniciado_em: '2026-07-26', concluido_em: null,
  };
  const bd = {
    consultar: async (sql: string) => {
      if (sql.includes('FROM importacao_itens') && sql.includes('ORDER BY linha')) {
        return [{ id: 'linha-1', linha: 1, tipo: 'desconhecido', resultado: 'pendente', dados_json: JSON.stringify({
          aba: 'acoes', ticker: 'PETR4', nome: 'Petrobras PN', quantidade: 10, precoMedio: 30, valorTotal: 320,
        }) }];
      }
      return [];
    },
    primeiro: async () => importacao,
    executar: async () => ({ sucesso: true, linhasAfetadas: 1 }),
    emLote: async (operacoes: { sql: string; valores: unknown[] }[]) => { lotes.push(operacoes); },
  };

  const resultado = await servicoPatrimonio(bd).confirmarImportacao('usuario-1', 'importacao-1');

  assert.equal(resultado.ok, true, JSON.stringify(resultado));
  if (!resultado.ok) return;
  assert.equal(resultado.dados.itensCriados, 1);
  assert.equal(resultado.dados.itensRejeitados, 0);
  assert.match(lotes[0][0].sql, /INSERT INTO patrimonio_itens/);
  assert.match(lotes[0][1].sql, /INSERT INTO patrimonio_movimentos/);
  assert.equal(lotes[0][1].valores[4], 1);
  assert.match(lotes[0][2].sql, /resultado = 'aceito'/);
  assert.match(lotes[0][3].sql, /INSERT INTO patrimonio_fila_reconstrucao/);
});

test('confirma fundo importado vinculando seu CNPJ ao catálogo canônico', async () => {
  const lotes: { sql: string; valores: unknown[] }[][] = [];
  const importacao = { id: 'importacao-2', usuario_id: 'usuario-1', origem: 'fundos.xlsx', status: 'pendente', iniciado_em: '2026-07-26', concluido_em: null };
  const bd = {
    consultar: async (sql: string) => sql.includes('ORDER BY linha')
      ? [{ id: 'linha-fundo', linha: 1, tipo: 'desconhecido', resultado: 'pendente', dados_json: JSON.stringify({
        aba: 'fundos', nome: 'Fundo CVM', cnpj: '12.345.678/0001-90', valorAplicado: 500,
      }) }]
      : [],
    primeiro: async (sql: string) => sql.includes('FROM ativos') ? null : importacao,
    executar: async () => ({ sucesso: true, linhasAfetadas: 1 }),
    emLote: async (operacoes: { sql: string; valores: unknown[] }[]) => { lotes.push(operacoes); },
  };

  const resultado = await servicoPatrimonio(bd).confirmarImportacao('usuario-1', 'importacao-2');

  assert.equal(resultado.ok, true, JSON.stringify(resultado));
  assert.match(lotes[0][0].sql, /INSERT INTO ativos/);
  assert.equal(lotes[0][0].valores[1], '12345678000190');
  assert.match(lotes[0][1].sql, /INSERT INTO patrimonio_itens/);
  assert.equal(lotes[0][1].valores[2], lotes[0][0].valores[0]);
  assert.match(lotes[0][2].sql, /INSERT INTO patrimonio_movimentos/);
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

test('lista somente os movimentos do item do usuário autenticado', async () => {
  const bd = {
    consultar: async (sql: string) => sql.includes('FROM patrimonio_movimentos') ? [{
      id: 'movimento-1', usuario_id: 'usuario-1', item_id: 'item-1', importacao_id: 'importacao-1', linha_importacao: 3,
      tipo: 'compra', quantidade: 10, valor_brl: 300, data: '2026-07-20', origem: 'importacao',
      dados_json: '{"aba":"acoes"}', criado_em: '2026-07-20T10:00:00.000Z',
    }] : [],
    primeiro: async (sql: string) => sql.includes('FROM patrimonio_itens') ? { id: 'item-1' } : null,
    executar: async () => ({ sucesso: true, linhasAfetadas: 0 }),
    emLote: async () => {},
  };
  const resultado = await servicoPatrimonio(bd).listarMovimentosItem('usuario-1', 'item-1');
  assert.equal(resultado.ok, true, JSON.stringify(resultado));
  if (!resultado.ok) return;
  assert.deepEqual(resultado.dados.itens[0], {
    id: 'movimento-1', usuarioId: 'usuario-1', itemId: 'item-1', importacaoId: 'importacao-1', linhaImportacao: 3,
    tipo: 'compra', quantidade: 10, valorBrl: 300, data: '2026-07-20', origem: 'importacao',
    dadosJson: { aba: 'acoes' }, criadoEm: '2026-07-20T10:00:00.000Z',
  });
});
