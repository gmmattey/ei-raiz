/**
 * gerar-icons.mjs
 * Converte iconApp_Esquilo.svg em PNGs para PWA, favicon, Apple Touch e Android.
 * Usa Playwright (já no devDependencies do monorepo).
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../');

const SVG_PATH = resolve(ROOT, 'midia/brand/icons/iconApp_Esquilo.svg');
const OUT_DIR  = resolve(ROOT, 'apresentacao/public/assets/logo');

mkdirSync(OUT_DIR, { recursive: true });

const svgContent = readFileSync(SVG_PATH, 'utf8');

// Tamanhos necessários
const SIZES = [16, 32, 48, 64, 96, 180, 192, 512, 1024];

const browser = await chromium.launch();
const page    = await browser.newPage();

for (const size of SIZES) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:${size}px; height:${size}px; overflow:hidden; background:transparent; }
  img { width:${size}px; height:${size}px; display:block; }
</style>
</head>
<body>
  <img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}" />
</body>
</html>`);

  const buffer = await page.screenshot({
    type: 'png',
    clip: { x: 0, y: 0, width: size, height: size },
    omitBackground: true,
  });

  const filename = `icon-${size}x${size}.png`;
  writeFileSync(resolve(OUT_DIR, filename), buffer);
  console.log(`✅ ${filename}`);
}

// Alias especiais esperados por index.html e manifest
import { copyFileSync } from 'fs';
copyFileSync(resolve(OUT_DIR, 'icon-512x512.png'), resolve(OUT_DIR, 'esquilo-invest-simbolo.png'));
copyFileSync(resolve(OUT_DIR, 'icon-180x180.png'), resolve(OUT_DIR, 'apple-touch-icon.png'));
console.log('✅ esquilo-invest-simbolo.png (alias 512)');
console.log('✅ apple-touch-icon.png (alias 180)');

// Copia a versão maior para o Capacitor (Android/iOS)
const androidResDir = resolve(ROOT, 'apresentacao/android/app/src/main/res');
const capacitorAssets = resolve(ROOT, 'apresentacao/public/assets');

// Salva também na raiz pública como favicon.ico (PNG renomeado — browsers modernos aceitam PNG)
copyFileSync(resolve(OUT_DIR, 'icon-32x32.png'), resolve(ROOT, 'apresentacao/public/favicon.png'));
console.log('✅ public/favicon.png (32px)');

await browser.close();
console.log('\n🐿️  Icons gerados com sucesso em:', OUT_DIR);
