/**
 * PATCH para apps_script/backend/Operational_CRUD.gs
 *
 * Substitua o conteúdo atual do arquivo por esta versão.
 *
 * Comportamento:
 * - Create, Update e Delete passam a operar no D1
 * - Read principal já pode estar no D1 via patch anterior
 * - Nenhuma função executa ordem financeira real
 */

function updateStatusAtivo(tipo, codigo, novoStatus) {
  var status = String(novoStatus || '').trim();
  if (!status) throw new Error('Novo status obrigatorio.');

  var result = d1UpdateOperationalStatus_(tipo, codigo, status);
  return Object.assign({}, result, {
    message: 'Status atualizado com sucesso.',
    financialExecution: false
  });
}

function removerAtivo(tipo, codigo) {
  var result = d1DeleteOperationalRecord_(tipo, codigo);
  return Object.assign({}, result, {
    message: 'Registro removido com sucesso.',
    financialExecution: false
  });
}

function adicionarAtivo(tipo, dados) {
  var payload = ensureOperationalCrudPayload_(dados, true);
  var result = d1InsertOperationalRecord_(tipo, payload);
  return Object.assign({}, result, {
    message: 'Registro criado com sucesso.',
    financialExecution: false
  });
}

function atualizarAtivo(tipo, codigo, dados) {
  var payload = ensureOperationalCrudPayload_(dados, false);
  var result = d1UpdateOperationalRecord_(tipo, codigo, payload);
  return Object.assign({}, result, {
    message: 'Registro atualizado com sucesso.',
    financialExecution: false
  });
}

function ensureOperationalCrudPayload_(dados, requireContent) {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    throw new Error('Payload invalido para operacao de CRUD.');
  }

  var payload = Object.keys(dados).reduce(function (result, key) {
    var normalizedKey = String(key || '').trim();
    if (!normalizedKey) return result;
    result[normalizedKey] = dados[key];
    return result;
  }, {});

  if (requireContent && !Object.keys(payload).length) {
    throw new Error('Dados obrigatorios para criar o registro.');
  }

  if (!requireContent && !Object.keys(payload).length) {
    throw new Error('Nenhum dado valido recebido para atualizacao.');
  }

  return payload;
}
