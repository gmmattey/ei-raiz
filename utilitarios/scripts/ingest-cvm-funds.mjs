#!/usr/bin/env node
/**
 * Ingestão diária CVM → Esquilo Invest (D1 via admin API).
 *
 * Roda fora do Worker. Baixa o CSV de informes diários da CVM, parseia em
 * streaming, envia em lotes para o endpoint admin e mantém um run operacional
 * em `cvm_ingestion_runs` para que o painel mostre freshness real.
 *
 * ─── Uso ────────────────────────────────────────────────────────────────────
 *
 *   # Mês corrente + fallback p/ mês anterior (uso padrão do cron)
 *   EI_ADMIN_TOKEN=<jwt> node utilitarios/scripts/ingest-cvm-funds.mjs
 *
 *   # Mês específico
 *   EI_ADMIN_TOKEN=<jwt> node utilitarios/scripts/ingest-cvm-funds.mjs --mes=2026-03
 *
 *   # Rotular origem da execução (manual|scheduled|github_action|trigger)
 *   EI_ADMIN_TOKEN=<jwt> node utilitarios/scripts/ingest-cvm-funds.mjs --origem=github_action
 *
 *   # Sem fallback para mês anterior
 *   EI_ADMIN_TOKEN=<jwt> node utilitarios/scripts/ingest-cvm-funds.mjs --sem-fallback
 *
 * Comando npm equivalente:  npm run ingest:cvm
 *
 * ─── Variáveis de ambiente ──────────────────────────────────────────────────
 *
 *   EI_ADMIN_TOKEN (obrigatório) Service token de longa duração — deve bater
 *                                com `ADMIN_TOKEN` do Worker (env). Também
 *                                aceita JWT admin (expira em 8h, não serve
 *                                para cron).
 *   EI_API_URL     (opcional)    Default: https://ei-api-gateway.giammattey-luiz.workers.dev
 *   EI_ORIGEM      (opcional)    Alternativa a --origem
 *
 * Exit codes: 0 sucesso, 1 falha crítica, 2 sucesso parcial (fallback falhou).
 */

import { createWriteStream, createReadStream, existsSync, mkdirSync, unlinkSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { execFileSync } from "node:child_process";
import { dirname } from "node:path";

// ─── Config ──────────────────────────────────────────────────────────────────

const API_BASE_URL = (process.env.EI_API_URL || "https://ei-api-gateway.giammattey-luiz.workers.dev").replace(/\/$/, "");
const ADMIN_TOKEN = process.env.EI_ADMIN_TOKEN;
const TAMANHO_LOTE = 4000; // endpoint aceita até 5000, deixa margem
const TMP_DIR = ".tmp-cvm";

const args = new Map();
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--")) {
    const [chave, valor] = a.slice(2).split("=");
    args.set(chave, valor ?? "true");
  }
}

const mesArg = args.get("mes");
const origemArg = args.get("origem") || process.env.EI_ORIGEM || "manual";
const semFallback = args.get("sem-fallback") === "true";

const ORIGENS_VALIDAS = new Set(["manual", "scheduled", "github_action", "trigger"]);
const origemExecucao = ORIGENS_VALIDAS.has(origemArg) ? origemArg : "manual";

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function normalizarCnpj(raw) {
  if (!raw) return null;
  const digitos = String(raw).replace(/\D/g, "");
  return digitos.length === 14 ? digitos : null;
}

