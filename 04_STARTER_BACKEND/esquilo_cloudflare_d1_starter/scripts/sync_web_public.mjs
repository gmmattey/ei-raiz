import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const webDistDir = path.resolve(repoRoot, "apps", "web", "app", "dist");
const publicDir = path.resolve(__dirname, "..", "public");

if (!fs.existsSync(webDistDir)) {
  console.error(`[sync] dist não encontrado: ${webDistDir}`);
  process.exit(1);
}

fs.mkdirSync(publicDir, { recursive: true });

// Limpa public sem apagar arquivos de controle do git.
for (const name of fs.readdirSync(publicDir)) {
  if (name === ".gitkeep" || name === ".gitignore") continue;
  fs.rmSync(path.join(publicDir, name), { recursive: true, force: true });
}

copyDir(webDistDir, publicDir);
console.log(`[sync] OK: ${webDistDir} -> ${publicDir}`);

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, dstPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}
