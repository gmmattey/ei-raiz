import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const NODE = process.execPath
const NPM_CLI = process.env.npm_execpath
const WRANGLER_BIN = join(ROOT, 'node_modules', 'wrangler', 'bin', 'wrangler.js')
const PLAYWRIGHT_BIN = join(ROOT, 'node_modules', '@playwright', 'test', 'cli.js')
const WRANGLER_TOML = join(ROOT, 'wrangler.toml')

const args = new Set(process.argv.slice(2))
const checkRemoteSecret = args.has('--check-remote-secret')

function getEnvArgs() {
  const envIndex = process.argv.indexOf('--env')
  if (envIndex >= 0 && process.argv[envIndex + 1]) {
    return ['--env', process.argv[envIndex + 1]]
  }
  return []
}

function runStep(step) {
  const startedAt = Date.now()
  console.log(`\n[cutover-preflight] ${step.label}`)
  console.log(`[cutover-preflight] > ${step.command} ${step.args.join(' ')}`)

  const result = spawnSync(step.command, step.args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  })

  const elapsedMs = Date.now() - startedAt
  if (result.status !== 0) {
    const error = new Error(`Step failed: ${step.label}`)
    error.step = step.id
    error.status = result.status ?? 1
    error.elapsedMs = elapsedMs
    throw error
  }

  return { id: step.id, label: step.label, status: 'passed', elapsedMs }
}

function readCurrentAssetsDirectory() {
  const wranglerToml = readFileSync(WRANGLER_TOML, 'utf8')
  const match = wranglerToml.match(/\[assets\][\s\S]*?directory\s*=\s*"([^"]+)"/)
  return match?.[1] ?? null
}

function listRemoteSecrets() {
  const wranglerArgs = [WRANGLER_BIN, 'secret', 'list', '--format', 'json', ...getEnvArgs()]

  const result = spawnSync(NODE, wranglerArgs, {
    cwd: ROOT,
    encoding: 'utf8',
    env: process.env,
  })

  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim()
    throw new Error(detail || 'wrangler secret list failed')
  }

  const raw = (result.stdout || '').trim()
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed)) {
    throw new Error('Unexpected response from wrangler secret list')
  }

  return parsed
}

function getCurrentRemoteVersionBindings() {
  const deploymentResult = spawnSync(NODE, [WRANGLER_BIN, 'deployments', 'list', '--json', ...getEnvArgs()], {
    cwd: ROOT,
    encoding: 'utf8',
    env: process.env,
  })

  if (deploymentResult.status !== 0) {
    const detail = (deploymentResult.stderr || deploymentResult.stdout || '').trim()
    throw new Error(detail || 'wrangler deployments list failed')
  }

  const deployments = JSON.parse((deploymentResult.stdout || '').trim())
  if (!Array.isArray(deployments) || deployments.length === 0) {
    throw new Error('No remote deployments found')
  }

  const currentDeployment = deployments[deployments.length - 1]
  const currentVersionId = currentDeployment?.versions?.find((version) => version?.percentage === 100)?.version_id
  if (!currentVersionId) {
    throw new Error('Could not resolve current 100% deployment version')
  }

  const versionResult = spawnSync(NODE, [WRANGLER_BIN, 'versions', 'view', currentVersionId, '--json', ...getEnvArgs()], {
    cwd: ROOT,
    encoding: 'utf8',
    env: process.env,
  })

  if (versionResult.status !== 0) {
    const detail = (versionResult.stderr || versionResult.stdout || '').trim()
    throw new Error(detail || 'wrangler versions view failed')
  }

  const version = JSON.parse((versionResult.stdout || '').trim())
  const bindings = Array.isArray(version?.resources?.bindings) ? version.resources.bindings : []
  return { currentVersionId, bindings }
}

function inspectRemoteJwtBinding() {
  const { currentVersionId, bindings } = getCurrentRemoteVersionBindings()
  const jwtBinding = bindings.find((binding) => binding?.name === 'JWT_SECRET')
  return {
    currentVersionId,
    bindingType: jwtBinding?.type ?? null,
  }
}

function summarize(results, skipped = [], warnings = []) {
  console.log('\n[cutover-preflight] Summary')
  for (const result of results) {
    console.log(`- PASS ${result.id}: ${result.label} (${(result.elapsedMs / 1000).toFixed(1)}s)`)
  }
  for (const warning of warnings) {
    console.log(`- WARN ${warning.id}: ${warning.label}`)
  }
  for (const skip of skipped) {
    console.log(`- SKIP ${skip.id}: ${skip.label}`)
  }
}

