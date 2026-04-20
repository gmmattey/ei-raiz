#!/usr/bin/env node
/**
 * Sincronização de patrimônio externo (imóveis, veículos) de posicoes_financeiras
 * para perfil_contexto_financeiro.
 *
 * Objetivo: Garantir que dados de bens (imovel, veiculo) que estão em posicoes_financeiras
 * sejam também registrados em perfil_contexto_financeiro para que apareçam no painel de perfil
 * e sejam contabilizados no score.
 *
 * Uso:
 *   node utilitarios/scripts/sincronizar-patrimonio-externo.mjs [--usuario-id=uuid] [--dry-run]
 *
 * Exemplos:
 *   # Sincronizar apenas um usuário
 *   node utilitarios/scripts/sincronizar-patrimonio-externo.mjs --usuario-id=4a858baf-fd89-42a8-84f2-d45c7489b2a3
 *
 *   # Sincronizar todos os usuários (dry-run)
 *   node utilitarios/scripts/sincronizar-patrimonio-externo.mjs --dry-run
 *
 *   # Sincronizar todos os usuários (apply)
 *   node utilitarios/scripts/sincronizar-patrimonio-externo.mjs
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../infra/banco/banco.db');

const args = process.argv.slice(2);
const usuarioIdParam = args.find(a => a.startsWith('--usuario-id='))?.split('=')[1];
const isDryRun = args.includes('--dry-run');

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';

console.log(`[${new Date().toISOString()}] Sincronização de Patrimônio Externo`);
console.log(`[${new Date().toISOString()}] Banco: ${dbPath}`);
console.log(`[${new Date().toISOString()}] Modo: ${isDryRun ? 'DRY-RUN' : 'APPLY'}`);

let db;
try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  /**
   * Busca todos os usuários que têm bens em posicoes_financeiras
   */
  const buscarUsuariosComBens = () => {
    const query = `
      SELECT DISTINCT usuario_id
      FROM posicoes_financeiras
      WHERE tipo IN ('imovel', 'veiculo')
      ${usuarioIdParam ? 'AND usuario_id = ?' : ''}
      ORDER BY usuario_id
    `;
    const stmt = db.prepare(query);
    const resultado = usuarioIdParam ? stmt.all(usuarioIdParam) : stmt.all();
    return resultado.map(r => r.usuario_id);
  };

  /**
   * Busca bens (imóveis e veículos) de um usuário em posicoes_financeiras
   */
  const buscarBensDoUsuario = (usuarioId) => {
    const query = `
      SELECT
        id, tipo, nome, valor_atual, metadata_json
      FROM posicoes_financeiras
      WHERE usuario_id = ? AND tipo IN ('imovel', 'veiculo')
      ORDER BY tipo, nome
    `;
    const stmt = db.prepare(query);
    return stmt.all(usuarioId);
  };

  /**
   * Busca contexto existente (ou null)
   */
  const buscarContextoExistente = (usuarioId) => {
    const query = `
      SELECT id, contexto_json, atualizado_em
      FROM perfil_contexto_financeiro
      WHERE usuario_id = ?
      LIMIT 1
    `;
    const stmt = db.prepare(query);
    return stmt.get(usuarioId);
  };

  /**
   * Transforma dados de bens para o formato esperado em patrimonioExterno
   */
  const transformarBensParaContexto = (bens) => {
    const imoveis = [];
    const veiculos = [];

    for (const bem of bens) {
      const metadata = JSON.parse(bem.metadata_json || '{}');
      const saldoFinanciamento = Number(metadata.saldoFinanciamento) || 0;

      const item = {
        id: bem.id || uuidv4(),
        tipo: bem.nome || '',
        valorEstimado: Number(bem.valor_atual) || 0,
      };

      if (bem.tipo === 'imovel') {
        imoveis.push({
          ...item,
          saldoFinanciamento,
          geraRenda: false,
        });
      } else if (bem.tipo === 'veiculo') {
        veiculos.push({
          ...item,
          quitado: saldoFinanciamento === 0,
        });
      }
    }

    return { imoveis, veiculos };
  };

  /**
   * Funde patrimonioExterno novo com existente (novo toma precedência)
   */
  const mergerPatrimonioExterno = (existente, novo) => {
    if (!existente) {
      return {
        imoveis: novo.imoveis,
        veiculos: novo.veiculos,
        caixaDisponivel: 0,
        poupanca: 0,
      };
    }

    const existenteParsed = typeof existente === 'string' ? JSON.parse(existente) : existente;
    return {
      imoveis: novo.imoveis.length > 0 ? novo.imoveis : (existenteParsed.imoveis || []),
      veiculos: novo.veiculos.length > 0 ? novo.veiculos : (existenteParsed.veiculos || []),
      caixaDisponivel: existenteParsed.caixaDisponivel || 0,
      poupanca: existenteParsed.poupanca || 0,
    };
  };

  /**
   * Salva ou atualiza contexto para um usuário
   */
  const salvarContexto = (usuarioId, patrimonioExterno, contextoPrevio) => {
    const agora = new Date().toISOString();
    const id = contextoPrevio?.id || `ctx_${usuarioId}`;

    const contextoJson = contextoPrevio?.contexto_json
      ? typeof contextoPrevio.contexto_json === 'string'
        ? JSON.parse(contextoPrevio.contexto_json)
        : contextoPrevio.contexto_json
      : {};

    const contextoBuscado = {
      ...contextoJson,
      patrimonioExterno,
    };

    const query = `
      INSERT INTO perfil_contexto_financeiro (id, usuario_id, contexto_json, atualizado_em)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(usuario_id) DO UPDATE SET
        contexto_json = excluded.contexto_json,
        atualizado_em = excluded.atualizado_em
    `;

    const stmt = db.prepare(query);
    return stmt.run(id, usuarioId, JSON.stringify(contextoBuscado), agora);
  };

  /**
   * Main sync logic
   */
  const sincronizar = () => {
    const usuariosComBens = buscarUsuariosComBens();
    console.log(`\n[${new Date().toISOString()}] Encontrados ${usuariosComBens.length} usuário(s) com bens`);

    let sincronizados = 0;
    let atualizados = 0;
    let erros = 0;

    for (const usuarioId of usuariosComBens) {
      try {
        const bens = buscarBensDoUsuario(usuarioId);
        const contextoPrevio = buscarContextoExistente(usuarioId);
        const bensTranformados = transformarBensParaContexto(bens);
        const patrimonioFinal = mergerPatrimonioExterno(contextoPrevio?.contexto_json, bensTranformados);

        const emAtualiza = !!contextoPrevio;
        console.log(
          `  ${emAtualiza ? '[UPDATE]' : '[INSERT]'} ${usuarioId}` +
          ` — ${bensTranformados.imoveis.length} imóvel(is) + ${bensTranformados.veiculos.length} veículo(s)`
        );

        if (!isDryRun) {
          salvarContexto(usuarioId, patrimonioFinal, contextoPrevio);
          if (emAtualiza) atualizados++;
          else sincronizados++;
        } else {
          sincronizados++;
        }
      } catch (err) {
        console.error(`  [ERRO] ${usuarioId}: ${err.message}`);
        erros++;
      }
    }

    console.log(`\n[${new Date().toISOString()}] Resumo:`);
    console.log(`  Novos registros: ${sincronizados}`);
    console.log(`  Atualizados: ${atualizados}`);
    console.log(`  Erros: ${erros}`);
    console.log(`  Modo: ${isDryRun ? 'DRY-RUN (nenhum dado foi alterado)' : 'APPLY (dados foram sincronizados)'}`);

    if (erros > 0) {
      process.exit(1);
    }
  };

  sincronizar();
} catch (err) {
  console.error(`[ERRO] ${err.message}`);
  process.exit(1);
} finally {
  if (db) db.close();
  console.log(`[${new Date().toISOString()}] Concluído`);
}
