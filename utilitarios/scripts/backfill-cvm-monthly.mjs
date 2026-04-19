#!/usr/bin/env node
/**
 * Backfill mensal CVM → Esquilo Invest.
 *
 * Carrega histórico retroativo de cotas de fundos — uma cota por (CNPJ, mês),
 * correspondente ao último dia útil disponível daquele mês. Reaproveita a
 * tabela cotas_fundos_cvm (mesma estrutura da ingestão diária), mantendo
 * compat com obterFechamentosMensais(...). Roda fora do Worker.
 *
 * ─── Fluxo ─────────────────────────────────────────────────────────────────
 *   1. POST /api/admin/cvm/backfill/plan
 *        → backend calcula intervalo e lista de CNPJs a partir de ativos.
 *   2. POST /api/admin/cvm/backfill/runs → abre run (id).
 *   3. Para cada mês do intervalo:
 *        - baixa inf_diario_fi_YYYYMM.csv
 *        - filtra pelos CNPJs alvo
 *        - reduz para 1 linha por CNPJ (maior dataRef do mês)
 *        - POST /api/admin/cvm/backfill/ingest-lote
 *   4. PATCH /api/admin/cvm/backfill/runs/:id → finaliza.
 *
 * ─── Uso ───────────────────────────────────────────────────────────────────
 *   EI_ADMIN_TOKEN=<jwt> npm run backfill:cvm-monthly
 *   EI_ADMIN_TOKEN=<jwt> npm run backfill:cvm-monthly -- --inicio=2021-01 --fim=2024-12
 *   EI_ADMIN_TOKEN=<jwt> npm run backfill:cvm-monthly -- --janela=36 --margem=1
 *   EI_ADMIN_TOKEN=<jwt> npm run backfill:cvm-monthly -- --origem=github_action
 *
 * ─── Variáveis de ambiente ────────────────────────────────────────────────
 *   EI_ADMIN_TOKEN (obrigatório)  Service token de longa duração — deve bater
 *                                 com `ADMIN_TOKEN` do Worker (env). Também
 *                                 aceita JWT admin (mas expira em 8h).
 *   EI_API_URL     (opcional)     Default: https://ei-api.esquiloinvest.workers.dev
 */

import { createWriteStream, createReadStream, existsSync, mkdirSync, unlinkSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";

import { normalizarCnpj, normalizarDataRef, parseLinhaCvm } from "./ingest-cvm-funds.mjs";

const API_BASE_URL = (process.env.EI_API_URL || "https://ei-api.esquiloinvest.workers.dev").replace(/\/$/, "");
const ADMIN_TOKEN = process.env.EI_ADMIN_TOKEN;
const TAMANHO_LOTE = 4000;
const TMP_DIR = ".tmp-cvm";

const args = new Map();
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--")) {
    const [k, v] = a.slice(2).split("=");
    args.set(k, v ?? "true");
  }
}

const ORIGENS_VALIDAS = new Set(["manual", "scheduled", "github_action", "trigger"]);
const origemExecucao = ORIGENS_VALIDAS.has(args.get("origem")) ? args.get("origem") : "manual";

function anoMesSemTraco(am) {
  return am.replace("-", "");
}