const steps = [
  {
    id: 'sync-assets',
    label: 'Sincronizar assets buildless de apps/web',
    command: NODE,
    args: [join(ROOT, 'scripts', 'sync-web-runtime-assets.mjs')],
  },
  {
    id: 'typecheck',
    label: 'Validar tipos em src/apps/packages',
    command: NODE,
    args: [NPM_CLI, 'run', 'typecheck'],
  },
  {
    id: 'dry-run-legacy',
    label: 'Dry-run do Worker atual com assets de public/',
    command: NODE,
    args: [WRANGLER_BIN, 'deploy', '--dry-run'],
  },
  {
    id: 'dry-run-web-assets',
    label: 'Dry-run do Worker candidato com assets de apps/web',
    command: NODE,
    args: [WRANGLER_BIN, 'deploy', '--dry-run', '--assets', 'apps/web'],
  },
  {
    id: 'scheduler',
    label: 'Validar wiring oficial dos crons',
    command: NODE,
    args: [PLAYWRIGHT_BIN, 'test', 'tests/scheduler.spec.ts'],
  },
  {
    id: 'cutover-smoke',
    label: 'Comparar public/ e apps/web contra o mesmo runtime vivo',
    command: NODE,
    args: [PLAYWRIGHT_BIN, 'test', 'tests/cutover-smoke.spec.ts'],
  },
  {
    id: 'cutover-worker',
    label: 'Validar apps/web servido na raiz de um Worker temporario',
    command: NODE,
    args: [PLAYWRIGHT_BIN, 'test', 'tests/cutover-worker.spec.ts'],
  },
  {
    id: 'web-pilot',
    label: 'Validar a vertical viva da trilha nova',
    command: NODE,
    args: [PLAYWRIGHT_BIN, 'test', 'tests/web-pilot.spec.ts'],
  },
  {
    id: 'rollback-rehearsal',
    label: 'Ensaiar cutover local e rollback de assets',
    command: NODE,
    args: [join(ROOT, 'scripts', 'rehearse-assets-cutover.mjs')],
  },
]

const results = []
const skipped = []
const warnings = []
const currentAssetsDirectory = readCurrentAssetsDirectory()
const legacyParityChecksEnabled = currentAssetsDirectory === 'public'

try {
  for (const step of steps) {
    if (!legacyParityChecksEnabled && (step.id === 'cutover-smoke' || step.id === 'rollback-rehearsal')) {
      skipped.push({
        id: step.id,
        label: `${step.label} ignorado porque o assets directory atual ja e "${currentAssetsDirectory}" e a fase de comparacao com public/ foi superada.`,
      })
      continue
    }
    results.push(runStep(step))
  }

  if (checkRemoteSecret) {
    const startedAt = Date.now()
    console.log('\n[cutover-preflight] Validar binding remoto de JWT_SECRET')
    const secrets = listRemoteSecrets()
    const hasJwtSecretInSecretList = secrets.some((secret) => {
      const name = typeof secret === 'string'
        ? secret
        : typeof secret?.name === 'string'
          ? secret.name
          : ''
      return name === 'JWT_SECRET'
    })
    const remoteJwt = inspectRemoteJwtBinding()

    if (!remoteJwt.bindingType) {
      throw new Error('Remote Worker is missing JWT_SECRET binding in the current deployed version')
    }

    results.push({
      id: 'remote-jwt-binding',
      label: `JWT_SECRET presente na versao remota ${remoteJwt.currentVersionId}`,
      status: 'passed',
      elapsedMs: Date.now() - startedAt,
    })

    if (remoteJwt.bindingType !== 'secret_text') {
      warnings.push({
        id: 'remote-jwt-binding-kind',
        label: `JWT_SECRET esta presente como ${remoteJwt.bindingType} na versao remota atual; a migracao final ainda deve convertê-lo para secret_text.`,
      })
    }

    if (!hasJwtSecretInSecretList) {
      warnings.push({
        id: 'remote-jwt-secret-list',
        label: 'JWT_SECRET nao aparece em `wrangler secret list`; o binding atual existe na versao ativa, mas ainda nao esta modelado como secret_text listavel pelo Wrangler.',
      })
    }
  } else {
    skipped.push({
      id: 'remote-jwt-binding',
      label: 'Checagem remota de JWT_SECRET nao executada. Rode com --check-remote-secret quando o Wrangler estiver autenticado.',
    })
  }

  summarize(results, skipped, warnings)
} catch (error) {
  summarize(results, skipped, warnings)
  const message = error instanceof Error ? error.message : String(error)
  console.error(`\n[cutover-preflight] FAILED: ${message}`)
  process.exit(1)
}
