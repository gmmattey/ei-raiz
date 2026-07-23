import { expect, test } from '@playwright/test'
import { deflateRawSync } from 'node:zlib'
import worker from '../src/index'

type OperationLog = {
  operation_type: string
  status: string
  trigger_source: string
  summary_json: string | null
  error_message: string | null
}

function makeZip(csv: string) {
  const filename = Buffer.from('cvm.csv', 'utf8')
  const compressed = deflateRawSync(Buffer.from(csv, 'utf8'))
  const header = Buffer.alloc(30 + filename.length)

  header.writeUInt32LE(0x04034b50, 0)
  header.writeUInt16LE(20, 4)
  header.writeUInt16LE(0, 6)
  header.writeUInt16LE(8, 8)
  header.writeUInt32LE(0, 10)
  header.writeUInt32LE(0, 14)
  header.writeUInt32LE(compressed.length, 18)
  header.writeUInt32LE(Buffer.byteLength(csv), 22)
  header.writeUInt16LE(filename.length, 26)
  header.writeUInt16LE(0, 28)
  filename.copy(header, 30)

  return Buffer.concat([header, compressed])
}

class FakeStmt {
  constructor(
    private db: FakeD1,
    private sql: string,
    private args: unknown[],
  ) {}

  async first<T>() {
    return this.db.first<T>(this.sql, this.args)
  }

  async all<T>() {
    return this.db.all<T>(this.sql, this.args)
  }

  async run() {
    return this.db.run(this.sql, this.args)
  }

  async __execute() {
    return this.run()
  }
}

class FakeD1 {
  operationLogs: OperationLog[] = []
  quoteUpserts: Array<{ ticker: string; price: number }> = []
  macroUpserts: Array<{ slug: string; value: number }> = []
  snapshots = new Set<string>()
  cvmFundsRows = 0

  constructor(
    private readonly opts: {
      brapiAssets: string[]
      cvmAssets: string[]
      activeUsers: number[]
      portfolioSummaryByUser: Record<number, { total_balance: number; total_invested: number }>
    },
  ) {}

  prepare(sql: string) {
    const normalized = this.normalize(sql)
    return {
      bind: (...args: unknown[]) => new FakeStmt(this, normalized, args),
      first: async <T>() => this.first<T>(normalized, []),
      all: async <T>() => this.all<T>(normalized, []),
      run: async () => this.run(normalized, []),
    }
  }

  async batch(stmts: Array<FakeStmt | { run: () => Promise<unknown> }>) {
    for (const stmt of stmts) {
      if ('__execute' in stmt && typeof stmt.__execute === 'function') {
        await stmt.__execute()
      } else {
        await stmt.run()
      }
    }
    return []
  }

  private normalize(sql: string) {
    return sql.toLowerCase().replace(/\s+/g, ' ').trim()
  }

  async first<T>(sql: string, args: unknown[]) {
    if (sql.includes("from sqlite_master where type = 'table' and name = ?")) {
      return ({ ok: args[0] === 'operation_logs' ? 1 : 0 } as T)
    }

    if (sql.includes('select total_balance, total_invested from vw_portfolio_summary where user_id = ?')) {
      return (this.opts.portfolioSummaryByUser[Number(args[0])] ?? null) as T | null
    }

    if (sql.includes('select id from snapshots where user_id = ? and month = ?')) {
      const key = `${args[0]}:${args[1]}`
      return (this.snapshots.has(key) ? ({ id: 1 } as T) : null)
    }

    return null
  }

  async all<T>(sql: string, _args: unknown[]) {
    if (sql.includes("select distinct ticker from assets where ticker is not null") && sql.includes("quote_source is null or quote_source = 'brapi'")) {
      return { results: this.opts.brapiAssets.map((ticker) => ({ ticker })) as T[] }
    }

    if (sql.includes("select distinct ticker from assets") && sql.includes("quote_source = 'cvm'")) {
      return { results: this.opts.cvmAssets.map((ticker) => ({ ticker })) as T[] }
    }

    if (sql.includes("select distinct user_id from assets where status = 'active'")) {
      return { results: this.opts.activeUsers.map((user_id) => ({ user_id })) as T[] }
    }

    return { results: [] as T[] }
  }

  async run(sql: string, args: unknown[]) {
    if (sql.startsWith('insert into operation_logs')) {
      this.operationLogs.push({
        operation_type: String(args[0]),
        status: String(args[1]),
        trigger_source: String(args[2]),
        summary_json: typeof args[4] === 'string' ? String(args[4]) : null,
        error_message: typeof args[5] === 'string' ? String(args[5]) : null,
      })
      return { success: true }
    }

    if (sql.startsWith('insert into quotes_cache')) {
      this.quoteUpserts.push({
        ticker: String(args[0]),
        price: Number(args[1]),
      })
      return { success: true }
    }

    if (sql.startsWith('insert into snapshots')) {
      this.snapshots.add(`${args[0]}:${args[1]}`)
      return { success: true }
    }

    if (sql.startsWith('delete from cvm_funds_cache')) {
      this.cvmFundsRows = 0
      return { success: true }
    }

    if (sql.startsWith('insert into cvm_funds_cache')) {
      this.cvmFundsRows += Math.floor(args.length / 9)
      return { success: true }
    }

    if (sql.startsWith('insert into macro_cache')) {
      this.macroUpserts.push({
        slug: String(args[0]),
        value: Number(args[1]),
      })
      return { success: true }
    }

    return { success: true }
  }
}

