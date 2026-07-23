import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const envName = process.argv[2];
if (!envName) {
  console.error("Uso: node scripts/deploy.mjs <local|hml|production>");
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workerDir = path.resolve(__dirname, "..");

run("npm", ["run", "build:web"], { cwd: workerDir });
run("npm", ["run", "sync:web"], { cwd: workerDir });

// Build gate: se build/sync falhar, nao chega aqui.
run("npx", ["wrangler", "deploy", "--env", envName], { cwd: workerDir });

function run(bin, args, options) {
  const cmd = bin;
  const pretty = `${cmd} ${args.join(" ")}`;
  console.log(`[deploy] ${pretty}`);
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
    ...options,
  });
  if (result.error) {
    console.error(`[deploy] Falha ao executar: ${pretty}`);
    console.error(result.error);
    process.exit(1);
  }
  if ((result.status ?? 1) !== 0) {
    console.error(`[deploy] Exit code != 0: ${pretty} (${result.status ?? 1})`);
    process.exit(result.status ?? 1);
  }
}
