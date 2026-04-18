#!/usr/bin/env node
/**
 * Ingestão direta CVM → D1 via wrangler d1 execute.
 * Baixa o ZIP da CVM, extrai o CSV, filtra pelos CNPJs e insere via SQL.
 *
 * Uso:
 *   node scripts/ingerir-cvm-direto.mjs [YYYY-MM] [YYYY-MM] ...
 *   (sem argumentos = mês corrente + mês anterior)
 */

import {
  createWriteStream,
  createReadStream,
  existsSync,
  mkdirSync,
  unlinkSync,
  writeFileSync,
  readdirSync,
} from "node:fs";
import { pipeline } from "node:stream/promises";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { execSync } from "node:child_process";

const TMP_DIR = ".tmp-cvm";
const CNPJS_ALVO = new Set([
  "42229399000127", // Kinea Andes Prev RF CP
  "17454259000105", // Verde AM Patrimonio
  "21470989000177", // Absolute Vertex FIC FIM
  "12831360000114", // SPX Nimitz Feeder FIC FIM
]);

function normalizarCnpj(raw) {
  if (!raw) return null;
  const d = String(raw).replace(/\D/g, "");
  return d.length === 14 ? d : null;
}

function anoMesSemTraco(am) {
  return am.replace("-", "");
}

async function baixarArquivo(url, nomeLocal) {
  if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });
  const dest = `${TMP_DIR}/${nomeLocal}`;
  if (existsSync(dest)) {
    console.log(`  Cache: ${dest}`);
    return dest;
  }
  console.log(`  Baixando ${url}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download falhou (${res.status}): ${url}`);
  const ws = createWriteStream(dest);
  await pipeline(Readable.fromWeb(res.body), ws);
  console.log(`  Salvo: ${dest}`);
  return dest;
}

function descompactarZip(zipPath) {
  // Usa unzip do sistema (disponível em Windows/WSL e Linux)
  const outDir = `${TMP_DIR}/extracted`;
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  try {
    // Tenta PowerShell (Windows nativo)
    execSync(
      `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outDir}' -Force"`,
      { stdio: "pipe", timeout: 120_000 },
    );
  } catch {
    // Fallback: unzip (WSL/Linux)
    execSync(`unzip -o "${zipPath}" -d "${outDir}"`, {
      stdio: "pipe",
      timeout: 120_000,
    });
  }
  // Encontra o CSV extraído
  const arquivos = readdirSync(outDir).filter((f) => f.endsWith(".csv"));
  if (arquivos.length === 0) throw new Error("Nenhum CSV encontrado no ZIP");
  return `${outDir}/${arquivos[0]}`;
}

