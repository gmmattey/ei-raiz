import { recordOperationLog } from '../core-api/runtime/audit'

// ── CVM Pipeline: Cotacoes Automaticas de Fundos ──────────────────────────
// Spec: docs/SPEC_CVM_PIPELINE.md
// Zero external dependencies — uses Web APIs native to Cloudflare Workers.

// ── Constants ──────────────────────────────────────────────────────────────

export const CVM_INFORME_BASE =
  'https://dados.cvm.gov.br/dados/FI/DOC/INF_DIARIO/DADOS'

export const CVM_CADASTRO_URL =
  'https://dados.cvm.gov.br/dados/FI/CAD/DADOS/cad_fi.csv'

// ── decodeLatin1 ───────────────────────────────────────────────────────────
// Workers does NOT support TextDecoder('latin1'). ISO-8859-1 maps bytes
// 0x00-0xFF directly to Unicode code points U+0000-U+00FF, so
// String.fromCharCode is correct by definition.
// Process in chunks of 8192 to avoid call stack limits on large arrays.

export function decodeLatin1(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunks: string[] = []
  for (let i = 0; i < bytes.length; i += 8192) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + 8192)))
  }
  return chunks.join('')
}

// ── parseZipHeader ─────────────────────────────────────────────────────────
// Reads the ZIP local file header to find where the raw DEFLATE stream
// starts. The CVM ZIP is trivial: single file, DEFLATE, no encryption.

export function parseZipHeader(buffer: ArrayBuffer): {
  dataOffset: number
  compressedSize: number
} {
  const view = new DataView(buffer)

  if (buffer.byteLength < 30) {
    throw new Error('ZIP: file too small for local file header')
  }

  const magic = view.getUint32(0, true)
  if (magic !== 0x04034b50) {
    throw new Error(
      `ZIP: invalid magic bytes (expected 0x04034b50, got 0x${magic.toString(16)})`,
    )
  }

  const compressionMethod = view.getUint16(8, true)
  if (compressionMethod !== 8) {
    throw new Error(
      `ZIP: unsupported compression method ${compressionMethod} (expected 8 = DEFLATE)`,
    )
  }

  const compressedSize = view.getUint32(18, true)
  const filenameLength = view.getUint16(26, true)
  const extraLength = view.getUint16(28, true)
  const dataOffset = 30 + filenameLength + extraLength

  return { dataOffset, compressedSize }
}

// ── createLineSplitter ─────────────────────────────────────────────────────
// A TransformStream that buffers text chunks and emits complete lines
// (split on \n). Handles \r\n by trimming \r from line ends.

export function createLineSplitter(): TransformStream<string, string> {
  let buffer = ''

  return new TransformStream<string, string>({
    transform(chunk, controller) {
      buffer += chunk
      const lines = buffer.split('\n')
      buffer = lines.pop()!
      for (const line of lines) {
        controller.enqueue(line.endsWith('\r') ? line.slice(0, -1) : line)
      }
    },
    flush(controller) {
      if (buffer.length > 0) {
        controller.enqueue(
          buffer.endsWith('\r') ? buffer.slice(0, -1) : buffer,
        )
      }
    },
  })
}

// ── streamParseCsvFromZip ──────────────────────────────────────────────────
// Stream-parses the CVM informe diario ZIP. Filters only CNPJs in the
// provided set and keeps the latest date's quota per CNPJ.

export async function streamParseCsvFromZip(
  zipBuffer: ArrayBuffer,
  cnpjSet: Set<string>,
): Promise<Map<string, { date: string; quota: number }>> {
  const { dataOffset, compressedSize } = parseZipHeader(zipBuffer)
  const deflateSlice = zipBuffer.slice(dataOffset, dataOffset + compressedSize)

  const compressedStream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(deflateSlice))
      controller.close()
    },
  })

  const lineStream = compressedStream
    .pipeThrough(new DecompressionStream('deflate-raw'))
    .pipeThrough(new TextDecoderStream('utf-8'))
    .pipeThrough(createLineSplitter())

  const results = new Map<string, { date: string; quota: number }>()
  const reader = lineStream.getReader()
  let isFirstLine = true

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break

    if (isFirstLine) {
      isFirstLine = false
      continue
    }

    const line = value
    if (line.length === 0) continue

    const cols = line.split(';')
    const cnpj = cols[1]
    if (!cnpj || !cnpjSet.has(cnpj)) continue

    const quotaStr = cols[5]
    if (!quotaStr) continue
    const quota = parseFloat(quotaStr)
    if (!(quota > 0)) continue

    const date = cols[3]
    if (!date) continue

    const existing = results.get(cnpj)
    if (!existing || date > existing.date) {
      results.set(cnpj, { date, quota })
    }
  }

  return results
}

// ── refreshCvmQuotes ───────────────────────────────────────────────────────

