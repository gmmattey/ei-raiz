import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const envName = process.argv[2] || "production";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workerDir = path.resolve(__dirname, "..");

// Observacao: o comando exato pode variar por versao do Wrangler.
// Se falhar, o rollback ainda pode ser feito pelo dashboard do Cloudflare (Deployments).
const cmd = "npx";
const result = spawnSync(cmd, ["wrangler", "rollback", "--env", envName], {
  cwd: workerDir,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