async function fetchComRetry(url, opts = {}, tentativas = 3) {
  let lastErr;
  for (let i = 0; i < tentativas; i++) {
    try {
      return await fetch(url, opts);
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  throw lastErr;
}

async function apiJson(path, opts = {}) {
  const res = await fetchComRetry(`${API_BASE_URL}${path}`, {
    ...opts,
    headers: {
      ...(opts.headers ?? {}),
      "content-type": "application/json",
      authorization: `Bearer ${ADMIN_TOKEN}`,
      "x-admin-token": ADMIN_TOKEN,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.ok) {
    throw new Error(`${opts.method || "GET"} ${path} falhou (${res.status}): ${JSON.stringify(body).slice(0, 300)}`);
  }
  return body.dados;
}

async function baixarArquivo(url, nomeLocal) {
  if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });
  const destino = `${TMP_DIR}/${nomeLocal}`;
  const res = await fetchComRetry(url);
  if (!res.ok) throw new Error(`download_${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(destino));
  return destino;
}

async function* lerCsvLatin1(caminho) {
  const rl = createInterface({
    input: createReadStream(caminho, { encoding: "latin1" }),
    crlfDelay: Infinity,
  });
  let cabecalho = null;
  for await (const linha of rl) {
    const trimmed = linha.trim();
    if (!trimmed) continue;
    const campos = trimmed.split(";");
    if (!cabecalho) {
      cabecalho = campos.map((c) => c.trim());
      continue;
    }
    const obj = {};
    for (let i = 0; i < cabecalho.length; i++) obj[cabecalho[i]] = campos[i]?.trim() ?? "";
    yield obj;
  }
}

/**
 * Para um mês, baixa CSV, filtra por CNPJs alvo e devolve um array com uma
 * linha por CNPJ — a do maior dataRef daquele mês (fechamento mensal).
 */
async function processarMes(anoMes, cnpjsAlvo) {
  const sufixo = anoMesSemTraco(anoMes);
  const url = `https://dados.cvm.gov.br/dados/FI/DOC/INF_DIARIO/DADOS/inf_diario_fi_${sufixo}.csv`;
  const nomeLocal = `backfill_${sufixo}.csv`;

  let caminho;
  try {
    caminho = await baixarArquivo(url, nomeLocal);
  } catch (err) {
    return { ok: false, motivo: `download: ${err.message}`, lidos: 0, fechamentos: [] };
  }

  const melhorPorCnpj = new Map(); // cnpj → item
  let lidos = 0;
  let invalidos = 0;

  try {
    for await (const row of lerCsvLatin1(caminho)) {
      lidos += 1;
      const cnpjRaw = row.CNPJ_FUNDO_CLASSE || row.CNPJ_FUNDO;
      const cnpj = normalizarCnpj(cnpjRaw);
      if (!cnpj || !cnpjsAlvo.has(cnpj)) continue;
      const parsed = parseLinhaCvm(row);
      if (!parsed.ok) { invalidos += 1; continue; }
      const atual = melhorPorCnpj.get(cnpj);
      if (!atual || parsed.item.dataRef > atual.dataRef) {
        melhorPorCnpj.set(cnpj, parsed.item);
      }
    }
    return { ok: true, lidos, invalidos, fechamentos: Array.from(melhorPorCnpj.values()) };
  } finally {
    try { unlinkSync(caminho); } catch { /* ok */ }
  }
}

async function postarLoteBackfill(runId, itens, registrosLidosLote) {
  return apiJson("/api/admin/cvm/backfill/ingest-lote", {
    method: "POST",
    body: JSON.stringify({ runId, itens, registrosLidosLote }),
  });
}

async function main() {
  if (!ADMIN_TOKEN) {
    console.error("Erro: defina EI_ADMIN_TOKEN (JWT admin).");
    process.exit(1);
  }

  const intervaloInicial = args.get("inicio");
  const intervaloFinal = args.get("fim");
  const janelaPadraoMeses = args.get("janela") ? Number(args.get("janela")) : undefined;
  const margemMeses = args.get("margem") ? Number(args.get("margem")) : undefined;

  console.log("=== Backfill mensal CVM → EI ===");
  console.log(`  API: ${API_BASE_URL}`);

  // 1. Planner
  const plano = await apiJson("/api/admin/cvm/backfill/plan", {
    method: "POST",
    body: JSON.stringify({ intervaloInicial, intervaloFinal, janelaPadraoMeses, margemMeses }),
  });

  if (plano.cnpjs.length === 0) {
    console.error("Nenhum CNPJ de fundo encontrado em ativos. Vincule fundos primeiro.");
    process.exit(1);
  }

  console.log(`  Intervalo: ${plano.intervaloInicial} → ${plano.intervaloFinal} (${plano.totalMesesPrevistos} meses, origem=${plano.origem})`);
  console.log(`  Fundos alvo: ${plano.cnpjs.length}`);
  console.log(`  Contexto: menorDataAquisicao=${plano.contexto.menorDataAquisicao}`);

  // 2. Abrir run
  const { id: runId } = await apiJson("/api/admin/cvm/backfill/runs", {
    method: "POST",
    body: JSON.stringify({
      intervaloInicial: plano.intervaloInicial,
      intervaloFinal: plano.intervaloFinal,
      totalMesesPrevistos: plano.totalMesesPrevistos,
      totalFundos: plano.cnpjs.length,
      origemExecucao,
    }),
  });
  console.log(`  runId=${runId}`);

  const cnpjsSet = new Set(plano.cnpjs);
  let totalMesesProcessados = 0;
  let totalGravados = 0;
  let totalInvalidos = 0;
  let totalLidos = 0;
  let erroFinal = null;

  try {
    for (const mes of plano.meses) {
      process.stdout.write(`\n  → ${mes}: `);
      const resultado = await processarMes(mes, cnpjsSet);
      totalLidos += resultado.lidos;
      totalInvalidos += resultado.invalidos ?? 0;
      if (!resultado.ok) {
        console.warn(`  ${mes} pulado (${resultado.motivo})`);
        continue;
      }
      totalMesesProcessados += 1;
      process.stdout.write(`lidos=${resultado.lidos} fechamentos=${resultado.fechamentos.length}`);

      // Envia em lotes — para muitos CNPJs pode passar de 5000.
      for (let i = 0; i < resultado.fechamentos.length; i += TAMANHO_LOTE) {
        const slice = resultado.fechamentos.slice(i, i + TAMANHO_LOTE);
        const registrosLidosLote = i === 0 ? resultado.lidos : 0;
        const r = await postarLoteBackfill(runId, slice, registrosLidosLote);
        totalGravados += Number(r.gravados ?? slice.length);
      }
    }

    await apiJson(`/api/admin/cvm/backfill/runs/${runId}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "completed",
        totalMesesProcessados,
        finalizar: true,
      }),
    });
  } catch (err) {
    erroFinal = err;
    await apiJson(`/api/admin/cvm/backfill/runs/${runId}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "failed",
        totalMesesProcessados,
        erroResumo: String(err.message).slice(0, 500),
        finalizar: true,
      }),
    }).catch(() => { /* ignora erro ao fechar */ });
  }

  console.log("\n\n=== Resumo ===");
  console.log(JSON.stringify({
    runId,
    intervaloInicial: plano.intervaloInicial,
    intervaloFinal: plano.intervaloFinal,
    totalMesesPrevistos: plano.totalMesesPrevistos,
    totalMesesProcessados,
    totalFundos: plano.cnpjs.length,
    totalLidos,
    totalGravados,
    totalInvalidos,
    erro: erroFinal ? String(erroFinal.message) : null,
  }, null, 2));

  process.exit(erroFinal ? 1 : 0);
}

if (process.argv[1]?.endsWith("backfill-cvm-monthly.mjs")) {
  main().catch((err) => {
    console.error("Erro fatal:", err);
    process.exit(1);
  });
}
