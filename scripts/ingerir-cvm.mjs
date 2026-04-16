#!/usr/bin/env node
/**
 * Script de ingestão CVM → Esquilo Invest (D1 via admin API).
 *
 * Baixa os CSVs do portal Dados Abertos da CVM, parseia e envia em lotes
 * para os endpoints /api/admin/fundos/cvm/ingerir-cotas e ingerir-cadastro.
 *
 * ─── Uso ────────────────────────────────────────────────────────────────────
 *
 *   # Cotas do mês corrente (inf_diario)
 *   EI_ADMIN_TOKEN=<jwt> node scripts/ingerir-cvm.mjs cotas
 *
 *   # Cotas de um mês específico
 *   EI_ADMIN_TOKEN=<jwt> node scripts/ingerir-cvm.mjs cotas 2025-03
 *
 *   # Cadastro de fundos (CAD_FI)
 *   EI_ADMIN_TOKEN=<jwt> node scripts/ingerir-cvm.mjs cadastro
 *
 *   # Ambos
 *   EI_ADMIN_TOKEN=<jwt> node scripts/ingerir-cvm.mjs tudo
 *
 *   # Filtrando somente CNPJs já vinculados (default) ou todos
 *   EI_ADMIN_TOKEN=<jwt> EI_FILTRAR_CNPJS=0 node scripts/ingerir-cvm.mjs cotas
 *
 * ─── Variáveis de ambiente ──────────────────────────────────────────────────
 *
 *   EI_ADMIN_TOKEN   (obrigatório) JWT de admin válido
 *   EI_API_URL       (opcional)    Base URL, default https://ei-api.esquiloinvest.workers.dev
 *   EI_FILTRAR_CNPJS (opcional)    "1" (default) filtra por CNPJs vinculados; "0" ingere tudo
 *
 * ─── Fontes CVM ─────────────────────────────────────────────────────────────
 *
 *   Cotas:    https://dados.cvm.gov.br/dados/FI/DOC/INF_DIARIO/DADOS/inf_diario_fi_YYYYMM.csv
 *   Cadastro: https://dados.cvm.gov.br/dados/FI/CAD/DADOS/cad_fi.csv
 *
 *   Encoding: Latin-1 (ISO-8859-1) com separador ";"
 */

