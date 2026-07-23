import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const webDir = path.resolve(repoRoot, "apps", "web", "app");

const cmd = "npm";
const result = spawnSync(cmd, ["run", "build"], {
  cwd: webDir,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

if (result.error) {
  console.error(`[build:web] Falha ao executar ${cmd} (cwd=${webDir}).`);
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
