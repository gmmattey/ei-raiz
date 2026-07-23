const args = process.argv.slice(2)

function readArg(flag) {
  const index = args.indexOf(flag)
  if (index === -1) return null
  return args[index + 1] ?? null
}

const baseUrl = readArg('--base-url')
const token = readArg('--token')

if (!baseUrl) {
  console.error('Usage: node scripts/post-cutover-smoke.mjs --base-url <url> [--token <jwt>]')
  process.exit(1)
}

const rootUrl = baseUrl.replace(/\/+$/, '')

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${rootUrl}${path}`, options)
  const text = await response.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    // keep raw text diagnostics in the error path below
  }

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}: ${text}`)
  }

  return json
}

async function fetchText(path, options = {}) {
  const response = await fetch(`${rootUrl}${path}`, options)
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}: ${text}`)
  }
  return text
}

async function main() {
  const checks = []

  console.log(`[cutover-postflight] Base URL: ${rootUrl}`)

  const health = await fetchJson('/api/health')
  assert(health?.status === 'ok', 'Health endpoint did not return status=ok')
  checks.push('health')

  const html = await fetchText('/')
  assert(html.includes('id="pilot-root"'), 'Root shell is not serving apps/web pilot root')
  assert(html.includes('./runtime-ui/styles.css'), 'Root shell is missing apps/web runtime-ui stylesheet')
  checks.push('shell')

  const manifest = await fetchJson('/manifest.json')
  assert(manifest?.name === 'Quanto', 'Manifest name mismatch')
  assert(manifest?.start_url === './', 'Manifest start_url is not relative for apps/web cutover')
  assert(Array.isArray(manifest?.icons) && manifest.icons.length >= 2, 'Manifest icons are missing')
  checks.push('manifest')

  const sw = await fetchText('/sw.js')
  assert(sw.includes("shellAsset('/manifest.json')"), 'Service worker does not cache manifest.json')
  assert(sw.includes("shellAsset('/runtime-ui/styles.css')"), 'Service worker does not cache runtime-ui/styles.css')
  assert(sw.includes("shellAsset('/icons/quanto-icon-192.png')"), 'Service worker does not cache app icons')
  checks.push('service-worker')

  const icon192 = await fetch(`${rootUrl}/icons/quanto-icon-192.png`)
  assert(icon192.ok, 'Icon 192 is not reachable')
  const icon512 = await fetch(`${rootUrl}/icons/quanto-icon-512.png`)
  assert(icon512.ok, 'Icon 512 is not reachable')
  checks.push('icons')

  if (token) {
    const authHeaders = { Authorization: `Bearer ${token}` }
    const portfolio = await fetchJson('/api/portfolio', { headers: authHeaders })
    assert(typeof portfolio?.total === 'number', 'Authenticated portfolio payload is missing total')
    assert(Array.isArray(portfolio?.assets), 'Authenticated portfolio payload is missing assets')
    checks.push('portfolio')
  } else {
    console.log('[cutover-postflight] Token not provided; skipping authenticated portfolio check.')
  }

  console.log('[cutover-postflight] Passed checks:')
  for (const check of checks) {
    console.log(`- ${check}`)
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[cutover-postflight] FAILED: ${message}`)
  process.exit(1)
})