export function normalizarDataRef(raw) {
  if (!raw) return null;
  const texto = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

export function parseLinhaCvm(row) {
  const cnpj = normalizarCnpj(row.CNPJ_FUNDO_CLASSE || row.CNPJ_FUNDO);
  if (!cnpj) return { ok: false, motivo: "cnpj_invalido" };

  const dataRef = normalizarDataRef(row.DT_COMPTC);
  if (!dataRef) return { ok: false, motivo: "data_invalida" };

  const vlQuotaNum = Number.parseFloat(String(row.VL_QUOTA).replace(",", "."));
  if (!Number.isFinite(vlQuotaNum) || vlQuotaNum <= 0) return { ok: false, motivo: "vl_quota_invalido" };

  const vlPatrimLiqNum = Number.parseFloat(String(row.VL_PATRIM_LIQ ?? "").replace(",", "."));
  const nrCotstNum = Number.parseInt(String(row.NR_COTST ?? ""), 10);

  return {
    ok: true,
    item: {
      cnpj,
      dataRef,
      vlQuota: vlQuotaNum,
      vlPatrimLiq: Number.isFinite(vlPatrimLiqNum) ? vlPatrimLiqNum : undefined,
      nrCotst: Number.isFinite(nrCotstNum) ? nrCotstNum : undefined,
    },
  };
}

function anoMesAtualUtc() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function mesAnterior(anoMes) {
  const [ano, mes] = anoMes.split("-").map(Number);
  const d = new Date(Date.UTC(ano, mes - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function anoMesSemTraco(anoMes) {
  return anoMes.replace("-", "");
}

async function fetchComRetry(url, opts = {}, tentativas = 3) {
  let lastErr;
  for (let i = 0; i < tentativas; i++) {
    try {
      return await fetch(url, opts);
    } catch (err) {
      lastErr = err;
      console.warn(`  Retry ${i + 1}/${tentativas} em ${url}: ${err.message}`);
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

async function abrirRun(referenciaAnoMes) {
  const dados = await apiJson("/api/admin/cvm/runs", {
    method: "POST",
    body: JSON.stringify({ referenciaAnoMes, origemExecucao }),
  });
  return dados.id;
}

async function atualizarRun(runId, patch) {
  return apiJson(`/api/admin/cvm/runs/${runId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

async function postarLoteCotas(runId, itens) {
  const dados = await apiJson("/api/admin/fundos/cvm/ingerir-cotas", {
    method: "POST",
    body: JSON.stringify({ itens, runId }),
  });
  return dados;
}

async function baixarArquivo(url, nomeLocal) {
  if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });
  const destino = `${TMP_DIR}/${nomeLocal}`;
  console.log(`  Baixando ${url}`);
  // Usa curl em vez de fetch para downloads: o undici do Node 20 tem falhas
  // intermitentes (`fetch failed`) com o portal da CVM em runners do GitHub,
  // mesmo quando o recurso responde 200 para curl. Mantém retry/TLS padrão.
  try {
    execFileSync(
      "curl",
      [
        "-sSfL",
        "--retry", "3",
        "--retry-delay", "2",
        "--connect-timeout", "30",
        "--max-time", "300",
        "-A", "Mozilla/5.0 (compatible; EsquiloInvestBot/1.0)",
        "-o", destino,
        url,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
  } catch (err) {
    throw new Error(`download_falhou: ${err.stderr?.toString?.() || err.message}`);
  }
  console.log(`  Salvo em ${destino}`);
  return destino;
}

/**
 * Baixa o .zip da CVM e extrai o CSV esperado. A CVM distribui os informes
 * diários em ZIP desde 2026 — cada arquivo contém um único CSV com o mesmo
 * nome-base. Requer `unzip` no PATH (disponível por padrão em Linux/Mac e em
 * Git Bash no Windows).
 */
async function baixarEExtrairCsv(urlZip, csvEsperado) {
  if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });
  const nomeZip = csvEsperado.replace(/\.csv$/, ".zip");
  const zipLocal = await baixarArquivo(urlZip, nomeZip);
  execFileSync("unzip", ["-o", zipLocal, "-d", TMP_DIR], { stdio: "pipe" });
  const csvLocal = `${TMP_DIR}/${csvEsperado}`;
  if (!existsSync(csvLocal)) {
    throw new Error(`csv_nao_encontrado_no_zip: ${csvEsperado}`);
  }
  try { unlinkSync(zipLocal); } catch { /* ok */ }
  return csvLocal;
}

async function* lerCsvLatin1(caminho, separador = ";") {
  const rl = createInterface({
    input: createReadStream(caminho, { encoding: "latin1" }),
    crlfDelay: Infinity,
  });
  let cabecalho = null;
  for await (const linha of rl) {
    const trimmed = linha.trim();
    if (!trimmed) continue;
    const campos = trimmed.split(separador);
    if (!cabecalho) {
      cabecalho = campos.map((c) => c.trim());
      continue;
    }
    const obj = {};
    for (let i = 0; i < cabecalho.length; i++) {
      obj[cabecalho[i]] = campos[i]?.trim() ?? "";
    }
    yield obj;
  }
}

// ─── Pipeline por mês ────────────────────────────────────────────────────────

async function ingerirMes(anoMes) {
  const sufixo = anoMesSemTraco(anoMes);
  const url = `https://dados.cvm.gov.br/dados/FI/DOC/INF_DIARIO/DADOS/inf_diario_fi_${sufixo}.zip`;
  const csvEsperado = `inf_diario_fi_${sufixo}.csv`;

  console.log(`\n▶ Ingestão CVM ${anoMes} (origem=${origemExecucao})`);

  const runId = await abrirRun(anoMes);
  console.log(`  runId=${runId}`);

  let caminhoLocal;
  try {
    caminhoLocal = await baixarEExtrairCsv(url, csvEsperado);
  } catch (err) {
    console.error(`  Falha no download: ${err.message}`);
    await atualizarRun(runId, {
      status: "failed",
      erroResumo: `download: ${err.message}`.slice(0, 500),
      finalizar: true,
    });
    return { ok: false, runId, motivo: "download" };
  }

  let lote = [];
  let totalLidos = 0;
  let totalValidos = 0;
  let totalInvalidos = 0;
  let acumuladoEnviados = 0;

  try {
    for await (const row of lerCsvLatin1(caminhoLocal)) {
      totalLidos += 1;
      const parsed = parseLinhaCvm(row);
      if (!parsed.ok) { totalInvalidos += 1; continue; }
      lote.push(parsed.item);
      if (lote.length >= TAMANHO_LOTE) {
        const r = await postarLoteCotas(runId, lote);
        totalValidos += Number(r.inseridos ?? lote.length);
        totalInvalidos += Number(r.invalidos ?? 0);
        acumuladoEnviados += lote.length;
        process.stdout.write(`\r  ${acumuladoEnviados} cotas enviadas (${totalLidos} linhas lidas)…`);
        lote = [];
      }
    }
    if (lote.length > 0) {
      const r = await postarLoteCotas(runId, lote);
      totalValidos += Number(r.inseridos ?? lote.length);
      totalInvalidos += Number(r.invalidos ?? 0);
      acumuladoEnviados += lote.length;
      lote = [];
    }

    await atualizarRun(runId, {
      status: "completed",
      arquivosProcessados: 1,
      registrosLidos: totalLidos,
      registrosValidos: totalValidos,
      registrosInvalidos: totalInvalidos,
      finalizar: true,
    });

    console.log(
      `\n  ✔ ${anoMes}: lidos=${totalLidos} válidos=${totalValidos} inválidos=${totalInvalidos}`,
    );
    return { ok: true, runId, totalLidos, totalValidos, totalInvalidos };
  } catch (err) {
    console.error(`\n  ✖ Falha na ingestão ${anoMes}: ${err.message}`);
    await atualizarRun(runId, {
      status: "failed",
      arquivosProcessados: 1,
      registrosLidos: totalLidos,
      registrosValidos: totalValidos,
      registrosInvalidos: totalInvalidos,
      erroResumo: `${err.message}`.slice(0, 500),
      finalizar: true,
    });
    return { ok: false, runId, motivo: "processamento", erro: err.message };
  } finally {
    try { unlinkSync(caminhoLocal); } catch { /* ok */ }
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!ADMIN_TOKEN) {
    console.error("Erro: defina EI_ADMIN_TOKEN (JWT de admin) para executar.");
    process.exit(1);
  }
  const alvoPrimario = mesArg || anoMesAtualUtc();
  console.log(`=== Ingestão CVM Funds → ${API_BASE_URL} ===`);
  console.log(`  mês primário: ${alvoPrimario}`);

  const resultadoPrincipal = await ingerirMes(alvoPrimario);

  // Fallback: se mês atual ainda não tem arquivo (CVM publica com D+1), tenta o anterior.
  let resultadoFallback = null;
  if (!semFallback && !mesArg && !resultadoPrincipal.ok && resultadoPrincipal.motivo === "download") {
    const anterior = mesAnterior(alvoPrimario);
    console.log(`\n↩ Fallback para mês anterior: ${anterior}`);
    resultadoFallback = await ingerirMes(anterior);
  }

  console.log("\n=== Resumo ===");
  console.log(JSON.stringify({ primario: resultadoPrincipal, fallback: resultadoFallback }, null, 2));

  if (resultadoPrincipal.ok) process.exit(0);
  if (resultadoFallback?.ok) process.exit(2);
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("ingest-cvm-funds.mjs")) {
  main().catch((err) => {
    console.error("Erro fatal:", err);
    process.exit(1);
  });
}