function createCtx() {
  const pending: Promise<unknown>[] = []
  return {
    waitUntil(promise: Promise<unknown>) {
      pending.push(promise)
    },
    async drain() {
      await Promise.all(pending)
    },
  }
}

test('scheduled handler preserva wiring de BRAPI, macro, snapshot e CVM com trilha de auditoria', async () => {
  const db = new FakeD1({
    brapiAssets: ['PETR4'],
    cvmAssets: ['12345678000190'],
    activeUsers: [1],
    portfolioSummaryByUser: {
      1: { total_balance: 2400, total_invested: 1800 },
    },
  })

  const originalFetch = global.fetch
  global.fetch = (async (input: string | URL | Request) => {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url

    if (url.includes('/quote/PETR4')) {
      return new Response(JSON.stringify({
        results: [{ symbol: 'PETR4', regularMarketPrice: 38.12 }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    if (url.includes('/v2/macro/latest')) {
      return new Response(JSON.stringify({
        results: [
          { slug: 'cdi', latestValue: 10.65, latestDate: '2026-06-16' },
          { slug: 'selic', latestValue: 10.5, latestDate: '2026-06-16' },
          { slug: 'ipca12m', latestValue: 4.2, latestDate: '2026-06-16' },
        ],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    if (url.includes('inf_diario_fi_')) {
      const csv = [
        'TP_FUNDO_CLASSE;CNPJ_FUNDO_CLASSE;ID_SUBCLASSE;DT_COMPTC;VL_TOTAL;VL_QUOTA;VL_PATRIM_LIQ;CAPTC_DIA;RESG_DIA;NR_COTST',
        'F;12345678000190;1;2026-06-03;10;1.45;100;0;0;1',
      ].join('\n')
      return new Response(makeZip(csv), { status: 200 })
    }

    if (url.includes('cad_fi.csv')) {
      const cols = new Array(41).fill('')
      cols[1] = '12345678000190'
      cols[2] = 'Fundo QA Catalogo'
      cols[7] = 'EM FUNCIONAMENTO NORMAL'
      cols[12] = 'Renda Fixa'
      cols[14] = 'CDI'
      cols[16] = 'N'
      cols[25] = '5000000'
      cols[29] = 'Admin QA'
      cols[32] = 'Gestor QA'
      cols[40] = 'Previdenciario'
      const csv = ['HEADER', cols.join(';')].join('\n')
      return new Response(Buffer.from(csv, 'latin1'), { status: 200 })
    }

    return new Response('not found', { status: 404 })
  }) as typeof fetch

  try {
    const env = {
      DB: db as unknown as D1Database,
      BRAPI_BASE_URL: 'https://mock.brapi.local/api',
      BRAPI_TOKEN: 'mock-token',
      JWT_SECRET: 'unused-in-scheduler',
    } as any

    for (const cron of ['0 12 * * *', '0 12 1 * *', '0 22 * * 1-5', '0 23 2 * *']) {
      const ctx = createCtx()
      await worker.scheduled?.({ cron } as ScheduledEvent, env, ctx as unknown as ExecutionContext)
      await ctx.drain()
    }
  } finally {
    global.fetch = originalFetch
  }

  expect(db.quoteUpserts.some((row) => row.ticker === 'PETR4')).toBeTruthy()
  expect(db.quoteUpserts.some((row) => row.ticker === '12345678000190')).toBeTruthy()
  expect(db.macroUpserts.map((row) => row.slug).sort()).toEqual(['cdi', 'ipca12m', 'selic'])
  expect(db.snapshots.size).toBe(1)
  expect(db.cvmFundsRows).toBeGreaterThan(0)

  expect(db.operationLogs).toEqual(expect.arrayContaining([
    expect.objectContaining({ operation_type: 'cron_brapi_quotes', status: 'completed', trigger_source: 'scheduled' }),
    expect.objectContaining({ operation_type: 'cron_macro', status: 'completed', trigger_source: 'scheduled' }),
    expect.objectContaining({ operation_type: 'cron_snapshot', status: 'completed', trigger_source: 'scheduled' }),
    expect.objectContaining({ operation_type: 'cron_cvm_quotes', status: 'completed', trigger_source: 'scheduled' }),
    expect.objectContaining({ operation_type: 'cron_cvm_catalog', status: 'completed', trigger_source: 'scheduled' }),
  ]))
})