import { createWriteStream, createReadStream, existsSync, mkdirSync, unlinkSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";

// ─── Config ──────────────────────────────────────────────────────────────────

const API_BASE_URL = process.env.EI_API_URL || "https://ei-api.esquiloinvest.workers.dev";
const ADMIN_TOKEN = process.env.EI_ADMIN_TOKEN;
const FILTRAR_CNPJS = (process.env.EI_FILTRAR_CNPJS ?? "1") === "1";
const TAMANHO_LOTE = 4000; // max 5000 no endpoint, margem de segurança
const TMP_DIR = ".tmp-cvm";

if (!ADMIN_TOKEN) {
  console.error("Erro: defina EI_ADMIN_TOKEN (JWT de admin) para executar.");
  process.exit(1);
}

const comando = process.argv[2] ?? "tudo";
if (!["cotas", "cadastro", "tudo"].includes(comando)) {
  console.error(`Uso: node scripts/ingerir-cvm.mjs [cotas|cadastro|tudo] [YYYY-MM]`);
  process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function anoMesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function anoMesSemTraco(anoMes) {
  return anoMes.replace("-", "");
}

/** Normaliza CNPJ para 14 dígitos */
function normalizarCnpj(raw) {
  if (!raw) return null;
  const d = String(raw).replace(/\D/g, "");
  return d.length === 14 ? d : null;
}

async function fetchComRetry(url, opts = {}, tentativas = 3) {
  for (let i = 0; i < tentativas; i++) {
    try {
      const res = await fetch(url, opts);
      return res;
    } catch (err) {
      if (i === tentativas - 1) throw err;
      console.warn(`  Retry ${i + 1}/${tentativas} para ${url}: ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
}

/** POST /api/admin/fundos/cvm/* com retry */
async function postarLote(endpoint, itens) {
  const url = `${API_BASE_URL}${endpoint}`;
  const res = await fetchComRetry(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ADMIN_TOKEN}`,
    },
    body: JSON.stringify({ itens }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.ok) {
    throw new Error(`POST ${endpoint} falhou (${res.status}): ${JSON.stringify(body).slice(0, 300)}`);
  }
  return body.dados;
}

/** Busca CNPJs já vinculados em ativos no D1 */
async function obterCnpjsVinculados() {
  const url = `${API_BASE_URL}/api/admin/fundos/cvm/status`;
  const res = await fetchComRetry(url, {
    headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
  });
  const body = await res.json().catch(() => ({}));
  // Endpoint de status não devolve a lista de CNPJs, mas podemos usar
  // ativos-sem-cnpj para pegar todos vinculados. Alternativa: query direta.
  // Vamos buscar via um endpoint custom ou listar ativos com cnpj.
  // Para simplificar: busca todos os CNPJs únicos via query no status endpoint.
  // Como não temos endpoint que liste, vamos não filtrar se não houver como.
  // Na prática, o D1 batch de 5000 é rápido — filtro é otimização de volume.
  return null; // TODO: implementar quando houver endpoint
}

/**
 * Baixa um arquivo grande para disco (streaming).
 * Retorna o path local.
 */
async function baixarArquivo(url, nomeLocal) {
  if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });
  const destino = `${TMP_DIR}/${nomeLocal}`;
  console.log(`  Baixando ${url}...`);
  const res = await fetchComRetry(url);
  if (!res.ok) throw new Error(`Download falhou (${res.status}): ${url}`);
  const ws = createWriteStream(destino);
  await pipeline(Readable.fromWeb(res.body), ws);
  console.log(`  Salvo em ${destino}`);
  return destino;
}

/**
 * Lê CSV Latin-1 com separador ";", linha a linha.
 * Retorna um async generator de objetos { campo: valor }.
 */
async function* lerCsvLatin1(caminhoLocal, separador = ";") {
  const rl = createInterface({
    input: createReadStream(caminhoLocal, { encoding: "latin1" }),
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

// ─── Ingestão de cotas (inf_diario) ─────────────────────────────────────────

async function ingerirCotas(anoMes) {
  const sufixo = anoMesSemTraco(anoMes);
  const url = `https://dados.cvm.gov.br/dados/FI/DOC/INF_DIARIO/DADOS/inf_diario_fi_${sufixo}.csv`;
  const nomeLocal = `inf_diario_fi_${sufixo}.csv`;

  let caminhoLocal;
  try {
    caminhoLocal = await baixarArquivo(url, nomeLocal);
  } catch (err) {
    console.error(`  Falha ao baixar cotas ${anoMes}: ${err.message}`);
    return;
  }

  let lote = [];
  let totalEnviados = 0;
  let totalLinhas = 0;

  console.log(`  Parseando ${nomeLocal}...`);
  for await (const row of lerCsvLatin1(caminhoLocal)) {
    totalLinhas++;
    // Colunas: antigo CNPJ_FUNDO ou novo CNPJ_FUNDO_CLASSE (CVM mudou ~2026)
    const cnpj = normalizarCnpj(row.CNPJ_FUNDO_CLASSE || row.CNPJ_FUNDO);
    if (!cnpj) continue;

    const vlQuota = parseFloat(row.VL_QUOTA);
    if (!Number.isFinite(vlQuota) || vlQuota <= 0) continue;

    // Data vem no formato DD/MM/YYYY ou YYYY-MM-DD
    let dataRef = row.DT_COMPTC || "";
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataRef)) {
      const [dd, mm, yyyy] = dataRef.split("/");
      dataRef = `${yyyy}-${mm}-${dd}`;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataRef)) continue;

    const item = {
      cnpj,
      dataRef,
      vlQuota,
      vlPatrimLiq: parseFloat(row.VL_PATRIM_LIQ) || undefined,
      nrCotst: parseInt(row.NR_COTST, 10) || undefined,
    };

    lote.push(item);
    if (lote.length >= TAMANHO_LOTE) {
      const resultado = await postarLote("/api/admin/fundos/cvm/ingerir-cotas", lote);
      totalEnviados += resultado.inseridos ?? lote.length;
      process.stdout.write(`\r  ${totalEnviados} cotas enviadas (${totalLinhas} linhas lidas)...`);
      lote = [];
    }
  }

  if (lote.length > 0) {
    const resultado = await postarLote("/api/admin/fundos/cvm/ingerir-cotas", lote);
    totalEnviados += resultado.inseridos ?? lote.length;
  }

  console.log(`\n  Cotas ${anoMes}: ${totalEnviados} inseridas de ${totalLinhas} linhas.`);

  // Limpa arquivo temporário
  try { unlinkSync(caminhoLocal); } catch { /* ok */ }
}

// ─── Ingestão de cadastro (CAD_FI) ──────────────────────────────────────────

async function ingerirCadastro() {
  const url = "https://dados.cvm.gov.br/dados/FI/CAD/DADOS/cad_fi.csv";
  const nomeLocal = "cad_fi.csv";

  let caminhoLocal;
  try {
    caminhoLocal = await baixarArquivo(url, nomeLocal);
  } catch (err) {
    console.error(`  Falha ao baixar cadastro: ${err.message}`);
    return;
  }

  let lote = [];
  let totalEnviados = 0;
  let totalLinhas = 0;

  console.log(`  Parseando ${nomeLocal}...`);
  for await (const row of lerCsvLatin1(caminhoLocal)) {
    totalLinhas++;
    // Colunas esperadas: CNPJ_FUNDO;DENOM_SOCIAL;SIT;CLASSE;...
    const cnpj = normalizarCnpj(row.CNPJ_FUNDO);
    if (!cnpj) continue;

    const denominacaoSocial = row.DENOM_SOCIAL || "";
    if (denominacaoSocial.length < 2) continue;

    const item = {
      cnpj,
      denominacaoSocial,
      classe: row.CLASSE || undefined,
      situacao: row.SIT || undefined,
    };

    lote.push(item);
    if (lote.length >= TAMANHO_LOTE) {
      const resultado = await postarLote("/api/admin/fundos/cvm/ingerir-cadastro", lote);
      totalEnviados += resultado.inseridos ?? lote.length;
      process.stdout.write(`\r  ${totalEnviados} cadastros enviados (${totalLinhas} linhas lidas)...`);
      lote = [];
    }
  }

  if (lote.length > 0) {
    const resultado = await postarLote("/api/admin/fundos/cvm/ingerir-cadastro", lote);
    totalEnviados += resultado.inseridos ?? lote.length;
  }

  console.log(`\n  Cadastro: ${totalEnviados} inseridos de ${totalLinhas} linhas.`);

  try { unlinkSync(caminhoLocal); } catch { /* ok */ }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== Ingestão CVM → Esquilo Invest ===`);
  console.log(`  API: ${API_BASE_URL}`);
  console.log(`  Comando: ${comando}`);
  console.log("");

  if (comando === "cadastro" || comando === "tudo") {
    console.log("[1/2] Cadastro de fundos (CAD_FI)...");
    await ingerirCadastro();
    console.log("");
  }

  if (comando === "cotas" || comando === "tudo") {
    const anoMes = process.argv[3] || anoMesAtual();
    console.log(`[2/2] Cotas diárias (inf_diario ${anoMes})...`);
    await ingerirCotas(anoMes);

    // Se for mês corrente, ingere o mês anterior também (para ter dados completos)
    if (!process.argv[3]) {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      const mesAnterior = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      console.log(`\n  (bônus) Cotas do mês anterior ${mesAnterior}...`);
      await ingerirCotas(mesAnterior);
    }
    console.log("");
  }

  console.log("=== Ingestão concluída ===\n");
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