async function processarMes(anoMes) {
  const sufixo = anoMesSemTraco(anoMes);
  const url = `https://dados.cvm.gov.br/dados/FI/DOC/INF_DIARIO/DADOS/inf_diario_fi_${sufixo}.zip`;
  const nomeLocal = `inf_diario_fi_${sufixo}.zip`;

  let zipPath;
  try {
    zipPath = await baixarArquivo(url, nomeLocal);
  } catch (err) {
    console.error(`  Falha download ${anoMes}: ${err.message}`);
    return 0;
  }

  console.log(`  Descompactando...`);
  let csvPath;
  try {
    csvPath = descompactarZip(zipPath);
  } catch (err) {
    console.error(`  Falha unzip ${anoMes}: ${err.message}`);
    return 0;
  }

  const rl = createInterface({
    input: createReadStream(csvPath, { encoding: "latin1" }),
    crlfDelay: Infinity,
  });

  let cabecalho = null;
  const linhasFiltradas = [];

  for await (const linha of rl) {
    const trimmed = linha.trim();
    if (!trimmed) continue;
    const campos = trimmed.split(";");
    if (!cabecalho) {
      cabecalho = campos.map((c) => c.trim());
      continue;
    }
    const obj = {};
    for (let i = 0; i < cabecalho.length; i++) {
      obj[cabecalho[i]] = campos[i]?.trim() ?? "";
    }

    // Suporta tanto o formato antigo (CNPJ_FUNDO) quanto o novo (CNPJ_FUNDO_CLASSE)
    const cnpj = normalizarCnpj(obj.CNPJ_FUNDO_CLASSE || obj.CNPJ_FUNDO);
    if (!cnpj || !CNPJS_ALVO.has(cnpj)) continue;

    const vlQuota = parseFloat(obj.VL_QUOTA);
    if (!Number.isFinite(vlQuota) || vlQuota <= 0) continue;

    let dataRef = obj.DT_COMPTC || "";
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataRef)) {
      const [dd, mm, yyyy] = dataRef.split("/");
      dataRef = `${yyyy}-${mm}-${dd}`;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataRef)) continue;

    const vlPatrimLiq = parseFloat(obj.VL_PATRIM_LIQ) || null;
    const nrCotst = parseInt(obj.NR_COTST, 10) || null;

    linhasFiltradas.push({ cnpj, dataRef, vlQuota, vlPatrimLiq, nrCotst });
  }

  console.log(
    `  ${anoMes}: ${linhasFiltradas.length} cotas para ${CNPJS_ALVO.size} CNPJs.`,
  );

  if (linhasFiltradas.length === 0) return 0;

  // Insere via wrangler em lotes de 400 (seguro para D1 batch)
  const BATCH = 400;
  let totalInseridos = 0;

  for (let i = 0; i < linhasFiltradas.length; i += BATCH) {
    const lote = linhasFiltradas.slice(i, i + BATCH);
    const sqlLines = lote.map((r) => {
      const vlPL = r.vlPatrimLiq !== null ? r.vlPatrimLiq : "NULL";
      const nr = r.nrCotst !== null ? r.nrCotst : "NULL";
      return `INSERT INTO cotas_fundos_cvm (cnpj, data_ref, vl_quota, vl_patrim_liq, nr_cotst, atualizado_em) VALUES ('${r.cnpj}', '${r.dataRef}', ${r.vlQuota}, ${vlPL}, ${nr}, datetime('now')) ON CONFLICT(cnpj, data_ref) DO UPDATE SET vl_quota = excluded.vl_quota, vl_patrim_liq = excluded.vl_patrim_liq, nr_cotst = excluded.nr_cotst, atualizado_em = excluded.atualizado_em;`;
    });
    const sqlFile = `${TMP_DIR}/batch_${sufixo}_${i}.sql`;
    writeFileSync(sqlFile, sqlLines.join("\n"), "utf8");

    try {
      const cmd = `cd apps/api && npx wrangler d1 execute DB --remote --file ../../${sqlFile}`;
      console.log(
        `  Batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(linhasFiltradas.length / BATCH)} (${lote.length} linhas)...`,
      );
      execSync(cmd, { stdio: "pipe", timeout: 120_000 });
      totalInseridos += lote.length;
    } catch (err) {
      console.error(`  Erro batch: ${err.stderr?.toString().slice(0, 200) || err.message?.slice(0, 200)}`);
    }

    try {
      unlinkSync(sqlFile);
    } catch {
      /* ok */
    }
  }

  // Limpa CSV extraído (mantém ZIP como cache)
  try {
    unlinkSync(csvPath);
  } catch {
    /* ok */
  }

  return totalInseridos;
}

// Main
async function main() {
  let meses = process.argv.slice(2);
  if (meses.length === 0) {
    const agora = new Date();
    const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
    const ant = new Date(agora);
    ant.setMonth(ant.getMonth() - 1);
    const mesAnterior = `${ant.getFullYear()}-${String(ant.getMonth() + 1).padStart(2, "0")}`;
    meses = [mesAnterior, mesAtual];
  }

  console.log(`\n=== Ingestão CVM → D1 (wrangler) ===`);
  console.log(`  CNPJs: ${[...CNPJS_ALVO].join(", ")}`);
  console.log(`  Meses: ${meses.join(", ")}\n`);

  let total = 0;
  for (const mes of meses) {
    total += await processarMes(mes);
  }

  console.log(`\nTotal: ${total} cotas inseridas.\n`);
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
