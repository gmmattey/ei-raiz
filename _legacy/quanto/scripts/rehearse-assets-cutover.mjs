import { execFileSync, spawn } from 'node:child_process'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const NODE = process.execPath
const WRANGLER_BIN = join(ROOT, 'node_modules', 'wrangler', 'bin', 'wrangler.js')

function killTree(pid) {
  if (!pid) return
  try {
    if (process.platform === 'win32') {
      execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' })
    } else {
      process.kill(pid, 'SIGTERM')
    }
  } catch {
    // ignore
  }
}

async function waitFor(url, timeoutMs = 60000) {
  const started = Date.now()
  for (;;) {
    try {
      const res = await fetch(url)
      if (res.ok) return res
    } catch {
      // keep waiting
    }
    if (Date.now() - started > timeoutMs) {
      throw new Error(`Timed out waiting for ${url}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
}

async function settle(ms = 1500) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function startWorker({ port, persistDir, assetsDir }) {
  const args = [
    WRANGLER_BIN,
    'dev',
    '--local',
    '--port',
    String(port),
    '--persist-to',
    persistDir,
    '--show-interactive-dev-session=false',
    '--log-level',
    'error',
  ]

  if (assetsDir) {
    args.push('--assets', assetsDir)
  }

  const child = spawn(NODE, args, {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      JWT_SECRET: process.env.JWT_SECRET || 'rollback-rehearsal-secret',
    },
  })

  child.stdout.setEncoding('utf8')
  child.stderr.setEncoding('utf8')

  let stderr = ''
  child.stderr.on('data', (chunk) => {
    stderr += chunk
  })

  await waitFor(`http://127.0.0.1:${port}/api/health`)

  return {
    child,
    getStderr: () => stderr,
  }
}

async function validateWebPreview(port) {
  const health = await (await waitFor(`http://127.0.0.1:${port}/api/health`)).json()
  if (health.status !== 'ok') {
    throw new Error('Preview worker health check failed')
  }

  const html = await (await fetch(`http://127.0.0.1:${port}/index.html`)).text()
  if (!html.includes('today-page') && !html.includes('Hoje')) {
    throw new Error('Preview worker did not serve apps/web shell')
  }

  const sw = await (await fetch(`http://127.0.0.1:${port}/sw.js`)).text()
  if (!sw.includes('runtime-ui/styles.css') || !sw.includes('runtime-ui/components.js')) {
    throw new Error('Preview worker service worker did not match apps/web assets')
  }
}

async function validateLegacyRuntime(port) {
  const health = await (await waitFor(`http://127.0.0.1:${port}/api/health`)).json()
  if (health.status !== 'ok') {
    throw new Error('Legacy worker health check failed')
  }

  const html = await (await fetch(`http://127.0.0.1:${port}/`)).text()
  if (!html.includes('manifest.json') || !html.includes('id="app"')) {
    throw new Error('Legacy worker did not serve public shell')
  }

  const sw = await (await fetch(`http://127.0.0.1:${port}/sw.js`)).text()
  if (!sw.includes("'/app.js'") || !sw.includes("'/manifest.json'")) {
    throw new Error('Legacy worker service worker did not match public assets')
  }
}

async function main() {
  execFileSync(NODE, [join(ROOT, 'scripts', 'sync-web-runtime-assets.mjs')], { cwd: ROOT, stdio: 'pipe' })

  const scratchBase = join(ROOT, '.wrangler', 'rollback-rehearsal')
  mkdirSync(scratchBase, { recursive: true })
  const previewState = join(scratchBase, 'preview-state')
  const legacyState = join(scratchBase, 'legacy-state')
  const port = 8788

  let preview
  let legacy

  try {
    preview = await startWorker({ port, persistDir: previewState, assetsDir: 'apps/web' })
    await validateWebPreview(port)
    killTree(preview.child.pid)
    await settle()

    legacy = await startWorker({ port, persistDir: legacyState })
    await validateLegacyRuntime(port)
    killTree(legacy.child.pid)
    await settle()

    console.log('Rollback rehearsal succeeded: apps/web assets served, then public assets restored.')
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    const stderr = [preview?.getStderr?.(), legacy?.getStderr?.()].filter(Boolean).join('\n')
    throw new Error(stderr ? `${detail}\n${stderr}` : detail)
  } finally {
    killTree(preview?.child?.pid)
    killTree(legacy?.child?.pid)
    await settle(1000)
    if (existsSync(scratchBase)) {
      try {
        rmSync(scratchBase, { recursive: true, force: true })
      } catch {
        // Windows may keep transient handles after taskkill; cleanup is best-effort.
      }
    }
  }
}

await main()