export async function refreshCvmQuotes(db: D1Database): Promise<void> {
  const tickersResult = await db
    .prepare(
      `SELECT DISTINCT ticker FROM assets
       WHERE quote_source = 'CVM'
         AND status IN ('active', 'redeeming')
         AND ticker IS NOT NULL`,
    )
    .all<{ ticker: string }>()

  if (tickersResult.results.length === 0) {
    console.log('CVM quotes: no CVM assets found, skipping')
    await recordOperationLog(db, {
      operationType: 'cron_cvm_quotes',
      status: 'skipped',
      triggerSource: 'scheduled',
      summary: { trackedTickers: 0, refreshedTickers: 0 },
    })
    return
  }

  const cnpjSet = new Set(tickersResult.results.map((row) => row.ticker))
  console.log(`CVM quotes: refreshing ${cnpjSet.size} CNPJs`)

  const now = new Date()
  const yyyy = now.getUTCFullYear().toString()
  const mm = (now.getUTCMonth() + 1).toString().padStart(2, '0')
  const yyyymm = yyyy + mm
  const zipUrl = `${CVM_INFORME_BASE}/inf_diario_fi_${yyyymm}.zip`

  let resp: Response
  try {
    resp = await fetch(zipUrl)
  } catch (err) {
    console.log(`CVM quotes: fetch failed for ${zipUrl}`, err)
    await recordOperationLog(db, {
      operationType: 'cron_cvm_quotes',
      status: 'failed',
      triggerSource: 'scheduled',
      summary: { trackedTickers: cnpjSet.size },
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    return
  }

  if (!resp.ok) {
    console.log(`CVM quotes: HTTP ${resp.status} for ${zipUrl}`)
    await recordOperationLog(db, {
      operationType: 'cron_cvm_quotes',
      status: 'failed',
      triggerSource: 'scheduled',
      summary: { trackedTickers: cnpjSet.size },
      errorMessage: `HTTP ${resp.status}`,
    })
    return
  }

  const zipBuffer = await resp.arrayBuffer()

  let quotes: Map<string, { date: string; quota: number }>
  try {
    quotes = await streamParseCsvFromZip(zipBuffer, cnpjSet)
  } catch (err) {
    console.log('CVM quotes: ZIP parse error', err)
    await recordOperationLog(db, {
      operationType: 'cron_cvm_quotes',
      status: 'failed',
      triggerSource: 'scheduled',
      summary: { trackedTickers: cnpjSet.size },
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    return
  }

  if (quotes.size === 0) {
    console.log('CVM quotes: no matching quotes found in ZIP')
    await recordOperationLog(db, {
      operationType: 'cron_cvm_quotes',
      status: 'skipped',
      triggerSource: 'scheduled',
      summary: { trackedTickers: cnpjSet.size, refreshedTickers: 0 },
    })
    return
  }

  const stmts: D1PreparedStatement[] = []
  for (const [cnpj, { quota }] of quotes) {
    stmts.push(
      db.prepare(
        `INSERT INTO quotes_cache (ticker, price, fetched_at)
         VALUES (?, ?, datetime('now'))
         ON CONFLICT(ticker) DO UPDATE
           SET price = excluded.price, fetched_at = excluded.fetched_at`,
      ).bind(cnpj, quota),
    )
  }

  await db.batch(stmts)
  console.log(`CVM quotes: upserted ${quotes.size} quotes`)
  await recordOperationLog(db, {
    operationType: 'cron_cvm_quotes',
    status: 'completed',
    triggerSource: 'scheduled',
    summary: { trackedTickers: cnpjSet.size, refreshedTickers: quotes.size },
  })
}

// ── refreshCvmFundsCache ───────────────────────────────────────────────────

export async function refreshCvmFundsCache(db: D1Database): Promise<void> {
  console.log('CVM funds cache: starting refresh')

  let resp: Response
  try {
    resp = await fetch(CVM_CADASTRO_URL)
  } catch (err) {
    console.log(`CVM funds cache: fetch failed for ${CVM_CADASTRO_URL}`, err)
    await recordOperationLog(db, {
      operationType: 'cron_cvm_catalog',
      status: 'failed',
      triggerSource: 'scheduled',
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    return
  }

  if (!resp.ok) {
    console.log(`CVM funds cache: HTTP ${resp.status}`)
    await recordOperationLog(db, {
      operationType: 'cron_cvm_catalog',
      status: 'failed',
      triggerSource: 'scheduled',
      errorMessage: `HTTP ${resp.status}`,
    })
    return
  }

  const buffer = await resp.arrayBuffer()
  const text = decodeLatin1(buffer)
  const lines = text.split('\n')

  if (lines.length < 2) {
    console.log('CVM funds cache: CSV too short')
    await recordOperationLog(db, {
      operationType: 'cron_cvm_catalog',
      status: 'skipped',
      triggerSource: 'scheduled',
      summary: { parsedFunds: 0 },
    })
    return
  }

  type FundRow = {
    cnpj: string
    denom_social: string
    classe: string
    classe_anbima: string
    gestor: string
    admin: string
    fundo_cotas: string
    rentab_fundo: string
    vl_patrim_liq: number | null
  }

  const funds: FundRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.length === 0) continue

    const cols = line.split(';')
    const sit = cols[7]
    if (sit !== 'EM FUNCIONAMENTO NORMAL') continue

    const vlPatrimStr = cols[25]
    const vlPatrimLiq = vlPatrimStr ? parseFloat(vlPatrimStr) : null

    funds.push({
      cnpj: cols[1] ?? '',
      denom_social: cols[2] ?? '',
      classe: cols[12] ?? '',
      classe_anbima: cols[40] ?? '',
      gestor: cols[32] ?? '',
      admin: cols[29] ?? '',
      fundo_cotas: cols[16] ?? '',
      rentab_fundo: cols[14] ?? '',
      vl_patrim_liq: vlPatrimLiq !== null && !Number.isNaN(vlPatrimLiq) ? vlPatrimLiq : null,
    })
  }

  console.log(`CVM funds cache: ${funds.length} active funds parsed`)

  if (funds.length === 0) {
    console.log('CVM funds cache: no funds to insert, aborting')
    await recordOperationLog(db, {
      operationType: 'cron_cvm_catalog',
      status: 'skipped',
      triggerSource: 'scheduled',
      summary: { parsedFunds: 0 },
    })
    return
  }

  const deleteStmt = db.prepare('DELETE FROM cvm_funds_cache')
  const rowsPerInsert = 11
  const maxStmtsPerBatch = 999
  const allInsertStmts: D1PreparedStatement[] = []

  for (let i = 0; i < funds.length; i += rowsPerInsert) {
    const chunk = funds.slice(i, i + rowsPerInsert)

    const valuePlaceholders = chunk
      .map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))')
      .join(', ')

    const sql = `INSERT INTO cvm_funds_cache
      (cnpj, denom_social, classe, classe_anbima, gestor, admin, fundo_cotas, rentab_fundo, vl_patrim_liq, fetched_at)
      VALUES ${valuePlaceholders}`

    const bindings: (string | number | null)[] = []
    for (const fund of chunk) {
      bindings.push(
        fund.cnpj,
        fund.denom_social,
        fund.classe,
        fund.classe_anbima,
        fund.gestor,
        fund.admin,
        fund.fundo_cotas,
        fund.rentab_fundo,
        fund.vl_patrim_liq,
      )
    }

    allInsertStmts.push(db.prepare(sql).bind(...bindings))
  }

  console.log(`CVM funds cache: ${allInsertStmts.length} INSERT statements to execute`)

  const firstBatchSize = Math.min(allInsertStmts.length, maxStmtsPerBatch)
  const firstBatch = [deleteStmt, ...allInsertStmts.slice(0, firstBatchSize)]
  await db.batch(firstBatch)

  let offset = firstBatchSize
  while (offset < allInsertStmts.length) {
    const batchSize = Math.min(allInsertStmts.length - offset, 1000)
    const batch = allInsertStmts.slice(offset, offset + batchSize)
    await db.batch(batch)
    offset += batchSize
  }

  console.log(`CVM funds cache: refresh complete (${funds.length} funds)`)
  await recordOperationLog(db, {
    operationType: 'cron_cvm_catalog',
    status: 'completed',
    triggerSource: 'scheduled',
    summary: { parsedFunds: funds.length, insertStatements: allInsertStmts.length },
  })
}

// ── searchFunds ────────────────────────────────────────────────────────────

export async function searchFunds(
  db: D1Database,
  query: string,
): Promise<
  Array<{
    cnpj: string
    name: string
    manager: string
    class_: string
    classAnbima: string
    benchmark: string
    aum: number | null
  }>
> {
  const digitsOnly = query.replace(/\D/g, '')

  const result = await db
    .prepare(
      `SELECT cnpj, denom_social, gestor, classe, classe_anbima, rentab_fundo, vl_patrim_liq
       FROM cvm_funds_cache
       WHERE denom_social LIKE '%' || ?1 || '%' COLLATE NOCASE
          OR (?2 != '' AND REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '/', ''), '-', '') LIKE '%' || ?2 || '%')
       ORDER BY vl_patrim_liq DESC
       LIMIT 20`,
    )
    .bind(query, digitsOnly)
    .all<{
      cnpj: string
      denom_social: string
      gestor: string
      classe: string
      classe_anbima: string
      rentab_fundo: string
      vl_patrim_liq: number | null
    }>()

  return result.results.map((row) => ({
    cnpj: row.cnpj,
    name: row.denom_social,
    manager: row.gestor ?? '',
    class_: row.classe ?? '',
    classAnbima: row.classe_anbima ?? '',
    benchmark: row.rentab_fundo ?? '',
    aum: row.vl_patrim_liq ?? null,
  }))
}
